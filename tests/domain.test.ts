import test from "node:test";
import assert from "node:assert/strict";
import {
  allocate,
  balances,
  breakdown,
  csv,
  dailySeries,
  emptyWallet,
  goalPlan,
  inRange,
  parseAmount,
  periodRange,
  totals,
  validateWallet,
  validDate,
  type Wallet,
} from "../src/domain";
const wallet = (): Wallet => ({
  ...emptyWallet(),
  name: "Dira",
  opening: 100000,
  transactions: [
    {
      id: "in",
      kind: "income",
      amount: 1000000,
      category: "Uang jajan",
      note: "",
      date: "2026-01-01",
    },
    {
      id: "out",
      kind: "expense",
      amount: 250000,
      category: "Belanja",
      note: "",
      date: "2026-01-02",
    },
  ],
  goals: [
    {
      id: "goal",
      name: "Sepatu",
      saved: 200000,
      target: 500000,
      deadline: "2026-02-01",
    },
  ],
});
test("balance, reserved money and surplus reconcile without double counting savings", () => {
  assert.deepEqual(balances(wallet()), {
    balance: 850000,
    reserved: 200000,
    available: 650000,
  });
  assert.deepEqual(totals(wallet().transactions), {
    income: 1000000,
    expense: 250000,
    net: 750000,
    rate: 75,
    expenseRate: 25,
  });
  const next = allocate(wallet(), "goal", 100000);
  assert.deepEqual(balances(next), {
    balance: 850000,
    reserved: 300000,
    available: 550000,
  });
  assert.deepEqual(
    balances(allocate(next, "goal", 100000, true)),
    balances(wallet()),
  );
});
test("goals cannot create money, overspend available funds, or exceed target", () => {
  for (const amount of [-1, 0, 0.5, NaN, 300001, 700000])
    assert.throws(() => allocate(wallet(), "goal", amount));
  assert.throws(() => allocate(wallet(), "missing", 1));
  assert.throws(() => allocate(wallet(), "goal", 200001, true));
  const poor = wallet();
  poor.opening = 0;
  poor.transactions = [];
  assert.throws(() => allocate(poor, "goal", 1));
});
test("deleting a goal releases reservations without changing net cash", () => {
  assert.deepEqual(balances({ ...wallet(), goals: [] }), {
    balance: 850000,
    reserved: 0,
    available: 850000,
  });
});
test("income zero has no invented percent and actual deficit is visible", () => {
  const t = totals(wallet().transactions.filter((t) => t.kind === "expense"));
  assert.equal(t.rate, null);
  assert.equal(t.expenseRate, null);
  assert.equal(t.net, -250000);
  assert.equal(totals([]).income, 0);
});
test("month boundaries work across years and leap February", () => {
  assert.deepEqual(periodRange("month", -1, "2026-01-31"), {
    start: "2025-12-01",
    end: "2025-12-31",
    label: "Desember 2025",
  });
  assert.equal(periodRange("month", 0, "2024-02-29").end, "2024-02-29");
  assert.equal(periodRange("month", 1, "2026-01-31").end, "2026-02-28");
});
test("weeks start Monday and end Sunday, including across years", () => {
  const r = periodRange("week", 0, "2026-01-04");
  assert.equal(r.start, "2025-12-29");
  assert.equal(r.end, "2026-01-04");
  assert.equal(periodRange("week", 0, "2026-01-05").start, "2026-01-05");
});
test("date and amount inputs reject malformed values instead of guessing", () => {
  for (const s of ["2026-02-29", "2026-13-01", "2026-02-30", "10/01/2026"])
    assert.equal(validDate(s), false);
  for (const s of [
    "-5",
    "1.000",
    "1e6",
    "1,5",
    "",
    "Infinity",
    "1000000000001",
  ])
    assert.throws(() => parseAmount(s));
  assert.equal(parseAmount(" 5000 "), 5000);
  assert.equal(parseAmount("0", true), 0);
  assert.throws(() => parseAmount("0"));
});
test("daily chart and category percentages add up to report totals", () => {
  const ts = wallet().transactions;
  const ds = dailySeries(ts, "2026-01-01", "2026-01-03");
  assert.equal(ds.length, 3);
  assert.equal(
    ds.reduce((n, d) => n + d.income, 0),
    totals(ts).income,
  );
  assert.equal(
    ds.reduce((n, d) => n + d.expense, 0),
    totals(ts).expense,
  );
  assert.equal(
    breakdown(ts, "expense").reduce((n, d) => n + d.share, 0),
    100,
  );
  assert.equal(
    inRange(ts, { start: "2026-01-02", end: "2026-01-02" }).length,
    1,
  );
});
test("goal daily estimate includes today and handles completed/overdue goals", () => {
  const g = wallet().goals[0];
  assert.equal(goalPlan(g, "2026-01-03").daily, 10000);
  assert.equal(goalPlan(g, "2026-02-02").overdue, true);
  assert.equal(goalPlan({ ...g, saved: g.target }, "2026-02-02").daily, 0);
});
test("backup restore validates all fields, IDs, dates and safe aggregate integers", () => {
  assert.deepEqual(validateWallet(wallet()), wallet());
  const bad: unknown[] = [
    null,
    [],
    {},
    { ...wallet(), version: 2 },
    { ...wallet(), name: "" },
    { ...wallet(), budget: -1 },
    { ...wallet(), opening: Infinity },
    {
      ...wallet(),
      transactions: [{ ...wallet().transactions[0], date: "2999-01-01" }],
    },
    {
      ...wallet(),
      transactions: [{ ...wallet().transactions[0], category: "Unknown" }],
    },
    {
      ...wallet(),
      transactions: [...wallet().transactions, wallet().transactions[0]],
    },
    { ...wallet(), goals: [{ ...wallet().goals[0], saved: 600000 }] },
  ];
  bad.forEach((w) => assert.throws(() => validateWallet(w)));
  const huge = {
    ...wallet(),
    transactions: Array.from({ length: 10000 }, (_, i) => ({
      ...wallet().transactions[0],
      id: String(i),
      amount: 1e12,
    })),
  };
  assert.throws(() => validateWallet(huge));
});
test("CSV escapes quotes, multiline notes and spreadsheet formulas", () => {
  const t = wallet().transactions[0];
  const text = csv([{ ...t, note: '=HYPERLINK("https://example.com")' }]);
  assert.ok(text.includes('"\'=HYPERLINK(""https://example.com"")"'));
  assert.ok(csv([{ ...t, note: 'a,"b"\nc' }]).includes('"a,""b""\nc"'));
});
