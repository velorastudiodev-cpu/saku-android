import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle,
} from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import {
  balances,
  money,
  periodRange,
  today,
  totals,
  inRange,
  type Wallet,
} from "./domain";

type LockStatus = { enabled: boolean; available: boolean; unlocked: boolean };
const NativePrivacy = registerPlugin<{
  getLockStatus(): Promise<LockStatus>;
  authenticate(): Promise<void>;
  setLock(options: { enabled: boolean }): Promise<void>;
  screenReady(options: { locked: boolean }): Promise<void>;
  addListener(
    event: "privacyStateChanged",
    listener: (state: { isActive: boolean }) => void,
  ): Promise<PluginListenerHandle>;
  getWidgetStatus(): Promise<{ visible: boolean }>;
  updateWidget(options: {
    visible?: boolean;
    balance?: string;
    budget?: string;
    date?: string;
    month?: string;
  }): Promise<void>;
}>("SecureWallet");
const PrivacyContext = createContext({
  enabled: false,
  available: false,
  changing: false,
  change: async (_enabled: boolean) => {},
});

export function PrivacyGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LockStatus | null>(
    Capacitor.isNativePlatform()
      ? null
      : { enabled: false, available: false, unlocked: true },
  );
  const [error, setError] = useState("");
  const [changing, setChanging] = useState(false);
  const authenticating = useRef(false);
  const status = useRef(state);
  status.current = state;
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    const refresh = () =>
      NativePrivacy.getLockStatus()
        .then((s) => {
          if (active) setState(s);
        })
        .catch(() => {
          if (active) {
            setState(null);
            setError("Kunci aplikasi belum bisa diperiksa. Buka ulang Saku.");
          }
        });
    void refresh();
    const onState = ({ isActive }: { isActive: boolean }) => {
      if (authenticating.current) return;
      if (!isActive && status.current?.enabled)
        setState({ ...status.current, unlocked: false });
      if (isActive) void refresh();
    };
    const listener = NativeApp.addListener("appStateChange", onState);
    const nativeListener = NativePrivacy.addListener(
      "privacyStateChanged",
      onState,
    );
    return () => {
      active = false;
      void listener.then((l) => l.remove());
      void nativeListener.then((l) => l.remove());
    };
  }, []);
  useEffect(() => {
    if (Capacitor.isNativePlatform())
      void NativePrivacy.screenReady({ locked: !state?.unlocked }).catch(() =>
        setError("Tampilan terkunci belum siap. Buka ulang Saku."),
      );
  }, [state]);
  async function auth(enabled?: boolean) {
    if (authenticating.current) return;
    authenticating.current = true;
    setChanging(true);
    setError("");
    try {
      if (enabled === undefined) await NativePrivacy.authenticate();
      else await NativePrivacy.setLock({ enabled });
      setState(await NativePrivacy.getLockStatus());
    } catch (e) {
      try {
        setState(await NativePrivacy.getLockStatus());
      } catch {
        setState(null);
      }
      setError(e instanceof Error ? e.message : "Verifikasi belum berhasil.");
    } finally {
      authenticating.current = false;
      setChanging(false);
    }
  }
  if (!state || !state.unlocked)
    return (
      <main className="startup lock-screen">
        <img src="/saku-logo.png" width="72" height="72" alt="" />
        <h1>{state ? "Saku terkunci" : "Membuka Saku"}</h1>
        <p>
          {state
            ? "Verifikasi dengan biometrik atau kunci layar perangkat untuk membuka catatan."
            : "Memeriksa perlindungan perangkat…"}
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {state ? (
          <button
            className="primary"
            disabled={changing}
            onClick={() => void auth()}
          >
            {changing ? "Memverifikasi…" : "Buka Saku"}
          </button>
        ) : (
          error && <button onClick={() => location.reload()}>Buka ulang</button>
        )}
      </main>
    );
  return (
    <PrivacyContext.Provider
      value={{
        enabled: state.enabled,
        available: state.available,
        changing,
        change: auth,
      }}
    >
      {children}
      {error && (
        <div className="notice error privacy-error" role="alert">
          {error}
          <button onClick={() => setError("")}>Tutup</button>
        </div>
      )}
    </PrivacyContext.Provider>
  );
}

export function PrivacySettings({ wallet }: { wallet: Wallet }) {
  const privacy = useContext(PrivacyContext);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (privacy.enabled) setVisible(false);
  }, [privacy.enabled]);
  useEffect(() => {
    if (Capacitor.getPlatform() === "android")
      void NativePrivacy.getWidgetStatus()
        .then((r) => setVisible(r.visible))
        .catch(() => setError("Pengaturan widget belum terbaca."));
  }, []);
  return (
    <section className="panel feature-panel">
      <h2>Privasi & akses cepat</h2>
      <p className="hint">
        Kunci aplikasi memakai biometrik atau PIN/pola/sandi layar perangkat.
        Saku tidak menyimpan PIN dan tidak memerlukan akun.
      </p>
      {Capacitor.isNativePlatform() ? (
        <>
          <button
            disabled={!privacy.available || privacy.changing}
            onClick={() => void privacy.change(!privacy.enabled)}
          >
            {privacy.changing
              ? "Memverifikasi…"
              : privacy.enabled
                ? "Nonaktifkan kunci aplikasi"
                : "Aktifkan kunci aplikasi"}
          </button>
          {!privacy.available && (
            <p className="hint">
              Atur kunci layar pada pengaturan perangkat terlebih dahulu.
            </p>
          )}
          <p className="hint">
            Saat aktif, Saku meminta verifikasi ketika dibuka kembali dari latar
            belakang. Di Android, tangkapan layar dibatasi dan nominal widget
            disembunyikan.
          </p>
        </>
      ) : (
        <p className="hint">
          Kunci aplikasi tersedia pada aplikasi native Android/iOS.
        </p>
      )}
      {Capacitor.getPlatform() === "android" && (
        <>
          <h3>Widget layar utama</h3>
          <p className="hint">
            Tekan lama layar utama Android, pilih Widget → Saku. Tombol Catat
            membuka transaksi baru. Nominal disembunyikan secara default.
          </p>
          <label className="check-label">
            <input
              type="checkbox"
              checked={visible}
              disabled={busy || privacy.enabled}
              onChange={(e) => {
                const next = e.target.checked;
                setBusy(true);
                setError("");
                void publishWidget(wallet, next)
                  .then(() => setVisible(next))
                  .catch(() => setError("Pengaturan widget belum tersimpan."))
                  .finally(() => setBusy(false));
              }}
            />
            Tampilkan saldo dan sisa anggaran di widget
          </label>
          {privacy.enabled && (
            <p className="hint">
              Matikan kunci aplikasi sebelum mengizinkan nominal di layar utama.
            </p>
          )}
          <p className="hint">
            Jika diizinkan, dua nominal ringkasan disimpan di penyimpanan privat
            widget dan terlihat di layar utama. Diperbarui saat catatan disimpan
            atau Saku dibuka; waktu pembaruan ditampilkan.
          </p>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export async function publishWidget(wallet: Wallet, visible?: boolean) {
  if (Capacitor.getPlatform() !== "android") return;
  const expense = totals(
    inRange(wallet.transactions, periodRange("month")),
  ).expense;
  await NativePrivacy.updateWidget({
    visible,
    balance: money(balances(wallet).available),
    budget: wallet.budget ? money(wallet.budget - expense) : "Belum diatur",
    date: today(),
    month: today().slice(0, 7),
  });
}
