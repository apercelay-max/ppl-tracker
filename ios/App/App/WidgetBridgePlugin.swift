import Capacitor
import WidgetKit

// Reçoit de l'appli web le résumé affiché par le widget (voir src/lib/widgetSync.ts)
// et le range dans l'« App Group » : un espace de stockage que l'appli et le
// widget ont le droit de lire tous les deux (le localStorage de l'appli, lui,
// est invisible pour le widget). L'identifiant doit rester identique dans
// App.entitlements, PPLWidget.entitlements et PPLWidget.swift.
@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setData", returnType: CAPPluginReturnPromise)
    ]

    static let appGroup = "group.com.ppltracker.app"
    static let dataKey = "widgetData"

    @objc func setData(_ call: CAPPluginCall) {
        guard let json = call.getString("json") else {
            call.reject("json manquant")
            return
        }
        guard let defaults = UserDefaults(suiteName: Self.appGroup) else {
            call.reject("App Group introuvable")
            return
        }
        defaults.set(json, forKey: Self.dataKey)
        // Sans ça, iOS garde l'ancien affichage jusqu'à sa prochaine mise à jour planifiée.
        WidgetCenter.shared.reloadAllTimelines()
        call.resolve()
    }
}
