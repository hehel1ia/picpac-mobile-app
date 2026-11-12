import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function Header({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <View>
      {onBack && (
        <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>← Назад</Text>
        </Pressable>
      )}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  backText: { color: colors.red, fontWeight: '800', fontSize: 16 },
  title: { fontSize: 28, fontWeight: '800', color: colors.ink },
});
