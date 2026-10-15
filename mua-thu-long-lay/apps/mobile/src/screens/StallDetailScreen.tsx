import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getStall, getZone, resolveText } from '@mtll/shared';
import { Button, Card, Chip, StallCode, text } from '../components/ui';
import { speak, stopSpeaking } from '../lib/narrator';
import type { RootScreenProps } from '../navigation';
import { useLang, useSettings } from '../state/settings';
import { colors, space } from '../theme';

export function StallDetailScreen({ route, navigation }: RootScreenProps<'StallDetail'>) {
  const { id, stamp } = route.params;
  const { t, tl, rate, pushHistory } = useSettings();
  const lang = useLang();
  const stall = getStall(id);
  const zone = stall ? getZone(stall.zoneId) : undefined;
  const [speaking, setSpeaking] = useState(false);
  const stampNote = stamp === 'new' ? t('stall.stampEarned') : stamp === 'owned' ? t('stall.stampOwned') : null;
  const handled = useRef(false);

  useEffect(() => {
    if (!stall || handled.current) return;
    handled.current = true;
    navigation.setOptions({ title: stall.id });
    pushHistory(stall.id);
  }, [stall, pushHistory, navigation]);

  useEffect(() => () => stopSpeaking(), []);

  if (!stall || !zone) {
    return (
      <View style={styles.root}>
        <Text style={text.body}>{t('stall.notFound')}</Text>
      </View>
    );
  }

  const description = resolveText(stall.description, lang);
  const listen = () => {
    setSpeaking(true);
    speak(`${tl(stall.name)}. ${description.text}`, description.lang, rate, () => setSpeaking(false));
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {stampNote && (
        <View style={styles.stamp} accessibilityLiveRegion="polite">
          <Text style={styles.stampText}>{stampNote}</Text>
        </View>
      )}
      <View style={styles.head}>
        <StallCode id={stall.id} color={colors.zone[zone.kind]} size={52} />
        <View style={{ flex: 1, gap: space(1) }}>
          <Chip label={tl(zone.name)} color={colors.zone[zone.kind]} />
          <Text style={text.h1}>{tl(stall.name)}</Text>
        </View>
      </View>

      <Card>
        <Text style={text.body}>{description.text}</Text>
        <View style={styles.meta}>
          <Text style={text.muted}>{t('stall.price')}</Text>
          <Text style={styles.metaValue}>{tl(stall.price)}</Text>
        </View>
        {stall.allergens && (
          <View style={styles.meta}>
            <Text style={text.muted}>{t('stall.allergens')}</Text>
            <Text style={styles.metaValue}>{tl(stall.allergens)}</Text>
          </View>
        )}
      </Card>

      {speaking ? (
        <Button
          label={t('map.stop')}
          onPress={() => {
            stopSpeaking();
            setSpeaking(false);
          }}
        />
      ) : (
        <Button kind="primary" label={t('map.listen')} onPress={listen} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), gap: space(4), paddingBottom: space(10) },
  head: { flexDirection: 'row', gap: space(3), alignItems: 'center' },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space(3),
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingTop: space(2),
  },
  metaValue: { fontSize: 14, fontWeight: '600', color: colors.ink, flexShrink: 1, textAlign: 'right' },
  stamp: { backgroundColor: colors.accentSoft, borderRadius: 10, padding: space(3) },
  stampText: { color: colors.accentInk, fontWeight: '700' },
});
