import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { App } from "./App";
import { ReminderFields } from "./DailyReminderSettings";
import {
  DEFAULT_DAILY_REMINDER,
  loadDailyReminder,
  saveDailyReminder,
  type DailyReminder,
} from "./dailyReminder";

const welcomeKey = "saku.welcome.v1";
const slides = [
  {
    title: "Kenali isi sakumu.",
    text: "Catat uang masuk dan keluar. Lihat yang masih bisa dipakai, tanpa hitung ulang.",
    image: "wallet",
    caption: "Catat sedikit. Pahami lebih banyak.",
  },
  {
    title: "Beri ruang untuk keinginan.",
    text: "Atur batas belanja dan sisihkan untuk tujuanmu. Boleh Jajan membantu melihat ruang belanja hari ini.",
    image: "growth",
    caption: "Pelan-pelan, rencanamu terkumpul.",
  },
  {
    title: "Catatanmu, milikmu.",
    text: "Tanpa akun, tanpa iklan. Catatan tersimpan di perangkat dan bisa dipakai tanpa internet.",
    image: "privacy",
    caption: "Simpan cadangan saat diperlukan.",
  },
];

export function WelcomeGate() {
  const [show, setShow] = useState<boolean | null>(null);
  const [replay, setReplay] = useState(false);
  const [notice, setNotice] = useState("");
  const [finishing, setFinishing] = useState(false);
  const finishingRef = useRef(false);
  useEffect(() => {
    let active = true;
    void Preferences.get({ key: welcomeKey })
      .then((result) => {
        if (active) setShow(result.value !== "seen");
      })
      .catch(() => {
        if (active) setShow(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function finish(reminder?: DailyReminder) {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    let message = "";
    if (reminder) {
      try {
        await saveDailyReminder(reminder);
      } catch (error) {
        message =
          error instanceof Error
            ? error.message
            : "Pengingat belum aktif. Atur nanti lewat Lainnya → Pengingat.";
      }
    }
    try {
      await Preferences.set({ key: welcomeKey, value: "seen" });
    } catch {
      message ||=
        "Panduan belum ditandai selesai. Saku tetap bisa digunakan; panduan mungkin tampil lagi saat dibuka.";
    }
    setNotice(message);
    setShow(false);
    setFinishing(false);
    finishingRef.current = false;
    window.scrollTo(0, 0);
  }

  if (show === null)
    return (
      <main className="startup">
        <img src="/saku-logo.png" width="48" height="48" alt="" />
        <p role="status">Membuka Saku…</p>
      </main>
    );
  if (show)
    return <WelcomeGuide replay={replay} busy={finishing} finish={finish} />;
  return (
    <App
      initialNotice={notice}
      onShowWelcome={() => {
        setReplay(true);
        setNotice("");
        setShow(true);
        window.scrollTo(0, 0);
      }}
    />
  );
}

function WelcomeGuide({
  replay,
  busy,
  finish,
}: {
  replay: boolean;
  busy: boolean;
  finish: (reminder?: DailyReminder) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [reminder, setReminder] = useState({ ...DEFAULT_DAILY_REMINDER });
  const [reminderReady, setReminderReady] = useState(false);
  const [changed, setChanged] = useState(false);
  const rail = useRef<HTMLDivElement>(null);
  const currentStep = useRef(step);
  currentStep.current = step;
  useEffect(() => {
    let active = true;
    void loadDailyReminder()
      .then((config) => {
        if (active) setReminder(config);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReminderReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  function goTo(next: number) {
    const element = rail.current;
    if (!element || busy) return;
    element.scrollTo({
      left:
        Math.max(0, Math.min(slides.length - 1, next)) * element.clientWidth,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    let width = 0;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return;
      width = el.clientWidth;
      el.scrollTo({ left: currentStep.current * width, behavior: "auto" });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    const listener = NativeApp.addListener("backButton", () => {
      if (busy) return;
      if (step > 0) goTo(step - 1);
      else if (replay) void finish();
      else void NativeApp.minimizeApp();
    });
    return () => {
      void listener.then((l) => l.remove());
    };
  }, [step, busy, replay]);
  return (
    <main
      className="welcome-guide"
      onKeyDown={(event) => {
        if ((event.target as HTMLElement).closest("input, select, textarea"))
          return;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          goTo(step + (event.key === "ArrowRight" ? 1 : -1));
        }
      }}
    >
      <header className="welcome-header">
        <div className="brand">
          <img
            src="/saku-logo.png"
            className="saku-mark"
            width="36"
            height="36"
            alt=""
          />
          <span>saku.</span>
        </div>
        <button
          className="text-button"
          disabled={busy}
          onClick={() => void finish()}
        >
          {replay ? "Tutup panduan" : "Lewati panduan"}
        </button>
      </header>
      <div
        className="welcome-rail"
        ref={rail}
        role="region"
        aria-label="Pengenalan Saku, tiga halaman"
        onScroll={(event) => {
          const el = event.currentTarget;
          setStep(
            Math.max(
              0,
              Math.min(
                slides.length - 1,
                Math.round(el.scrollLeft / el.clientWidth),
              ),
            ),
          );
        }}
      >
        {slides.map((slide, index) => (
          <section
            className="welcome-slide"
            key={slide.image}
            inert={step !== index}
            aria-hidden={step !== index}
            aria-label={`Halaman ${index + 1} dari ${slides.length}`}
          >
            <div className="welcome-art">
              <img
                src={`/onboarding/${slide.image}.png`}
                width="768"
                height="768"
                alt=""
                draggable={false}
              />
            </div>
            <div className="welcome-copy">
              <h1>{slide.title}</h1>
              <p>{slide.text}</p>
              <small>{slide.caption}</small>
            </div>
            {index === slides.length - 1 && Capacitor.isNativePlatform() && (
              <ReminderFields
                value={reminder}
                change={(next) => {
                  setReminder(next);
                  setChanged(true);
                }}
                disabled={busy || !reminderReady || step !== index}
              />
            )}
          </section>
        ))}
      </div>
      <footer className="welcome-footer">
        <nav className="welcome-dots" aria-label="Halaman panduan">
          {slides.map((slide, index) => (
            <button
              key={slide.image}
              disabled={busy}
              aria-label={`Halaman ${index + 1}: ${slide.title}`}
              aria-current={step === index ? "step" : undefined}
              onClick={() => goTo(index)}
            >
              <span />
            </button>
          ))}
        </nav>
        <span className="welcome-count" aria-live="polite">
          {step + 1} dari {slides.length}
        </span>
        <div className="welcome-actions">
          {step > 0 && (
            <button
              className="welcome-back"
              disabled={busy}
              onClick={() => goTo(step - 1)}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={21} />
            </button>
          )}
          <button
            className="primary"
            disabled={busy}
            onClick={() =>
              step === slides.length - 1
                ? void finish(changed ? reminder : undefined)
                : goTo(step + 1)
            }
          >
            {busy
              ? "Menyiapkan…"
              : step === slides.length - 1
                ? replay
                  ? "Kembali ke Saku"
                  : "Mulai pakai Saku"
                : "Lanjut"}
            <ArrowRight size={19} />
          </button>
        </div>
      </footer>
    </main>
  );
}
