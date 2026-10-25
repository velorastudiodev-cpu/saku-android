import { useState } from "react";
import {
  categoryNames,
  dateLabel,
  money,
  parseAmount,
  today,
  type Account,
  type Wallet,
} from "./domain";
import {
  accountBalance,
  budgetStatus,
  insights,
  spendingRoom,
  transferMoney,
} from "./finance";
import type { SaveFeature } from "./ManageCategories";
type Props = { wallet: Wallet; busy: boolean; save: SaveFeature };

export function AccountSelect({
  wallet,
  value,
  name = "accountId",
  label = "Dompet",
}: {
  wallet: Wallet;
  value?: string;
  name?: string;
  label?: string;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={value ?? wallet.accounts[0].id}>
        {wallet.accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AccountsPanel({ wallet, busy, save }: Props) {
  const [editing, setEditing] = useState<Account | "new" | null>(null);
  const [transfer, setTransfer] = useState(false);
  const [all, setAll] = useState(false);
  const [error, setError] = useState("");
  const current = typeof editing === "object" ? editing : null;
  const used =
    current &&
    (wallet.transactions.some((t) => t.accountId === current.id) ||
      wallet.recurring.some((r) => r.accountId === current.id) ||
      wallet.transfers.some(
        (t) => t.from === current.id || t.to === current.id,
      ));
  async function perform(action: () => Promise<void>) {
    setError("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Perubahan belum tersimpan.");
    }
  }
  return (
    <details className="panel feature-panel">
      <summary>
        Dompet & transfer{" "}
        <span className="muted">{wallet.accounts.length} dompet</span>
      </summary>
      <p className="hint">
        Pisahkan tunai, rekening, dan e-wallet. Transfer antar-dompet tidak
        dihitung sebagai pemasukan atau pengeluaran.
      </p>
      {wallet.accounts.map((a) => (
        <div className="account-row" key={a.id}>
          <div>
            <strong>{a.name}</strong>
            <span
              className={
                accountBalance(wallet, a.id) < 0 ? "negative num" : "num"
              }
            >
              {money(accountBalance(wallet, a.id))}
            </span>
          </div>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setEditing(a);
              setError("");
            }}
          >
            Edit <span className="sr-only">{a.name}</span>
          </button>
        </div>
      ))}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!editing && (
        <div className="feature-actions">
          <button
            disabled={busy || wallet.accounts.length >= 30}
            onClick={() => setEditing("new")}
          >
            Tambah dompet
          </button>
          <button
            disabled={busy || wallet.accounts.length < 2}
            onClick={() => setTransfer(!transfer)}
          >
            {transfer ? "Tutup transfer" : "Transfer uang"}
          </button>
        </div>
      )}
      {editing && (
        <form
          className="recurring-form"
          key={current?.id ?? "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void perform(async () => {
              const account = {
                id: current?.id ?? crypto.randomUUID(),
                name: String(f.get("name")).trim(),
                opening: parseAmount(String(f.get("opening")), true),
              };
              const accounts = current
                ? wallet.accounts.map((a) =>
                    a.id === current.id ? account : a,
                  )
                : [...wallet.accounts, account];
              if (
                await save(
                  {
                    ...wallet,
                    accounts,
                    opening: accounts.reduce((n, a) => n + a.opening, 0),
                  },
                  "Dompet tersimpan.",
                )
              )
                setEditing(null);
            });
          }}
        >
          <h3>{current ? "Edit dompet" : "Dompet baru"}</h3>
          <label>
            Nama dompet
            <input
              name="name"
              maxLength={40}
              required
              defaultValue={current?.name}
              placeholder="Contoh: DANA"
            />
          </label>
          <label>
            Saldo awal pencatatan (Rp)
            <input
              name="opening"
              inputMode="numeric"
              pattern="[0-9]+"
              maxLength={13}
              required
              defaultValue={current?.opening ?? 0}
            />
          </label>
          <p className="hint">
            Saldo awal bukan pemasukan. Jika uang berasal dari dompet lain yang
            sudah dicatat, isi 0 lalu gunakan transfer.
          </p>
          <div className="feature-actions">
            <button className="primary" disabled={busy}>
              Simpan dompet
            </button>
            <button type="button" onClick={() => setEditing(null)}>
              Batal
            </button>
            {current && (
              <button
                type="button"
                className="text-button danger"
                disabled={
                  busy ||
                  !!used ||
                  wallet.accounts.length === 1 ||
                  current.opening !== 0
                }
                onClick={() =>
                  void perform(async () => {
                    if (
                      await save(
                        {
                          ...wallet,
                          accounts: wallet.accounts.filter(
                            (a) => a.id !== current.id,
                          ),
                        },
                        "Dompet kosong dihapus.",
                      )
                    )
                      setEditing(null);
                  })
                }
              >
                Hapus dompet kosong
              </button>
            )}
          </div>
          {current && (
            <p className="hint">
              Dompet dengan saldo awal, transaksi, transfer, atau jadwal
              dipertahankan untuk menjaga riwayat.
            </p>
          )}
        </form>
      )}
      {transfer && (
        <form
          className="recurring-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            void perform(async () => {
              const next = transferMoney(wallet, {
                id: crypto.randomUUID(),
                from: String(f.get("from")),
                to: String(f.get("to")),
                amount: parseAmount(String(f.get("amount"))),
                date: String(f.get("date")),
                note: String(f.get("note") || "").trim(),
              });
              if (await save(next, "Transfer tersimpan.")) {
                form.reset();
                setTransfer(false);
              }
            });
          }}
        >
          <h3>Transfer antar-dompet</h3>
          <div className="form-two">
            <AccountSelect wallet={wallet} name="from" label="Dari" />
            <AccountSelect
              wallet={wallet}
              name="to"
              label="Ke"
              value={wallet.accounts[1]?.id}
            />
          </div>
          <div className="form-two">
            <label>
              Nominal (Rp)
              <input
                name="amount"
                inputMode="numeric"
                pattern="[0-9]+"
                maxLength={13}
                required
              />
            </label>
            <label>
              Tanggal
              <input
                type="date"
                name="date"
                defaultValue={today()}
                max={today()}
                required
              />
            </label>
          </div>
          <label>
            Catatan (opsional)
            <input name="note" maxLength={120} />
          </label>
          <p className="hint">
            Biaya admin, jika ada, dicatat sebagai pengeluaran terpisah.
          </p>
          <button className="primary" disabled={busy}>
            Simpan transfer
          </button>
        </form>
      )}
      {!!wallet.transfers.length && (
        <details className="transfer-history">
          <summary>
            Riwayat transfer{" "}
            <span className="muted">{wallet.transfers.length}</span>
          </summary>
          {[...wallet.transfers]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, all ? undefined : 10)
            .map((t) => (
              <div className="account-row" key={t.id}>
                <div>
                  <strong>
                    {wallet.accounts.find((a) => a.id === t.from)?.name} →{" "}
                    {wallet.accounts.find((a) => a.id === t.to)?.name}
                  </strong>
                  <span className="num">{money(t.amount)}</span>
                  <small>
                    {dateLabel(t.date, true)}
                    {t.note ? ` · ${t.note}` : ""}
                  </small>
                </div>
                <button
                  className="text-button danger"
                  disabled={busy}
                  onClick={() =>
                    void save(
                      {
                        ...wallet,
                        transfers: wallet.transfers.filter(
                          (old) => old.id !== t.id,
                        ),
                      },
                      "Transfer dihapus; saldo dompet disesuaikan.",
                    )
                  }
                >
                  Hapus
                  <span className="sr-only"> transfer {money(t.amount)}</span>
                </button>
              </div>
            ))}
          {wallet.transfers.length > 10 && !all && (
            <button className="text-button" onClick={() => setAll(true)}>
              Lihat semua transfer
            </button>
          )}
        </details>
      )}
    </details>
  );
}

