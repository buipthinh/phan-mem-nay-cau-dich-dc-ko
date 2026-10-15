import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { festival } from '@mtll/shared';
import { StallCode, text } from '../components/ui';
import type { RootStackParamList } from '../navigation';
import { useSettings } from '../state/settings';
import { colors, space } from '../theme';

export function StallsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { tl, t } = useSettings();
  const sections = festival.zones
    .map((z) => ({ zone: z, data: festival.stalls.filter((s) => s.zoneId === z.id) }))
    .filter((s) => s.data.length > 0);

  return (
    <SectionList
      style={styles.root}
      contentContainerStyle={styles.content}
      sections={sections}
      keyExtractor={(s) => s.id}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <View style={[styles.header, { borderColor: colors.zone[section.zone.kind] }]}>
          <Text style={text.h2}>{tl(section.zone.name)}</Text>
          <Text style={text.muted}>{section.data.length}</Text>
        </View>
      )}
      renderItem={({ item, section }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => nav.navigate('StallDetail', { id: item.id })}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
        >
          <StallCode id={item.id} color={colors.zone[section.zone.kind]} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.name}>
              {tl(item.name)}
              {item.suggested ? <Text style={styles.tag}> {t('stall.suggested')}</Text> : null}
            </Text>
            <Text style={text.muted} numberOfLines={2}>
              {tl(item.description)}
            </Text>
            <Text style={styles.price}>{tl(item.price)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space(4), paddingBottom: space(10) },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottomWidth: 2,
    paddingBottom: space(1),
    marginTop: space(4),
    marginBottom: space(1),
  },
  row: { flexDirection: 'row', gap: space(3), paddingVertical: space(3), alignItems: 'flex-start' },
  name: { fontSize: 16, fontWeight: '600', color: colors.ink },
  tag: { fontSize: 11, color: colors.accentInk, fontWeight: '700' },
  price: { fontSize: 13, color: colors.ink, fontVariant: ['tabular-nums'] },
});
