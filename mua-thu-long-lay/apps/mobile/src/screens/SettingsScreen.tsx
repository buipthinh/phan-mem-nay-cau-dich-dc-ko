import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { festival, LANGS } from '@mtll/shared';
import { Card, text } from '../components/ui';
import { stopSpeaking } from '../lib/narrator';
import { useLang, useSettings } from '../state/settings';
import { colors, radius, space } from '../theme';

const RATES = [0.75, 1, 1.25, 1.5];

export function SettingsScreen() {
  const { t, tl, setLang, autoNarrate, setAutoNarrate, rate, setRate } = useSettings();
  const lang = useLang();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Card>
        <Text style={text.eyebrow}>{t('settings.language')}</Text>
        <View style={styles.wrap}>
          {LANGS.map((l) => (
            <Pressable
              key={l.code}
              accessibilityRole="button"
              accessibilityState={{ selected: l.code === lang }}
              onPress={() => {
                stopSpeaking();
                setLang(l.code);
              }}
              style={[styles.pill, l.code === lang && styles.pillOn]}
            >
              <Text style={[styles.pillText, l.code === lang && styles.pillTextOn]}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <View style={styles.switchRow}>
          <Text style={[text.body, { flex: 1 }]}>{t('settings.autoNarrate')}</Text>
          <Switch value={autoNarrate} onValueChange={setAutoNarrate} trackColor={{ true: colors.accent, false: colors.line }} />
        </View>
        <Text style={text.eyebrow}>{t('settings.rate')}</Text>
        <View style={styles.wrap}>
          {RATES.map((r) => (
            <Pressable key={r} onPress={() => setRate(r)} style={[styles.pill, r === rate && styles.pillOn]}>
              <Text style={[styles.pillText, r === rate && styles.pillTextOn]}>{r}x</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={text.eyebrow}>{t('settings.about')}</Text>
        <Text style={text.h2}>{tl(festival.name)}</Text>
        <Text style={text.body}>{tl(festival.tagline)}</Text>
        <Text style={text.muted}>
          {festival.days.map((d) => d.split('-').reverse().join('/')).join(', ')} · {festival.opens}–{festival.closes}
        </Text>
        <Text style={text.muted}>{tl(festival.location)}</Text>
        <Text style={text.muted}>{t('settings.offline')}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), gap: space(3), paddingBottom: space(10) },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  pill: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingVertical: 8, paddingHorizontal: 14 },
  pillOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { color: colors.ink, fontWeight: '600' },
  pillTextOn: { color: colors.bg },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: space(3) },
});
