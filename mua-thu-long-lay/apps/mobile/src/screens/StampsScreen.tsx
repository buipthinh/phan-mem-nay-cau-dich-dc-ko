import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { canRedeem, festival, getStall, getZone, progress } from '@mtll/shared';
import { Button, Card, StallCode, text } from '../components/ui';
import { useSettings } from '../state/settings';
import { colors, space } from '../theme';

export function StampsScreen() {
  const { t, tl, stamps, clearStamps } = useSettings();
  const goal = festival.stampsForGift;
  const done = canRedeem(stamps, goal);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={text.h1}>{t('stamps.title')}</Text>
      <Text style={text.muted}>{t('stamps.howTo')}</Text>
      <Card>
        <Text style={text.h2}>{t('stamps.progress', { count: Math.min(stamps.length, goal), goal })}</Text>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress(stamps, goal) * 100}%` }]} />
        </View>
        <View style={styles.slots}>
          {Array.from({ length: goal }, (_, i) => {
            const id = stamps[i];
            const zone = id ? getZone(getStall(id)?.zoneId ?? '') : undefined;
            return id && zone ? (
              <StallCode key={i} id={id} color={colors.zone[zone.kind]} size={44} />
            ) : (
              <View key={i} style={styles.empty} />
            );
          })}
        </View>
      </Card>
      {done && (
        <View style={styles.ready}>
          <Text style={styles.readyText}>{t('stamps.ready')}</Text>
        </View>
      )}
      {stamps.length > 0 && (
        <View style={{ gap: space(1) }}>
          {stamps.map((id) => {
            const s = getStall(id);
            return s ? (
              <Text key={id} style={text.body}>
                {id} · {tl(s.name)}
              </Text>
            ) : null;
          })}
        </View>
      )}
      {stamps.length > 0 && <Button label={t('stamps.reset')} onPress={clearStamps} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), gap: space(4), paddingBottom: space(10) },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.accent },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginTop: space(2) },
  empty: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.line },
  ready: { backgroundColor: colors.goodSoft, padding: space(4), borderRadius: 12 },
  readyText: { color: colors.good, fontWeight: '700', fontSize: 16 },
});
