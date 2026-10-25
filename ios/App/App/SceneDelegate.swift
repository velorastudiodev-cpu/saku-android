import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = SakuViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func sceneWillResignActive(_ scene: UIScene) {
        guard SakuPrivacy.enabled else { return }
        if !SakuPrivacy.authenticating { SakuPrivacy.unlocked = false }
        SakuPrivacy.plugin?.notifyListeners("privacyStateChanged", data: ["isActive": false])
        guard let window = window, window.viewWithTag(3115) == nil else { return }
        let cover = UIView(frame: window.bounds)
        cover.tag = 3115
        cover.backgroundColor = .systemBackground
        cover.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        window.addSubview(cover)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        if !SakuPrivacy.enabled { window?.viewWithTag(3115)?.removeFromSuperview() }
        SakuPrivacy.plugin?.notifyListeners("privacyStateChanged", data: ["isActive": true])
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
