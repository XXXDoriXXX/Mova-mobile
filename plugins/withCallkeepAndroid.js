const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");

// react-native-callkeep ships no Expo config plugin, and its library manifest
// declares only permissions — NOT its Telecom ConnectionService. Without this
// <service> in the app manifest the system never binds the self-managed
// connection, so displayIncomingCall() silently no-ops. Inject it here.
const SERVICE_NAME = "io.wazo.callkeep.VoiceConnectionService";
const BIND_PERMISSION = "android.permission.BIND_TELECOM_CONNECTION_SERVICE";

const withCallkeepAndroid = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.service = app.service ?? [];

    if (
      !app.service.some((s) => s.$?.["android:name"] === SERVICE_NAME)
    ) {
      app.service.push({
        $: {
          "android:name": SERVICE_NAME,
          "android:label": "Mova",
          "android:permission": BIND_PERMISSION,
          "android:foregroundServiceType": "phoneCall",
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "android.telecom.ConnectionService" } },
            ],
          },
        ],
      });
    }

    return cfg;
  });

module.exports = withCallkeepAndroid;
