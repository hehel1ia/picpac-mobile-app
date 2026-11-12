import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

export default function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
      <Text style={{ color: selected ? colors.cream : colors.ink, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.coral, justifyContent: 'center' },
});
