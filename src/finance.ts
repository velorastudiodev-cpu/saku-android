import {
  addDays,
  balances,
  breakdown,
  daysBetween,
  fromDate,
  inRange,
  money,
  periodRange,
  today,
  totals,
  validateWallet,
  type Transfer,
  type Wallet,
} from "./domain";

export function accountBalance(w: Wallet, id: string, date = today()) {
  const account = w.accounts.find((a) => a.id === id);
  if (!account) throw new Error("Dompet tidak ditemukan.");
  return (
    account.opening +
    totals(w.transactions.filter((t) => t.accountId === id && t.date <= date))
      .net +
    w.transfers
      .filter((t) => t.date <= date)
      .reduce(
        (n, t) =>
          n + (t.to === id ? t.amount : 0) - (t.from === id ? t.amount : 0),
        0,
      )
  );
}

export function transferMoney(w: Wallet, transfer: Transfer) {
  const next = validateWallet({ ...w, transfers: [transfer, ...w.transfers] });
  if (
    accountBalance(w, transfer.from, transfer.date) < transfer.amount ||
    accountBalance(next, transfer.from) < 0
  )
    throw new Error(
      "Saldo dompet asal tidak cukup pada tanggal transfer atau saat ini.",
    );
  return next;
}

export function budgetStatus(w: Wallet, now = today()) {
  const expenses = inRange(w.transactions, periodRange("month", 0, now)).filter(
    (t) => t.kind === "expense",
  );
  return w.categoryBudgets
    .map((b) => {
      const used = expenses
        .filter((t) => t.category === b.category)
        .reduce((n, t) => n + t.amount, 0);
      return { ...b, used, ratio: used / b.limit, remaining: b.limit - used };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

// Unrecorded expense schedules remain commitments; income is never assumed received.
export function commitments(w: Wallet, now = today()) {
  const end = periodRange("month", 0, now).end;
  const ids = new Set(w.transactions.map((t) => t.id));
  let amount = 0;
  for (const original of w.recurring) {
    if (!original.active || original.kind !== "expense") continue;
    if (original.nextDate > end) continue;
    const start = fromDate(original.nextDate),
      last = fromDate(end);
    let count =
      original.frequency === "week"
        ? Math.floor(daysBetween(original.nextDate, end) / 7) + 1
        : (last.getUTCFullYear() - start.getUTCFullYear()) * 12 +
          last.getUTCMonth() -
          start.getUTCMonth() +
          1;
    const prefix = `r:${original.id}:`;
    for (const id of ids) {
      if (!id.startsWith(prefix)) continue;
      const date = id.slice(prefix.length);
      if (date >= original.nextDate && date <= end) count--;
    }
    amount += Math.max(0, count) * original.amount;
    if (!Number.isSafeInteger(amount)) return Number.MAX_SAFE_INTEGER;
  }
  return amount;
}

export function spendingRoom(w: Wallet, now = today()) {
  const month = periodRange("month", 0, now);
  const expenses = totals(inRange(w.transactions, month)).expense;
  const spentToday = totals(
    w.transactions.filter((t) => t.date === now),
  ).expense;
  const mandatory = commitments(w, now);
  const available = balances(w).available;
  const days = daysBetween(now, month.end) + 1;
  const budgetRemaining = w.budget ? w.budget - expenses : null;
  const spendable = Math.max(
    0,
    Math.min(available, budgetRemaining ?? available) - mandatory,
  );
  // Reconstruct today's starting pool, share it across days, then subtract today's spend.
  const daily = Math.max(
    0,
    Math.min(
      spendable,
      Math.floor((spendable + spentToday) / days) - spentToday,
    ),
  );
  return {
    daily,
    days,
    spentToday,
    mandatory,
    available,
    budgetRemaining,
    spendable,
  };
}

export function forecast(w: Wallet, now = today()) {
  const range = periodRange("month", 0, now);
  const spent = totals(
    inRange(w.transactions, { start: range.start, end: now }),
  ).expense;
  const first = inRange(w.transactions, { start: range.start, end: now })
    .filter((t) => t.kind === "expense")
    .map((t) => t.date)
    .sort()[0];
  const elapsed = first ? daysBetween(first, now) + 1 : 0;
  const estimate = elapsed
    ? Math.ceil(spent + (spent / elapsed) * daysBetween(now, range.end))
    : 0;
  return { spent, estimate, elapsed, enough: elapsed >= 7 };
}

export function insights(w: Wallet, now = today()) {
  const current = breakdown(
    inRange(w.transactions, { start: addDays(now, -6), end: now }),
    "expense",
  );
  const previous = breakdown(
    inRange(w.transactions, {
      start: addDays(now, -13),
      end: addDays(now, -7),
    }),
    "expense",
  );
  const notes: { title: string; text: string }[] = [];
  const increase = current
    .map((c) => ({
      ...c,
      before: previous.find((p) => p.name === c.name)?.amount ?? 0,
    }))
    .filter((c) => c.before > 0 && c.amount > c.before)
    .sort((a, b) => b.amount - b.before - (a.amount - a.before))[0];
  if (increase)
    notes.push({
      title: `${increase.name} meningkat`,
      text: `Tujuh hari terakhir ${money(increase.amount)}, naik ${money(increase.amount - increase.before)} dari tujuh hari sebelumnya. Kembali ke pola sebelumnya dapat mengurangi pengeluaran sebesar selisih ini per minggu.`,
    });
  const month = breakdown(
    inRange(w.transactions, periodRange("month", 0, now)),
    "expense",
  );
  const other = month.find((c) => c.name === "Lainnya");
  if (other && other.share >= 25)
    notes.push({
      title: "Rapikan kategori Lainnya",
      text: `${money(other.amount)} (${Math.round(other.share)}%) pengeluaran bulan ini belum terkelompok rinci. Buat kategori sendiri, lalu gunakan Ubah kategori massal di Transaksi.`,
    });
  const prediction = forecast(w, now);
  if (prediction.enough)
    notes.push({
      title: "Perkiraan akhir bulan",
      text: `Sekitar ${money(prediction.estimate)} jika rata-rata harian tercatat berlanjut.${w.budget && prediction.estimate > w.budget ? ` Lebih ${money(prediction.estimate - w.budget)} dari anggaran. Kurangi belanja yang dapat ditunda.` : ""} Perkiraan ini bukan kepastian dan belum menambahkan tagihan mendatang.`,
    });
  const largest = month[0];
  if (largest && largest.name !== "Lainnya")
    notes.push({
      title: `Peluang hemat di ${largest.name}`,
      text: `Kategori terbesar bulan ini: ${money(largest.amount)}. Mengurangi 10% memberi ruang sekitar ${money(Math.floor(largest.amount * 0.1))}; pilih kebutuhan yang benar-benar bisa dikurangi.`,
    });
  return notes;
}
