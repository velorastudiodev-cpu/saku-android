import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.velorastudio.saku",
  appName: "Saku",
  webDir: "dist",
  loggingBehavior: "none",
  plugins: {
    SystemBars: { style: "LIGHT", initialViewportFitValueHint: "cover" },
  },
  ios: { backgroundColor: "#f2f4f7", webContentsDebuggingEnabled: false },
  android: {
    backgroundColor: "#f2f4f7",
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};
export default config;
