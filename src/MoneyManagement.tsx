import { useState } from "react";
import {
  categoryNames,
  dateLabel,
  money,
  parseAmount,
  today,
  type Account,
  type CategoryBudget,
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
  function cancel() {
    setEditing(null);
    setTransfer(false);
    setError("");
  }
  return (
    <section className="panel feature-panel">
      <div className="section-head">
        <h2>
          {editing
            ? current
              ? "Edit dompet"
              : "Dompet baru"
            : transfer
              ? "Pindahkan uang"
              : "Uangmu ada di mana?"}
        </h2>
        {!editing && !transfer && (
          <span className="muted">{wallet.accounts.length} dompet</span>
        )}
      </div>
      <p className="hint">
        {editing
          ? "Beri nama sesuai tempat kamu menyimpan uang."
          : transfer
            ? "Pindahkan catatan saldo antar-dompet. Total uangmu tetap sama."
            : "Pisahkan uang tunai, rekening, dan e-wallet agar saldonya mudah dilihat."}
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!editing && !transfer && (
        <>
          <div className="feature-actions">
            <button
              className="primary"
              disabled={busy || wallet.accounts.length >= 30}
              onClick={() => {
                setEditing("new");
                setError("");
              }}
            >
              Tambah dompet
            </button>
            <button
              disabled={busy || wallet.accounts.length < 2}
              onClick={() => {
                setTransfer(true);
                setError("");
              }}
            >
              Pindahkan uang
            </button>
          </div>
          {wallet.accounts.length < 2 && (
            <p className="hint">
              Tambahkan dompet kedua untuk memindahkan uang.
            </p>
          )}
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
                cancel();
            });
          }}
        >
          <label>
            Nama dompet
            <input
              name="name"
              maxLength={40}
              required
              autoFocus
              defaultValue={current?.name}
              placeholder="Misalnya: Tunai, BCA, atau DANA"
            />
          </label>
          <label>
            Saldo awal (Rp)
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
            Jika uangnya sudah tercatat di dompet lain, isi 0 lalu pilih
            Pindahkan uang.
          </p>
          <div className="feature-actions">
            <button className="primary" disabled={busy}>
              Simpan dompet
            </button>
            <button type="button" disabled={busy} onClick={cancel}>
              Batal
            </button>
          </div>
          <details className="feature-help">
            <summary>
              Tentang saldo awal{current ? " & penghapusan" : ""}
            </summary>
            <p className="hint">
              Saldo awal adalah uang yang sudah ada sebelum mulai mencatat,
              bukan pemasukan baru. Mengubahnya akan mengubah saldo total.
            </p>
            {current && (
              <>
                <p className="hint">
                  Dompet hanya bisa dihapus jika saldo awalnya nol dan belum
                  digunakan oleh transaksi, transfer, atau jadwal. Riwayat yang
                  sudah ada tetap dijaga.
                </p>
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
                        cancel();
                    })
                  }
                >
                  Hapus dompet kosong
                </button>
              </>
            )}
          </details>
        </form>
      )}
      {transfer && (
        <form
          className="recurring-form feature-editor"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void perform(async () => {
              const next = transferMoney(wallet, {
                id: crypto.randomUUID(),
                from: String(f.get("from")),
                to: String(f.get("to")),
                amount: parseAmount(String(f.get("amount"))),
                date: String(f.get("date")),
                note: String(f.get("note") || "").trim(),
              });
              if (await save(next, "Uang dipindahkan antar-dompet.")) cancel();
            });
          }}
        >
          <div className="form-two">
            <AccountSelect wallet={wallet} name="from" label="Dari dompet" />
            <AccountSelect
              wallet={wallet}
              name="to"
              label="Ke dompet"
              value={wallet.accounts[1]?.id}
            />
          </div>
          <label>
            Berapa yang dipindahkan? (Rp)
            <input
              name="amount"
              inputMode="numeric"
              pattern="[0-9]+"
              maxLength={13}
              required
              autoFocus
              placeholder="50000"
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
          <details className="feature-help">
            <summary>Tambahkan catatan</summary>
            <label>
              Catatan (opsional)
              <input name="note" maxLength={120} />
            </label>
          </details>
          <p className="hint">
            Pemindahan ini tidak dihitung sebagai pemasukan atau pengeluaran.
            Biaya admin dicatat terpisah sebagai pengeluaran.
          </p>
          <div className="feature-actions">
            <button className="primary" disabled={busy}>
              Pindahkan uang
            </button>
            <button type="button" disabled={busy} onClick={cancel}>
              Batal
            </button>
          </div>
        </form>
      )}
      {!editing && !transfer && !!wallet.transfers.length && (
        <details className="transfer-history">
          <summary>
            Riwayat pemindahan{" "}
            <span className="muted">{wallet.transfers.length}</span>
          </summary>
          {[...wallet.transfers]
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, all ? undefined : 5)
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
                      "Pemindahan dihapus; saldo dompet disesuaikan.",
                    )
                  }
                >
                  Hapus
                  <span className="sr-only"> pemindahan {money(t.amount)}</span>
                </button>
              </div>
            ))}
          {wallet.transfers.length > 5 && (
            <button className="text-button" onClick={() => setAll(!all)}>
              {all ? "Tampilkan lebih sedikit" : "Lihat semua pemindahan"}
            </button>
          )}
        </details>
      )}
    </section>
  );
}

