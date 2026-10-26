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
  const [showAll, setShowAll] = useState(false);
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
    <section className="panel recurring-panel">
      <div className="section-head">
        <h2>
          {editing
            ? current
              ? "Ubah jadwal"
              : "Jadwal baru"
            : "Uang yang berulang"}
        </h2>
        <span className="muted">
          {due.length
            ? `${due.length} jadwal jatuh tempo`
            : `${wallet.recurring.filter((r) => r.active).length} jadwal aktif`}
        </span>
      </div>
      <p className="hint">
        Jadwalkan uang jajan, langganan, atau tagihan agar tidak terlupa.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!editing && (
        <button
          className="primary"
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
      {!editing && (
        <>
          <ul className="recurring-list">
            {[...wallet.recurring]
              .sort(
                (a, b) =>
                  Number(b.active) - Number(a.active) ||
                  a.nextDate.localeCompare(b.nextDate),
              )
              .slice(0, showAll ? undefined : Math.max(5, due.length))
              .map((rule) => (
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
                    {wallet.accounts.find((a) => a.id === rule.accountId)?.name}{" "}
                    · {rule.frequency === "week" ? "Mingguan" : "Bulanan"} ·{" "}
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
                      Ubah jadwal
                    </button>
                  </div>
                </li>
              ))}
          </ul>
          {!wallet.recurring.length && (
            <p className="feature-empty">
              Belum ada jadwal. Tambahkan satu kebutuhan rutin untuk mulai.
            </p>
          )}
          {wallet.recurring.length > Math.max(5, due.length) && (
            <button
              className="text-button"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll
                ? "Tampilkan lebih sedikit"
                : `Lihat semua ${wallet.recurring.length} jadwal`}
            </button>
          )}
        </>
      )}

      {editing && (
        <form
          className="recurring-form feature-editor"
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
                autoFocus
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
            Nama jadwal (opsional)
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
          <label>
            Cara mencatat
            <select name="mode" defaultValue={current?.mode ?? "confirm"}>
              <option value="confirm">Konfirmasi sebelum dicatat</option>
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
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setEditing(null);
                setError("");
              }}
            >
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
      {!editing && Capacitor.isNativePlatform() && (
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
            {wallet.reminders ? "Matikan pengingat" : "Ingatkan saya"}
          </button>
          <p className="hint">
            Pengingat {wallet.reminders ? "aktif" : "nonaktif"}. Notifikasi
            hanya berisi pengingat umum, tanpa nominal.
          </p>
        </div>
      )}
      <details className="feature-help">
        <summary>Cara kerja jadwal</summary>
        <p className="hint">
          Pilih Konfirmasi untuk mengecek setiap kejadian sebelum dicatat. Mode
          Otomatis mencatat jadwal jatuh tempo ketika Saku dibuka atau aktif,
          bukan saat ditutup.
        </p>
        <p className="hint">
          Tanggal bulanan yang tidak tersedia mengikuti hari terakhir bulan,
          lalu kembali ke tanggal asal. Jadwal yang lewat tetap menunggu;
          menghapus jadwal tidak menghapus transaksi sebelumnya.
        </p>
        <p className="hint">
          Jika pengingat diaktifkan, kejadian berikutnya dijadwalkan pukul 09.00
          waktu perangkat. Buka Saku untuk memperbaruinya. Pengaturan baterai
          atau fokus bisa menunda notifikasi.
        </p>
      </details>
    </section>
  );
}
