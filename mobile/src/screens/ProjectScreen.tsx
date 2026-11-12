import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { SAMPLE_PRODUCT as P } from '../mock/sample';
import { colors } from '../theme';

// Демо-плитки. Позже вместо цветных блоков будут настоящие фото (expo-image-picker).
const initial = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, low: i === 3 }));

export default function ProjectScreen({ onBack, onCheck }: { onBack: () => void; onCheck: () => void }) {
  const [items, setItems] = useState(initial);
  const move = (i: number, d: number) => {
    const j = i + d; if (j < 0 || j >= items.length) return;
    const next = [...items]; [next[i], next[j]] = [next[j], next[i]]; setItems(next);
  };
  const lowCount = items.filter((x) => x.low).length;

  return (
    <Screen>
      <Header title="Проект" onBack={onBack} />
      <Text style={styles.text}>{P.name} · Фото: {items.length} из {P.minPhotos}+. Черновик сохраняется автоматически.</Text>
      <Button label="Добавить фото" variant="outline" onPress={() => setItems([...items, { id: items.length + 1, low: false }])} />

      {lowCount > 0 && (
        <Card style={{ borderColor: colors.red }}>
          <Text style={[styles.text, { fontWeight: '800', color: colors.red }]}>Низкое разрешение: {lowCount} фото</Text>
          <Text style={styles.text}>Фото №4 меньше {P.minPx} px по короткой стороне, на печати оно будет нечётким. Замените его или продолжите осознанно.</Text>
        </Card>
      )}

      <View style={styles.grid}>
        {items.map((x, i) => (
          <View key={x.id} style={[styles.tile, x.low && { borderColor: colors.red }]}>
            <View style={styles.thumb}><Text style={styles.num}>{i + 1}</Text>{x.low && <Text style={styles.warn}>⚠</Text>}</View>
            <View style={styles.tools}>
              <Pressable accessibilityLabel="Переместить левее" onPress={() => move(i, -1)} style={styles.tool}><Text>←</Text></Pressable>
              <Pressable accessibilityLabel="Переместить правее" onPress={() => move(i, 1)} style={styles.tool}><Text>→</Text></Pressable>
              <Pressable accessibilityLabel="Удалить фото" onPress={() => setItems(items.filter((y) => y.id !== x.id))} style={styles.tool}><Text>✕</Text></Pressable>
            </View>
          </View>
        ))}
      </View>

      <Button label="Проверить проект" onPress={onCheck} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '31%', borderWidth: 1.5, borderColor: colors.coral, borderRadius: 14, padding: 4 },
  thumb: { aspectRatio: 1, borderRadius: 10, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: 24, fontWeight: '800', color: colors.ink },
  warn: { position: 'absolute', top: 2, right: 6, color: colors.red, fontSize: 16 },
  tools: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tool: { minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
});
