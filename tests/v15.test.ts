import test from "node:test";
import assert from "node:assert/strict";
import {
  balances,
  emptyWallet,
  totals,
  validateWallet,
  type Recurring,
  type Transaction,
  type Wallet,
} from "../src/domain";
import {
  accountBalance,
  budgetStatus,
  commitments,
  forecast,
  insights,
  spendingRoom,
  transferMoney,
} from "../src/finance";
const base = (): Wallet => ({
  ...emptyWallet(),
  name: "Dira",
  opening: 270000,
  budget: 270000,
  accounts: [
    { id: "main", name: "Tunai", opening: 270000 },
    { id: "bank", name: "Bank", opening: 0 },
  ],
});
const expense = (
  id: string,
  amount: number,
  date: string,
  category = "Makan & minum",
): Transaction => ({
  id,
  accountId: "main",
  kind: "expense",
  amount,
  category,
  date,
  note: "",
});
const recurring = (extra: Partial<Recurring> = {}): Recurring => ({
  id: "bill",
  accountId: "main",
  kind: "expense",
  amount: 60000,
  category: "Tagihan",
  note: "",
  frequency: "month",
  nextDate: "2026-01-28",
  anchorDay: 28,
  mode: "confirm",
  active: true,
  ...extra,
});

test("schema 2 migration assigns balances, transactions and schedules to one wallet without changing totals", () => {
  const old = {
    ...base(),
    version: 2,
    accounts: undefined,
    categoryBudgets: undefined,
    transfers: undefined,
    transactions: [
      { ...expense("lunch", 20000, "2026-01-01"), accountId: undefined },
    ],
    recurring: [{ ...recurring(), accountId: undefined }],
  };
  const next = validateWallet(old);
  assert.equal(next.version, 3);
  assert.deepEqual(next.accounts, [
    { id: "main", name: "Dompet utama", opening: 270000 },
  ]);
  assert.equal(next.transactions[0].accountId, "main");
  assert.equal(next.recurring[0].accountId, "main");
  assert.equal(accountBalance(next, "main"), 250000);
});
test("transfers reconcile per wallet and never inflate income, spending or global balance", () => {
  const w = base();
  const transfer = {
    id: "move",
    from: "main",
    to: "bank",
    amount: 100000,
    date: "2026-01-01",
    note: "",
  };
  const next = transferMoney(w, transfer);
  assert.equal(accountBalance(next, "main"), 170000);
  assert.equal(accountBalance(next, "bank"), 100000);
  assert.deepEqual(balances(next), balances(w));
  assert.deepEqual(totals(next.transactions), totals(w.transactions));
  assert.throws(() => transferMoney(next, transfer));
  for (const change of [
    { to: "main" },
    { to: "missing" },
    { amount: 270001 },
    { amount: -1 },
    { amount: 0.5 },
    { date: "2999-01-01" },
  ])
    assert.throws(() => transferMoney(w, { ...transfer, ...change }));
  assert.throws(() =>
    validateWallet({
      ...w,
      accounts: [w.accounts[0], { ...w.accounts[1], name: "tunai" }],
    }),
  );
  assert.throws(() =>
    validateWallet({
      ...w,
      transactions: [
        { ...expense("bad", 1, "2026-01-01"), accountId: "missing" },
      ],
    }),
  );
  assert.throws(() => validateWallet({ ...w, opening: 0 }));
});
test("category limits report exact 80% and 100%, stay in their month, and reject duplicates", () => {
  const w = {
    ...base(),
    categoryBudgets: [{ category: "Makan & minum", limit: 100000 }],
    transactions: [
      expense("one", 80000, "2026-01-02"),
      expense("old", 90000, "2025-12-01"),
    ],
  };
  assert.equal(budgetStatus(w, "2026-01-26")[0].ratio, 0.8);
  assert.equal(
    budgetStatus(
      {
        ...w,
        transactions: [...w.transactions, expense("two", 20000, "2026-01-03")],
      },
      "2026-01-26",
    )[0].ratio,
    1,
  );
  assert.throws(() =>
    validateWallet({
      ...w,
      categoryBudgets: [...w.categoryBudgets, ...w.categoryBudgets],
    }),
  );
  assert.throws(() =>
    validateWallet({
      ...w,
      categoryBudgets: [{ category: "missing", limit: 1 }],
    }),
  );
});
test("daily room subtracts today's spend once and reserves goals and pending bills without counting future income", () => {
  const w = { ...base(), transactions: [expense("past", 60000, "2026-01-25")] };
  assert.equal(spendingRoom(w, "2026-01-26").daily, 35000);
  assert.equal(
    spendingRoom(
      {
        ...w,
        transactions: [
          ...w.transactions,
          expense("today", 25000, "2026-01-26"),
        ],
      },
      "2026-01-26",
    ).daily,
    10000,
  );
  const reserved = {
    ...w,
    goals: [
      {
        id: "goal",
        name: "Sepatu",
        saved: 30000,
        target: 100000,
        deadline: "2026-12-01",
      },
    ],
    recurring: [
      recurring(),
      recurring({
        id: "income",
        kind: "income",
        category: "Gaji",
        amount: 1000000,
      }),
    ],
  };
  assert.equal(spendingRoom(reserved, "2026-01-26").daily, 20000);
  assert.equal(commitments(reserved, "2026-01-26"), 60000);
  assert.equal(
    spendingRoom({ ...reserved, opening: 0 }, "2026-01-26").daily,
    0,
  );
  const recorded = {
    ...reserved,
    transactions: [
      ...reserved.transactions,
      expense("r:bill:2026-01-28", 60000, "2026-01-28", "Tagihan"),
    ],
  };
  assert.equal(commitments(recorded, "2026-01-28"), 0);
  assert.equal(
    commitments(
      {
        ...w,
        recurring: [recurring({ frequency: "week", nextDate: "2026-01-01" })],
      },
      "2026-01-26",
    ),
    300000,
  );
});
test("forecast waits for a week of history and insights compare equal seven-day windows", () => {
  const w = {
    ...base(),
    transactions: [
      expense("prior", 100000, "2026-01-19"),
      expense("now", 200000, "2026-01-26"),
    ],
  };
  assert.equal(
    forecast({ ...w, transactions: [w.transactions[1]] }, "2026-01-26").enough,
    false,
  );
  assert.equal(forecast(w, "2026-01-26").enough, true);
  assert.match(insights(w, "2026-01-26")[0].title, /Makan & minum meningkat/);
  assert.ok(
    insights(
      {
        ...w,
        transactions: [expense("other", 100000, "2026-01-26", "Lainnya")],
      },
      "2026-01-26",
    ).some((n) => n.title === "Rapikan kategori Lainnya"),
  );
});
