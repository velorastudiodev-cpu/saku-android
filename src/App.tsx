import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
} from "react";
import { App as NativeApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Target,
  SlidersHorizontal,
  Search,
  Download,
  Upload,
  Trash2,
  Pencil,
  Check,
  ArrowRight,
  ShieldCheck,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  allocate,
  addDays,
  balances,
  breakdown,
  categoryNames,
  processRecurring,
  csv,
  dateLabel,
  emptyWallet,
  goalPlan,
  inRange,
  money,
  parseAmount,
  pct,
  periodRange,
  today,
  totals,
  validateWallet,
  type Goal,
  type Kind,
  type Period,
  type Transaction,
  type Wallet,
} from "./domain";
import { exportFile, loadWallet, saveWallet } from "./storage";
import { CashChart } from "./Chart";
import { MoneyAdvice } from "./MoneyAdvice";
import { AnimatedMoney, GoalProgress } from "./Motion";
import { ManageCategories, BulkCategory } from "./ManageCategories";
import { RecurringPanel } from "./RecurringPanel";
import {
  AccountsPanel,
  AccountSelect,
  CategoryBudgets,
  BudgetAlerts,
  SpendingGuide,
  SmartInsights,
} from "./MoneyManagement";
import { PrivacySettings, publishWidget } from "./Privacy";
import { syncReminders } from "./reminders";
import {
  protectBackup,
  unlockBackup,
  validateProtectedBackup,
  type ProtectedBackup,
} from "./backup";

type Page = "home" | "transactions" | "reports" | "goals" | "settings";
type Modal =
  | { kind: "backup-export" }
  | { kind: "backup-import"; backup: ProtectedBackup }
  | { kind: "transaction"; transaction?: Transaction }
  | { kind: "goal"; goal?: Goal }
  | { kind: "allocate"; goal: Goal }
  | {
      kind: "confirm";
      title: string;
      message: string;
      action: () => Promise<void>;
      label?: string;
    };
const pages = [
  { id: "home", label: "Ringkasan", Icon: LayoutDashboard },
  { id: "transactions", label: "Transaksi", Icon: ArrowLeftRight },
  { id: "reports", label: "Laporan", Icon: ChartNoAxesCombined },
  { id: "goals", label: "Tujuan", Icon: Target },
  { id: "settings", label: "Pengaturan", Icon: SlidersHorizontal },
] as const;
const readPage = (): Page =>
  pages.find((p) => p.id === location.hash.slice(1))?.id ?? "home";
let launchUrlConsumed = false;
const formText = (form: HTMLFormElement, key: string) =>
  String(new FormData(form).get(key) ?? "").trim();
