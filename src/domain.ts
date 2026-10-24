export type Kind = "income" | "expense";
export type Transaction = {
  id: string;
  kind: Kind;
  amount: number;
  category: string;
  note: string;
  date: string;
};
export type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string;
};
export type Wallet = {
  version: 1;
  name: string;
  opening: number;
  budget: number;
  transactions: Transaction[];
  goals: Goal[];
};
export type Period = "week" | "month";
export const categories: Record<Kind, string[]> = {
  expense: [
    "Makan & minum",
    "Transportasi",
    "Belanja",
    "Hiburan",
    "Tagihan",
    "Kesehatan",
    "Pendidikan",
    "Lainnya",
  ],
  income: ["Uang jajan", "Gaji", "Freelance", "Hadiah", "Lainnya"],
};
export const emptyWallet = (): Wallet => ({
  version: 1,
  name: "",
  opening: 0,
  budget: 0,
  transactions: [],
  goals: [],
});
export const money = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
export const pct = (n: number | null) =>
  n === null
    ? "—"
    : `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n)}%`;
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const fromDate = (s: string) => new Date(`${s}T12:00:00Z`);
export const dateLabel = (s: string, short = false) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: short ? "short" : "long",
    ...(short ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(fromDate(s));
export function validDate(s: unknown): s is string {
  return (
    typeof s === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !isNaN(fromDate(s).getTime()) &&
    fromDate(s).toISOString().slice(0, 10) === s
  );
}
export const addDays = (s: string, days: number) => {
  const d = fromDate(s);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
export const daysBetween = (a: string, b: string) =>
  Math.round((fromDate(b).getTime() - fromDate(a).getTime()) / 86400000);
export function periodRange(period: Period, offset = 0, now = today()) {
  const d = fromDate(now);
  if (period === "month") {
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + offset);
    const start = d.toISOString().slice(0, 10);
    d.setUTCMonth(d.getUTCMonth() + 1);
    d.setUTCDate(0);
    return {
      start,
      end: d.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(d),
    };
  }
  const start = addDays(now, -((d.getUTCDay() + 6) % 7) + offset * 7);
  const end = addDays(start, 6);
  return {
    start,
    end,
    label: `${dateLabel(start, true)} – ${dateLabel(end, true)} ${end.slice(0, 4)}`,
  };
}
export function totals(transactions: Transaction[]) {
  const income = transactions
    .filter((t) => t.kind === "income")
    .reduce((a, t) => a + t.amount, 0);
  const expense = transactions
    .filter((t) => t.kind === "expense")
    .reduce((a, t) => a + t.amount, 0);
  return {
    income,
    expense,
    net: income - expense,
    rate: income ? ((income - expense) / income) * 100 : null,
    expenseRate: income ? (expense / income) * 100 : null,
  };
}
export function balances(w: Wallet) {
  const balance = w.opening + totals(w.transactions).net;
  const reserved = w.goals.reduce((a, g) => a + g.saved, 0);
  return { balance, reserved, available: balance - reserved };
}
export const inRange = (
  ts: Transaction[],
  range: { start: string; end: string },
) => ts.filter((t) => t.date >= range.start && t.date <= range.end);
export function breakdown(ts: Transaction[], kind: Kind) {
  const total = totals(ts)[kind];
  return categories[kind]
    .map((name) => {
      const amount = ts
        .filter((t) => t.kind === kind && t.category === name)
        .reduce((n, t) => n + t.amount, 0);
      return { name, amount, share: total ? (amount / total) * 100 : 0 };
    })
    .filter((c) => c.amount)
    .sort((a, b) => b.amount - a.amount);
}
export function dailySeries(ts: Transaction[], start: string, end: string) {
  return Array.from({ length: daysBetween(start, end) + 1 }, (_, i) => {
    const date = addDays(start, i);
    return { date, ...totals(ts.filter((t) => t.date === date)) };
  });
}
export function goalPlan(g: Goal, now = today()) {
  const remaining = g.target - g.saved;
  const days = Math.max(1, daysBetween(now, g.deadline) + 1);
  return {
    remaining,
    days,
    daily: Math.ceil(remaining / days),
    progress: (g.saved / g.target) * 100,
    overdue: g.deadline < now && remaining > 0,
  };
}
export function parseAmount(s: string, allowZero = false) {
  const clean = s.trim();
  if (!/^\d+$/.test(clean))
    throw new Error("Isi nominal dalam rupiah utuh, tanpa titik atau koma.");
  const n = Number(clean);
  if (
    !Number.isSafeInteger(n) ||
    n < (allowZero ? 0 : 1) ||
    n > 1_000_000_000_000
  )
    throw new Error(
      "Nominal harus antara " +
        (allowZero ? "0" : "1") +
        " dan 1 triliun rupiah.",
    );
  return n;
}
export function validateWallet(input: unknown): Wallet {
  const fail = () => {
    throw new Error(
      "Data cadangan tidak valid atau menggunakan versi yang belum didukung.",
    );
  };
  if (!input || typeof input !== "object") return fail();
  const w = input as Wallet;
  const amount = (n: unknown, zero = true) =>
    typeof n === "number" &&
    Number.isSafeInteger(n) &&
    n >= (zero ? 0 : 1) &&
    n <= 1_000_000_000_000;
  const text = (s: unknown, max: number, min = 1) =>
    typeof s === "string" && s.trim().length >= min && s.length <= max;
  if (
    w.version !== 1 ||
    !text(w.name, 40) ||
    !amount(w.opening) ||
    !amount(w.budget) ||
    !Array.isArray(w.transactions) ||
    !Array.isArray(w.goals) ||
    w.transactions.length > 20000 ||
    w.goals.length > 100
  )
    return fail();
  const ids = new Set<string>();
  for (const t of w.transactions) {
    if (
      !t ||
      !text(t.id, 100) ||
      ids.has(t.id) ||
      !["income", "expense"].includes(t.kind) ||
      !amount(t.amount, false) ||
      !categories[t.kind].includes(t.category) ||
      !text(t.note, 120, 0) ||
      !validDate(t.date) ||
      t.date > today()
    )
      return fail();
    ids.add(t.id);
  }
  for (const g of w.goals) {
    if (
      !g ||
      !text(g.id, 100) ||
      ids.has(g.id) ||
      !text(g.name, 60) ||
      !amount(g.target, false) ||
      !amount(g.saved) ||
      g.saved > g.target ||
      !validDate(g.deadline)
    )
      return fail();
    ids.add(g.id);
  }
  if (
    !Number.isSafeInteger(
      w.opening +
        w.transactions.reduce((n, t) => n + t.amount, 0) +
        w.goals.reduce((n, g) => n + g.saved, 0),
    )
  )
    return fail();
  return {
    version: 1,
    name: w.name,
    opening: w.opening,
    budget: w.budget,
    transactions: w.transactions.map(
      ({ id, kind, amount, category, note, date }) => ({
        id,
        kind,
        amount,
        category,
        note,
        date,
      }),
    ),
    goals: w.goals.map(({ id, name, target, saved, deadline }) => ({
      id,
      name,
      target,
      saved,
      deadline,
    })),
  };
}
export function allocate(
  w: Wallet,
  id: string,
  amount: number,
  withdraw = false,
): Wallet {
  const goal = w.goals.find((g) => g.id === id);
  if (!goal || !Number.isSafeInteger(amount) || amount <= 0)
    throw new Error("Nominal alokasi tidak valid.");
  if (withdraw && amount > goal.saved)
    throw new Error("Nominal melebihi tabungan tujuan ini.");
  if (!withdraw && amount > balances(w).available)
    throw new Error(
      "Saldo tersedia tidak cukup. Catat pemasukan terlebih dahulu.",
    );
  if (!withdraw && amount > goal.target - goal.saved)
    throw new Error("Nominal melebihi sisa target.");
  return {
    ...w,
    goals: w.goals.map((g) =>
      g.id === id
        ? { ...g, saved: g.saved + (withdraw ? -amount : amount) }
        : g,
    ),
  };
}
export function csv(ts: Transaction[]) {
  const cell = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      ["Tanggal", "Jenis", "Kategori", "Catatan", "Nominal (IDR)"],
      ...ts.map((t) => [
        t.date,
        t.kind === "income" ? "Pemasukan" : "Pengeluaran",
        t.category,
        t.note,
        t.amount,
      ]),
    ]
      .map((r) => r.map(cell).join(","))
      .join("\r\n")
  );
}
