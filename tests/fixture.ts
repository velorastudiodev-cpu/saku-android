import {
  addDays,
  emptyWallet,
  periodRange,
  today,
  type Wallet,
} from "../src/domain";
export function fixture(): Wallet {
  const now = today();
  const start = periodRange("month").start;
  return {
    ...emptyWallet(),
    name: "Dira",
    opening: 350000,
    budget: 1500000,
    transactions: [
      {
        id: "a",
        kind: "expense",
        category: "Makan & minum",
        amount: 35000,
        note: "Makan siang",
        date: now,
      },
      {
        id: "b",
        kind: "expense",
        category: "Transportasi",
        amount: 18000,
        note: "Perjalanan pulang",
        date: now,
      },
      {
        id: "c",
        kind: "income",
        category: "Freelance",
        amount: 450000,
        note: "Proyek desain",
        date: addDays(now, -1),
      },
      {
        id: "d",
        kind: "expense",
        category: "Makan & minum",
        amount: 42000,
        note: "Kopi & makan sore",
        date: addDays(now, -1),
      },
      {
        id: "e",
        kind: "expense",
        category: "Belanja",
        amount: 185000,
        note: "Kebutuhan bulanan",
        date: addDays(now, -2),
      },
      {
        id: "f",
        kind: "expense",
        category: "Transportasi",
        amount: 24000,
        note: "Ojek ke kampus",
        date: addDays(now, -3),
      },
      {
        id: "g",
        kind: "expense",
        category: "Hiburan",
        amount: 65000,
        note: "Nonton akhir pekan",
        date: addDays(now, -4),
      },
      {
        id: "h",
        kind: "income",
        category: "Uang jajan",
        amount: 1500000,
        note: "Uang jajan bulanan",
        date: start,
      },
      {
        id: "i",
        kind: "expense",
        category: "Tagihan",
        amount: 99000,
        note: "Paket internet",
        date: start,
      },
    ],
    goals: [
      {
        id: "g1",
        name: "Dana darurat",
        target: 3000000,
        saved: 650000,
        deadline: addDays(now, 120),
      },
      {
        id: "g2",
        name: "Headphone baru",
        target: 800000,
        saved: 200000,
        deadline: addDays(now, 60),
      },
    ],
  };
}
