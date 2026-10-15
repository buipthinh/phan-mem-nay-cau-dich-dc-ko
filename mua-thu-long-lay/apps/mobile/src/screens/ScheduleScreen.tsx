import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { festival, nextShow, occurrences, statusAt, type MessageKey, type Show } from '@mtll/shared';
import { Button, Card, text } from '../components/ui';
import { cancelReminder, scheduleShowReminder } from '../lib/reminders';
import { useLang, useSettings } from '../state/settings';
import { colors, space } from '../theme';

export function ScheduleScreen() {
  const { t, tl, reminders, setReminder } = useSettings();
  const lang = useLang();
  const [now, setNow] = useState(() => new Date());
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const upcoming = nextShow(festival, now);
  const todays = upcoming ? occurrences(festival).filter((o) => o.day === upcoming.day) : [];

  async function toggle(show: Show) {
    setNote(null);
    const existing = reminders[show.id];
    if (existing) {
      await cancelReminder(existing);
      setReminder(show.id, null);
      return;
    }
    const ids = await scheduleShowReminder(show, lang, now);
    if (ids === null) setNote(t('schedule.noPermission'));
    else setReminder(show.id, ids);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={text.muted}>{t('schedule.remindHint')}</Text>
      {note && <Text style={styles.note}>{note}</Text>}
      {festival.shows.map((show) => {
        const occ = todays.find((o) => o.show.id === show.id);
        const status = occ ? statusAt(occ, now) : null;
        const isNext = upcoming?.show.id === show.id && upcoming.day === occ?.day;
        const on = Boolean(reminders[show.id]);
        return (
          <Card key={show.id} style={isNext ? styles.next : undefined}>
            <View style={styles.top}>
              <Text style={text.eyebrow}>{t(`slot.${show.slot}` as MessageKey)}</Text>
              {status === 'live' && <Text style={styles.live}>{t('schedule.live')}</Text>}
              {status === 'done' && <Text style={text.muted}>{t('schedule.done')}</Text>}
              {status === 'upcoming' && isNext && <Text style={styles.live}>{t('schedule.next')}</Text>}
            </View>
            <Text style={styles.time}>
              {show.start} – {show.end}
            </Text>
            <Text style={text.h2}>{tl(show.name)}</Text>
            <Text style={text.muted}>{tl(show.description)}</Text>
            <Button
              kind={on ? 'default' : 'primary'}
              label={on ? `✓ ${t('schedule.reminded')}` : t('schedule.remind')}
              onPress={() => toggle(show)}
            />
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), gap: space(3), paddingBottom: space(10) },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 15, fontWeight: '700', color: colors.zone.stage, fontVariant: ['tabular-nums'] },
  live: { fontSize: 12, fontWeight: '700', color: colors.accentInk },
  next: { borderColor: colors.accent, borderWidth: 2 },
  note: { color: colors.accentInk, backgroundColor: colors.accentSoft, padding: space(3), borderRadius: 8 },
});
