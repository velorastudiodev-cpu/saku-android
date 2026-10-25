package com.velorastudio.saku;

import android.content.Context;
import android.content.Intent;
import android.app.Activity;
import android.app.KeyguardManager;
import android.hardware.biometrics.BiometricPrompt;
import android.hardware.biometrics.BiometricManager;
import android.os.Build;
import android.os.CancellationSignal;
import android.view.WindowManager;
import android.view.View;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.annotation.ActivityCallback;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Arrays;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import org.json.JSONObject;

@CapacitorPlugin(name = "SecureWallet")
public class SecureWalletPlugin extends Plugin {
    private static final String ALIAS = "com.velorastudio.saku.wallet.v1";
    private static final int MAX_BYTES = 10 * 1024 * 1024;
    private volatile boolean unlocked = false;
    private volatile boolean authenticating = false;

    private boolean lockEnabled() {
        return getContext().getSharedPreferences("SakuPrivacy", Context.MODE_PRIVATE).getBoolean("lock", false);
    }
    private boolean allowed(PluginCall call) {
        if (!lockEnabled() || unlocked) return true;
        call.reject("Buka kunci Saku terlebih dahulu.");
        return false;
    }
    private void protectScreen() {
        getActivity().runOnUiThread(() -> {
            if (lockEnabled()) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
        });
    }
    @PluginMethod
    public void getLockStatus(PluginCall call) {
        KeyguardManager keyguard = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        JSObject result = new JSObject();
        result.put("enabled", lockEnabled());
        result.put("available", keyguard != null && keyguard.isDeviceSecure());
        result.put("unlocked", !lockEnabled() || unlocked);
        call.resolve(result);
    }
    private void authenticated(PluginCall call) {
        if (call.getData().has("enabled")) {
            boolean enabled = Boolean.TRUE.equals(call.getBoolean("enabled"));
            if (enabled && !SakuWidget.hide(getContext())) {
                authenticating = false;
                call.reject("Ringkasan widget belum berhasil dibersihkan. Coba aktifkan kunci lagi."); return;
            }
            if (!getContext().getSharedPreferences("SakuPrivacy", Context.MODE_PRIVATE).edit().putBoolean("lock", enabled).commit()) {
                authenticating = false;
                call.reject("Pengaturan kunci belum tersimpan."); return;
            }
        }
        unlocked = true;
        authenticating = false;
        protectScreen();
        call.resolve();
    }
    @PluginMethod
    public void setLock(PluginCall call) { authenticate(call); }

