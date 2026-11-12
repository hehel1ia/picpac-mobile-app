import { ReactNode } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

interface Props { children: ReactNode; onPress?: () => void; solid?: boolean; style?: ViewStyle }

export default function Card({ children, onPress, solid, style }: Props) {
  const box = [styles.card, solid && styles.solid, style];
  if (!onPress) return <View style={box}>{children}</View>;
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [box, pressed && { opacity: 0.85 }]}>{children}</Pressable>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5, borderColor: colors.coral, borderRadius: radius.card, padding: 16, backgroundColor: 'rgba(251,240,237,0.78)' },
  solid: { backgroundColor: colors.red, borderColor: colors.red },
});
