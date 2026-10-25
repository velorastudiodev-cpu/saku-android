import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Wallet } from "./domain";
const firstId = 130000;
export async function requestReminders() {
  if (!Capacitor.isNativePlatform())
    throw new Error("Pengingat tersedia di aplikasi Android/iOS.");
  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== "granted")
    throw new Error(
      "Izin notifikasi belum diberikan. Jadwal tetap tersedia di dalam Saku.",
    );
}
let queue = Promise.resolve();
export function syncReminders(wallet: Wallet) {
  const work = async () => {
    if (!Capacitor.isNativePlatform()) return;
    const pending = await LocalNotifications.getPending();
    const own = pending.notifications.filter(
      (n) => n.id >= firstId && n.id < firstId + 50,
    );
    if (own.length) await LocalNotifications.cancel({ notifications: own });
    if (!wallet.reminders) return;
    if ((await LocalNotifications.checkPermissions()).display !== "granted")
      throw new Error(
        "Pengingat dimatikan oleh sistem. Jadwal tetap tersimpan; periksa izin notifikasi Saku.",
      );
    const notifications = wallet.recurring
      .filter((r) => r.active)
      .map((rule, i) => {
        const [year, month, day] = rule.nextDate.split("-").map(Number);
        return {
          id: firstId + i,
          isExactNotification: false,
          title: "Saku · Jadwal berulang",
          body:
            rule.mode === "confirm"
              ? "Ada transaksi rutin untuk dikonfirmasi. Buka Saku."
              : "Buka Saku untuk mencatat transaksi rutin yang jatuh tempo.",
          schedule: {
            at: new Date(year, month - 1, day, 9, 0, 0),
            allowWhileIdle: false,
          },
        };
      })
      .filter((n) => n.schedule.at.getTime() > Date.now());
    if (notifications.length)
      await LocalNotifications.schedule({ notifications });
  };
  queue = queue.catch(() => {}).then(work);
  return queue;
}