export function CategoryBudgets({ wallet, busy, save }: Props) {
  const [error, setError] = useState("");
  const statuses = budgetStatus(wallet);
  const sum = wallet.categoryBudgets.reduce((n, b) => n + b.limit, 0);
  return (
    <details className="panel feature-panel">
      <summary>
        Anggaran kategori <span className="muted">{statuses.length} batas</span>
      </summary>
      <p className="hint">
        Batas dipakai setiap bulan. Peringatan muncul pada 80% dan 100%
        pemakaian; saldo tidak berubah.
      </p>
      {statuses.map((b) => (
        <div className="budget-item" key={b.category}>
          <div className="key-value">
            <strong>{b.category}</strong>
            <span className="num">
              {money(b.used)} / {money(b.limit)}
            </span>
          </div>
          <progress
            max={b.limit}
            value={Math.min(b.used, b.limit)}
            aria-label={`Anggaran ${b.category}`}
            className={b.ratio >= 1 ? "over" : ""}
          />
          <div className="key-value">
            <span className={b.ratio >= 1 ? "negative" : "hint"}>
              {b.ratio >= 1
                ? `Batas tercapai${b.remaining < 0 ? `, lebih ${money(-b.remaining)}` : ""}`
                : b.ratio >= 0.8
                  ? "Sudah terpakai 80% atau lebih"
                  : `Sisa ${money(b.remaining)}`}
            </span>
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                void save(
                  {
                    ...wallet,
                    categoryBudgets: wallet.categoryBudgets.filter(
                      (x) => x.category !== b.category,
                    ),
                  },
                  "Batas kategori dihapus.",
                )
              }
            >
              Hapus<span className="sr-only"> batas {b.category}</span>
            </button>
          </div>
        </div>
      ))}
      {wallet.budget > 0 && sum > wallet.budget && (
        <p className="notice">
          Total batas kategori {money(sum)} melebihi anggaran keseluruhan{" "}
          {money(wallet.budget)}. Batas keseluruhan tetap menjadi acuan Boleh
          Jajan.
        </p>
      )}
      <form
        className="recurring-form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          setError("");
          void (async () => {
            try {
              const category = String(f.get("category"));
              const limit = parseAmount(String(f.get("amount")));
              if (
                await save(
                  {
                    ...wallet,
                    categoryBudgets: [
                      ...wallet.categoryBudgets.filter(
                        (b) => b.category !== category,
                      ),
                      { category, limit },
                    ],
                  },
                  "Anggaran kategori tersimpan.",
                )
              )
                form.reset();
            } catch (e) {
              setError(
                e instanceof Error ? e.message : "Anggaran belum tersimpan.",
              );
            }
          })();
        }}
      >
        <h3>Atur batas kategori</h3>
        <div className="form-two">
          <label>
            Kategori
            <select name="category">
              {categoryNames(wallet, "expense").map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Batas bulanan (Rp)
            <input
              name="amount"
              inputMode="numeric"
              pattern="[0-9]+"
              maxLength={13}
              required
            />
          </label>
        </div>
        <p className="hint">
          Menyimpan kategori yang sama mengganti batas sebelumnya.
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button disabled={busy}>Simpan batas</button>
      </form>
    </details>
  );
}

