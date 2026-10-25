import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyWallet,
  validateWallet,
  balances,
  breakdown,
  nextRecurringDate,
  processRecurring,
  settleRecurring,
  type Recurring,
} from "../src/domain";
import {
  protectBackup,
  unlockBackup,
  validateProtectedBackup,
} from "../src/backup";
const base = () => ({
  ...emptyWallet(),
  name: "Dira",
  opening: 500000,
  accounts: [{ id: "main", name: "Dompet utama", opening: 500000 }],
});
const rule = (override: Partial<Recurring> = {}): Recurring => ({
  id: "music",
  accountId: "main",
  kind: "expense",
  amount: 50000,
  category: "Hiburan",
  note: "Musik",
  frequency: "month",
  nextDate: "2026-01-31",
  anchorDay: 31,
  active: true,
  mode: "auto",
  ...override,
});
test("schema 1 migrates without changing any money or enabling automation", () => {
  const { recurring, reminders, customCategories, ...legacy } = base();
  const migrated = validateWallet({ ...legacy, version: 1 });
  assert.equal(migrated.version, 3);
  assert.deepEqual(balances(migrated), balances(base()));
  assert.deepEqual(migrated.recurring, []);
  assert.equal(migrated.reminders, false);
});
test("custom categories persist, reconcile with reports, and reject ambiguous names", () => {
  const w = {
    ...base(),
    customCategories: { income: [], expense: ["Kopi"] },
    transactions: [
      {
        id: "coffee",
        accountId: "main",
        kind: "expense" as const,
        amount: 20000,
        date: "2026-01-01",
        category: "Kopi",
        note: "",
      },
    ],
  };
  assert.deepEqual(validateWallet(w), w);
  assert.deepEqual(breakdown(w.transactions, "expense"), [
    { name: "Kopi", amount: 20000, share: 100 },
  ]);
  for (const names of [
    ["Kopi", "kopi"],
    ["Lainnya"],
    [" Kopi"],
    [""],
    ["x".repeat(41)],
  ])
    assert.throws(() =>
      validateWallet({
        ...w,
        customCategories: { income: [], expense: names },
      }),
    );
  assert.throws(() =>
    validateWallet({ ...w, customCategories: { income: [], expense: [] } }),
  );
});
test("monthly recurrences keep their anchor across short months and leap years", () => {
  assert.equal(nextRecurringDate(rule()), "2026-02-28");
  assert.equal(
    nextRecurringDate(rule({ nextDate: "2026-02-28" })),
    "2026-03-31",
  );
  assert.equal(
    nextRecurringDate(rule({ nextDate: "2024-01-31" })),
    "2024-02-29",
  );
  assert.equal(
    nextRecurringDate(rule({ frequency: "week", nextDate: "2025-12-29" })),
    "2026-01-05",
  );
});
test("automatic catch-up is idempotent and does not consume manual or paused rules", () => {
  const w = {
    ...base(),
    recurring: [
      rule(),
      rule({ id: "manual", mode: "confirm" }),
      rule({ id: "paused", active: false }),
    ],
  };
  const first = processRecurring(w, "2026-03-31");
  assert.equal(first.count, 3);
  assert.equal(first.wallet.transactions.length, 3);
  assert.equal(first.wallet.recurring[0].nextDate, "2026-04-30");
  assert.equal(first.wallet.recurring[1].nextDate, "2026-01-31");
  assert.equal(balances(first.wallet).balance, 350000);
  assert.equal(processRecurring(first.wallet, "2026-03-31").count, 0);
  assert.equal(w.transactions.length, 0);
  const skip = settleRecurring(first.wallet, "manual", true, "2026-03-31");
  assert.equal(skip.transactions.length, 3);
  assert.equal(skip.recurring[1].nextDate, "2026-02-28");
  assert.throws(() => settleRecurring(skip, "paused", false, "2026-03-31"));
});
test("repeating an occurrence cannot duplicate its transaction and malformed rules are rejected", () => {
  const w = { ...base(), recurring: [rule()] };
  const recorded = settleRecurring(w, "music", false, "2026-02-01");
  const replay = settleRecurring(
    { ...recorded, recurring: w.recurring },
    "music",
    false,
    "2026-02-01",
  );
  assert.equal(replay.transactions.length, 1);
  const autoReplay = processRecurring(
    { ...recorded, recurring: w.recurring },
    "2026-02-01",
  );
  assert.equal(autoReplay.count, 0);
  assert.equal(autoReplay.wallet.recurring[0].nextDate, "2026-02-28");
  assert.throws(() =>
    validateWallet({ ...w, recurring: [rule({ anchorDay: 32 })] }),
  );
  assert.throws(() =>
    validateWallet({ ...w, recurring: [rule({ nextDate: "2026-02-31" })] }),
  );
});
test("encrypted backups round-trip, reject wrong passwords and detect ciphertext tampering", async () => {
  const w = { ...base(), recurring: [rule()] };
  const text = await protectBackup(w, "frasa panjang rahasia");
  assert.ok(!text.includes("Dira"));
  const envelope = JSON.parse(text);
  assert.deepEqual(await unlockBackup(envelope, "frasa panjang rahasia"), w);
  await assert.rejects(() => unlockBackup(envelope, "sandi salah"));
  const tampered = {
    ...envelope,
    ciphertext:
      (envelope.ciphertext[0] === "A" ? "B" : "A") +
      envelope.ciphertext.slice(1),
  };
  await assert.rejects(() => unlockBackup(tampered, "frasa panjang rahasia"));
  assert.throws(() =>
    validateProtectedBackup({ ...envelope, iterations: 999999999 }),
  );
  await assert.rejects(() => protectBackup(w, "pendek"));
});
