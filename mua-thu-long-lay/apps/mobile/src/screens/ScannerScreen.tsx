import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { getStall, parseStallCode } from '@mtll/shared';
import { Button, text } from '../components/ui';
import type { RootScreenProps } from '../navigation';
import { useSettings } from '../state/settings';
import { colors, radius, space } from '../theme';

export function ScannerScreen({ navigation }: RootScreenProps<'Scanner'>) {
  const { t, collectStamp } = useSettings();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  function open(raw: string) {
    const code = parseStallCode(raw);
    if (!code || !getStall(code)) {
      setError(t('scan.invalid'));
      return false;
    }
    // Quét được mã hợp lệ thì ghi tem ngay tại đây, rồi mở trang gian hàng.
    navigation.replace('StallDetail', { id: code, stamp: collectStamp(code) ? 'new' : 'owned' });
    return true;
  }

  return (
    <View style={styles.root}>
      <Text style={text.h2}>{t('scan.title')}</Text>
      <View style={styles.frame}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => {
              if (busy.current) return;
              busy.current = true;
              if (!open(data)) setTimeout(() => (busy.current = false), 1500);
            }}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={[text.body, { textAlign: 'center' }]}>{t('scan.permission')}</Text>
            <Button kind="primary" label={t('scan.allow')} onPress={requestPermission} />
          </View>
        )}
      </View>
      {error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      <Text style={text.muted}>{t('scan.manual')}</Text>
      <View style={styles.manual}>
        <TextInput
          style={styles.input}
          value={manual}
          onChangeText={(v) => {
            setManual(v);
            setError(null);
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder="F2"
          placeholderTextColor={colors.muted}
          onSubmitEditing={() => open(manual)}
          accessibilityLabel={t('scan.manual')}
        />
        <Button label={t('scan.open')} onPress={() => open(manual)} disabled={!manual.trim()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: space(4), gap: space(3) },
  frame: { aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.ink },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space(3),
    padding: space(6),
    backgroundColor: colors.surface,
  },
  manual: { flexDirection: 'row', gap: space(2) },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: space(3),
    fontSize: 16,
    color: colors.ink,
  },
  error: { color: '#B3261E', fontWeight: '600' },
});