export function BudgetAlerts({ wallet }: { wallet: Wallet }) {
  const alerts = budgetStatus(wallet).filter((b) => b.ratio >= 0.8);
  if (!alerts.length) return null;
  return (
    <div className="notice" role="status">
      {alerts.map((b) => (
        <p key={b.category}>
          <strong>{b.category}:</strong>{" "}
          {b.ratio >= 1
            ? "batas anggaran tercapai"
            : "80% anggaran sudah terpakai"}{" "}
          ({money(b.used)} dari {money(b.limit)}).
        </p>
      ))}
    </div>
  );
}

export function SpendingGuide({ wallet }: { wallet: Wallet }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const room = spendingRoom(wallet);
  const numeric =
    /^\d{1,13}$/.test(amount) && Number(amount) <= 1e12 ? Number(amount) : null;
  const budget = budgetStatus(wallet).find((b) => b.category === category);
  const allowance = Math.max(
    0,
    Math.min(room.daily, budget?.remaining ?? room.daily),
  );
  return (
    <section
      className="daily-pocket spending-guide"
      aria-labelledby="jajan-title"
    >
      <h2 id="jajan-title">Boleh Jajan?</h2>
      <span className="muted">Ruang belanja tersisa hari ini</span>
      <strong className="num">{money(room.daily)}</strong>
      <p>
        {room.daily > 0
          ? "Dalam batas catatan dan rencana yang tersedia."
          : "Tahan dulu belanja tambahan; periksa saldo dan kebutuhan wajib."}
      </p>
      <details>
        <summary>Simulasikan belanja</summary>
        <label>
          Perkiraan belanja (Rp)
          <input
            inputMode="numeric"
            pattern="[0-9]+"
            maxLength={13}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25000"
          />
        </label>
        <label>
          Kategori (opsional)
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tanpa kategori</option>
            {categoryNames(wallet, "expense").map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        {amount && (
          <p
            className={
              numeric !== null && numeric <= allowance
                ? "simulation-result"
                : "simulation-result negative"
            }
            role="status"
          >
            {numeric === null
              ? "Isi rupiah utuh, maksimal 1 triliun."
              : numeric <= allowance
                ? `Masih dalam batas. Setelah belanja, ruang hari ini ${money(allowance - numeric)}.`
                : `Melebihi ruang belanja ${money(numeric - allowance)}. Pertimbangkan menunda atau mengurangi nominal.`}
          </p>
        )}
        <div className="key-value">
          <span>Sisa hari bulan ini</span>
          <strong>{room.days} hari</strong>
        </div>
        <div className="key-value">
          <span>Pengeluaran hari ini</span>
          <span className="num">{money(room.spentToday)}</span>
        </div>
        <div className="key-value">
          <span>Kebutuhan terjadwal</span>
          <span className="num">{money(room.mandatory)}</span>
        </div>
        <div className="key-value">
          <span>Sisa anggaran</span>
          <span className="num">
            {room.budgetRemaining === null
              ? "Belum diatur"
              : money(room.budgetRemaining)}
          </span>
        </div>
        <p className="hint">
          Alokasi tujuan dan pengeluaran terjadwal yang belum dicatat sudah
          disisihkan. Pemasukan mendatang tidak diasumsikan diterima.
          Pengeluaran hari ini mengurangi jatah hari ini; batas kategori juga
          berlaku saat dipilih.
        </p>
        <p className="hint">
          Ini perkiraan berdasarkan catatan, bukan jaminan. Masukkan seluruh
          kebutuhan wajib sebagai jadwal agar hitungannya berguna.
          {!wallet.budget &&
            " Atur anggaran bulanan untuk batas yang lebih terarah."}
        </p>
      </details>
    </section>
  );
}

export function SmartInsights({ wallet }: { wallet: Wallet }) {
  const notes = insights(wallet);
  return (
    <section className="smart-insights" aria-label="Saku Insight 2.0">
      {notes.length ? (
        notes.map((n) => (
          <article key={n.title}>
            <h3>{n.title}</h3>
            <p>{n.text}</p>
          </article>
        ))
      ) : (
        <p className="hint">
          Catat pengeluaran secara rutin. Perbandingan kategori dan perkiraan
          akhir bulan muncul ketika catatannya mencukupi.
        </p>
      )}
      <p className="hint">
        Dihitung di perangkat, tanpa AI online. Catatan yang belum lengkap akan
        memengaruhi saran.
      </p>
    </section>
  );
}
