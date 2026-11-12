import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import type { Adjust, Filter } from '../types/order';

// Приблизительный предпросмотр: цветные полупрозрачные слои поверх фото.
// Итоговая обработка делается при печати, здесь она лишь показывает направление правок.
function overlays(filter: Filter, a: Adjust): string[] {
  const o: string[] = [];
  if (filter === 'Ч/Б') o.push('rgba(128,128,128,0.6)');
  if (filter === 'Сепия') o.push('rgba(112,66,20,0.4)');
  if (filter === 'Тёплый') o.push('rgba(255,160,80,0.22)');
  if (filter === 'Холодный') o.push('rgba(80,140,255,0.22)');
  const b = (a.exposure + a.light * 0.6 + a.shadows * 0.3) / 100;
  if (b > 0) o.push(`rgba(255,255,255,${Math.min(b * 0.4, 0.4)})`);
  if (b < 0) o.push(`rgba(0,0,0,${Math.min(-b * 0.4, 0.4)})`);
  if (a.contrast < 0) o.push(`rgba(128,128,128,${(-a.contrast / 100) * 0.3})`);
  if (a.temperature > 0) o.push(`rgba(255,150,60,${(a.temperature / 100) * 0.3})`);
  if (a.temperature < 0) o.push(`rgba(60,130,255,${(-a.temperature / 100) * 0.3})`);
  if (a.tint > 0) o.push(`rgba(255,60,200,${(a.tint / 100) * 0.25})`);
  if (a.tint < 0) o.push(`rgba(60,255,120,${(-a.tint / 100) * 0.25})`);
  return o;
}

interface Props { uri: string; filter?: Filter; adjust?: Adjust; style?: StyleProp<ViewStyle> }

export default function PhotoPreview({ uri, filter = 'Оригинал', adjust, style }: Props) {
  const layers = overlays(filter, adjust ?? { exposure: 0, contrast: 0, shadows: 0, light: 0, temperature: 0, tint: 0 });
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {layers.map((c, i) => <View key={i} pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c }]} />)}
    </View>
  );
}
