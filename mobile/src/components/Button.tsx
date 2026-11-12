import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

type Variant = 'solid' | 'outline' | 'light';
interface Props { label: string; onPress: () => void; variant?: Variant; disabled?: boolean }

export default function Button({ label, onPress, variant = 'solid', disabled }: Props) {
  const v = variants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, v.box, pressed && { opacity: 0.8 }, disabled && { opacity: 0.5 }]}
    >
      <Text style={[styles.text, { color: v.color }]}>{label}</Text>
    </Pressable>
  );
}

const variants = {
  solid: { box: { backgroundColor: colors.red, borderColor: colors.red }, color: colors.cream },
  outline: { box: { backgroundColor: 'transparent', borderColor: colors.red }, color: colors.red },
  light: { box: { backgroundColor: colors.cream, borderColor: colors.cream }, color: colors.red },
};

const styles = StyleSheet.create({
  base: { minHeight: 48, paddingHorizontal: 18, borderRadius: radius.button, borderWidth: 2, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  text: { fontWeight: '800', fontSize: 16 },
});
