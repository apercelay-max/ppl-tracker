import Capacitor

// Capacitor ne trouve pas tout seul les plugins écrits dans l'appli elle-même
// (seulement ceux installés via npm) : on les déclare ici.
class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(WidgetBridgePlugin())
        bridge?.registerPluginInstance(SubscriptionsPlugin())
    }
}