    @PluginMethod
    public void authenticate(PluginCall call) {
        if (authenticating) { call.reject("Verifikasi sedang berjalan."); return; }
        KeyguardManager keyguard = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        if (keyguard == null || !keyguard.isDeviceSecure()) { call.reject("Atur kunci layar perangkat terlebih dahulu."); return; }
        authenticating = true;
        getActivity().runOnUiThread(() -> {
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    BiometricPrompt.Builder builder = new BiometricPrompt.Builder(getActivity())
                        .setTitle("Buka Saku").setDescription("Verifikasi untuk mengakses catatan keuangan.");
                    if (Build.VERSION.SDK_INT >= 30) builder.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL);
                    else builder.setDeviceCredentialAllowed(true);
                    builder.build().authenticate(new CancellationSignal(), getActivity().getMainExecutor(), new BiometricPrompt.AuthenticationCallback() {
                        @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) { authenticated(call); }
                        @Override public void onAuthenticationError(int code, CharSequence message) {
                            authenticating = false;
                            call.reject("Verifikasi dibatalkan atau belum berhasil. Coba lagi.");
                        }
                    });
                } else {
                    Intent intent = keyguard.createConfirmDeviceCredentialIntent("Buka Saku", "Verifikasi untuk mengakses catatan keuangan.");
                    if (intent == null) throw new IllegalStateException("No credential");
                    startActivityForResult(call, intent, "credentialResult");
                }
            } catch (Exception error) {
                authenticating = false;
                call.reject("Verifikasi perangkat belum tersedia.");
            }
        });
    }
    @ActivityCallback
    private void credentialResult(PluginCall call, ActivityResult result) {
        if (call == null) { authenticating = false; return; }
        if (result.getResultCode() == Activity.RESULT_OK) authenticated(call);
        else { authenticating = false; call.reject("Verifikasi dibatalkan."); }
    }
    @Override protected void handleOnPause() {
        if (!authenticating) unlocked = false;
        if (lockEnabled() && getBridge().getWebView() != null) getBridge().getWebView().setVisibility(View.INVISIBLE);
        JSObject event = new JSObject(); event.put("isActive", false);
        notifyListeners("privacyStateChanged", event);
    }
    @Override protected void handleOnResume() {
        JSObject event = new JSObject(); event.put("isActive", true);
        notifyListeners("privacyStateChanged", event);
    }
    @PluginMethod public void screenReady(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (!lockEnabled() || unlocked || Boolean.TRUE.equals(call.getBoolean("locked", false)))
                getBridge().getWebView().setVisibility(View.VISIBLE);
            call.resolve();
        });
    }
    @PluginMethod public void getWidgetStatus(PluginCall call) {
        if (!allowed(call)) return;
        JSObject result = new JSObject();
        result.put("visible", SakuWidget.preferences(getContext()).getBoolean("visible", false) && !lockEnabled());
        call.resolve(result);
    }
    @PluginMethod public void updateWidget(PluginCall call) {
        if (!allowed(call)) return;
        android.content.SharedPreferences preferences = SakuWidget.preferences(getContext());
        boolean visible = !lockEnabled() && Boolean.TRUE.equals(call.getBoolean("visible", preferences.getBoolean("visible", false)));
        if (!visible) {
            if (SakuWidget.hide(getContext())) call.resolve();
            else call.reject("Pengaturan widget belum tersimpan. Coba lagi.");
            return;
        }
        String balance = call.getString("balance", "—");
        String budget = call.getString("budget", "—");
        String date = call.getString("date", "");
        String month = call.getString("month", "");
        if (balance.length() > 60 || budget.length() > 60 || !date.matches("\\d{4}-\\d{2}-\\d{2}") || !month.matches("\\d{4}-\\d{2}")) {
            call.reject("Ringkasan widget tidak valid."); return;
        }
        if (!preferences.edit().putBoolean("visible", true).putString("balance", balance).putString("budget", budget).putString("date", date).putString("month", month).commit()) {
            call.reject("Ringkasan widget belum tersimpan."); return;
        }
        SakuWidget.refresh(getContext());
        call.resolve();
    }

    private AtomicFile walletFile() {
        return new AtomicFile(new File(getContext().getNoBackupFilesDir(), "wallet.v1.enc"));
    }

    private SecretKey key(boolean create) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(ALIAS)) return (SecretKey) store.getKey(ALIAS, null);
        if (!create) throw new IOException("Wallet key unavailable");
        KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(ALIAS,
            KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build());
        return generator.generateKey();
    }

    @PluginMethod
    public synchronized void read(PluginCall call) {
        if (!allowed(call)) return;
        try {
            AtomicFile file = walletFile();
            // AtomicFile also recovers an interrupted write from its backup.
            if (!file.getBaseFile().exists() && !new File(file.getBaseFile() + ".bak").exists()) {
                JSObject result = new JSObject();
                result.put("value", JSONObject.NULL);
                call.resolve(result);
                return;
            }
            byte[] data = file.readFully();
            if (data.length < 29 || data.length > MAX_BYTES + 29 || data[0] != 1)
                throw new IOException("Invalid wallet envelope");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(false),
                new GCMParameterSpec(128, Arrays.copyOfRange(data, 1, 13)));
            cipher.updateAAD(ALIAS.getBytes(StandardCharsets.UTF_8));
            byte[] plain = cipher.doFinal(data, 13, data.length - 13);
            JSObject result = new JSObject();
            result.put("value", new String(plain, StandardCharsets.UTF_8));
            call.resolve(result);
        } catch (Exception error) {
            call.reject("Catatan terenkripsi belum bisa dibuka. Data tidak dihapus; coba lagi atau pulihkan cadangan JSON.");
        }
    }

    @PluginMethod
    public synchronized void write(PluginCall call) {
        if (!allowed(call)) return;
        AtomicFile file = walletFile();
        FileOutputStream output = null;
        try {
            String value = call.getString("value");
            if (value == null || value.length() > MAX_BYTES) throw new IOException("Invalid wallet size");
            byte[] plain = value.getBytes(StandardCharsets.UTF_8);
            if (plain.length > MAX_BYTES) throw new IOException("Wallet too large");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(true));
            cipher.updateAAD(ALIAS.getBytes(StandardCharsets.UTF_8));
            byte[] encrypted = cipher.doFinal(plain);
            byte[] iv = cipher.getIV();
            if (iv.length != 12) throw new IOException("Invalid IV length");
            byte[] data = ByteBuffer.allocate(1 + iv.length + encrypted.length)
                .put((byte) 1).put(iv).put(encrypted).array();
            output = file.startWrite();
            output.write(data);
            output.getFD().sync();
            file.finishWrite(output);
            output = null;
            if (!Arrays.equals(data, file.readFully()))
                throw new IOException("Wallet persistence incomplete");
            call.resolve();
        } catch (Exception error) {
            if (output != null) file.failWrite(output);
            call.reject("Catatan belum tersimpan. Pastikan ruang penyimpanan tersedia lalu coba lagi.");
        }
    }

    @PluginMethod
    public void clearLegacy(PluginCall call) {
        if (!allowed(call)) return;
        android.content.SharedPreferences legacy = getContext()
            .getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        if (legacy.contains("saku.wallet.v1") && !legacy.edit().remove("saku.wallet.v1").commit()) {
            call.reject("Pembersihan catatan lama belum selesai. Coba buka ulang aplikasi.");
            return;
        }
        call.resolve();
    }

    @Override
    public void load() {
        protectScreen();
        if (lockEnabled()) SakuWidget.hide(getContext());
        long cutoff = System.currentTimeMillis() - 24 * 60 * 60 * 1000L;
        File[] exports = new File(getContext().getCacheDir(), "exports").listFiles();
        if (exports != null) {
            for (File file : exports) {
                if (file.isFile() && file.lastModified() < cutoff) file.delete();
            }
        }
        File[] legacyExports = getContext().getCacheDir().listFiles();
        if (legacyExports != null) {
            for (File file : legacyExports) {
                String name = file.getName();
                if (file.isFile() && name.startsWith("saku-") &&
                    (name.endsWith(".json") || name.endsWith(".csv")) && file.lastModified() < cutoff)
                    file.delete();
            }
        }
    }
}
