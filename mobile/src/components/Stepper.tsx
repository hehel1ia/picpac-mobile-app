import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityLabel="Меньше" onPress={() => onChange(Math.max(min, value - 1))} style={styles.btn}><Text style={styles.sign}>−</Text></Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable accessibilityLabel="Больше" onPress={() => onChange(Math.min(max, value + 1))} style={styles.btn}><Text style={styles.sign}>+</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  btn: { width: 44, height: 44, borderRadius: 14, borderWidth: 2, borderColor: colors.red, alignItems: 'center', justifyContent: 'center' },
  sign: { fontSize: 22, fontWeight: '800', color: colors.red },
  value: { fontSize: 18, fontWeight: '800', color: colors.ink, minWidth: 28, textAlign: 'center' },
});
