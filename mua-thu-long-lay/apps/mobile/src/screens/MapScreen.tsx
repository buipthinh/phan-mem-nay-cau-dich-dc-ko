import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LANGS, resolveText, type Zone } from '@mtll/shared';
import { FestivalMapView } from '../components/FestivalMapView';
import { Button, Card, Chip, text } from '../components/ui';
import { speak, stopSpeaking } from '../lib/narrator';
import { useZoneTracking } from '../lib/useZoneTracking';
import type { RootStackParamList } from '../navigation';
import { useLang, useSettings } from '../state/settings';
import { colors, space } from '../theme';

export function MapScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, tl, autoNarrate, rate } = useSettings();
  const lang = useLang();
  const [speaking, setSpeaking] = useState(false);

  const narrate = useCallback(
    (zone: Zone) => {
      setSpeaking(true);
      speak(`${tl(zone.name)}. ${tl(zone.narration)}`, resolveText(zone.narration, lang).lang, rate, () => setSpeaking(false));
    },
    [lang, rate, tl],
  );

  const onEnter = useCallback(
    (zone: Zone) => {
      if (autoNarrate) narrate(zone);
    },
    [autoNarrate, narrate],
  );

  const { zone, gps, simulate } = useZoneTracking(onEnter);
  useEffect(() => () => stopSpeaking(), []);

  const narration = zone ? resolveText(zone.narration, lang) : null;
  const fallbackLabel = narration?.isFallback ? LANGS.find((l) => l.code === narration.lang)?.label : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Card style={{ padding: space(2) }}>
        <FestivalMapView
          lang={lang}
          activeZone={zone?.id}
          onZonePress={simulate}
          onStallPress={(id) => nav.navigate('StallDetail', { id })}
        />
      </Card>

      <View style={styles.gpsRow}>
        <View style={[styles.gpsDot, { backgroundColor: gps === 'on' ? colors.good : colors.muted }]} />
        <Text style={text.muted}>{gps === 'on' ? t('map.gpsOn') : t('map.gpsOff')}</Text>
      </View>

      <Card>
        {zone ? (
          <>
            <Chip label={`${t('map.youAreIn')} · ${zone.id}`} color={colors.zone[zone.kind]} />
            <Text style={text.h2}>{tl(zone.name)}</Text>
            <Text style={text.body}>{narration?.text}</Text>
            {fallbackLabel && <Text style={text.muted}>{t('map.fallbackNotice', { lang: fallbackLabel })}</Text>}
            <View style={styles.actions}>
              {speaking ? (
                <Button
                  label={t('map.stop')}
                  onPress={() => {
                    stopSpeaking();
                    setSpeaking(false);
                  }}
                />
              ) : (
                <Button kind="primary" label={t('map.listen')} onPress={() => narrate(zone)} />
              )}
            </View>
          </>
        ) : (
          <>
            <Text style={text.h2}>{t('map.outside')}</Text>
            <Text style={text.muted}>{t('map.outsideHint')}</Text>
          </>
        )}
      </Card>

      <Button kind="primary" label={t('map.scan')} onPress={() => nav.navigate('Scanner')} />
      <Text style={text.muted}>{t('map.demoHint')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), gap: space(3), paddingBottom: space(10) },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: space(2), marginTop: space(1) },
});