export function CategoryBudgets({ wallet, busy, save }: Props) {
  const [editing, setEditing] = useState<CategoryBudget | "new" | null>(null);
  const [error, setError] = useState("");
  const current = typeof editing === "object" ? editing : null;
  const statuses = budgetStatus(wallet);
  const sum = wallet.categoryBudgets.reduce((n, b) => n + b.limit, 0);
  return (
    <section className="panel feature-panel">
      <div className="section-head">
        <h2>
          {editing
            ? current
              ? "Ubah batas belanja"
              : "Batas belanja baru"
            : "Batas per kategori"}
        </h2>
        {!editing && <span className="muted">{statuses.length} kategori</span>}
      </div>
      <p className="hint">
        Tentukan batas bulanan untuk makan, transportasi, atau kebutuhan lain.
      </p>
      {!editing && (
        <>
          <button
            className="primary"
            disabled={busy}
            onClick={() => {
              setEditing("new");
              setError("");
            }}
          >
            Atur batas kategori
          </button>
          {!statuses.length && (
            <p className="feature-empty">
              Mulai dari kategori yang paling sering kamu pakai. Saku akan
              mengingatkan saat batasnya hampir habis.
            </p>
          )}
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
                    ? b.remaining < 0
                      ? `Lewat ${money(-b.remaining)}`
                      : "Batas bulan ini sudah habis"
                    : b.ratio >= 0.8
                      ? "Hampir habis · 80% sudah terpakai"
                      : `Masih ada ${money(b.remaining)}`}
                </span>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() => {
                    setEditing({ category: b.category, limit: b.limit });
                    setError("");
                  }}
                >
                  Ubah<span className="sr-only"> batas {b.category}</span>
                </button>
              </div>
            </div>
          ))}
        </>
      )}
      {wallet.budget > 0 && sum > wallet.budget && (
        <p className="notice">
          Batas kategori berjumlah {money(sum)}, melebihi anggaran bulanan{" "}
          {money(wallet.budget)}. Boleh Jajan tetap memakai batas bulanan.
        </p>
      )}
      {editing && (
        <form
          className="recurring-form feature-editor"
          key={current?.category ?? "new"}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
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
                    "Batas belanja tersimpan.",
                  )
                )
                  setEditing(null);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Anggaran belum tersimpan.",
                );
              }
            })();
          }}
        >
          <label>
            Kategori
            {current ? (
              <input name="category" value={current.category} readOnly />
            ) : (
              <select name="category">
                {categoryNames(wallet, "expense").map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            )}
          </label>
          <label>
            Batas per bulan (Rp)
            <input
              name="amount"
              inputMode="numeric"
              pattern="[0-9]+"
              maxLength={13}
              defaultValue={current?.limit}
              autoFocus
              required
              placeholder="150000"
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="feature-actions">
            <button className="primary" disabled={busy}>
              Simpan batas
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
          </div>
          {current ? (
            <button
              type="button"
              className="text-button danger"
              disabled={busy}
              onClick={() =>
                void (async () => {
                  if (
                    await save(
                      {
                        ...wallet,
                        categoryBudgets: wallet.categoryBudgets.filter(
                          (b) => b.category !== current.category,
                        ),
                      },
                      "Batas kategori dihapus.",
                    )
                  )
                    setEditing(null);
                })()
              }
            >
              Hapus batas ini
            </button>
          ) : (
            <p className="hint">
              Jika kategori sudah punya batas, nominal baru akan
              menggantikannya.
            </p>
          )}
        </form>
      )}
      <details className="feature-help">
        <summary>Cara kerja anggaran</summary>
        <p className="hint">
          Batas berlaku setiap bulan dan tidak memindahkan uang. Peringatan
          muncul pada 80% dan 100% pemakaian. Anggaran bulanan mengatur total
          belanja; batas kategori membantu membaginya.
        </p>
      </details>
    </section>
  );
}

