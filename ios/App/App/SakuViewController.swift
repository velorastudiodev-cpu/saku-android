import UIKit
import WebKit
import Capacitor
import CryptoKit
import Security
import LocalAuthentication

enum SakuPrivacy {
    static var enabled: Bool { UserDefaults.standard.bool(forKey: "saku.app-lock") }
    static var unlocked = false
    static var authenticating = false
    static weak var plugin: SakuSecureWalletPlugin?
}

class SakuViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(SakuSecureWalletPlugin())
        overrideUserInterfaceStyle = .light
        setNeedsStatusBarAppearanceUpdate()
        let rules = """
        [{"trigger":{"url-filter":"^https?://"},"action":{"type":"block"}}]
        """
        WKContentRuleListStore.default().compileContentRuleList(forIdentifier: "SakuOffline", encodedContentRuleList: rules) { [weak self] list, _ in
            if let list = list { self?.webView?.configuration.userContentController.add(list) }
        }
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .darkContent }
}

@objc(SakuSecureWalletPlugin)
public class SakuSecureWalletPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SakuSecureWalletPlugin"
    public let jsName = "SecureWallet"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "read", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "write", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clearLegacy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getLockStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "authenticate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setLock", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "screenReady", returnType: CAPPluginReturnPromise)
    ]
    private let alias = "com.velorastudio.saku.wallet.v1"
    private let maxBytes = 10 * 1024 * 1024
    private let work = DispatchQueue(label: "com.velorastudio.saku.storage")
    private enum StorageError: Error { case unavailable, invalid }

    private func allowed(_ call: CAPPluginCall) -> Bool {
        guard !SakuPrivacy.enabled || SakuPrivacy.unlocked else {
            call.reject("Buka kunci Saku terlebih dahulu."); return false
        }
        return true
    }
    @objc func getLockStatus(_ call: CAPPluginCall) {
        let context = LAContext()
        call.resolve(["enabled": SakuPrivacy.enabled,
                      "available": context.canEvaluatePolicy(.deviceOwnerAuthentication, error: nil),
                      "unlocked": !SakuPrivacy.enabled || SakuPrivacy.unlocked])
    }
    @objc func screenReady(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard !SakuPrivacy.enabled || SakuPrivacy.unlocked || call.getBool("locked") == true else { call.resolve(); return }
            self.bridge?.viewController?.view.window?.viewWithTag(3115)?.removeFromSuperview()
            call.resolve()
        }
    }
    @objc func setLock(_ call: CAPPluginCall) { authenticate(call) }
    @objc func authenticate(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard !SakuPrivacy.authenticating else { call.reject("Verifikasi sedang berjalan."); return }
            let context = LAContext()
            context.localizedCancelTitle = "Batal"
            guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: nil) else {
                call.reject("Atur kunci layar perangkat terlebih dahulu."); return
            }
            SakuPrivacy.authenticating = true
            context.evaluatePolicy(.deviceOwnerAuthentication, localizedReason: "Buka catatan keuangan di Saku.") { success, _ in
                DispatchQueue.main.async {
                    SakuPrivacy.authenticating = false
                    guard success else { call.reject("Verifikasi dibatalkan atau belum berhasil."); return }
                    if let enabled = call.getBool("enabled") { UserDefaults.standard.set(enabled, forKey: "saku.app-lock") }
                    SakuPrivacy.unlocked = true
                    call.resolve()
                }
            }
        }
    }

    private func key(create: Bool) throws -> SymmetricKey {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: alias,
            kSecAttrAccount as String: "wallet-key",
            kSecAttrSynchronizable as String: false
        ]
        var read = query
        read[kSecReturnData as String] = true
        read[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(read as CFDictionary, &result)
        if status == errSecSuccess, let data = result as? Data, data.count == 32 {
            return SymmetricKey(data: data)
        }
        guard status == errSecItemNotFound, create else { throw StorageError.unavailable }
        let generated = SymmetricKey(size: .bits256)
        var add = query
        add[kSecValueData as String] = generated.withUnsafeBytes { Data($0) }
        add[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        guard SecItemAdd(add as CFDictionary, nil) == errSecSuccess else { throw StorageError.unavailable }
        return generated
    }

    private func walletURL(create: Bool) throws -> URL {
        guard let root = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { throw StorageError.unavailable }
        var directory = root.appendingPathComponent("Saku", isDirectory: true)
        if create {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true, attributes: [.protectionKey: FileProtectionType.complete])
            var values = URLResourceValues()
            values.isExcludedFromBackup = true
            try directory.setResourceValues(values)
        }
        return directory.appendingPathComponent("wallet.v1.enc")
    }

    @objc func read(_ call: CAPPluginCall) {
        guard allowed(call) else { return }
        work.async {
            do {
                let url = try self.walletURL(create: false)
                guard FileManager.default.fileExists(atPath: url.path) else { call.resolve(["value": NSNull()]); return }
                let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
                guard let size = attributes[.size] as? NSNumber, size.intValue <= self.maxBytes + 29 else { throw StorageError.invalid }
                let data = try Data(contentsOf: url)
                guard data.first == 1, data.count >= 29 else { throw StorageError.invalid }
                let sealed = try AES.GCM.SealedBox(combined: Data(data.dropFirst()))
                let plain = try AES.GCM.open(sealed, using: self.key(create: false), authenticating: Data(self.alias.utf8))
                guard let value = String(data: plain, encoding: .utf8) else { throw StorageError.invalid }
                call.resolve(["value": value])
            } catch {
                call.reject("Catatan terenkripsi belum bisa dibuka. Buka kunci perangkat, coba lagi, atau pulihkan cadangan.")
            }
        }
    }

    @objc func write(_ call: CAPPluginCall) {
        guard allowed(call) else { return }
        guard let value = call.getString("value"), let plain = value.data(using: .utf8), plain.count <= maxBytes else {
            call.reject("Catatan tidak valid atau melebihi batas penyimpanan."); return
        }
        work.async {
            do {
                let sealed = try AES.GCM.seal(plain, using: self.key(create: true), authenticating: Data(self.alias.utf8))
                guard let combined = sealed.combined else { throw StorageError.invalid }
                let data = Data([1]) + combined
                var url = try self.walletURL(create: true)
                try data.write(to: url, options: [.atomic, .completeFileProtection])
                var values = URLResourceValues()
                values.isExcludedFromBackup = true
                try url.setResourceValues(values)
                guard try Data(contentsOf: url) == data else { throw StorageError.invalid }
                call.resolve()
            } catch {
                call.reject("Catatan belum tersimpan. Buka kunci perangkat dan pastikan ruang penyimpanan tersedia.")
            }
        }
    }

    @objc func clearLegacy(_ call: CAPPluginCall) {
        guard allowed(call) else { return }
        UserDefaults.standard.removeObject(forKey: "CapacitorStorage.saku.wallet.v1")
        call.resolve()
    }

    public override func load() {
        SakuPrivacy.plugin = self
        guard let cache = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first else { return }
        let exports = cache.appendingPathComponent("exports", isDirectory: true)
        let cutoff = Date().addingTimeInterval(-86400)
        guard let files = try? FileManager.default.contentsOfDirectory(at: exports, includingPropertiesForKeys: [.contentModificationDateKey, .isRegularFileKey]) else { return }
        for file in files {
            guard let values = try? file.resourceValues(forKeys: [.contentModificationDateKey, .isRegularFileKey]),
                  values.isRegularFile == true, let modified = values.contentModificationDate, modified < cutoff else { continue }
            try? FileManager.default.removeItem(at: file)
        }
    }
}
