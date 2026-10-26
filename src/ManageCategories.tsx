import { useState } from "react";
import {
  categoryNames,
  type Kind,
  type Wallet,
  type Transaction,
} from "./domain";
export type SaveFeature = (next: Wallet, message: string) => Promise<boolean>;
export function ManageCategories({
  wallet,
  save,
  busy,
}: {
  wallet: Wallet;
  save: SaveFeature;
  busy: boolean;
}) {
  const [kind, setKind] = useState<Kind>("expense");
  const [categoryError, setCategoryError] = useState("");
  return (
    <section className="panel feature-panel">
      <h2>Kategori buatanmu</h2>
      <p className="hint">
        Buat nama yang dekat dengan keseharianmu, seperti Kopi atau Kebutuhan
        anak.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const name = String(new FormData(form).get("name") || "").trim();
          setCategoryError("");
          if (!name) {
            setCategoryError("Isi nama kategori terlebih dahulu.");
            return;
          }
          if (
            categoryNames(wallet, kind).some(
              (n) => n.toLocaleLowerCase("id") === name.toLocaleLowerCase("id"),
            )
          ) {
            setCategoryError("Kategori dengan nama ini sudah ada.");
            return;
          }
          if (
            await save(
              {
                ...wallet,
                customCategories: {
                  ...wallet.customCategories,
                  [kind]: [...wallet.customCategories[kind], name],
                },
              },
              "Kategori ditambahkan.",
            )
          )
            form.reset();
        }}
      >
        <label>
          Jenis kategori
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as Kind)}
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </label>
        <label>
          Nama kategori
          <input
            name="name"
            required
            maxLength={40}
            placeholder="Contoh: Kopi"
          />
        </label>
        {categoryError && (
          <p className="form-error" role="alert">
            {categoryError}
          </p>
        )}
        <button
          className="primary"
          disabled={busy || wallet.customCategories[kind].length >= 50}
        >
          Tambah kategori
        </button>
      </form>
      <ul className="category-manage-list">
        {wallet.customCategories[kind].map((name) => {
          const used =
            (kind === "expense" &&
              wallet.categoryBudgets.some((b) => b.category === name)) ||
            wallet.transactions.some(
              (t) => t.kind === kind && t.category === name,
            ) ||
            wallet.recurring.some(
              (r) => r.kind === kind && r.category === name,
            );
          return (
            <li key={name}>
              <span>
                {name}
                {used && <small>Masih dipakai</small>}
              </span>
              <button
                className="text-button"
                disabled={busy || used}
                aria-label={`Hapus kategori ${name}`}
                onClick={() =>
                  void save(
                    {
                      ...wallet,
                      customCategories: {
                        ...wallet.customCategories,
                        [kind]: wallet.customCategories[kind].filter(
                          (n) => n !== name,
                        ),
                      },
                    },
                    "Kategori dihapus.",
                  )
                }
              >
                Hapus
              </button>
            </li>
          );
        })}
      </ul>
      {!wallet.customCategories[kind].length && (
        <p className="feature-empty">
          Belum ada kategori buatanmu untuk{" "}
          {kind === "expense" ? "pengeluaran" : "pemasukan"}. Kategori bawaan
          tetap tersedia saat mencatat.
        </p>
      )}
      <details className="feature-help">
        <summary>Mengapa kategori tidak bisa dihapus?</summary>
        <p className="hint">
          Kategori yang masih dipakai oleh transaksi, jadwal, atau anggaran
          tetap dijaga. Pindahkan transaksi lewat Ubah kategori sekaligus di
          Catatan, lalu sesuaikan jadwal dan anggarannya.
        </p>
      </details>
    </section>
  );
}
export function BulkCategory({
  wallet,
  transactions,
  save,
  busy,
}: {
  wallet: Wallet;
  transactions: Transaction[];
  save: SaveFeature;
  busy: boolean;
}) {
  const [kind, setKind] = useState<Kind>("expense");
  const [source, setSource] = useState("Lainnya");
  const [target, setTarget] = useState("Makan & minum");
  const selected = transactions.filter(
    (t) => t.kind === kind && t.category === source,
  );
  return (
    <details className="bulk-category">
      <summary>Ubah kategori sekaligus</summary>
      <p className="hint">
        Pindahkan transaksi yang cocok dengan filter dan pencarian saat ini.
        Jumlah di bawah termasuk hasil yang belum tampil; jadwal tetap sama.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const ids = new Set(selected.map((t) => t.id));
          void save(
            {
              ...wallet,
              transactions: wallet.transactions.map((t) =>
                ids.has(t.id) ? { ...t, category: target } : t,
              ),
            },
            `${ids.size} transaksi dipindahkan ke ${target}.`,
          );
        }}
      >
        <label>
          Jenis
          <select
            value={kind}
            onChange={(e) => {
              const k = e.target.value as Kind;
              setKind(k);
              setSource("Lainnya");
              setTarget(categoryNames(wallet, k)[0]);
            }}
          >
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
          </select>
        </label>
        <div className="form-two">
          <label>
            Dari kategori
            <select value={source} onChange={(e) => setSource(e.target.value)}>
              {categoryNames(wallet, kind).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Ke kategori
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              {categoryNames(wallet, kind).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <p>{selected.length} transaksi akan berubah kategorinya.</p>
        <button
          disabled={
            busy ||
            !selected.length ||
            source === target ||
            !categoryNames(wallet, kind).includes(target)
          }
        >
          Ubah {selected.length} transaksi
        </button>
      </form>
    </details>
  );
}