export function BudgetAlerts({ wallet }: { wallet: Wallet }) {
  const alerts = budgetStatus(wallet).filter((b) => b.ratio >= 0.8);
  if (!alerts.length) return null;
  const first = alerts[0];
  return (
    <div className="notice" role="status">
      <p>
        <strong>{first.category}:</strong>{" "}
        {first.ratio >= 1
          ? "batas bulan ini sudah habis"
          : "anggaran hampir habis"}{" "}
        ({money(first.used)} dari {money(first.limit)}).
      </p>
      {alerts.length > 1 && (
        <details className="feature-help">
          <summary>
            {alerts.length - 1} kategori lain perlu diperhatikan
          </summary>
          {alerts.slice(1).map((b) => (
            <p key={b.category}>
              <strong>{b.category}:</strong>{" "}
              {b.ratio >= 1 ? "batas tercapai" : "80% terpakai"} (
              {money(b.used)} dari {money(b.limit)}).
            </p>
          ))}
        </details>
      )}
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
    <section className="panel spending-guide" aria-labelledby="jajan-title">
      <div className="jajan-heading">
        <div>
          <h2 id="jajan-title">Boleh jajan hari ini?</h2>
          <p className="muted">Perkiraan ruang belanja tersisa</p>
        </div>
        <strong className="num">{money(room.daily)}</strong>
      </div>
      <p>
        {room.daily > 0
          ? "Kebutuhan terjadwal dan tabungan tujuan sudah diperhitungkan."
          : "Tahan dulu belanja tambahan. Cek saldo dan kebutuhan wajibmu."}
      </p>
      <details className="jajan-simulator">
        <summary>Cek rencana belanja</summary>
        <label>
          Mau belanja berapa? (Rp)
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
          Untuk apa? (opsional)
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Pilih kategori</option>
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
                ? `Masih dalam batas. Setelah belanja, ruang hari ini tersisa ${money(allowance - numeric)}.`
                : `Melebihi ruang belanja ${money(numeric - allowance)}. Coba kurangi nominal atau tunda dulu.`}
          </p>
        )}
        <p className="hint">
          Simulasi saja. Catat pengeluaran setelah kamu benar-benar belanja.
        </p>
        <details className="feature-help">
          <summary>Dasar perhitungan</summary>
          <div className="key-value">
            <span>Sisa hari bulan ini</span>
            <strong>{room.days} hari</strong>
          </div>
          <div className="key-value">
            <span>Sudah dibelanjakan hari ini</span>
            <span className="num">{money(room.spentToday)}</span>
          </div>
          <div className="key-value">
            <span>Kebutuhan terjadwal</span>
            <span className="num">{money(room.mandatory)}</span>
          </div>
          <div className="key-value">
            <span>Sisa anggaran bulanan</span>
            <span className="num">
              {room.budgetRemaining === null
                ? "Belum diatur"
                : money(room.budgetRemaining)}
            </span>
          </div>
          <p className="hint">
            Saldo setelah alokasi tujuan dan kebutuhan terjadwal dibagi ke sisa
            hari. Belanja hari ini mengurangi jatah hari ini. Batas kategori
            juga berlaku jika dipilih; pemasukan mendatang belum dihitung.
          </p>
          <p className="hint">
            Perkiraan mengikuti catatanmu, bukan jaminan. Catat kebutuhan wajib
            sebagai jadwal.
            {!wallet.budget &&
              " Atur anggaran bulanan di Rencana untuk batas yang lebih terarah."}
          </p>
        </details>
      </details>
    </section>
  );
}

export function SmartInsights({ wallet }: { wallet: Wallet }) {
  const notes = insights(wallet);
  return (
    <section className="smart-insights" aria-label="Saran Saku">
      {notes.length ? (
        <>
          <article>
            <h3>{notes[0].title}</h3>
            <p>{notes[0].text}</p>
          </article>
          {notes.length > 1 && (
            <details className="insight-more">
              <summary>Lihat {notes.length - 1} saran lainnya</summary>
              {notes.slice(1).map((n) => (
                <article key={n.title}>
                  <h3>{n.title}</h3>
                  <p>{n.text}</p>
                </article>
              ))}
            </details>
          )}
        </>
      ) : (
        <p className="hint">
          Saran akan muncul seiring catatanmu bertambah. Mulai dari pengeluaran
          hari ini.
        </p>
      )}
      <p className="hint">
        Dihitung offline dari catatanmu. Catatan yang lengkap membuat perkiraan
        lebih berguna.
      </p>
    </section>
  );
}
