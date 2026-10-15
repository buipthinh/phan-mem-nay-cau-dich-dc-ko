import * as Notifications from 'expo-notifications';
import { festival, reminderTimes, tr, type Lang, type Show } from '@mtll/shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Đặt thông báo 15 phút trước suất diễn cho mọi ngày lễ hội còn ở tương lai.
 * Trả về danh sách mã thông báo để huỷ sau, hoặc null nếu khách chưa cho phép thông báo.
 */
export async function scheduleShowReminder(show: Show, lang: Lang, now = new Date()): Promise<string[] | null> {
  if (!(await ensurePermission())) return null;
  const ids: string[] = [];
  for (const r of reminderTimes(festival, show.id, now)) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: tr(show.name, lang),
        body: `${show.start} · ${tr(festival.zones.find((z) => z.kind === 'stage')!.name, lang)}`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at },
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelReminder(ids: string[]) {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
