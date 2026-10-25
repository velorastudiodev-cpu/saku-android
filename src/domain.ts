export type Kind = "income" | "expense";
export type Transaction = {
  id: string;
  accountId: string;
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
export type Recurring = {
  id: string;
  accountId: string;
  kind: Kind;
  amount: number;
  category: string;
  note: string;
  frequency: "week" | "month";
  nextDate: string;
  anchorDay: number;
  mode: "confirm" | "auto";
  active: boolean;
};
export type Account = { id: string; name: string; opening: number };
export type Transfer = {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  note: string;
};
export type CategoryBudget = { category: string; limit: number };
export type Wallet = {
  version: 3;
  accounts: Account[];
  transfers: Transfer[];
  categoryBudgets: CategoryBudget[];
  customCategories: Record<Kind, string[]>;
  recurring: Recurring[];
  reminders: boolean;
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
  version: 3,
  accounts: [{ id: "main", name: "Dompet utama", opening: 0 }],
  transfers: [],
  categoryBudgets: [],
  customCategories: { income: [], expense: [] },
  recurring: [],
  reminders: false,
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
  return [...new Set(ts.filter((t) => t.kind === kind).map((t) => t.category))]
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
  const w = input as Omit<Wallet, "version"> & { version: number };
  const amount = (n: unknown, zero = true) =>
    typeof n === "number" &&
    Number.isSafeInteger(n) &&
    n >= (zero ? 0 : 1) &&
    n <= 1_000_000_000_000;
  const text = (s: unknown, max: number, min = 1) =>
    typeof s === "string" && s.trim().length >= min && s.length <= max;
  if (
    ![1, 2, 3].includes(w.version) ||
    !text(w.name, 40) ||
    !amount(w.opening) ||
    !amount(w.budget) ||
    !Array.isArray(w.transactions) ||
    !Array.isArray(w.goals) ||
    w.transactions.length > 20000 ||
    w.goals.length > 100
  )
    return fail();
  const custom =
    w.version === 1 ? { income: [], expense: [] } : w.customCategories;
  const recurring = w.version === 1 ? [] : w.recurring;
  const reminders = w.version === 1 ? false : w.reminders;
  const accounts =
    w.version < 3
      ? [{ id: "main", name: "Dompet utama", opening: w.opening }]
      : w.accounts;
  const transfers = w.version < 3 ? [] : w.transfers;
  const categoryBudgets = w.version < 3 ? [] : w.categoryBudgets;
  if (
    !Array.isArray(accounts) ||
    !accounts.length ||
    accounts.length > 30 ||
    !Array.isArray(transfers) ||
    transfers.length > 20000 ||
    !Array.isArray(categoryBudgets) ||
    categoryBudgets.length > 58
  )
    return fail();
  const accountIds = new Set<string>();
  const accountNames = new Set<string>();
  for (const a of accounts) {
    if (
      !a ||
      !text(a.id, 60) ||
      accountIds.has(a.id) ||
      !text(a.name, 40) ||
      a.name !== a.name.trim() ||
      accountNames.has(a.name.toLocaleLowerCase("id")) ||
      !amount(a.opening)
    )
      return fail();
    accountIds.add(a.id);
    accountNames.add(a.name.toLocaleLowerCase("id"));
  }
  if (accounts.reduce((n, a) => n + a.opening, 0) !== w.opening) return fail();
  if (
    !custom ||
    typeof custom !== "object" ||
    !Array.isArray(recurring) ||
    recurring.length > 50 ||
    typeof reminders !== "boolean"
  )
    return fail();
  for (const kind of ["income", "expense"] as const) {
    if (!Array.isArray(custom[kind]) || custom[kind].length > 50) return fail();
    const names = new Set(
      categories[kind].map((name) => name.toLocaleLowerCase("id")),
    );
    for (const name of custom[kind]) {
      if (
        !text(name, 40) ||
        name !== name.trim() ||
        names.has(name.toLocaleLowerCase("id"))
      )
        return fail();
      names.add(name.toLocaleLowerCase("id"));
    }
  }
  const knownCategory = (kind: Kind, name: string) =>
    [...categories[kind], ...custom[kind]].includes(name);
  const budgetNames = new Set<string>();
  for (const b of categoryBudgets) {
    if (
      !b ||
      !knownCategory("expense", b.category) ||
      budgetNames.has(b.category) ||
      !amount(b.limit, false)
    )
      return fail();
    budgetNames.add(b.category);
  }
  const ids = new Set<string>();
  for (const t of w.transactions) {
    if (
      !t ||
      !text(t.id, 100) ||
      ids.has(t.id) ||
      (w.version === 3 && !accountIds.has(t.accountId)) ||
      !["income", "expense"].includes(t.kind) ||
      !amount(t.amount, false) ||
      !knownCategory(t.kind, t.category) ||
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
  for (const r of recurring) {
    if (
      !r ||
      !text(r.id, 60) ||
      ids.has(r.id) ||
      (w.version === 3 && !accountIds.has(r.accountId)) ||
      !["income", "expense"].includes(r.kind) ||
      !amount(r.amount, false) ||
      !knownCategory(r.kind, r.category) ||
      !text(r.note, 120, 0) ||
      !["week", "month"].includes(r.frequency) ||
      !validDate(r.nextDate) ||
      !Number.isInteger(r.anchorDay) ||
      r.anchorDay < 1 ||
      r.anchorDay > 31 ||
      !["confirm", "auto"].includes(r.mode) ||
      typeof r.active !== "boolean"
    )
      return fail();
    ids.add(r.id);
  }
  for (const t of transfers) {
    if (
      !t ||
      !text(t.id, 100) ||
      ids.has(t.id) ||
      !accountIds.has(t.from) ||
      !accountIds.has(t.to) ||
      t.from === t.to ||
      !amount(t.amount, false) ||
      !validDate(t.date) ||
      t.date > today() ||
      !text(t.note, 120, 0)
    )
      return fail();
    ids.add(t.id);
  }
  if (
    !Number.isSafeInteger(
      w.opening +
        w.transactions.reduce((n, t) => n + t.amount, 0) +
        transfers.reduce((n, t) => n + t.amount, 0) +
        w.goals.reduce((n, g) => n + g.saved, 0),
    )
  )
    return fail();
  return {
    version: 3,
    accounts: accounts.map(({ id, name, opening }) => ({ id, name, opening })),
    transfers: transfers.map(({ id, from, to, amount, date, note }) => ({
      id,
      from,
      to,
      amount,
      date,
      note,
    })),
    categoryBudgets: categoryBudgets.map(({ category, limit }) => ({
      category,
      limit,
    })),
    customCategories: {
      income: [...custom.income],
      expense: [...custom.expense],
    },
    recurring: recurring.map(
      ({
        id,
        accountId,
        kind,
        amount,
        category,
        note,
        frequency,
        nextDate,
        anchorDay,
        mode,
        active,
      }) => ({
        id,
        accountId: w.version < 3 ? "main" : accountId,
        kind,
        amount,
        category,
        note,
        frequency,
        nextDate,
        anchorDay,
        mode,
        active,
      }),
    ),
    reminders,
    name: w.name,
    opening: w.opening,
    budget: w.budget,
    transactions: w.transactions.map(
      ({ id, accountId, kind, amount, category, note, date }) => ({
        id,
        accountId: w.version < 3 ? "main" : accountId,
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
export function csv(ts: Transaction[], accounts: Account[] = []) {
  const cell = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      ["Tanggal", "Jenis", "Kategori", "Catatan", "Nominal (IDR)", "Dompet"],
      ...ts.map((t) => [
        t.date,
        t.kind === "income" ? "Pemasukan" : "Pengeluaran",
        t.category,
        t.note,
        t.amount,
        accounts.find((a) => a.id === t.accountId)?.name ?? t.accountId,
      ]),
    ]
      .map((r) => r.map(cell).join(","))
      .join("\r\n")
  );
}

export const categoryNames = (wallet: Wallet, kind: Kind) => [
  ...categories[kind],
  ...wallet.customCategories[kind],
];

export function nextRecurringDate(rule: Recurring) {
  if (rule.frequency === "week") return addDays(rule.nextDate, 7);
  const d = fromDate(rule.nextDate);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(rule.anchorDay, last));
  const next = d.toISOString().slice(0, 10);
  if (!validDate(next))
    throw new Error("Tanggal jadwal di luar rentang yang didukung.");
  return next;
}

export function settleRecurring(
  wallet: Wallet,
  id: string,
  skip = false,
  now = today(),
): Wallet {
  const rule = wallet.recurring.find((r) => r.id === id);
  if (!rule || !rule.active || rule.nextDate > now)
    throw new Error("Jadwal ini belum jatuh tempo.");
  const transactionId = `r:${rule.id}:${rule.nextDate}`;
  const transaction: Transaction = {
    id: transactionId,
    accountId: rule.accountId,
    kind: rule.kind,
    amount: rule.amount,
    category: rule.category,
    note: rule.note,
    date: rule.nextDate,
  };
  return validateWallet({
    ...wallet,
    transactions:
      skip || wallet.transactions.some((t) => t.id === transactionId)
        ? wallet.transactions
        : [transaction, ...wallet.transactions],
    recurring: wallet.recurring.map((r) =>
      r.id === id ? { ...r, nextDate: nextRecurringDate(r) } : r,
    ),
  });
}

export function processRecurring(
  wallet: Wallet,
  now = today(),
): { wallet: Wallet; count: number } {
  const rules = wallet.recurring.map((r) => ({ ...r }));
  const ids = new Set(wallet.transactions.map((t) => t.id));
  const added: Transaction[] = [];
  let processed = 0;
  // One validation per batch keeps long histories responsive; excess work stays queued.
  for (const rule of rules) {
    if (!rule.active || rule.mode !== "auto") continue;
    while (
      rule.nextDate <= now &&
      processed < 100 &&
      wallet.transactions.length + added.length < 20000
    ) {
      const id = `r:${rule.id}:${rule.nextDate}`;
      if (!ids.has(id)) {
        added.push({
          id,
          accountId: rule.accountId,
          kind: rule.kind,
          amount: rule.amount,
          category: rule.category,
          note: rule.note,
          date: rule.nextDate,
        });
        ids.add(id);
      }
      rule.nextDate = nextRecurringDate(rule);
      processed++;
    }
  }
  if (!processed) return { wallet, count: 0 };
  return {
    wallet: validateWallet({
      ...wallet,
      transactions: [...added.reverse(), ...wallet.transactions],
      recurring: rules,
    }),
    count: added.length,
  };
}
