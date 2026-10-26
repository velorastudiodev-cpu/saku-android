import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import {
  LocalNotifications,
  type LocalNotificationSchema,
} from "@capacitor/local-notifications";

export type DailyReminder = { enabled: boolean; time: string };
export const DEFAULT_DAILY_REMINDER: DailyReminder = {
  enabled: false,
  time: "20:00",
};
export const DAILY_REMINDER_ID = 129900;
const channelId = "saku-daily-v1";
const key = "saku.daily-reminder.v1";
const validTime = (time: unknown): time is string =>
  typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export function parseDailyReminder(value: string | null): DailyReminder {
  try {
    const parsed = JSON.parse(value ?? "null");
    if (parsed && typeof parsed.enabled === "boolean" && validTime(parsed.time))
      return { enabled: parsed.enabled, time: parsed.time };
  } catch {
    /* Invalid preferences must never enable notifications. */
  }
  return { ...DEFAULT_DAILY_REMINDER };
}

export async function loadDailyReminder() {
  return parseDailyReminder((await Preferences.get({ key })).value);
}

export function dailyNotification(time: string): LocalNotificationSchema {
  if (!validTime(time)) throw new Error("Pilih jam pengingat yang valid.");
  const [hour, minute] = time.split(":").map(Number);
  return {
    id: DAILY_REMINDER_ID,
    title: "Saku",
    body: "Ada transaksi hari ini? Luangkan sebentar untuk melengkapi catatanmu.",
    channelId,
    smallIcon: "ic_saku_notification",
    iconColor: "#147d59",
    isExactNotification: false,
    interruptionLevel: "passive",
    extra: { utcOffset: new Date().getTimezoneOffset() },
    schedule: {
      on: { hour, minute, second: 0 },
      repeats: true,
      allowWhileIdle: false,
    },
  };
}

let queue = Promise.resolve();
function enqueue(work: () => Promise<void>) {
  queue = queue.catch(() => {}).then(work);
  return queue;
}

function ignoreUnavailableChannel(error: unknown) {
  // Android 7 has no channels; its per-notification sound is used instead.
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "UNAVAILABLE"
  )
    return;
  throw error;
}

async function replaceSchedule(config: DailyReminder) {
  if (!Capacitor.isNativePlatform()) return;
  await LocalNotifications.cancel({
    notifications: [{ id: DAILY_REMINDER_ID }],
  });
  if (!config.enabled) {
    const delivered = (
      await LocalNotifications.getDeliveredNotifications()
    ).notifications.filter((n) => n.id === DAILY_REMINDER_ID);
    if (delivered.length)
      await LocalNotifications.removeDeliveredNotifications({
        notifications: delivered,
      });
    return;
  }
  if ((await LocalNotifications.checkPermissions()).display !== "granted")
    throw new Error(
      "Izinkan notifikasi Saku di pengaturan perangkat untuk menerima pengingat.",
    );
  const notification = dailyNotification(config.time);
  if (Capacitor.getPlatform() === "android") {
    await LocalNotifications.createChannel({
      id: channelId,
      name: "Pengingat catatan harian",
      description: "Satu pengingat ringan untuk melengkapi catatan harian.",
      importance: 2,
      visibility: 0,
      vibration: false,
      sound: "saku_silent.wav",
    }).catch(ignoreUnavailableChannel);
    // Android 7 uses the notification's sound instead of channels.
    notification.sound = "saku_silent.wav";
  }
  await LocalNotifications.schedule({ notifications: [notification] });
}

export function saveDailyReminder(config: DailyReminder) {
  return enqueue(async () => {
    if (!validTime(config.time) || typeof config.enabled !== "boolean")
      throw new Error("Pilih jam pengingat yang valid.");
    if (config.enabled) {
      if (!Capacitor.isNativePlatform())
        throw new Error("Pengingat tersedia di aplikasi Android/iOS.");
      const permission = await LocalNotifications.checkPermissions();
      if (
        permission.display !== "granted" &&
        (await LocalNotifications.requestPermissions()).display !== "granted"
      )
        throw new Error(
          "Notifikasi belum diizinkan. Kamu tetap bisa memakai Saku; aktifkan nanti lewat Lainnya → Pengingat.",
        );
    }
    const previous = await loadDailyReminder();
    try {
      await replaceSchedule(config);
      await Preferences.set({ key, value: JSON.stringify(config) });
    } catch (error) {
      // Keep the previous preference and restore its schedule if an update fails.
      await replaceSchedule(previous).catch(() => {});
      throw error;
    }
  });
}

export function syncDailyReminder() {
  return enqueue(async () => {
    if (!Capacitor.isNativePlatform()) return;
    const config = await loadDailyReminder();
    const pending = (await LocalNotifications.getPending()).notifications.find(
      (n) => n.id === DAILY_REMINDER_ID,
    );
    if (!config.enabled) {
      if (pending) await replaceSchedule(config);
      return;
    }
    if ((await LocalNotifications.checkPermissions()).display !== "granted") {
      await LocalNotifications.cancel({
        notifications: [{ id: DAILY_REMINDER_ID }],
      });
      throw new Error(
        "Pengingat harian belum bisa tampil. Periksa izin notifikasi Saku di pengaturan perangkat.",
      );
    }
    const expected = dailyNotification(config.time).schedule!.on!;
    if (
      pending?.schedule?.on?.hour === expected.hour &&
      pending?.schedule?.on?.minute === expected.minute &&
      pending?.schedule?.repeats &&
      pending.extra?.utcOffset === new Date().getTimezoneOffset()
    )
      return;
    await replaceSchedule(config);
  });
}

export async function dailyNotificationsAllowed() {
  if (!Capacitor.isNativePlatform()) return false;
  if ((await LocalNotifications.checkPermissions()).display !== "granted")
    return false;
  if (Capacitor.getPlatform() === "android") {
    const channels = await LocalNotifications.listChannels().catch((error) => {
      ignoreUnavailableChannel(error);
      return { channels: [] };
    });
    const channel = channels.channels.find((c) => c.id === channelId);
    if (channel?.importance === 0) return false;
  }
  return true;
}