function Mark() {
  return (
    <img
      src="/saku-logo.png"
      width="36"
      height="36"
      alt=""
      className="saku-mark"
    />
  );
}
function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <p>{title}</p>
      <span>{children}</span>
      {action}
    </div>
  );
}
function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="section-head">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
function AmountField({
  label = "Nominal",
  name = "amount",
  value,
  zero = false,
}: {
  label?: string;
  name?: string;
  value?: number;
  zero?: boolean;
}) {
  return (
    <label>
      {label}
      <div className="amount-input">
        <span>Rp</span>
        <input
          name={name}
          type="text"
          inputMode="numeric"
          pattern="[0-9]+"
          maxLength={13}
          defaultValue={value ?? ""}
          placeholder={zero ? "0" : "25000"}
          required
          aria-describedby={`${name}-hint`}
        />
      </div>
      <small id={`${name}-hint`}>Rupiah utuh, tanpa titik atau koma.</small>
    </label>
  );
}
function Dialog({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement;
    const el = ref.current!;
    el.showModal();
    return () => {
      el.close();
      before?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
    >
      <div className="dialog-head">
        <h2 id="dialog-title">{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Tutup"
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function App() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState<Page>(readPage);
  const pageContent = useRef<HTMLDivElement>(null);
  const previousPage = useRef(page);
  const swipe = useRef<{
    x: number;
    y: number;
    page: Page;
    axis: "horizontal" | "vertical" | null;
  } | null>(null);
  const suppressClickUntil = useRef(0);
  const [modal, setModal] = useState<Modal | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [undo, setUndo] = useState<Wallet | null>(null);
  const [savedPulse, setSavedPulse] = useState(false);
  const [reminderError, setReminderError] = useState("");
  const autoAttempt = useRef<{ wallet: Wallet; date: string } | null>(null);
  const saving = useRef(false);
  const [period, setPeriod] = useState<Period>("month");
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | Kind>("all");
  const [txMonth, setTxMonth] = useState("");
  const [accountFilter, setAccountFilter] = useState("");
  const [quickAdd, setQuickAdd] = useState(false);
  const [limit, setLimit] = useState(40);
  const [txKind, setTxKind] = useState<Kind>("expense");
  const [withdrawing, setWithdrawing] = useState(false);
  const [categoryKind, setCategoryKind] = useState<Kind>("expense");
  const importRef = useRef<HTMLInputElement>(null);
  const [currentDate, setCurrentDate] = useState(today);
  useEffect(() => {
    const refresh = () => setCurrentDate(today());
    const timer = setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  async function load() {
    setLoadError(false);
    try {
      setWallet(await loadWallet());
    } catch {
      setLoadError(true);
    } finally {
      setLoaded(true);
    }
  }
  useEffect(() => {
    void load();
    const onHash = () => {
      setPage(readPage());
      setError("");
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    const listener = NativeApp.addListener("backButton", () => {
      if (modal) setModal(null);
      else if (page !== "home") location.hash = "home";
      else void NativeApp.minimizeApp();
    });
    return () => {
      void listener.then((l) => l.remove());
    };
  }, [modal, page]);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => {
      setNotice("");
      setUndo(null);
    }, 10000);
    return () => clearTimeout(id);
  }, [notice, wallet]);
  useEffect(() => {
    if (!savedPulse) return;
    const timer = setTimeout(() => setSavedPulse(false), 1200);
    return () => clearTimeout(timer);
  }, [savedPulse, wallet]);
  useEffect(() => {
    if (!wallet) return;
    void publishWidget(wallet).catch(() =>
      setNotice(
        "Catatan tersimpan; widget belum diperbarui. Buka ulang Saku untuk mencoba lagi.",
      ),
    );
  }, [wallet, currentDate]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const route = (url?: string) => {
      if (url === "saku://transaction") {
        location.hash = "transactions";
        setQuickAdd(true);
      } else if (url === "saku://home") location.hash = "home";
    };
    if (!launchUrlConsumed) {
      launchUrlConsumed = true;
      void NativeApp.getLaunchUrl().then((result) => route(result?.url));
    }
    const listener = NativeApp.addListener("appUrlOpen", ({ url }) =>
      route(url),
    );
    return () => {
      void listener.then((l) => l.remove());
    };
  }, []);
  useEffect(() => {
    if (quickAdd && wallet && !busy && !modal) {
      setQuickAdd(false);
      open({ kind: "transaction" });
    }
  }, [quickAdd, wallet, busy, modal]);
  useEffect(() => {
    if (!wallet) return;
    let current = true;
    void syncReminders(wallet)
      .then(() => {
        if (current) setReminderError("");
      })
      .catch((e) => {
        if (current)
          setReminderError(
            e instanceof Error ? e.message : "Pengingat belum diperbarui.",
          );
      });
    return () => {
      current = false;
    };
  }, [wallet]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const listener = LocalNotifications.addListener(
      "localNotificationActionPerformed",
      () => {
        location.hash = "transactions";
      },
    );
    return () => {
      void listener.then((l) => l.remove());
    };
  }, []);
  useEffect(() => {
    if (
      !wallet ||
      modal ||
      busy ||
      saving.current ||
      (autoAttempt.current?.wallet === wallet &&
        autoAttempt.current.date === currentDate)
    )
      return;
    autoAttempt.current = { wallet, date: currentDate };
    try {
      const result = processRecurring(wallet, currentDate);
      if (result.wallet === wallet) return;
      saving.current = true;
      setBusy(true);
      void saveWallet(result.wallet)
        .then(() => {
          setWallet(result.wallet);
          setUndo(null);
          setNotice(
            result.count
              ? `${result.count} transaksi rutin dicatat otomatis.`
              : "Jadwal diperbarui tanpa menggandakan transaksi.",
          );
        })
        .catch((e) =>
          setError(
            e instanceof Error ? e.message : "Transaksi rutin belum tersimpan.",
          ),
        )
        .finally(() => {
          saving.current = false;
          setBusy(false);
        });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Jadwal belum bisa diproses.");
    }
  }, [wallet, currentDate, busy, modal]);
  useEffect(() => {
    const from = pages.findIndex((p) => p.id === previousPage.current);
    const to = pages.findIndex((p) => p.id === page);
    previousPage.current = page;
    swipe.current = null;
    if (from === to || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const animation = pageContent.current?.animate(
      [
        { opacity: 0.6, transform: `translateX(${to > from ? 16 : -16}px)` },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: 220, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
    );
    return () => animation?.cancel();
  }, [page]);
  function navigate(p: Page) {
    location.hash = p;
    setPage(p);
  }
  function startSwipe(e: TouchEvent<HTMLElement>) {
    swipe.current = null;
    if (
      modal ||
      busy ||
      e.touches.length !== 1 ||
      !matchMedia("(max-width: 800px)").matches ||
      window.getSelection()?.toString()
    )
      return;
    const target = e.target as Element;
    if (
      e.currentTarget.tagName !== "NAV" &&
      target.closest(
        "form, input, select, textarea, label, summary, .table-scroll, [contenteditable]",
      )
    )
      return;
    const { clientX: x, clientY: y } = e.touches[0];
    // Leave the screen edges to Android's system back gesture.
    if (x < 24 || x > window.innerWidth - 24) return;
    swipe.current = { x, y, page, axis: null };
  }
  function moveSwipe(e: TouchEvent<HTMLElement>) {
    const gesture = swipe.current;
    if (!gesture) return;
    if (e.touches.length !== 1) {
      swipe.current = null;
      return;
    }
    const dx = Math.abs(e.touches[0].clientX - gesture.x);
    const dy = Math.abs(e.touches[0].clientY - gesture.y);
    if (!gesture.axis && Math.max(dx, dy) >= 12)
      gesture.axis = dx > dy * 1.5 ? "horizontal" : "vertical";
  }
  function endSwipe(e: TouchEvent<HTMLElement>) {
    const gesture = swipe.current;
    swipe.current = null;
    if (
      !gesture ||
      gesture.axis !== "horizontal" ||
      e.touches.length ||
      modal ||
      busy ||
      gesture.page !== page
    )
      return;
    suppressClickUntil.current = Date.now() + 400;
    const dx = e.changedTouches[0].clientX - gesture.x;
    const dy = e.changedTouches[0].clientY - gesture.y;
    if (Math.abs(dx) < 64 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    const next =
      pages[pages.findIndex((p) => p.id === page) + (dx < 0 ? 1 : -1)];
    if (next) navigate(next.id);
  }
  const swipeHandlers = {
    onTouchStart: startSwipe,
    onTouchMove: moveSwipe,
    onTouchEnd: endSwipe,
    onTouchCancel: () => {
      swipe.current = null;
    },
    onClickCapture: (e: MouseEvent<HTMLElement>) => {
      if (Date.now() < suppressClickUntil.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
  function open(m: Modal) {
    setError("");
    setModal(m);
    if (m.kind === "transaction") setTxKind(m.transaction?.kind ?? "expense");
    if (m.kind === "allocate") setWithdrawing(false);
  }
  function close() {
    if (!saving.current) {
      setModal(null);
      setError("");
    }
  }
  async function commit(next: Wallet, message: string, undoable = false) {
    const validated = validateWallet(next);
    await saveWallet(validated);
    setUndo(undoable ? wallet : null);
    setWallet(validated);
    if (message === "Transaksi tersimpan.") setSavedPulse(true);
    setLoadError(false);
    setModal(null);
    setNotice(message);
  }
  async function run(action: () => Promise<void>) {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan. Coba lagi.");
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }
  const onSubmit =
    (action: (form: HTMLFormElement) => Promise<void>) =>
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      void run(() => action(form));
    };
  async function importBackup(file?: File) {
    if (!file) return;
    await run(async () => {
      if (file.size > 16 * 1024 * 1024)
        throw new Error(
          "File terlalu besar. Maksimal 16 MB untuk cadangan terenkripsi.",
        );
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        throw new Error("Pilih cadangan JSON yang diekspor dari Saku.");
      }
      if (parsed && typeof parsed === "object" && "format" in parsed) {
        open({
          kind: "backup-import",
          backup: validateProtectedBackup(parsed),
        });
      } else {
        if (file.size > 10 * 1024 * 1024)
          throw new Error("Cadangan biasa maksimal 10 MB.");
        confirmImport(validateWallet(parsed));
      }
    });
  }
  function confirmImport(next: Wallet) {
    open({
      kind: "confirm",
      title: "Pulihkan cadangan?",
      message: `${next.transactions.length} transaksi, ${next.goals.length} tujuan, dan ${next.recurring.length} jadwal milik ${next.name} akan mengganti data di perangkat ini. Ekspor data lama terlebih dahulu jika masih diperlukan. Jadwal otomatis yang lewat akan diproses setelah pemulihan.`,
      label: "Pulihkan data",
      action: () => commit(next, "Cadangan berhasil dipulihkan."),
    });
  }
  const backupDialog = (modal?.kind === "backup-export" ||
    modal?.kind === "backup-import") && (
    <Dialog
      title={
        modal.kind === "backup-export"
          ? "Cadangan berpassword"
          : "Buka cadangan"
      }
      close={close}
    >
      <p className="dialog-copy">
        {modal.kind === "backup-export"
          ? "Simpan kata sandi secara terpisah. Saku tidak dapat memulihkan kata sandi yang hilang."
          : "Masukkan kata sandi cadangan. Data baru diganti setelah Anda mengonfirmasi pemulihan."}
      </p>
      <form
        onSubmit={onSubmit(async (form) => {
          const password = String(new FormData(form).get("password") || "");
          if (modal.kind === "backup-export" && wallet) {
            if (password !== String(new FormData(form).get("repeat") || ""))
              throw new Error("Kedua kata sandi belum sama.");
            const data = await protectBackup(wallet, password);
            await exportFile(`saku-cadangan-aman-${today()}.json`, data);
            setModal(null);
            setNotice("Cadangan terenkripsi siap disimpan.");
          } else if (modal.kind === "backup-import")
            confirmImport(await unlockBackup(modal.backup, password));
        })}
      >
        <label>
          Kata sandi
          <input
            name="password"
            type="password"
            autoComplete={
              modal.kind === "backup-export"
                ? "new-password"
                : "current-password"
            }
            minLength={modal.kind === "backup-export" ? 10 : 1}
            maxLength={1024}
            required
            autoCapitalize="none"
          />
        </label>
        {modal.kind === "backup-export" && (
          <label>
            Ulangi kata sandi
            <input
              name="repeat"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={1024}
              required
              autoCapitalize="none"
            />
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {busy
            ? "Memproses…"
            : modal.kind === "backup-export"
              ? "Enkripsi & ekspor"
              : "Buka cadangan"}
        </button>
      </form>
    </Dialog>
  );
  const hiddenImport = (
    <input
      ref={importRef}
      type="file"
      accept="application/json,.json"
      className="sr-only"
      aria-label="Pilih cadangan JSON"
      onChange={(e) => {
        void importBackup(e.target.files?.[0]);
        e.target.value = "";
      }}
    />
  );
  const status = (
    <>
      {error && !modal && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <Check className="success-check" size={17} />
          <span>{notice}</span>
          {undo && (
            <button
              disabled={busy}
              onClick={() =>
                void run(() => commit(undo, "Perubahan diurungkan."))
              }
            >
              Urungkan
            </button>
          )}
        </div>
      )}
    </>
  );
  if (!loaded)
    return (
      <main className="startup">
        <Mark />
        <h1>Saku</h1>
        <p role="status">Membuka catatanmu…</p>
      </main>
    );
  const confirmation = modal?.kind === "confirm" && (
    <Dialog title={modal.title} close={close}>
      <p className="dialog-copy">{modal.message}</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button onClick={close} disabled={busy}>
          Batal
        </button>
        <button
          className="primary"
          disabled={busy}
          onClick={() => void run(modal.action)}
        >
          {busy ? "Menyimpan…" : (modal.label ?? "Hapus")}
        </button>
      </div>
    </Dialog>
  );
  if (loadError)
    return (
      <main className="startup">
        <Mark />
        <h1>Catatan belum bisa dibuka</h1>
        <p>
          Data di perangkat tidak diubah. Coba buka ulang atau pulihkan cadangan
          JSON yang masih baik.
        </p>
        <button className="primary" onClick={() => void load()}>
          Coba lagi
        </button>
        <button onClick={() => importRef.current?.click()}>
          Pulihkan cadangan
        </button>
        {hiddenImport}
        {status}
        {confirmation}
        {backupDialog}
      </main>
    );
  if (!wallet)
    return (
      <main className="onboarding">
        <div className="brand">
          <Mark />
          <span>
            saku<span className="brand-dot">.</span>
          </span>
        </div>
        <div className="setup-intro">
          <p className="muted">Keuangan pribadi, lebih tertata.</p>
          <h1>Mulai dari sakumu.</h1>
          <p>
            Catat uang yang datang, pahami yang keluar, dan sisihkan untuk hal
            yang berarti.
          </p>
        </div>
        <form
          onSubmit={onSubmit(async (f) =>
            commit(
              {
                ...emptyWallet(),
                name: formText(f, "name"),
                opening: parseAmount(formText(f, "opening"), true),
                accounts: [
                  {
                    id: "main",
                    name: "Dompet utama",
                    opening: parseAmount(formText(f, "opening"), true),
                  },
                ],
                budget: parseAmount(formText(f, "budget"), true),
              },
              "Saku siap digunakan.",
            ),
          )}
        >
          <label>
            Nama panggilan
            <input
              name="name"
              placeholder="Namamu"
              maxLength={40}
              required
              autoComplete="given-name"
            />
          </label>
          <AmountField
            label="Saldo yang kamu miliki sekarang"
            name="opening"
            value={0}
            zero
          />
          <AmountField
            label="Anggaran pengeluaran per bulan"
            name="budget"
            value={0}
            zero
          />
          <p className="hint">
            Isi 0 jika belum ingin mengatur anggaran. Saldo awal tidak dihitung
            sebagai pemasukan.
          </p>
          {status}
          <button className="primary wide" disabled={busy}>
            Mulai mencatat
            <ArrowRight size={18} />
          </button>
        </form>
        <button
          className="text-button restore-start"
          onClick={() => importRef.current?.click()}
        >
          <Upload size={16} />
          Sudah punya cadangan? Pulihkan
        </button>
        <p className="privacy-line">
          <ShieldCheck size={16} />
          Tersimpan di perangkat. Bisa dipakai tanpa internet.
        </p>
        {hiddenImport}
        {confirmation}
        {backupDialog}
      </main>
    );

  const balance = balances(wallet);
  const monthRange = periodRange("month");
  const month = totals(inRange(wallet.transactions, monthRange));
  const range = periodRange(period, offset);
  const scoped = inRange(wallet.transactions, range);
  const report = totals(scoped);
  const previous = totals(
    inRange(wallet.transactions, periodRange(period, offset - 1)),
  );
  const ordered = [...wallet.transactions].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const filtered = ordered.filter(
    (t) =>
      (filter === "all" || t.kind === filter) &&
      (!txMonth || t.date.startsWith(txMonth)) &&
      (!accountFilter || t.accountId === accountFilter) &&
      `${t.note} ${t.category}`
        .toLocaleLowerCase("id")
        .includes(query.toLocaleLowerCase("id")),
  );
  const budgetLeft = Math.max(0, wallet.budget - month.expense);
  const reserveShare =
    balance.balance > 0
      ? Math.min(100, (balance.reserved / balance.balance) * 100)
      : 0;
  const rows = (ts: Transaction[]) => (
    <div className="transaction-list">
      {ts.map((t) => (
        <button
          className="transaction-row"
          key={t.id}
          onClick={() => open({ kind: "transaction", transaction: t })}
          aria-label={`Edit ${t.note || t.category}, ${money(t.amount)}`}
        >
          <span className="transaction-symbol">
            {t.kind === "income" ? (
              <ArrowDownLeft size={19} />
            ) : (
              <ArrowUpRight size={19} />
            )}
          </span>
          <span className="transaction-text">
            <span>{t.note || t.category}</span>
            <small>
              {t.category} ·{" "}
              {wallet.accounts.find((a) => a.id === t.accountId)?.name} ·{" "}
              {dateLabel(t.date, true)}
            </small>
          </span>
          <span
            className={`transaction-amount ${t.kind === "income" ? "positive" : ""}`}
          >
            {t.kind === "income" ? "+" : "−"}
            {money(t.amount)}
          </span>
        </button>
      ))}
    </div>
  );
  const addTransaction = (
    <button
      className="primary"
      aria-label="Catat transaksi"
      onClick={() => open({ kind: "transaction" })}
    >
      {savedPulse ? (
        <Check className="success-check" size={18} />
      ) : (
        <Plus size={18} />
      )}
      <span>{savedPulse ? "Tersimpan" : "Catat transaksi"}</span>
    </button>
  );
  const goalPreview = (g: Goal) => {
    const p = goalPlan(g);
    return (
      <div className="goal-preview" key={g.id}>
        <div>
          <span>{g.name}</span>
          <span className="num">{pct(p.progress)}</span>
        </div>
        <GoalProgress
          value={g.saved}
          max={g.target}
          label={`Progres ${g.name}`}
        />
        <div>
          <small>{money(g.saved)}</small>
          <small>dari {money(g.target)}</small>
        </div>
        <p className="goal-preview-pace">
          {p.remaining === 0
            ? "Target tercapai"
            : p.overdue
              ? "Tanggal target sudah lewat"
              : `${money(p.daily)} / hari menuju target`}
        </p>
      </div>
    );
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Saku, ringkasan">
          <Mark />
          <span>
            saku<span className="brand-dot">.</span>
          </span>
        </a>
        <p className="workspace-label">Ruang pribadi {wallet.name}</p>
        <nav
          aria-label="Navigasi utama"
          style={
            {
              "--nav-index": pages.findIndex((p) => p.id === page),
            } as CSSProperties
          }
          {...swipeHandlers}
        >
          <span className="nav-indicator" aria-hidden="true" />
          {pages.map(({ id, label, Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={page === id ? "page" : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <ShieldCheck size={18} />
          <div>
            Catatan milikmu.<small>Tersimpan di perangkat ini.</small>
          </div>
        </div>
      </aside>
      <main className="canvas" {...swipeHandlers}>
        <div className="mobile-brand">
          <a className="brand" href="#home">
            <Mark />
            <span>saku.</span>
          </a>
          <button
            className="profile"
            onClick={() => navigate("settings")}
            aria-label={`Pengaturan ${wallet.name}`}
          >
            {wallet.name.slice(0, 1).toLocaleUpperCase("id")}
          </button>
        </div>
        {status}
        <div ref={pageContent}>
          <header className="page-header">
            <div>
              <h1>{pages.find((p) => p.id === page)?.label}</h1>
              <p>
                {page === "home"
                  ? dateLabel(today())
                  : page === "transactions"
                    ? "Setiap rupiah punya cerita."
                    : page === "reports"
                      ? "Kenali ritme uangmu."
                      : page === "goals"
                        ? "Sedikit demi sedikit, sampai tujuan."
                        : "Atur kebiasaan. Jaga catatan."}
              </p>
            </div>
            {page === "home" || page === "transactions" ? (
              addTransaction
            ) : page === "goals" ? (
              <button
                className="primary"
                onClick={() => open({ kind: "goal" })}
              >
                <Plus size={18} />
                Tujuan baru
              </button>
            ) : null}
          </header>
          {balance.available < 0 && page !== "settings" && (
            <div className="notice" role="status">
              {balance.balance < 0
                ? "Saldo sedang minus."
                : "Alokasi tujuan melebihi saldo."}{" "}
              Selisih {money(-balance.available)}. Periksa transaksi atau
              kurangi alokasi tujuan.
            </div>
          )}
          {(page === "home" || page === "transactions") && (
            <BudgetAlerts wallet={wallet} />
          )}
          {page === "home" && (
            <>
              <section className="balance-panel panel">
                <div className="balance-main">
                  <p className="muted">Saldo tersedia</p>
                  <div
                    className="balance-value num"
                    data-testid="available-balance"
                  >
                    <AnimatedMoney value={balance.available} />
                  </div>
                  <p className="balance-caption">
                    Uang yang bisa dipakai, setelah alokasi tujuan.
                  </p>
                  <div
                    className="pocket-bar"
                    role="img"
                    aria-label={`Saldo ${money(balance.balance)}, untuk tujuan ${money(balance.reserved)}`}
                  >
                    <span style={{ width: `${100 - reserveShare}%` }} />
                    <span style={{ width: `${reserveShare}%` }} />
                  </div>
                  <div className="balance-parts">
                    <span>
                      Saldo total
                      <strong className="num">{money(balance.balance)}</strong>
                    </span>
                    <span>
                      Untuk tujuan
                      <strong className="num">{money(balance.reserved)}</strong>
                    </span>
                  </div>
                </div>
                <SpendingGuide wallet={wallet} />
              </section>
              {wallet.recurring.some(
                (r) => r.active && r.nextDate <= today(),
              ) && (
                <button
                  className="due-banner"
                  onClick={() => navigate("transactions")}
                >
                  Ada jadwal jatuh tempo <ArrowRight size={16} />
                </button>
              )}
              <div className="overview-grid home-overview">
                <Section
                  title="Bulan ini"
                  action={
                    <button
                      className="text-button"
                      onClick={() => {
                        setPeriod("month");
                        setOffset(0);
                        navigate("reports");
                      }}
                    >
                      Lihat detail <ArrowRight size={16} />
                    </button>
                  }
                >
                  <p className="muted">
                    {wallet.budget ? "Sisa anggaran" : "Pengeluaran tercatat"}
                  </p>
                  <div className="compact-value num">
                    {money(wallet.budget ? budgetLeft : month.expense)}
                  </div>
                  {wallet.budget > 0 ? (
                    <>
                      <progress
                        max={wallet.budget}
                        value={Math.min(month.expense, wallet.budget)}
                        className={month.expense >= wallet.budget ? "over" : ""}
                        aria-label="Anggaran terpakai"
                      />
                      <p
                        className={
                          month.expense >= wallet.budget ? "negative" : "hint"
                        }
                      >
                        {month.expense > wallet.budget
                          ? `Melewati batas ${money(month.expense - wallet.budget)}.`
                          : month.expense === wallet.budget
                            ? "Anggaran bulan ini sudah habis."
                            : `${money(month.expense)} terpakai dari ${money(wallet.budget)}.`}
                      </p>
                    </>
                  ) : (
                    <button
                      className="text-button"
                      onClick={() => navigate("settings")}
                    >
                      Atur anggaran bulanan
                    </button>
                  )}
                  <div className="key-value">
                    <span>Arus kas bersih</span>
                    <strong
                      className={`num ${month.net < 0 ? "negative" : ""}`}
                    >
                      {money(month.net)}
                    </strong>
                  </div>
                  <p className="hint">
                    Pemasukan dikurangi pengeluaran bulan ini. Saldo awal bukan
                    pemasukan bulan berjalan.
                  </p>
                </Section>
                <Section
                  title="Transaksi terbaru"
                  action={
                    <button
                      className="text-button"
                      onClick={() => navigate("transactions")}
                    >
                      Semua <ArrowRight size={16} />
                    </button>
                  }
                >
                  {ordered.length ? (
                    rows(ordered.slice(0, 3))
                  ) : (
                    <Empty
                      title="Catatan pertamamu dimulai di sini."
                      action={
                        <button
                          className="text-button"
                          onClick={() => open({ kind: "transaction" })}
                        >
                          Tambah transaksi <Plus size={16} />
                        </button>
                      }
                    >
                      Masukkan uang yang diterima atau pengeluaran hari ini.
                    </Empty>
                  )}
                </Section>
              </div>
              <details className="panel insight-preview">
                <summary>
                  Saku Insight <span className="muted">Lihat saran</span>
                </summary>
                <SmartInsights wallet={wallet} />
                <MoneyAdvice wallet={wallet} />
              </details>
              {wallet.goals.length > 0 && (
                <Section
                  title="Tujuan terdekat"
                  action={
                    <button
                      className="text-button"
                      onClick={() => navigate("goals")}
                    >
                      Semua tujuan <ArrowRight size={16} />
                    </button>
                  }
                >
                  {goalPreview(
                    [...wallet.goals].sort((a, b) =>
                      a.deadline.localeCompare(b.deadline),
                    )[0],
                  )}
                </Section>
              )}
            </>
          )}
          {page === "transactions" && (
            <>
              <AccountsPanel
                wallet={wallet}
                busy={busy}
                save={(next, message) => run(() => commit(next, message, true))}
              />
              <RecurringPanel
                wallet={wallet}
                busy={busy}
                save={(next, message) => run(() => commit(next, message, true))}
              />
              {reminderError && (
                <p className="notice" role="status">
                  {reminderError}
                </p>
              )}
              <Section
                title="Riwayat uangmu"
                action={
                  <span className="muted">{filtered.length} transaksi</span>
                }
              >
                <div className="filters">
                  <label className="search-field">
                    <Search size={18} />
                    <input
                      aria-label="Cari transaksi"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setLimit(40);
                      }}
                      placeholder="Cari catatan atau kategori"
                    />
                  </label>
                  <label className="sr-only" htmlFor="tx-month">
                    Bulan transaksi
                  </label>
                  <select
                    id="tx-month"
                    value={txMonth}
                    onChange={(e) => {
                      setTxMonth(e.target.value);
                      setLimit(40);
                    }}
                  >
                    <option value="">Semua bulan</option>
                    {[
                      ...new Set(
                        wallet.transactions.map((t) => t.date.slice(0, 7)),
                      ),
                    ]
                      .sort()
                      .reverse()
                      .map((m) => (
                        <option key={m} value={m}>
                          {periodRange("month", 0, `${m}-01`).label}
                        </option>
                      ))}
                  </select>
                </div>
                <label className="account-filter">
                  Dompet
                  <select
                    value={accountFilter}
                    onChange={(e) => {
                      setAccountFilter(e.target.value);
                      setLimit(40);
                    }}
                  >
                    <option value="">Semua dompet</option>
                    {wallet.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="filter-row">
                  <div
                    className="tabs"
                    role="group"
                    aria-label="Jenis transaksi"
                  >
                    {(["all", "expense", "income"] as const).map((f) => (
                      <button
                        key={f}
                        aria-pressed={filter === f}
                        onClick={() => {
                          setFilter(f);
                          setLimit(40);
                        }}
                      >
                        {f === "all"
                          ? "Semua"
                          : f === "expense"
                            ? "Pengeluaran"
                            : "Pemasukan"}
                      </button>
                    ))}
                  </div>
                  {(query || txMonth || accountFilter) && (
                    <button
                      className="text-button"
                      onClick={() => {
                        setQuery("");
                        setTxMonth("");
                        setAccountFilter("");
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="transaction-summary">
                  <span>
                    Masuk{" "}
                    <strong className="num">
                      {money(totals(filtered).income)}
                    </strong>
                  </span>
                  <span>
                    Keluar{" "}
                    <strong className="num">
                      {money(totals(filtered).expense)}
                    </strong>
                  </span>
                </div>
                {filtered.length ? (
                  rows(filtered.slice(0, limit))
                ) : (
                  <Empty
                    title={
                      wallet.transactions.length
                        ? "Tidak ada transaksi yang cocok."
                        : "Belum ada transaksi."
                    }
                  >
                    {wallet.transactions.length
                      ? "Coba kata lain atau ubah filter."
                      : "Catat pemasukan atau pengeluaran pertamamu."}
                  </Empty>
                )}
                {filtered.length > limit && (
                  <button className="wide" onClick={() => setLimit(limit + 40)}>
                    Tampilkan lagi ({limit} dari {filtered.length})
                  </button>
                )}
                <div className="list-footer">
                  <span>Ketuk transaksi untuk mengedit atau menghapus.</span>
                  <button
                    className="text-button"
                    disabled={!filtered.length || busy}
                    onClick={() =>
                      void run(() =>
                        exportFile(
                          `saku-transaksi-${today()}.csv`,
                          csv(filtered),
                          "text/csv",
                        ),
                      )
                    }
                  >
                    <Download size={16} />
                    CSV
                  </button>
                </div>
                <BulkCategory
                  wallet={wallet}
                  transactions={filtered}
                  busy={busy}
                  save={(next, message) =>
                    run(() => commit(next, message, true))
                  }
                />
              </Section>
            </>
          )}
          {page === "reports" && (
            <>
              <div className="report-controls">
                <div className="tabs" role="group" aria-label="Periode laporan">
                  {(["week", "month"] as const).map((p) => (
                    <button
                      key={p}
                      aria-pressed={period === p}
                      onClick={() => {
                        setPeriod(p);
                        setOffset(0);
                      }}
                    >
                      {p === "week" ? "Mingguan" : "Bulanan"}
                    </button>
                  ))}
                </div>
                <div className="period-nav">
                  <button
                    className="icon-button"
                    aria-label="Periode sebelumnya"
                    onClick={() => setOffset(offset - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>{range.label}</span>
                  <button
                    className="icon-button"
                    disabled={offset === 0}
                    aria-label="Periode berikutnya"
                    onClick={() => setOffset(offset + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <section className="report-totals panel">
                <div>
                  <span>Arus kas bersih</span>
                  <strong
                    className={`num lead ${report.net < 0 ? "negative" : ""}`}
                    data-testid="report-net"
                  >
                    {money(report.net)}
                  </strong>
                  <small>
                    Pemasukan dikurangi pengeluaran. Saldo awal tidak termasuk.
                  </small>
                </div>
                <div>
                  <span>Pemasukan</span>
                  <strong className="num">{money(report.income)}</strong>
                  <small>
                    {report.income + report.expense
                      ? pct(
                          (report.income / (report.income + report.expense)) *
                            100,
                        )
                      : "0%"}{" "}
                    dari total arus uang
                  </small>
                </div>
                <div>
                  <span>Pengeluaran</span>
                  <strong className="num">{money(report.expense)}</strong>
                  <small>
                    {report.income + report.expense
                      ? pct(
                          (report.expense / (report.income + report.expense)) *
                            100,
                        )
                      : "0%"}{" "}
                    dari total arus uang
                  </small>
                </div>
              </section>
              <div className="overview-grid">
                <Section
                  title="Pemasukan & pengeluaran"
                  action={
                    <span className="muted">{scoped.length} transaksi</span>
                  }
                >
                  <CashChart
                    transactions={scoped}
                    start={range.start}
                    end={range.end}
                  />
                  <p className="chart-note">
                    {report.net < 0
                      ? `Pengeluaran melebihi pemasukan tercatat sebesar ${money(-report.net)}.`
                      : `Pemasukan tersisa setelah pengeluaran: ${money(report.net)}.`}{" "}
                    Saldo awal tetap dihitung dalam saldo total, bukan arus kas
                    periode ini.
                  </p>
                  <details className="chart-data">
                    <summary>Rincian persentase</summary>
                    <p className="hint">
                      Surplus ÷ pemasukan: {pct(report.rate)}. Pengeluaran ÷
                      pemasukan: {pct(report.expenseRate)}. Rasio dapat
                      melampaui 100% ketika pemasukan tercatat kecil; tanda “—”
                      berarti belum ada pemasukan.
                    </p>
                  </details>
                </Section>
                <Section title="Dibanding periode lalu">
                  <p className="comparison-period">
                    {periodRange(period, offset - 1).label}
                  </p>
                  <p className="hint">
                    Periode sebelumnya dihitung penuh. Periode berjalan bisa
                    belum selesai.
                  </p>
                  {(["income", "expense", "net"] as const).map((k) => {
                    const delta = report[k] - previous[k];
                    return (
                      <div className="comparison" key={k}>
                        <span>
                          {k === "income"
                            ? "Pemasukan"
                            : k === "expense"
                              ? "Pengeluaran"
                              : "Arus kas bersih"}
                        </span>
                        <strong
                          className={`num ${delta === 0 ? "" : (k === "expense" ? delta > 0 : delta < 0) ? "negative" : "positive"}`}
                        >
                          {delta > 0 ? "+" : ""}
                          {money(delta)}
                        </strong>
                        <small>
                          {previous[k] > 0
                            ? `${delta > 0 ? "+" : ""}${pct((delta / previous[k]) * 100)}`
                            : "—"}{" "}
                          · sebelumnya {money(previous[k])}
                        </small>
                      </div>
                    );
                  })}
                </Section>
                <Section
                  title="Ke mana uangmu pergi?"
                  className="category-panel"
                  action={
                    <select
                      aria-label="Jenis rincian kategori"
                      value={categoryKind}
                      onChange={(e) => setCategoryKind(e.target.value as Kind)}
                    >
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                    </select>
                  }
                >
                  {breakdown(scoped, categoryKind).length ? (
                    breakdown(scoped, categoryKind).map((c, i) => (
                      <div className="category-row" key={c.name}>
                        <div>
                          <span>{c.name}</span>
                          <span className="num">
                            {money(c.amount)} <small>{pct(c.share)}</small>
                          </span>
                        </div>
                        <div className="category-track">
                          <span
                            style={{
                              width: `${c.share}%`,
                              background:
                                i === 0 ? "var(--chart)" : "var(--chart-muted)",
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty title="Belum ada rincian kategori.">
                      Catatan pada periode ini akan muncul di sini.
                    </Empty>
                  )}
                </Section>
                <Section title="Cara membaca laporan">
                  <div className="explanation">
                    <p>
                      <strong>Surplus = pemasukan − pengeluaran.</strong> Nilai
                      positif berarti ada uang yang tersisa; nilai negatif
                      berarti defisit.
                    </p>
                    <p>
                      Persentase surplus dihitung dari pemasukan. Jika pemasukan
                      nol, persentasenya ditampilkan sebagai tanda “—”.
                    </p>
                    <p>
                      Porsi arus uang membandingkan setiap jenis dengan total
                      pemasukan + pengeluaran, sehingga kedua porsinya selalu
                      berjumlah 100% saat ada transaksi.
                    </p>
                    <p>
                      Saldo awal dan alokasi tujuan tidak dihitung sebagai
                      pemasukan atau pengeluaran.
                    </p>
                  </div>
                </Section>
              </div>
            </>
          )}
          {page === "goals" && (
            <>
              <div className="goals-summary panel">
                <span>
                  Sudah disisihkan
                  <strong className="num">{money(balance.reserved)}</strong>
                </span>
                <span>
                  Masih tersedia
                  <strong className="num">{money(balance.available)}</strong>
                </span>
              </div>
              {wallet.goals.length ? (
                <div className="goals-grid">
                  {wallet.goals.map((g) => {
                    const p = goalPlan(g);
                    return (
                      <Section
                        title={g.name}
                        key={g.id}
                        action={
                          <button
                            className="icon-button"
                            aria-label={`Edit tujuan ${g.name}`}
                            onClick={() => open({ kind: "goal", goal: g })}
                          >
                            <Pencil size={17} />
                          </button>
                        }
                      >
                        <div className="goal-amount num">
                          <AnimatedMoney value={g.saved} />
                          <span>dari {money(g.target)}</span>
                        </div>
                        <GoalProgress
                          value={g.saved}
                          max={g.target}
                          label={`Progres ${g.name}`}
                        />
                        <div className="key-value">
                          <span>{pct(p.progress)} terkumpul</span>
                          <span>{dateLabel(g.deadline, true)}</span>
                        </div>
                        <div className="goal-pace">
                          {p.remaining === 0 ? (
                            <>
                              <Check size={19} />
                              <p>Target tercapai. Kamu berhasil!</p>
                            </>
                          ) : (
                            <>
                              <Target size={19} />
                              <p>
                                {p.overdue
                                  ? "Target waktumu sudah lewat."
                                  : `Sisihkan ${money(p.daily)} per hari.`}
                                <small>
                                  {p.overdue
                                    ? `Masih kurang ${money(p.remaining)}. Atur ulang tanggal target.`
                                    : `${p.days} hari termasuk hari ini · sisa ${money(p.remaining)}`}
                                </small>
                              </p>
                            </>
                          )}
                        </div>
                        <button
                          className="wide"
                          onClick={() => open({ kind: "allocate", goal: g })}
                        >
                          {p.remaining === 0
                            ? "Kelola tabungan"
                            : "Sisihkan uang"}
                          <ArrowRight size={17} />
                        </button>
                      </Section>
                    );
                  })}
                </div>
              ) : (
                <Section title="Yang ingin kamu wujudkan">
                  <Empty
                    title="Keinginan kecil, rencana yang nyata."
                    action={
                      <button
                        className="primary"
                        onClick={() => open({ kind: "goal" })}
                      >
                        <Plus size={18} />
                        Buat tujuan pertama
                      </button>
                    }
                  >
                    Tentukan nominal dan tanggal. Saku menghitung berapa yang
                    perlu kamu sisihkan setiap hari.
                  </Empty>
                </Section>
              )}
              <p className="privacy-line">
                <WalletIcon size={16} />
                Alokasi tujuan tidak memindahkan uang ke rekening lain. Catat
                pengeluaran saat uang benar-benar dipakai.
              </p>
            </>
          )}
          {page === "settings" && (
            <div className="settings-layout">
              <Section title="Profil & anggaran">
                <form
                  key={`${wallet.name}-${wallet.budget}`}
                  onSubmit={onSubmit(async (f) =>
                    commit(
                      {
                        ...wallet,
                        name: formText(f, "name"),
                        budget: parseAmount(formText(f, "budget"), true),
                      },
                      "Pengaturan tersimpan.",
                    ),
                  )}
                >
                  <label>
                    Nama panggilan
                    <input
                      name="name"
                      defaultValue={wallet.name}
                      required
                      maxLength={40}
                    />
                  </label>
                  <AmountField
                    label="Anggaran pengeluaran bulanan"
                    name="budget"
                    value={wallet.budget}
                    zero
                  />
                  <p className="hint">
                    Batas yang sama dipakai setiap bulan. Isi 0 untuk
                    menonaktifkan.
                  </p>
                  <button className="primary" disabled={busy}>
                    Simpan pengaturan
                  </button>
                </form>
              </Section>
              <div className="settings-side">
                <PrivacySettings wallet={wallet} />
                <CategoryBudgets
                  wallet={wallet}
                  busy={busy}
                  save={(next, message) =>
                    run(() => commit(next, message, true))
                  }
                />
                <ManageCategories
                  wallet={wallet}
                  busy={busy}
                  save={(next, message) =>
                    run(() => commit(next, message, true))
                  }
                />
                <Section title="Cadangan & data">
                  <p className="muted">
                    Catatan tersimpan di perangkat ini. Simpan cadangan secara
                    berkala, terutama sebelum mengganti HP atau menghapus
                    aplikasi.
                  </p>
                  <button
                    className="primary wide"
                    disabled={busy}
                    onClick={() => open({ kind: "backup-export" })}
                  >
                    <Download size={17} />
                    Ekspor cadangan berpassword
                  </button>
                  <button
                    className="wide"
                    disabled={busy}
                    onClick={() => importRef.current?.click()}
                  >
                    <Upload size={17} />
                    Impor cadangan JSON
                  </button>
                  <button
                    className="text-button"
                    disabled={busy || !wallet.transactions.length}
                    onClick={() =>
                      void run(() =>
                        exportFile(
                          `saku-transaksi-${today()}.csv`,
                          csv(ordered, wallet.accounts),
                          "text/csv",
                        ),
                      )
                    }
                  >
                    <Download size={16} />
                    Ekspor semua transaksi CSV
                  </button>
                  <p className="hint">
                    Cadangan JSON baru dilindungi kata sandi; cadangan lama
                    tetap bisa diimpor. CSV tidak dienkripsi. Simpan kata sandi
                    terpisah karena tidak ada pemulihan lewat server.
                  </p>
                </Section>
                <Section title="Tentang Saku">
                  <div className="about-brand">
                    <Mark />
                    <span>saku.</span>
                    <small>v1.5.0</small>
                  </div>
                  <p className="muted">
                    Catat pengeluaran, pahami kebiasaan, dan sisihkan uang untuk
                    hal yang berarti. Oleh Velora Studio Dev, tanpa akun dan
                    tanpa iklan.
                  </p>
                  <p className="hint">
                    Di aplikasi Android/iOS, catatan dienkripsi di perangkat.
                    Semua fitur inti berjalan offline. Gunakan kunci layar untuk
                    membatasi akses. Data terhapus jika aplikasi di-uninstall;
                    simpan cadangan secara berkala.
                  </p>
                  <div className="key-value">
                    <span>Transaksi tersimpan</span>
                    <span>{wallet.transactions.length}</span>
                  </div>
                  <div className="key-value">
                    <span>Tujuan aktif</span>
                    <span>{wallet.goals.length}</span>
                  </div>
                </Section>
              </div>
            </div>
          )}
          <footer className="app-footer">
            <span>
              Copyright © {new Date().getFullYear()} by Velora Studio Dev.
            </span>
            <span>Rupiah Indonesia</span>
          </footer>
        </div>
      </main>
      {hiddenImport}
      {confirmation}
      {backupDialog}
      {modal?.kind === "transaction" && (
        <Dialog
          title={modal.transaction ? "Edit transaksi" : "Catat transaksi"}
          close={close}
        >
          <form
            onSubmit={onSubmit(async (f) => {
              const t: Transaction = {
                id: modal.transaction?.id ?? crypto.randomUUID(),
                accountId: formText(f, "accountId"),
                kind: txKind,
                amount: parseAmount(formText(f, "amount")),
                category: formText(f, "category"),
                note: formText(f, "note"),
                date: formText(f, "date"),
              };
              await commit(
                {
                  ...wallet,
                  transactions: modal.transaction
                    ? wallet.transactions.map((old) =>
                        old.id === t.id ? t : old,
                      )
                    : [t, ...wallet.transactions],
                },
                "Transaksi tersimpan.",
                true,
              );
            })}
          >
            <div
              className="tabs form-tabs"
              role="group"
              aria-label="Jenis transaksi baru"
            >
              {(["expense", "income"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  aria-pressed={txKind === k}
                  onClick={() => setTxKind(k)}
                >
                  {k === "expense" ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownLeft size={16} />
                  )}{" "}
                  {k === "expense" ? "Pengeluaran" : "Pemasukan"}
                </button>
              ))}
            </div>
            <AccountSelect
              wallet={wallet}
              value={modal.transaction?.accountId}
            />
            <AmountField value={modal.transaction?.amount} />
            <div className="form-two">
              <label>
                Kategori
                <select
                  name="category"
                  key={txKind}
                  defaultValue={
                    modal.transaction?.kind === txKind
                      ? modal.transaction.category
                      : categoryNames(wallet, txKind)[0]
                  }
                >
                  {categoryNames(wallet, txKind).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Tanggal
                <input
                  type="date"
                  name="date"
                  defaultValue={modal.transaction?.date ?? today()}
                  max={today()}
                  required
                />
              </label>
            </div>
            <label>
              Catatan <span className="optional">(opsional)</span>
              <input
                name="note"
                defaultValue={modal.transaction?.note}
                maxLength={120}
                placeholder="Contoh: Makan siang"
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              {modal.transaction && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    const t = modal.transaction!;
                    open({
                      kind: "confirm",
                      title: "Hapus transaksi?",
                      message: `${t.note || t.category} sebesar ${money(t.amount)} akan dihapus. Saldo dan laporan dihitung ulang.`,
                      action: () =>
                        commit(
                          {
                            ...wallet,
                            transactions: wallet.transactions.filter(
                              (x) => x.id !== t.id,
                            ),
                          },
                          "Transaksi dihapus.",
                          true,
                        ),
                    });
                  }}
                >
                  <Trash2 size={17} />
                  Hapus
                </button>
              )}
              <button type="submit" className="primary" disabled={busy}>
                {busy ? "Menyimpan…" : "Simpan transaksi"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {modal?.kind === "goal" && (
        <Dialog
          title={modal.goal ? "Edit tujuan" : "Tujuan baru"}
          close={close}
        >
          <form
            onSubmit={onSubmit(async (f) => {
              const g: Goal = {
                id: modal.goal?.id ?? crypto.randomUUID(),
                name: formText(f, "name"),
                target: parseAmount(formText(f, "amount")),
                saved: modal.goal?.saved ?? 0,
                deadline: formText(f, "deadline"),
              };
              if (g.target < g.saved)
                throw new Error(
                  "Target tidak boleh kurang dari tabungan yang sudah terkumpul.",
                );
              await commit(
                {
                  ...wallet,
                  goals: modal.goal
                    ? wallet.goals.map((old) => (old.id === g.id ? g : old))
                    : [...wallet.goals, g],
                },
                "Tujuan tersimpan.",
              );
            })}
          >
            <label>
              Nama tujuan
              <input
                name="name"
                defaultValue={modal.goal?.name}
                maxLength={60}
                placeholder="Contoh: Dana darurat"
                required
              />
            </label>
            <AmountField label="Nominal target" value={modal.goal?.target} />
            <label>
              Ingin terkumpul pada
              <input
                name="deadline"
                type="date"
                defaultValue={modal.goal?.deadline ?? addDays(today(), 90)}
                min={modal.goal ? undefined : today()}
                required
              />
            </label>
            <p className="hint">
              Setelah dibuat, sisihkan uang dari saldo tersedia secara bertahap.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              {modal.goal && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    const g = modal.goal!;
                    open({
                      kind: "confirm",
                      title: "Hapus tujuan?",
                      message: `${g.name} akan dihapus. Alokasi ${money(g.saved)} kembali menjadi saldo tersedia. Saldo total tidak berubah.`,
                      action: () =>
                        commit(
                          {
                            ...wallet,
                            goals: wallet.goals.filter((x) => x.id !== g.id),
                          },
                          "Tujuan dihapus; alokasinya dilepas.",
                        ),
                    });
                  }}
                >
                  <Trash2 size={17} />
                  Hapus
                </button>
              )}
              <button className="primary" disabled={busy}>
                Simpan tujuan
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {modal?.kind === "allocate" && (
        <Dialog title={modal.goal.name} close={close}>
          <form
            onSubmit={onSubmit(async (f) =>
              commit(
                allocate(
                  wallet,
                  modal.goal.id,
                  parseAmount(formText(f, "amount")),
                  withdrawing,
                ),
                withdrawing
                  ? "Alokasi dikembalikan ke saldo tersedia."
                  : "Uang berhasil disisihkan.",
              ),
            )}
          >
            <div
              className="tabs form-tabs"
              role="group"
              aria-label="Aksi tabungan"
            >
              <button
                type="button"
                aria-pressed={!withdrawing}
                onClick={() => setWithdrawing(false)}
              >
                Sisihkan uang
              </button>
              <button
                type="button"
                aria-pressed={withdrawing}
                onClick={() => setWithdrawing(true)}
              >
                Kembalikan
              </button>
            </div>
            <div className="allocation-info">
              <span>
                {withdrawing ? "Tersimpan di tujuan ini" : "Saldo tersedia"}
              </span>
              <strong className="num">
                {money(withdrawing ? modal.goal.saved : balance.available)}
              </strong>
            </div>
            <AmountField />
            <p className="hint">
              {withdrawing
                ? "Uang kembali bisa dibelanjakan. Saldo total tetap sama."
                : `Sisa target ${money(modal.goal.target - modal.goal.saved)}. Alokasi ini tidak dihitung sebagai pengeluaran.`}
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="primary wide" disabled={busy}>
              {withdrawing ? "Kembalikan ke saldo tersedia" : "Simpan alokasi"}
            </button>
          </form>
        </Dialog>
      )}
    </div>
  );
}
