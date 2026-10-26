import test from "node:test";
import assert from "node:assert/strict";
import {
  dailyNotification,
  parseDailyReminder,
  DAILY_REMINDER_ID,
} from "../src/dailyReminder";

test("a fresh or damaged preference never opts a user into notifications", () => {
  for (const raw of [
    null,
    "{bad",
    "null",
    "[]",
    '{"enabled":"true","time":"20:00"}',
    '{"enabled":true,"time":"24:00"}',
  ]) {
    assert.deepEqual(parseDailyReminder(raw), {
      enabled: false,
      time: "20:00",
    });
  }
  assert.deepEqual(parseDailyReminder('{"enabled":true,"time":"07:05"}'), {
    enabled: true,
    time: "07:05",
  });
});

test("daily reminders use a single stable calendar slot, separate from recurring bills", () => {
  for (const time of ["00:00", "07:05", "20:00", "23:59"]) {
    const notice = dailyNotification(time);
    assert.equal(notice.id, DAILY_REMINDER_ID);
    assert.ok(notice.id < 130000 || notice.id >= 130050);
    assert.deepEqual(notice.schedule, {
      on: {
        hour: Number(time.slice(0, 2)),
        minute: Number(time.slice(3)),
        second: 0,
      },
      repeats: true,
      allowWhileIdle: false,
    });
    assert.equal(notice.isExactNotification, false);
    assert.equal(notice.interruptionLevel, "passive");
    assert.doesNotMatch(notice.body ?? "", /Rp|\p{Extended_Pictographic}/u);
  }
  for (const time of ["24:00", "20:60", "8:00", "", "20:00\n"])
    assert.throws(() => dailyNotification(time));
});
