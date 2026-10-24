import {
  addDays,
  balances,
  breakdown,
  dateLabel,
  daysBetween,
  inRange,
  money,
  pct,
  periodRange,
  today,
  totals,
  type Wallet,
} from "./domain";

export function MoneyAdvice({ wallet }: { wallet: Wallet }) {
  const now = today();
  const range = periodRange("month", 0, now);
  const transactions = inRange(wallet.transactions, range);
  const month = totals(transactions);
  const prior = periodRange("month", -1, now);
  // Compare the same number of elapsed days, capped at the prior month's end.
  const priorEnd = [
    addDays(prior.start, daysBetween(range.start, now)),
    prior.end,
  ].sort()[0];
  const previous = totals(
    inRange(wallet.transactions, { start: prior.start, end: priorEnd }),
  );
  const largest = breakdown(transactions, "expense")[0];
  const spare = Math.max(0, Math.min(balances(wallet).available, month.net));
  const savingSuggestion = Math.floor(spare * 0.2);
  const advice: { title: string; comment: string; tip: string }[] = [];
  const reviewExpense = largest
    ? `Tinjau ${largest.name.toLocaleLowerCase("id")} (${money(largest.amount)}), kategori pengeluaran terbesar bulan ini. Dahulukan kebutuhan wajib sebelum belanja berikutnya.`
    : "Dahulukan kebutuhan wajib sebelum belanja berikutnya.";

  if (wallet.budget > 0 && month.expense >= wallet.budget * 0.8) {
    advice.push({
      title:
        month.expense >= wallet.budget
          ? "Anggaran sudah terpakai"
          : "Anggaran mulai menipis",
      comment: `Pengeluaran ${money(month.expense)} sudah mencapai ${pct((month.expense / wallet.budget) * 100)} dari anggaran ${money(wallet.budget)} bulan ini.`,
      tip: reviewExpense,
    });
  } else if (month.income > 0 && month.expense >= month.income * 0.8) {
    advice.push({
      title:
        month.expense > month.income
          ? "Pengeluaran melampaui pemasukan"
          : "Sebagian besar pemasukan terpakai",
      comment: `${money(month.expense)} keluar dari ${money(month.income)} yang masuk bulan ini (${pct(month.expenseRate)}).`,
      tip: reviewExpense,
    });
  } else if (month.expense > 0 && month.income === 0) {
    advice.push({
      title: "Belum ada pemasukan tercatat",
      comment: `Sudah ada pengeluaran ${money(month.expense)} bulan ini. Saldo awal tidak dihitung sebagai pemasukan bulan ini.`,
      tip: "Catat pemasukan jika sudah diterima, lalu sesuaikan belanja dengan saldo tersedia.",
    });
  }

  if (previous.income > 0 && month.income >= previous.income * 1.5) {
    advice.push({
      title: "Pemasukan meningkat",
      comment: `${money(month.income)} masuk pada ${dateLabel(range.start, true)}–${dateLabel(now, true)}, naik ${pct(((month.income - previous.income) / previous.income) * 100)} dibanding ${money(previous.income)} pada ${dateLabel(prior.start, true)}–${dateLabel(priorEnd, true)}.`,
      tip:
        savingSuggestion > 0
          ? `Setelah kebutuhan wajib terpenuhi, pertimbangkan menyisihkan ${money(savingSuggestion)} ke tujuan tabungan: 20% dari surplus yang masih tersedia.`
          : "Utamakan kebutuhan wajib dan pulihkan saldo tersedia sebelum menambah alokasi tabungan.",
    });
  } else if (
    month.income > 0 &&
    month.rate !== null &&
    month.rate >= 30 &&
    savingSuggestion > 0
  ) {
    advice.push({
      title: "Ada ruang untuk menabung",
      comment: `Surplus bulan ini ${money(month.net)}, setara ${pct(month.rate)} dari pemasukan ${money(month.income)}.`,
      tip: `Setelah kebutuhan wajib terpenuhi, pertimbangkan menyisihkan ${money(savingSuggestion)} ke tujuan tabungan: 20% dari surplus yang masih tersedia.`,
    });
  }

  if (!advice.length) {
    advice.push({
      title: transactions.length
        ? "Jaga ritme pencatatan"
        : "Mulai dari catatan hari ini",
      comment: transactions.length
        ? `Bulan ini ${money(month.income)} masuk dan ${money(month.expense)} keluar. Saran menyesuaikan catatanmu.`
        : "Belum ada transaksi bulan ini untuk melihat pola uangmu.",
      tip:
        wallet.budget > 0
          ? "Catat transaksi saat terjadi dan perhatikan sisa anggaran sebelum berbelanja."
          : "Tetapkan anggaran bulanan di Pengaturan agar batas belanja lebih jelas.",
    });
  }

  return (
    <section className="panel money-advice" aria-labelledby="advice-title">
      <div className="section-head">
        <h2 id="advice-title">Catatan Saku</h2>
        <span className="muted">{range.label}</span>
      </div>
      <ul className="advice-list">
        {advice.map((item) => (
          <li key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.comment}</p>
            <p className="advice-tip">
              <strong>Saran.</strong> {item.tip}
            </p>
          </li>
        ))}
      </ul>
      <p className="hint">
        Saran otomatis dari catatanmu, diperbarui saat transaksi berubah.
      </p>
    </section>
  );
}
