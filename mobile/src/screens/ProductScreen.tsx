import React, { useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Screen from '../components/Screen';
import Header from '../components/Header';
import Button from '../components/Button';
import Input from '../components/Input';
import Stepper from '../components/Stepper';
import PhotoPreview from '../components/PhotoPreview';
import { useCart } from '../state/CartContext';
import { pickPhotos } from '../lib/pickPhotos';
import {
  ALBUM_COVERS,
  ALBUM_FORMATS,
  ALBUM_LAMINATION,
  ALBUM_MIN_PX,
  ALBUM_PAPERS,
  MAX_SPREADS,
  MIN_SPREADS,
  Photo,
  SPREAD_PRICE,
  albumPrice,
  money,
} from '../types/order';
import { colors } from '../theme';

interface Props {
  photos: Photo[];
  onBack: () => void;
  onGoCart: () => void;
  onCheckout: () => void;
}

const priceOf = (list: { id: string; price: number }[], id: string) =>
  list.find((x) => x.id === id)?.price ?? 0;

const formatPrice = (n: number) => (n ? `+${money(n)}` : 'Включено');

function StyledCard({
  children,
  warn = false,
}: {
  children: React.ReactNode;
  warn?: boolean;
}) {
  return (
    <View style={styles.cardShadow}>
      <LinearGradient
        colors={['rgba(253, 224, 224, 0.85)', 'rgba(255, 252, 251, 0.97)']}
        start={{ x: 1, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={[styles.styledCard, warn && styles.styledCardWarn]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

function ParamOption({
  title,
  note,
  price,
  selected,
  onPress,
}: {
  title: string;
  note?: string;
  price?: number;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
    >
      <View>
        <Text style={[styles.optionTitle, selected && styles.optionTextSelected]}>
          {title}
        </Text>
        {!!note && <Text style={styles.optionNote}>{note}</Text>}
      </View>
      <Text style={[styles.optionPrice, selected && styles.optionTextSelected]}>
        {formatPrice(price ?? 0)}
      </Text>
    </Pressable>
  );
}

export default function AlbumScreen({
  photos,
  onBack,
  onGoCart,
  onCheckout,
}: Props) {
  const { addItem } = useCart();

  // Храним развороты как массив пар фотографий
  const [spreadList, setSpreadList] = useState<Photo[][]>(() =>
    Array.from({ length: MIN_SPREADS }, (_, k) =>
      photos.length
        ? [
            photos[(2 * k) % photos.length],
            photos[(2 * k + 1) % photos.length],
          ]
        : []
    )
  );

  const [cover, setCover] = useState(ALBUM_COVERS[0]?.id ?? 'hard');
  const [format, setFormat] = useState(ALBUM_FORMATS[0]?.id ?? '20x20');
  const [lam, setLam] = useState(ALBUM_LAMINATION[0]?.id ?? 'gloss');
  const [paper, setPaper] = useState(ALBUM_PAPERS[0]?.id ?? 'silk');
  const [qty, setQty] = useState(1);
  const [title, setTitle] = useState('НАШИ ВОСПОМИНАНИЯ');
  const [activeSpread, setActiveSpread] = useState(0);
  const [preview, setPreview] = useState(false);

  const spreadsCount = spreadList.length;

  const one = albumPrice(
    priceOf(ALBUM_COVERS, cover),
    priceOf(ALBUM_FORMATS, format),
    priceOf(ALBUM_LAMINATION, lam),
    priceOf(ALBUM_PAPERS, paper),
    spreadsCount
  );
  const total = one * qty;
  const fmtName = ALBUM_FORMATS.find((f) => f.id === format)?.name ?? format;

  const lowCount = useMemo(() => {
    const usedPhotos = [photos[0], ...spreadList.flat()].filter(Boolean);
    return usedPhotos.filter((p) => Math.min(p.width, p.height) < ALBUM_MIN_PX)
      .length;
  }, [photos, spreadList]);

  const handleAddSpread = () => {
    if (spreadsCount >= MAX_SPREADS) return;
    const k = spreadsCount;
    const nextPhotos = photos.length
      ? [photos[(2 * k) % photos.length], photos[(2 * k + 1) % photos.length]]
      : [];
    setSpreadList((prev) => [...prev, nextPhotos]);
  };

  const handleRemoveSpread = (index: number) => {
    if (spreadsCount <= MIN_SPREADS) return;
    setSpreadList((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (activeSpread >= next.length) {
        setActiveSpread(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  // Замена фото на развороте по тапу
  const handleReplacePhoto = async (spreadIdx: number, slotIdx: number) => {
    const picked = await pickPhotos();
    if (!picked.length) return;
    setSpreadList((prev) =>
      prev.map((pair, idx) => {
        if (idx !== spreadIdx) return pair;
        const updated = [...pair];
        updated[slotIdx] = picked[0];
        return updated;
      })
    );
  };

  // Свайп влево / вправо в модальном окне просмотра разворота
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 20 && Math.abs(gesture.dy) < 20,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -40) {
          setActiveSpread((prev) => Math.min(spreadsCount - 1, prev + 1));
        } else if (gesture.dx > 40) {
          setActiveSpread((prev) => Math.max(0, prev - 1));
        }
      },
    })
  ).current;

  const toCart = () =>
    addItem({
      kind: 'album',
      title: 'Фотоальбом',
      details: `${fmtName} · ${spreadsCount} разв. · ${qty} шт.`,
      total,
      payload: {
        cover,
        format,
        lam,
        paper,
        spreads: spreadsCount,
        qty,
        title,
        photos: spreadList.flat(),
      },
    });

  return (
    <Screen>
      <Header title="Создание альбома" onBack={onBack} />

      {/* Верхняя навигация по разворотам без заголовка */}
      <View style={styles.topNav}>
        <Text style={[styles.text, { color: colors.red, fontWeight: '800' }]}>
          {spreadsCount} разворотов ({spreadsCount * 2} стр.)
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.spreadStrip}
        >
          {spreadList.map((pair, k) => (
            <View key={k} style={styles.spWrapper}>
              <Pressable
                accessibilityLabel={`Разворот ${k + 1}`}
                onPress={() => {
                  setActiveSpread(k);
                  setPreview(true);
                }}
                style={[styles.sp, k === activeSpread && styles.spActive]}
              >
                <View style={{ flexDirection: 'row' }}>
                  {pair.map((p, i) => (
                    <PhotoPreview
                      key={`${p.uri}-${i}`}
                      uri={p.uri}
                      style={{ width: 34, height: 44 }}
                    />
                  ))}
                </View>
                <Text style={styles.spText}>Разв. {k + 1}</Text>
              </Pressable>

              {spreadsCount > MIN_SPREADS && (
                <Pressable
                  accessibilityLabel={`Удалить разворот ${k + 1}`}
                  onPress={() => handleRemoveSpread(k)}
                  style={styles.spDelete}
                >
                  <Text style={styles.spDeleteText}>✕</Text>
                </Pressable>
              )}
            </View>
          ))}

          {spreadsCount < MAX_SPREADS && (
            <Pressable
              accessibilityLabel="Добавить разворот"
              onPress={handleAddSpread}
              style={styles.spAdd}
            >
              <Text style={styles.spAddPlus}>+</Text>
              <Text style={styles.spAddPrice}>+{SPREAD_PRICE} BYN</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {lowCount > 0 && (
        <StyledCard warn>
          <Text style={[styles.text, { fontWeight: '800', color: colors.red }]}>
            Низкое разрешение: {lowCount} фото
          </Text>
          <Text style={[styles.text, { marginTop: 4 }]}>
            Эти снимки меньше {ALBUM_MIN_PX} px по короткой стороне, в альбоме
            они будут нечёткими. Замените их по нажатию в превью.
          </Text>
        </StyledCard>
      )}

      {/* Превью обложки и ввод названия без кнопки ОК */}
      <StyledCard>
        <Text style={styles.h3}>Обложка</Text>
        <View style={styles.coverWrap}>
          {photos[0] && (
            <PhotoPreview uri={photos[0].uri} style={styles.cover} />
          )}
          <View style={styles.coverText}>
            <Text style={styles.coverTitle} numberOfLines={2}>
              {title}
            </Text>
          </View>
        </View>

        <Input
          label="Надпись на обложке:"
          value={title}
          onChangeText={setTitle}
        />
      </StyledCard>

      {/* Параметры альбома с ценой внизу кнопок */}
      <StyledCard>
        <Text style={styles.h2}>Параметры альбома</Text>

        <Text style={styles.label}>Тип обложки</Text>
        <View style={styles.wrap}>
          {ALBUM_COVERS.map((c) => (
            <ParamOption
              key={c.id}
              title={c.name}
              note={c.note}
              price={c.price}
              selected={cover === c.id}
              onPress={() => setCover(c.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>Формат альбома</Text>
        <View style={styles.wrap}>
          {ALBUM_FORMATS.map((f) => (
            <ParamOption
              key={f.id}
              title={f.name}
              note={f.note}
              price={f.price}
              selected={format === f.id}
              onPress={() => setFormat(f.id)}
            />
          ))}
        </View>

                <Text style={styles.label}>Ламинация обложки</Text>
        <View style={styles.wrap}>
          {ALBUM_LAMINATION.map((l) => (
            <ParamOption
              key={l.id}
              title={l.name}
              note={l.note}
              price={l.price}
              selected={lam === l.id}
              onPress={() => setLam(l.id)}
            />
          ))}
        </View>

        <Text style={styles.label}>Тип бумаги разворотов</Text>
        <View style={styles.wrap}>
          {ALBUM_PAPERS.map((p) => (
            <ParamOption
              key={p.id}
              title={p.name}
              note={p.note}
              price={p.price}
              selected={paper === p.id}
              onPress={() => setPaper(p.id)}
            />
          ))}
        </View>

        <View style={[styles.row, { marginTop: 14 }]}>
          <Text style={styles.bold}>Количество альбомов:</Text>
          <Stepper value={qty} onChange={setQty} />
        </View>
      </StyledCard>

      {/* Итоговая стоимость */}
      <StyledCard>
        <Text style={styles.text}>
          Выбранные параметры: {fmtName} · {spreadsCount} разв.
        </Text>
        <View style={styles.row}>
          <Text style={styles.bold}>Итоговая стоимость:</Text>
          <Text style={styles.total}>{money(total)}</Text>
        </View>
        <View style={[styles.row, { marginTop: 10 }]}>
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

      {/* Модальное окно просмотра с крестиком удаления, тапом по фото и свайпом */}
      <Modal
        visible={preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modal} {...panResponder.panHandlers}>
            <View style={styles.row}>
              <Text style={styles.h2}>
                Разворот {activeSpread + 1} из {spreadsCount}
              </Text>
              {spreadsCount > MIN_SPREADS && (
                <Pressable
                  accessibilityLabel="Удалить этот разворот"
                  onPress={() => handleRemoveSpread(activeSpread)}
                  style={styles.modalDeleteBtn}
                >
                  <Text style={styles.modalDeleteText}>✕ Удалить</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.spreadBig}>
              {(spreadList[activeSpread] ?? []).map((p, i) => (
                <Pressable
                  key={`${p.uri}-${i}`}
                  onPress={() => handleReplacePhoto(activeSpread, i)}
                  style={{ flex: 1 }}
                >
                  <PhotoPreview
                    uri={p.uri}
                    style={{ width: '100%', height: 200 }}
                  />
                </Pressable>
              ))}
              <View style={styles.fold} pointerEvents="none" />
            </View>

            <Text style={[styles.text, { fontSize: 12, opacity: 0.7 }]}>
              Свайпните влево или вправо для смены разворота. Нажмите на фото,
              чтобы заменить его.
            </Text>

            <View style={{ marginTop: 12 }}>
              <Button label="Закрыть" onPress={() => setPreview(false)} />
            </View>
          </View>
        </View>
      </Modal>
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
  styledCardWarn: {
    borderColor: colors.red,
  },
  topNav: {
    width: '100%',
  },
  spreadStrip: {
    gap: 10,
    paddingVertical: 10,
    paddingRight: 8,
    alignItems: 'center',
  },
  spWrapper: {
    position: 'relative',
  },
  sp: {
    borderWidth: 1.5,
    borderColor: 'rgba(229, 84, 84, 0.25)',
    borderRadius: 12,
    padding: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  spActive: {
    borderColor: colors.red,
  },
  spText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 4,
  },
  spDelete: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  spDeleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  spAdd: {
    width: 78,
    height: 76,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.red,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  spAddPlus: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.red,
    lineHeight: 26,
  },
  spAddPrice: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.ink,
    opacity: 0.75,
    marginTop: 2,
  },
  coverWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(253, 224, 224, 0.7)',
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  coverText: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  coverTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  h2: { fontSize: 18, fontWeight: '800', color: colors.ink },
  h3: { fontSize: 16, fontWeight: '800', color: colors.ink },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 14,
    marginBottom: 8,
  },
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  bold: { fontSize: 16, fontWeight: '800', color: colors.ink },
  total: { fontSize: 20, fontWeight: '800', color: colors.red },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    width: '48.5%',
    minHeight: 86,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(229, 84, 84, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    borderColor: colors.red,
    backgroundColor: '#FFFFFF',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  optionNote: {
    fontSize: 12,
    color: colors.ink,
    opacity: 0.65,
    marginTop: 2,
  },
  optionPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 10,
  },
  optionTextSelected: {
    color: colors.red,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modal: {
    backgroundColor: '#FFFDFC',
    borderRadius: 18,
    padding: 18,
  },
  modalDeleteBtn: {
    backgroundColor: 'rgba(229, 84, 84, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  modalDeleteText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
  },
  spreadBig: {
    flexDirection: 'row',
    marginVertical: 14,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  fold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },
});
