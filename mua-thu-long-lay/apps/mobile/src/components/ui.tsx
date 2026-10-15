import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, space } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  kind = 'default',
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'default' | 'primary';
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btn, kind === 'primary' && styles.primary, (pressed || disabled) && { opacity: 0.6 }]}
    >
      <Text style={[styles.btnText, kind === 'primary' && styles.primaryText]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '22' }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

export function StallCode({ id, color, size = 36 }: { id: string; color: string; size?: number }) {
  return (
    <View style={[styles.code, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.codeText}>{id}</Text>
    </View>
  );
}

export const text = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '800', color: colors.ink },
  h2: { fontSize: 20, fontWeight: '700', color: colors.ink },
  body: { fontSize: 15, lineHeight: 22, color: colors.ink },
  muted: { fontSize: 13, lineHeight: 19, color: colors.muted },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: colors.muted, textTransform: 'uppercase' },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    gap: space(2),
  },
  btn: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnText: { fontWeight: '600', color: colors.ink, fontSize: 15 },
  primaryText: { color: '#1B1200' },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  chipText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  code: { alignItems: 'center', justifyContent: 'center' },
  codeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
