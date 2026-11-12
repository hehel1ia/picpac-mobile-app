import React, { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import Screen from '../components/Screen';
import Header from '../components/Header';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Stepper from '../components/Stepper';
import PhotoPreview from '../components/PhotoPreview';
import { pickPhotos } from '../lib/pickPhotos';
import { useCart } from '../state/CartContext';
import {
  ADJUST_LABELS,
  Adjust,
  FILTERS,
  Filter,
  NO_ADJUST,
  Photo,
  PRINT_FORMATS,
  PRINT_PAPERS,
  money,
} from '../types/order';
import { colors } from '../theme';

interface Item {
  photo: Photo;
  qty: number;
  format: string;
  paper: string;
  filter: Filter;
  adjust: Adjust;
}

const make = (photo: Photo): Item => ({
  photo,
  qty: 1,
  format: '10x15',
  paper: 'matte',
  filter: 'Оригинал',
  adjust: NO_ADJUST,
});

interface Props {
  initialPhotos: Photo[];
  onBack: () => void;
  onGoCart: () => void;
  onCheckout: () => void;
}

function StyledCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.cardShadow}>
      <LinearGradient
        colors={['rgba(253, 224, 224, 0.85)', 'rgba(255, 252, 251, 0.97)']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.styledCard}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

// Компактная кнопка «Применить ко всем»
function ApplyAllButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallApplyBtn,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={styles.smallApplyText}>Применить ко всем</Text>
    </Pressable>
  );
}

