import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface Props { title: string; note?: string; price?: string; selected: boolean; onPress: () => void }

// Карточка выбора варианта (формат, бумага, тип обложки…)
export default function OptionCard({ title, note, price, selected, onPress }: Props) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}
      style={[styles.card, selected && styles.on]}>
      <View style={styles.top}>
        <Text style={styles.title}>{title}</Text>
        {!!price && <Text style={styles.price}>{price}</Text>}
      </View>
      {!!note && <Text style={styles.note}>{note}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '45%', minHeight: 60, borderRadius: 14, borderWidth: 1.5, borderColor: colors.coral, padding: 10, backgroundColor: 'rgba(251,240,237,0.78)' },
  on: { borderColor: colors.red, borderWidth: 2, backgroundColor: 'rgba(250,167,169,0.3)' },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  title: { fontWeight: '800', color: colors.ink, flexShrink: 1 },
  price: { fontWeight: '800', color: colors.red },
  note: { fontSize: 12, color: colors.ink, opacity: 0.8, marginTop: 2 },
});
