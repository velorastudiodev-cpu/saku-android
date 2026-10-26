import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import { Bell, Check } from "lucide-react";
import {
  DEFAULT_DAILY_REMINDER,
  dailyNotificationsAllowed,
  loadDailyReminder,
  saveDailyReminder,
  type DailyReminder,
} from "./dailyReminder";

export function ReminderFields({
  value,
  change,
  disabled = false,
}: {
  value: DailyReminder;
  change: (value: DailyReminder) => void;
  disabled?: boolean;
}) {
  return (
    <div className="reminder-choice">
      <label className="check-label">
        <input
          type="checkbox"
          checked={value.enabled}
          disabled={disabled}
          onChange={(e) =>
            change({
              ...value,
              time: value.time || DEFAULT_DAILY_REMINDER.time,
              enabled: e.target.checked,
            })
          }
        />
        <span>
          Ingatkan saya setiap hari
          <small>Satu pengingat untuk melengkapi catatan.</small>
        </span>
      </label>
      {value.enabled && (
        <label className="reminder-time">
          Jam pengingat
          <input
            type="time"
            value={value.time}
            required
            disabled={disabled}
            onChange={(e) => change({ ...value, time: e.target.value })}
          />
        </label>
      )}
    </div>
  );
}

export function DailyReminderSettings() {
  const [value, setValue] = useState({ ...DEFAULT_DAILY_REMINDER });
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    void Promise.all([loadDailyReminder(), dailyNotificationsAllowed()])
      .then(([config, permission]) => {
        if (active) {
          setValue(config);
          setAllowed(permission);
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Pengaturan pengingat belum terbaca. Buka kembali halaman ini.",
          );
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    const listener = NativeApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive)
        void dailyNotificationsAllowed()
          .then((permission) => {
            if (active) setAllowed(permission);
          })
          .catch(() => {
            if (active)
              setError(
                "Izin notifikasi belum bisa diperiksa. Buka kembali halaman ini.",
              );
          });
    });
    return () => {
      active = false;
      void listener.then((l) => l.remove());
    };
  }, []);
  return (
    <section className="panel daily-settings">
      <div className="section-head">
        <h2>Sedikit waktu, setiap hari</h2>
        <Bell size={20} aria-hidden="true" />
      </div>
      <p className="muted">
        Saku mengingatkan dengan kalimat singkat, tanpa emoji atau rincian
        uangmu.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setSaved(false);
          void saveDailyReminder(value)
            .then(async () => {
              setAllowed(await dailyNotificationsAllowed());
              setSaved(true);
            })
            .catch((e) =>
              setError(
                e instanceof Error ? e.message : "Pengingat belum tersimpan.",
              ),
            )
            .finally(() => setBusy(false));
        }}
      >
        <ReminderFields
          value={value}
          change={(next) => {
            setValue(next);
            setSaved(false);
          }}
          disabled={busy || !loaded || !Capacitor.isNativePlatform()}
        />
        {!Capacitor.isNativePlatform() && (
          <p className="hint">Pengingat tersedia pada aplikasi Android/iOS.</p>
        )}
        {loaded && value.enabled && !allowed && (
          <p className="notice">
            Notifikasi dibatasi oleh perangkat. Periksa Pengaturan → Aplikasi →
            Saku → Notifikasi.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="primary"
          disabled={busy || !loaded || !Capacitor.isNativePlatform()}
        >
          {saved ? (
            <Check size={18} className="success-check" />
          ) : (
            <Bell size={18} />
          )}
          {busy ? "Menyimpan…" : saved ? "Tersimpan" : "Simpan pengingat"}
        </button>
        {saved && (
          <p className="hint" role="status">
            {value.enabled
              ? allowed
                ? `Pengingat aktif sekitar pukul ${value.time}, sesuai waktu perangkat.`
                : "Jadwal tersimpan. Izin notifikasi masih dibatasi oleh perangkat."
              : "Pengingat harian dinonaktifkan."}
          </p>
        )}
      </form>
      <details className="feature-help">
        <summary>Tentang pengingat</summary>
        <p>
          Pengingat ini berjalan lokal, tanpa internet. Ketuk notifikasinya
          untuk membuka form transaksi. Kamu bisa mematikan atau mengganti
          jamnya kapan saja.
        </p>
        <p>
          Pengingat harian tetap mengajak mengecek kelengkapan catatan meski
          sudah ada transaksi. Pengingat tagihan atau jadwal rutin diatur
          terpisah di Rencana → Jadwal.
        </p>
        <p>
          Waktu tampil mengikuti pengaturan baterai, fokus, dan izin perangkat.
          Tidak ada alarm presisi atau notifikasi promosi.
        </p>
      </details>
    </section>
  );
}