export default function PrintScreen({
  initialPhotos,
  onBack,
  onGoCart,
  onCheckout,
}: Props) {
  const { addItem } = useCart();
  const [items, setItems] = useState<Item[]>(() => initialPhotos.map(make));
  const [cur, setCur] = useState(0);
  const [tab, setTab] = useState<'filters' | 'adjust'>('filters');
  const [slideWidth, setSlideWidth] = useState(0);
  const pagerRef = useRef<React.ElementRef<typeof ScrollView>>(null);


  const it = items[cur];

  const goToSlide = (index: number) => {
    const safeIndex = Math.max(0, Math.min(index, items.length - 1));
    setCur(safeIndex);
    if (slideWidth > 0) {
      pagerRef.current?.scrollTo({ x: safeIndex * slideWidth, animated: true });
    }
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!slideWidth) return;
    const nextIndex = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    if (nextIndex >= 0 && nextIndex < items.length && nextIndex !== cur) {
      setCur(nextIndex);
    }
  };

  const patch = (p: Partial<Item>) =>
    setItems((a) => a.map((x, i) => (i === cur ? { ...x, ...p } : x)));
  const patchAll = (p: Partial<Item>) =>
    setItems((a) => a.map((x) => ({ ...x, ...p })));

  const add = async () => {
    const n = await pickPhotos();
    if (n.length) {
      setItems((a) => [...a, ...n.map(make)]);
    }
  };

  const remove = () => {
    const nextLength = items.length - 1;
    const nextCur = Math.max(0, Math.min(cur, nextLength - 1));
    setItems((a) => a.filter((_, i) => i !== cur));
    setCur(nextCur);
    if (slideWidth > 0) {
      pagerRef.current?.scrollTo({ x: nextCur * slideWidth, animated: false });
    }
  };

  if (!it) {
    return (
      <Screen>
        <Header title="Фотопечать" onBack={onBack} />
        <StyledCard>
          <Text style={[styles.text, { marginBottom: 12 }]}>
            Фото не выбраны.
          </Text>
          <Button label="Выбрать из галереи" onPress={add} />
        </StyledCard>
      </Screen>
    );
  }

  const fmt = PRINT_FORMATS.find((f) => f.id === it.format)!;
  const lowRes = Math.min(it.photo.width, it.photo.height) < fmt.minPx;
  const count = items.reduce((s, x) => s + x.qty, 0);
  const total = items.reduce(
    (s, x) => s + x.qty * PRINT_FORMATS.find((f) => f.id === x.format)!.price,
    0,
  );
  const toCart = () =>
    addItem({
      kind: 'print',
      title: 'Фотопечать',
      details: `${items.length} фото · ${count} отпечатков`,
      total,
      payload: items,
    });

  return (
    <Screen>
      <Header title="Фотопечать" onBack={onBack} />
      <Text style={styles.text}>Выбрано {items.length} фото</Text>
      <Button label="+ Добавить фото" variant="outline" onPress={add} />

      {/* Карточка 1: Миниатюры -> Количество печати -> Большое фото */}
      <StyledCard>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
        >
          {items.map((x, i) => (
            <Pressable
              key={i}
              accessibilityLabel={`Фото ${i + 1}`}
              onPress={() => goToSlide(i)}
              style={[styles.thumbWrap, i === cur && { borderColor: colors.red }]}
            >
              <PhotoPreview
                uri={x.photo.uri}
                filter={x.filter}
                adjust={x.adjust}
                style={styles.thumb}
              />
              <Text style={styles.qtyBadge}>×{x.qty}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.cardDivider} />

        <Text style={styles.h3}>Количество печати</Text>
        <View style={[styles.qtyRow, { marginBottom: 12 }]}>
          <View style={styles.compactStepper}>
            <Stepper value={it.qty} onChange={(n) => patch({ qty: n })} />
          </View>
          <ApplyAllButton onPress={() => patchAll({ qty: it.qty })} />
        </View>

        <View
          style={styles.sliderBox}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w && w !== slideWidth) {
              setSlideWidth(w);
              pagerRef.current?.scrollTo({ x: cur * w, animated: false });
            }
          }}
        >
          <ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleMomentumEnd}
            scrollEventThrottle={16}
          >
            {items.map((x, i) => (
              <View key={i} style={{ width: slideWidth || '100%' }}>
                <PhotoPreview
                  uri={x.photo.uri}
                  filter={x.filter}
                  adjust={x.adjust}
                  style={styles.big}
                />
              </View>
            ))}
          </ScrollView>

          <Text style={styles.badge}>
            Фото {cur + 1} из {items.length}
          </Text>

          <Pressable
            accessibilityLabel="Удалить это фото"
            onPress={remove}
            hitSlop={8}
            style={styles.x}
          >
            <Text style={styles.xText}>✕</Text>
          </Pressable>
        </View>

        {lowRes && (
          <View style={styles.warn}>
            <Text style={[styles.text, { fontWeight: '800', color: colors.red }]}>
              Низкое разрешение
            </Text>
            <Text style={styles.text}>
              {it.photo.width}×{it.photo.height} px, для формата {fmt.name} нужно
              от {fmt.minPx} px по короткой стороне, иначе печать получится
              нечёткой. Замените фото или продолжите осознанно.
            </Text>
          </View>
        )}
      </StyledCard>

      {/* Карточка 2: Редактирование */}
      <StyledCard>
        <Text style={styles.h2}>Редактирование</Text>
        <View style={styles.cardDivider} />

        {/* Главные переключатели вкладок (отличаются цветом от фильтров) */}
        <View style={styles.tabsRow}>
          <Pressable
            onPress={() => setTab('filters')}
            style={[styles.tabBtn, tab === 'filters' && styles.tabBtnActive]}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === 'filters' && styles.tabBtnTextActive,
              ]}
            >
              Фильтры
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('adjust')}
            style={[styles.tabBtn, tab === 'adjust' && styles.tabBtnActive]}
          >
            <Text
              style={[
                styles.tabBtnText,
                tab === 'adjust' && styles.tabBtnTextActive,
              ]}
            >
              Настройки
            </Text>
          </Pressable>
        </View>

        {/* Отступ и зона самих фильтров/настроек */}
        <View style={styles.tabContentArea}>
          {tab === 'filters' ? (
            <View style={styles.wrap}>
              {FILTERS.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  selected={it.filter === f}
                  onPress={() => patch({ filter: f })}
                />
              ))}
            </View>
          ) : (
                ADJUST_LABELS.map(({ key, label }) => (
              <View key={key} style={{ marginBottom: 6 }}>
                <View style={styles.row}>
                  <Text style={styles.text}>{label}</Text>
                  <Text style={styles.text}>{it.adjust[key]}</Text>
                </View>
                <Slider
                  minimumValue={-100}
                  maximumValue={100}
                  step={1}
                  value={it.adjust[key]}
                  onValueChange={(v) =>
                    patch({ adjust: { ...it.adjust, [key]: Math.round(v) } })
                  }
                  minimumTrackTintColor={colors.red}
                  maximumTrackTintColor={colors.pink}
                  thumbTintColor={colors.red}
                />
              </View>
            ))
          )}
        </View>

        <View style={[styles.row, { marginTop: 14 }]}>
          <Button
            label="Сбросить"
            variant="outline"
            onPress={() => patch({ filter: 'Оригинал', adjust: NO_ADJUST })}
          />
          <ApplyAllButton
            onPress={() => patchAll({ filter: it.filter, adjust: it.adjust })}
          />
        </View>

        <Text
          style={[styles.text, { fontSize: 12, opacity: 0.7, marginTop: 8 }]}
        >
          Предпросмотр приблизительный, точная обработка выполняется при печати.
        </Text>
      </StyledCard>


      {/* Карточка 3: Формат печати (без скобок, цена снизу) */}
      <StyledCard>
        <View style={styles.row}>
          <Text style={styles.h3}>Формат печати</Text>
          <ApplyAllButton onPress={() => patchAll({ format: it.format })} />
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.optionsGrid}>
          {PRINT_FORMATS.map((f) => {
            const active = it.format === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => patch({ format: f.id })}
                style={[styles.choiceTile, active && styles.choiceTileActive]}
              >
                <View>
                  <Text style={styles.choiceTitle}>{f.name}</Text>
                  {!!f.note && <Text style={styles.choiceNote}>{f.note}</Text>}
                </View>
                <Text
                  style={[
                    styles.choicePriceBottom,
                    active && styles.choicePriceActive,
                  ]}
                >
                  {money(f.price)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </StyledCard>

         {/* Карточка 4: Тип бумаги (2 в ряд, перенос ниже при добавлении из БД) */}
      <StyledCard>
        <View style={styles.row}>
          <Text style={styles.h3}>Тип бумаги</Text>
          <ApplyAllButton onPress={() => patchAll({ paper: it.paper })} />
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.optionsGrid}>
          {PRINT_PAPERS.map((p) => {
            const active = it.paper === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => patch({ paper: p.id })}
                style={[
                  styles.choiceTile,
                  styles.paperTile,
                  active && styles.choiceTileActive,
                ]}
              >
                <View>
                  <Text style={styles.choiceTitle}>{p.name}</Text>
                  {!!p.note && <Text style={styles.choiceNote}>{p.note}</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </StyledCard>


      {/* Карточка 5: Итог */}
      <StyledCard>
        <View style={styles.row}>
          <Text style={styles.text}>Всего отпечатков в заказе:</Text>
          <Text style={styles.bold}>{count} шт.</Text>
        </View>
        <View style={styles.cardDivider} />
        <View style={styles.row}>
          <Text style={styles.bold}>Общая стоимость:</Text>
          <Text style={styles.total}>{money(total)}</Text>
        </View>
        <View style={[styles.row, { marginTop: 12 }]}>
          <Button
            label="В корзину"
            variant="outline"
            onPress={() => {
              toCart();
              onGoCart();
            }}
          />
          <Button
            label="Оформить заказ"
            onPress={() => {
              toCart();
              onCheckout();
            }}
          />
        </View>
      </StyledCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardShadow: {
    width: '100%',
    borderRadius: 15,
    shadowColor: '#C84B4B',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  styledCard: {
    width: '100%',
    borderRadius: 15,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.92)',
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(229, 84, 84, 0.14)',
    marginVertical: 12,
  },
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  bold: { fontSize: 16, fontWeight: '800', color: colors.ink },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  h3: { fontSize: 16, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  total: { fontSize: 26, fontWeight: '800', color: colors.red },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  compactStepper: {
    transform: [{ scale: 0.88 }],
    transformOrigin: 'left center',
  },
  smallApplyBtn: {
    backgroundColor: colors.red,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallApplyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: 'rgba(30, 32, 37, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.ink,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  tabContentArea: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(229, 84, 84, 0.14)',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  choiceTile: {
    width: '33%',
    minHeight: 95,
    borderRadius: 15,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1.5,
    borderColor: 'rgba(229, 84, 84, 0.18)',
    justifyContent: 'space-between',
  },
    paperTile: {
    width: '48.5%',
    minHeight: 74,
  },
  choiceTileActive: {
    borderColor: colors.red,
    backgroundColor: '#FFFFFF',
  },
  choiceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  choiceNote: {
    fontSize: 11,
    color: colors.ink,
    opacity: 0.65,
    marginTop: 2,
  },
  choicePriceBottom: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.red,
    marginTop: 8,
  },
  choicePriceActive: {
    color: colors.red,
  },
  sliderBox: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
  },
  big: { width: '100%', aspectRatio: 4 / 3, borderRadius: 15 },
  badge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: colors.ink,
    color: colors.cream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  x: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xText: { color: colors.cream, fontSize: 16, fontWeight: '800' },
  warn: {
    marginTop: 10,
    padding: 10,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.red,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  thumbWrap: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 15,
    overflow: 'hidden',
  },
  thumb: { width: 64, height: 64 },
  qtyBadge: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    backgroundColor: colors.ink,
    color: colors.cream,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 5,
    borderRadius: 15,
    overflow: 'hidden',
  },
});
