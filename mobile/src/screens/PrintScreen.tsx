import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import Screen from '../components/Screen';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Stepper from '../components/Stepper';
import OptionCard from '../components/OptionCard';
import PhotoPreview from '../components/PhotoPreview';
import { pickPhotos } from '../lib/pickPhotos';
import { useCart } from '../state/CartContext';
import { ADJUST_LABELS, Adjust, FILTERS, Filter, NO_ADJUST, Photo, PRINT_FORMATS, PRINT_PAPERS, money } from '../types/order';
import { colors } from '../theme';

interface Item { photo: Photo; qty: number; format: string; paper: string; filter: Filter; adjust: Adjust }
const make = (photo: Photo): Item => ({ photo, qty: 1, format: '10x15', paper: 'matte', filter: 'Оригинал', adjust: NO_ADJUST });

interface Props { initialPhotos: Photo[]; onBack: () => void; onGoCart: () => void; onCheckout: () => void }

export default function PrintScreen({ initialPhotos, onBack, onGoCart, onCheckout }: Props) {
  const { addItem } = useCart();
  const [items, setItems] = useState<Item[]>(() => initialPhotos.map(make));
  const [cur, setCur] = useState(0);
  const [tab, setTab] = useState<'filters' | 'adjust'>('filters');

  const it = items[cur];
  const patch = (p: Partial<Item>) => setItems((a) => a.map((x, i) => (i === cur ? { ...x, ...p } : x)));
  const patchAll = (p: Partial<Item>) => setItems((a) => a.map((x) => ({ ...x, ...p })));
  const add = async () => { const n = await pickPhotos(); if (n.length) setItems((a) => [...a, ...n.map(make)]); };
  const remove = () => { setItems((a) => a.filter((_, i) => i !== cur)); setCur(Math.max(0, cur - 1)); };

  if (!it) {
    return (
      <Screen><Header title="Фотопечать" onBack={onBack} />
        <Text style={styles.text}>Фото не выбраны.</Text>
        <Button label="Выбрать из галереи" onPress={add} />
      </Screen>
    );
  }

  const fmt = PRINT_FORMATS.find((f) => f.id === it.format)!;
  const lowRes = Math.min(it.photo.width, it.photo.height) < fmt.minPx;
  const count = items.reduce((s, x) => s + x.qty, 0);
  const total = items.reduce((s, x) => s + x.qty * PRINT_FORMATS.find((f) => f.id === x.format)!.price, 0);
  const toCart = () => addItem({ kind: 'print', title: 'Фотопечать', details: `${items.length} фото · ${count} отпечатков`, total, payload: items });

  return (
    <Screen>
      <Header title="Фотопечать" onBack={onBack} />
      <Text style={styles.text}>Выбрано {items.length} фото</Text>
      <Button label="+ Добавить фото" variant="outline" onPress={add} />

      <Card>
        <View>
          <PhotoPreview uri={it.photo.uri} filter={it.filter} adjust={it.adjust} style={styles.big} />
          <Text style={styles.badge}>Фото {cur + 1} из {items.length}</Text>
        </View>
        {lowRes && (
          <View style={styles.warn}>
            <Text style={[styles.text, { fontWeight: '800', color: colors.red }]}>Низкое разрешение</Text>
            <Text style={styles.text}>{it.photo.width}×{it.photo.height} px, для формата {fmt.name} нужно от {fmt.minPx} px по короткой стороне, иначе печать получится нечёткой. Замените фото или продолжите осознанно.</Text>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
          {items.map((x, i) => (
            <Pressable key={i} accessibilityLabel={`Фото ${i + 1}`} onPress={() => setCur(i)} style={[styles.thumbWrap, i === cur && { borderColor: colors.red }]}>
              <PhotoPreview uri={x.photo.uri} filter={x.filter} adjust={x.adjust} style={styles.thumb} />
              <Text style={styles.qtyBadge}>×{x.qty}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Button label="Удалить это фото" variant="outline" onPress={remove} />

        <Text style={[styles.h3, { marginTop: 14 }]}>Количество печати</Text>
        <View style={styles.row}>
          <Stepper value={it.qty} onChange={(n) => patch({ qty: n })} />
          <Button label="Применить ко всем" variant="solid" onPress={() => patchAll({ qty: it.qty })} />
        </View>
      </Card>

      <Card>
        <Text style={styles.h2}>Редактирование</Text>
        <View style={[styles.row, { justifyContent: 'flex-start', marginVertical: 10 }]}>
          <Chip label="Фильтры" selected={tab === 'filters'} onPress={() => setTab('filters')} />
          <Chip label="Настройки" selected={tab === 'adjust'} onPress={() => setTab('adjust')} />
        </View>

        {tab === 'filters' ? (
          <View style={styles.wrap}>
            {FILTERS.map((f) => <Chip key={f} label={f} selected={it.filter === f} onPress={() => patch({ filter: f })} />)}
          </View>
        ) : (
          ADJUST_LABELS.map(({ key, label }) => (
            <View key={key} style={{ marginBottom: 6 }}>
              <View style={styles.row}><Text style={styles.text}>{label}</Text><Text style={styles.text}>{it.adjust[key]}</Text></View>
              <Slider minimumValue={-100} maximumValue={100} step={1} value={it.adjust[key]}
                onValueChange={(v) => patch({ adjust: { ...it.adjust, [key]: Math.round(v) } })}
                minimumTrackTintColor={colors.red} maximumTrackTintColor={colors.pink} thumbTintColor={colors.red} />
            </View>
          ))
        )}
        <View style={styles.row}>
          <Button label="Сбросить" variant="outline" onPress={() => patch({ filter: 'Оригинал', adjust: NO_ADJUST })} />
          <Button label="Применить обработку ко всем" variant="solid" onPress={() => patchAll({ filter: it.filter, adjust: it.adjust })} />
        </View>
        <Text style={[styles.text, { fontSize: 12, opacity: 0.7, marginTop: 6 }]}>Предпросмотр приблизительный, точная обработка выполняется при печати.</Text>
      </Card>

      <Card>
        <View style={styles.row}><Text style={styles.h3}>Формат печати ({PRINT_FORMATS.length} варианта)</Text>
          <Button label="Применить ко всем" variant="solid" onPress={() => patchAll({ format: it.format })} /></View>
        <View style={[styles.wrap, { marginTop: 8 }]}>
          {PRINT_FORMATS.map((f) => <OptionCard key={f.id} title={f.name} note={f.note} price={money(f.price)} selected={it.format === f.id} onPress={() => patch({ format: f.id })} />)}
        </View>
      </Card>

      <Card>
        <View style={styles.row}><Text style={styles.h3}>Тип бумаги ({PRINT_PAPERS.length} варианта)</Text>
          <Button label="Применить ко всем" variant="solid" onPress={() => patchAll({ paper: it.paper })} /></View>
        <View style={[styles.wrap, { marginTop: 8 }]}>
          {PRINT_PAPERS.map((p) => <OptionCard key={p.id} title={p.name} note={p.note} selected={it.paper === p.id} onPress={() => patch({ paper: p.id })} />)}
        </View>
      </Card>

      <Card>
        <View style={styles.row}><Text style={styles.text}>Всего отпечатков в заказе:</Text><Text style={styles.bold}>{count} шт.</Text></View>
        <View style={styles.row}><Text style={styles.bold}>Общая стоимость:</Text><Text style={styles.total}>{money(total)}</Text></View>
        <View style={[styles.row, { marginTop: 8 }]}>
          <Button label="В корзину" variant="outline" onPress={() => { toCart(); onGoCart(); }} />
          <Button label="Оформить заказ" onPress={() => { toCart(); onCheckout(); }} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  bold: { fontSize: 16, fontWeight: '800', color: colors.ink },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  h3: { fontSize: 16, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  total: { fontSize: 26, fontWeight: '800', color: colors.red },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  big: { height: 240, borderRadius: 14 },
  badge: { position: 'absolute', top: 10, right: 10, backgroundColor: colors.ink, color: colors.cream, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, fontSize: 12, fontWeight: '600', overflow: 'hidden' },
  warn: { borderLeftWidth: 5, borderLeftColor: colors.red, paddingLeft: 10, marginTop: 10, backgroundColor: 'rgba(250,167,169,0.3)', paddingVertical: 6 },
  thumbWrap: { borderWidth: 2, borderColor: 'transparent', borderRadius: 12, padding: 2 },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  qtyBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: colors.red, color: colors.cream, borderRadius: 99, paddingHorizontal: 5, fontSize: 11, fontWeight: '800', overflow: 'hidden' },
});
