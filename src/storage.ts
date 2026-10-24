import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { validateWallet, type Wallet } from "./domain";
const key = "saku.wallet.v1";
export async function loadWallet(): Promise<Wallet | null> {
  const { value } = await Preferences.get({ key });
  return value === null ? null : validateWallet(JSON.parse(value));
}
export async function saveWallet(wallet: Wallet) {
  await Preferences.set({ key, value: JSON.stringify(validateWallet(wallet)) });
}
export async function exportFile(
  name: string,
  data: string,
  mime = "application/json",
) {
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: name,
      data,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
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
