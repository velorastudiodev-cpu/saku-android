import { validateWallet, type Wallet } from "./domain";
const iterations = 310000;
const MAX_BYTES = 10 * 1024 * 1024;
export type ProtectedBackup = {
  format: "saku-encrypted-backup";
  version: 1;
  kdf: "PBKDF2-SHA256";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};
const base64 = (bytes: Uint8Array) => {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192)
    text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
};
const bytes = (value: string) =>
  Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
export function validateProtectedBackup(input: unknown): ProtectedBackup {
  const b = input as ProtectedBackup;
  if (
    !b ||
    b.format !== "saku-encrypted-backup" ||
    b.version !== 1 ||
    b.kdf !== "PBKDF2-SHA256" ||
    b.iterations !== iterations ||
    typeof b.salt !== "string" ||
    b.salt.length !== 24 ||
    typeof b.iv !== "string" ||
    b.iv.length !== 16 ||
    typeof b.ciphertext !== "string" ||
    b.ciphertext.length > Math.ceil((MAX_BYTES + 16) / 3) * 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(b.ciphertext)
  )
    throw new Error("Format cadangan terenkripsi tidak didukung.");
  try {
    if (
      bytes(b.salt).length !== 16 ||
      bytes(b.iv).length !== 12 ||
      bytes(b.ciphertext).length < 16
    )
      throw new Error();
  } catch {
    throw new Error("Berkas cadangan terenkripsi tidak lengkap.");
  }
  return b;
}
async function derive(password: string, salt: Uint8Array<ArrayBuffer>) {
  if (!crypto.subtle)
    throw new Error("Enkripsi tidak tersedia di perangkat ini.");
  if (password.length > 1024) throw new Error("Kata sandi terlalu panjang.");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}
export async function protectBackup(
  wallet: Wallet,
  password: string,
): Promise<string> {
  if (password.length < 10)
    throw new Error("Gunakan kata sandi minimal 10 karakter.");
  const data = new TextEncoder().encode(JSON.stringify(validateWallet(wallet)));
  if (data.length > MAX_BYTES)
    throw new Error("Cadangan melebihi batas 10 MB.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await derive(password, salt);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data),
  );
  return JSON.stringify({
    format: "saku-encrypted-backup",
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations,
    salt: base64(salt),
    iv: base64(iv),
    ciphertext: base64(ciphertext),
  });
}
export async function unlockBackup(
  input: unknown,
  password: string,
): Promise<Wallet> {
  const b = validateProtectedBackup(input);
  const key = await derive(password, bytes(b.salt));
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes(b.iv) },
      key,
      bytes(b.ciphertext),
    );
  } catch {
    throw new Error(
      "Kata sandi salah atau berkas cadangan rusak. Catatan belum diubah.",
    );
  }
  if (plain.byteLength > MAX_BYTES) throw new Error("Cadangan terlalu besar.");
  return validateWallet(
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(plain)),
  );
}
