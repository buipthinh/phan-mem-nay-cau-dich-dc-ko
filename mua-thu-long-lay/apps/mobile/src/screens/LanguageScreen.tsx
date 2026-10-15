import { getLocales } from 'expo-localization';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { festival, LANGS, pickLang, translate, tr, type Lang } from '@mtll/shared';
import { Button, text } from '../components/ui';
import { useSettings } from '../state/settings';
import { colors, radius, space } from '../theme';

/** Màn hình đầu tiên: gợi ý sẵn ngôn ngữ của máy, khách chọn rồi bấm Tiếp tục. */
export function LanguageScreen() {
  const { setLang } = useSettings();
  const [choice, setChoice] = useState<Lang>(() => pickLang(getLocales().map((l) => l.languageTag)));

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.head}>
        <Text style={text.eyebrow}>{tr(festival.tagline, choice)}</Text>
        <Text style={styles.title}>{tr(festival.name, choice)}</Text>
      </View>
      <Text style={text.h2}>{translate(choice, 'app.chooseLanguage')}</Text>
      <View style={styles.list} accessibilityRole="radiogroup">
        {LANGS.map((l) => {
          const on = l.code === choice;
          return (
            <Pressable
              key={l.code}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => setChoice(l.code)}
              style={[styles.option, on && styles.optionOn]}
            >
              <Text style={[styles.optionText, on && { color: colors.accentInk }]}>{l.label}</Text>
              <View style={[styles.radio, on && styles.radioOn]} />
            </Pressable>
          );
        })}
      </View>
      <Text style={text.muted}>{translate(choice, 'app.chooseLanguageHint')}</Text>
      <View style={{ flex: 1 }} />
      <Button kind="primary" label={translate(choice, 'app.continue')} onPress={() => setLang(choice)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: space(5), gap: space(4) },
  head: { marginTop: space(6), marginBottom: space(4), gap: space(1) },
  title: { fontSize: 40, fontWeight: '800', color: colors.ink },
  list: { gap: space(2) },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space(4),
  },
  optionOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  optionText: { fontSize: 17, fontWeight: '600', color: colors.ink },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.line },
  radioOn: { borderColor: colors.accent, borderWidth: 6 },
});
