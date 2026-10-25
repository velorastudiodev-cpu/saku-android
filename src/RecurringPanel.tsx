import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  categoryNames,
  dateLabel,
  money,
  parseAmount,
  settleRecurring,
  today,
  type Kind,
  type Recurring,
  type Wallet,
} from "./domain";
import { AccountSelect } from "./MoneyManagement";
import { requestReminders } from "./reminders";
import type { SaveFeature } from "./ManageCategories";
export function RecurringPanel({
  wallet,
  save,
  busy,
}: {
  wallet: Wallet;
  save: SaveFeature;
  busy: boolean;
}) {
  const [editing, setEditing] = useState<Recurring | "new" | null>(null);
  const [kind, setKind] = useState<Kind>("expense");
  const [error, setError] = useState("");
  const [requesting, setRequesting] = useState(false);
  const due = wallet.recurring.filter((r) => r.active && r.nextDate <= today());
  const current = typeof editing === "object" ? editing : null;
  const perform = async (task: () => Promise<void>) => {
    setError("");
    try {
      await task();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Perubahan belum tersimpan.");
    }
  };
  return (
    <details
      className="panel recurring-panel"
      open={due.length > 0 || undefined}
    >
      <summary>
        <span>Transaksi berulang</span>
        <span className="muted">
          {due.length
            ? `${due.length} jadwal jatuh tempo`
            : `${wallet.recurring.filter((r) => r.active).length} jadwal aktif`}
        </span>
      </summary>
      <p className="hint">
        Konfirmasi saat jatuh tempo, atau catat otomatis saat Saku dibuka.
        Jadwal yang terlewat tetap menunggu; saldo hanya berubah setelah
        pencatatan.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <ul className="recurring-list">
        {wallet.recurring.map((rule) => (
          <li key={rule.id}>
            <div>
              <strong>{rule.note || rule.category}</strong>
              <span className="num">
                {rule.kind === "income" ? "+" : "−"}
                {money(rule.amount)}
              </span>
            </div>
            <p className="hint">
              {rule.category} ·{" "}
              {wallet.accounts.find((a) => a.id === rule.accountId)?.name} ·{" "}
              {rule.frequency === "week" ? "Mingguan" : "Bulanan"} ·{" "}
              {rule.active ? dateLabel(rule.nextDate, true) : "Dijeda"} ·{" "}
              {rule.mode === "auto"
                ? "Otomatis saat dibuka"
                : "Konfirmasi dulu"}
            </p>
            <div className="feature-actions">
              {rule.active && rule.nextDate <= today() && (
                <>
                  <button
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        await save(
                          settleRecurring(wallet, rule.id),
                          "Transaksi rutin dicatat.",
                        );
                      })
                    }
                  >
                    Catat {dateLabel(rule.nextDate, true)}
                  </button>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() =>
                      void perform(async () => {
                        await save(
                          settleRecurring(wallet, rule.id, true),
                          "Kejadian ini dilewati.",
                        );
                      })
                    }
                  >
                    Lewati kali ini
                  </button>
                </>
              )}
              <button
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setEditing(rule);
                  setKind(rule.kind);
                  setError("");
                }}
              >
                Edit jadwal
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!editing && (
        <button
          disabled={busy || wallet.recurring.length >= 50}
          onClick={() => {
            setEditing("new");
            setKind("expense");
            setError("");
          }}
        >
          Tambah jadwal
        </button>
      )}
      {editing && (
        <form
          className="recurring-form"
          key={current?.id ?? "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void perform(async () => {
              const nextDate = String(f.get("date"));
              const frequency = f.get("frequency") as Recurring["frequency"];
              const rule: Recurring = {
                id: current?.id ?? crypto.randomUUID(),
                accountId: String(f.get("accountId")),
                kind,
                amount: parseAmount(String(f.get("amount"))),
                note: String(f.get("note") || "").trim(),
                category: String(f.get("category")),
                frequency,
                mode: f.get("mode") as Recurring["mode"],
                nextDate,
                anchorDay:
                  current?.nextDate === nextDate &&
                  current.frequency === frequency
                    ? current.anchorDay
                    : Number(nextDate.slice(8)),
                active: f.get("active") === "on",
              };
              if (
                await save(
                  {
                    ...wallet,
                    recurring: current
                      ? wallet.recurring.map((r) =>
                          r.id === current.id ? rule : r,
                        )
                      : [...wallet.recurring, rule],
                  },
                  "Jadwal tersimpan.",
                )
              )
                setEditing(null);
            });
          }}
        >
          <h3>{current ? "Edit jadwal" : "Jadwal baru"}</h3>
          <AccountSelect wallet={wallet} value={current?.accountId} />
          <label>
            Jenis
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
          </label>
          <div className="form-two">
            <label>
              Nominal (Rp)
              <input
                name="amount"
                inputMode="numeric"
                pattern="[0-9]+"
                maxLength={13}
                defaultValue={current?.amount}
                required
              />
            </label>
            <label>
              Kategori
              <select
                name="category"
                key={kind}
                defaultValue={
                  current?.kind === kind
                    ? current.category
                    : categoryNames(wallet, kind)[0]
                }
              >
                {categoryNames(wallet, kind).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Nama atau catatan
            <input
              name="note"
              maxLength={120}
              defaultValue={current?.note}
              placeholder="Contoh: Langganan musik"
            />
          </label>
          <div className="form-two">
            <label>
              Pengulangan
              <select
                name="frequency"
                defaultValue={current?.frequency ?? "month"}
              >
                <option value="week">Setiap minggu</option>
                <option value="month">Setiap bulan</option>
              </select>
            </label>
            <label>
              Tanggal berikutnya
              <input
                type="date"
                name="date"
                defaultValue={current?.nextDate ?? today()}
                min={current ? undefined : today()}
                required
              />
            </label>
          </div>
          <p className="hint">
            Jika tanggal tidak ada pada suatu bulan, jadwal jatuh pada hari
            terakhir bulan itu, lalu kembali ke tanggal asal.
          </p>
          <label>
            Cara mencatat
            <select name="mode" defaultValue={current?.mode ?? "confirm"}>
              <option value="confirm">Minta konfirmasi dahulu</option>
              <option value="auto">Otomatis saat Saku dibuka</option>
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              name="active"
              defaultChecked={current?.active ?? true}
            />
            Jadwal aktif
          </label>
          <div className="feature-actions">
            <button className="primary" disabled={busy}>
              Simpan jadwal
            </button>
            <button type="button" onClick={() => setEditing(null)}>
              Batal
            </button>
            {current && (
              <button
                type="button"
                className="text-button danger"
                disabled={busy}
                onClick={() =>
                  void perform(async () => {
                    if (
                      await save(
                        {
                          ...wallet,
                          recurring: wallet.recurring.filter(
                            (r) => r.id !== current.id,
                          ),
                        },
                        "Jadwal dihapus; transaksi sebelumnya tetap tersimpan.",
                      )
                    )
                      setEditing(null);
                  })
                }
              >
                Hapus jadwal
              </button>
            )}
          </div>
        </form>
      )}
      {Capacitor.isNativePlatform() && (
        <div className="reminder-setting">
          <button
            disabled={busy || requesting}
            onClick={() =>
              void perform(async () => {
                setRequesting(true);
                try {
                  if (!wallet.reminders) await requestReminders();
                  await save(
                    { ...wallet, reminders: !wallet.reminders },
                    wallet.reminders
                      ? "Pengingat dinonaktifkan."
                      : "Pengingat diaktifkan.",
                  );
                } finally {
                  setRequesting(false);
                }
              })
            }
          >
            {wallet.reminders
              ? "Matikan pengingat lokal"
              : "Aktifkan pengingat lokal"}
          </button>
          <p className="hint">
            Pengingat berikutnya dijadwalkan pukul 09.00 waktu perangkat tanpa
            menampilkan nominal. Waktu kirim mengikuti pengaturan baterai/fokus
            sistem. Buka Saku untuk memperbarui pengingat berikutnya.
          </p>
        </div>
      )}
    </details>
  );
}
