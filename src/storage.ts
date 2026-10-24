import { Preferences } from "@capacitor/preferences";
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { validateWallet, type Wallet } from "./domain";
const key = "saku.wallet.v1";
const SecureWallet = registerPlugin<{
  read(): Promise<{ value: string | null }>;
  write(options: { value: string }): Promise<void>;
  clearLegacy(): Promise<void>;
}>("SecureWallet");
const isAndroid = () => Capacitor.getPlatform() === "android";

export async function loadWallet(): Promise<Wallet | null> {
  if (isAndroid()) {
    const stored = await SecureWallet.read();
    const value = stored.value ?? (await Preferences.get({ key })).value;
    if (value === null) return null;
    const wallet = validateWallet(JSON.parse(value));
    if (stored.value === null) {
      const migrated = JSON.stringify(wallet);
      await SecureWallet.write({ value: migrated });
      // Keep the original until the persisted, encrypted copy can be read back.
      if ((await SecureWallet.read()).value !== migrated)
        throw new Error(
          "Migrasi catatan belum selesai. Data lama tetap disimpan.",
        );
    }
    await SecureWallet.clearLegacy();
    return wallet;
  }
  const { value } = await Preferences.get({ key });
  return value === null ? null : validateWallet(JSON.parse(value));
}
export async function saveWallet(wallet: Wallet) {
  const value = JSON.stringify(validateWallet(wallet));
  if (isAndroid()) {
    await SecureWallet.write({ value });
    await SecureWallet.clearLegacy();
  } else {
    await Preferences.set({ key, value });
  }
}
export async function exportFile(
  name: string,
  data: string,
  mime = "application/json",
) {
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: `exports/${crypto.randomUUID()}-${name}`,
      data,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    await Share.share({
      title: "Cadangan Saku",
      files: [result.uri],
      dialogTitle: "Simpan atau kirim cadangan",
    });
  } else {
    const url = URL.createObjectURL(new Blob([data], { type: mime }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
