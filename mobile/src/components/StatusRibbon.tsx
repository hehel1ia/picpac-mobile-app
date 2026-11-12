import { StyleSheet, Text, View } from 'react-native';
import { STATUSES } from '../mock/sample';
import { colors } from '../theme';

// Статусная лента: принят → модерация → производство → готов → завершён
export default function StatusRibbon({ status }: { status: number }) {
  return (
    <View accessibilityLabel={`Статус заказа: ${STATUSES[status]}`}>
      {STATUSES.map((s, i) => (
        <View key={s} style={styles.row}>
          <View style={{ alignItems: 'center' }}>
            <View style={[styles.dot, i <= status && styles.dotOn]} />
            {i < STATUSES.length - 1 && <View style={[styles.line, i < status && { backgroundColor: colors.red }]} />}
          </View>
          <Text style={[styles.label, i <= status && { fontWeight: '800', opacity: 1 }]}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, minHeight: 36 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.red },
  dotOn: { backgroundColor: colors.red },
  line: { width: 2, flex: 1, backgroundColor: colors.pink },
  label: { color: colors.ink, opacity: 0.6, fontSize: 16 },
});
