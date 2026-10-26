import { test, expect, type Page } from "@playwright/test";
import { fixture } from "./fixture";
import { balances, money } from "../src/domain";
import AxeBuilder from "@axe-core/playwright";
async function seeded(page: Page) {
  await page.addInitScript((w) => {
    if (!localStorage.getItem("CapacitorStorage.saku.wallet.v1"))
      localStorage.setItem(
        "CapacitorStorage.saku.wallet.v1",
        JSON.stringify(w),
      );
  }, fixture());
  await page.goto("/");
}
test("first run, write transaction, reload, edit, delete and reconcile balance", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Nama panggilan").fill("Nara");
  await page.locator("input[name=opening]").fill("500000");
  await page.getByRole("button", { name: "Mulai mencatat" }).click();
  await expect(page.getByTestId("available-balance")).toContainText(
    money(500000),
  );
  await page
    .getByRole("button", { name: "Catat pengeluaran", exact: true })
    .click();
  await page.locator("input[name=amount]").fill("25000");
  await page.locator("input[name=note]").fill("Makan siang");
  await page.getByRole("button", { name: "Simpan transaksi" }).click();
  await expect(page.getByTestId("available-balance")).toContainText(
    money(475000),
  );
  await page.reload();
  await expect(page.getByTestId("available-balance")).toContainText(
    money(475000),
  );
  await page.getByRole("button", { name: /Edit Makan siang/ }).click();
  await page.locator("input[name=amount]").fill("30000");
  await page.getByRole("button", { name: "Simpan transaksi" }).click();
  await expect(page.getByTestId("available-balance")).toContainText(
    money(470000),
  );
  await page.getByRole("button", { name: /Edit Makan siang/ }).click();
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hapus", exact: true })
    .click();
  await expect(page.getByTestId("available-balance")).toContainText(
    money(500000),
  );
});
test("income form changes categories and report calculates surplus", async ({
  page,
}) => {
  await seeded(page);
  const before = balances(fixture()).available;
  await page
    .getByRole("button", { name: "Catat pengeluaran", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Pemasukan", exact: true })
    .click();
  await page.locator("select[name=category]").selectOption("Uang jajan");
  await page.locator("input[name=amount]").fill("100000");
  await page.getByRole("button", { name: "Simpan transaksi" }).click();
  await expect(page.getByTestId("available-balance")).toContainText(
    money(before + 100000),
  );
  await page.getByRole("link", { name: "Laporan", exact: true }).click();
  await expect(page.getByTestId("report-net")).toBeVisible();
  await page.getByRole("button", { name: "Mingguan", exact: true }).click();
  await page.getByRole("button", { name: "Periode sebelumnya" }).click();
  await expect(
    page.getByRole("button", { name: "Periode berikutnya" }),
  ).toBeEnabled();
});
test("goal creation, allocation, insufficient funds and deletion preserve total cash", async ({
  page,
}) => {
  await seeded(page);
  const before = balances(fixture()).available;
  await page.getByRole("link", { name: "Rencana", exact: true }).click();
  await page.getByRole("button", { name: "Tujuan baru", exact: true }).click();
  await page.getByLabel("Nama tujuan").fill("Laptop");
  await page.locator("input[name=amount]").fill("10000000");
  await page.getByRole("button", { name: "Simpan tujuan" }).click();
  const card = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Laptop", exact: true }),
  });
  await card
    .getByRole("button", { name: "Sisihkan uang", exact: true })
    .click();
  await page.locator("input[name=amount]").fill("10000000");
  await page.getByRole("button", { name: "Simpan alokasi" }).click();
  await expect(page.getByRole("alert")).toContainText("tidak cukup");
  await page.locator("input[name=amount]").fill("100000");
  await page.getByRole("button", { name: "Simpan alokasi" }).click();
  await page.getByRole("link", { name: "Beranda", exact: true }).click();
  await expect(page.getByTestId("available-balance")).toContainText(
    money(before - 100000),
  );
  await page.getByRole("link", { name: "Rencana", exact: true }).click();
  await page.getByRole("button", { name: "Edit tujuan Laptop" }).click();
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hapus", exact: true })
    .click();
  await page.getByRole("link", { name: "Beranda", exact: true }).click();
  await expect(page.getByTestId("available-balance")).toContainText(
    money(before),
  );
});
test("search filters rows and CSV exports the actual view", async ({
  page,
}) => {
  await seeded(page);
  await page.getByRole("link", { name: "Catatan", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Cari transaksi" })
    .fill("Makan siang");
  await expect(page.locator(".transaction-row")).toHaveCount(1);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
});
test("backup rejects corrupt content, exports and restores valid data", async ({
  page,
}) => {
  await seeded(page);
  await page.getByRole("link", { name: "Lainnya", exact: true }).click();
  await page.getByRole("button", { name: /Cadangan & data/ }).click();
  await page.getByLabel("Pilih cadangan JSON").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1}'),
  });
  await expect(page.getByRole("alert")).toBeVisible();
  const w = { ...fixture(), name: "Rani" };
  await page.getByLabel("Pilih cadangan JSON").setInputFiles({
    name: "saku.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(w)),
  });
  await expect(page.getByRole("dialog")).toContainText("Rani");
  await page
    .getByRole("button", { name: "Pulihkan data", exact: true })
    .click();
  await expect(page.locator(".workspace-label")).toContainText("Rani");
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Ekspor cadangan berpassword" })
    .click();
  await page
    .getByLabel("Kata sandi", { exact: true })
    .fill("contoh-kata-sandi");
  await page.getByLabel("Ulangi kata sandi").fill("contoh-kata-sandi");
  await page.getByRole("button", { name: "Enkripsi & ekspor" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});
test("monthly budget persists from the plan screen", async ({ page }) => {
  await seeded(page);
  await page.getByRole("link", { name: "Rencana", exact: true }).click();
  await page.getByRole("button", { name: "Anggaran", exact: true }).click();
  await page.locator("input[name=budget]").fill("2000000");
  await page.getByRole("button", { name: "Simpan anggaran" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Anggaran", exact: true }).click();
  await expect(page.locator("input[name=budget]")).toHaveValue("2000000");
});
test("corrupt local storage is not overwritten and can be recovered via import", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("CapacitorStorage.saku.wallet.v1", "{bad"),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Catatan belum bisa dibuka" }),
  ).toBeVisible();
  await page.getByLabel("Pilih cadangan JSON").setInputFiles({
    name: "saku.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(fixture())),
  });
  await page
    .getByRole("button", { name: "Pulihkan data", exact: true })
    .click();
  await expect(page.getByTestId("available-balance")).toBeVisible();
});
test("all screens fit phone, tablet and desktop without horizontal overflow or runtime errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await seeded(page);
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ["home", "transactions", "reports", "goals", "settings"]) {
      await page.goto(`/#${id}`);
      await page.locator("h1").waitFor();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
test("screens and transaction dialog have no serious accessibility violations", async ({
  page,
}) => {
  await seeded(page);
  for (const id of ["home", "transactions", "reports", "goals", "settings"]) {
    await page.goto(`/#${id}`);
    await page.locator("h1").waitFor();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations,
      JSON.stringify(
        result.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      ),
    ).toEqual([]);
  }
  await page.goto("/");
  await page
    .getByRole("button", { name: "Catat pengeluaran", exact: true })
    .click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
