import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Screen from '../components/Screen';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
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
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={[styles.optionTitle, selected && styles.optionTextSelected]}>
          {title}
        </Text>
        {!!note && <Text style={styles.optionNote}>{note}</Text>}
      </View>
      <Text style={[styles.optionPrice, selected && styles.optionTextSelected]}>
        {price ? `+${money(price)}` : '0 BYN'}
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

  const [spreadList, setSpreadList] = useState<Photo[][]>(() =>
    Array.from({ length: Math.max(1, MIN_SPREADS) }, (_, k) =>
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
  const [spread, setSpread] = useState(0);

  const spreads = spreadList.length;

  // Актуальные значения для PanResponder без устаревшего замыкания
  const stateRef = useRef({ spread, spreads });
  useEffect(() => {
    stateRef.current = { spread, spreads };
  }, [spread, spreads]);

  // Анимация перелистывания страницы
  const flipAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const animateTurn = (direction: 'next' | 'prev') => {
    const { spread: cur, spreads: totalSpreads } = stateRef.current;
    if (isAnimating.current) return;
    if (direction === 'next' && cur >= totalSpreads - 1) return;
    if (direction === 'prev' && cur <= 0) return;

    isAnimating.current = true;
    const outTo = direction === 'next' ? -1 : 1;
    const inFrom = direction === 'next' ? 1 : -1;

    Animated.timing(flipAnim, {
      toValue: outTo,
      duration: 170,
      useNativeDriver: true,
    }).start(() => {
      setSpread((s) => (direction === 'next' ? s + 1 : s - 1));
      flipAnim.setValue(inFrom);

      Animated.timing(flipAnim, {
        toValue: 0,
        duration: 190,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 18 && Math.abs(g.dy) < 25,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -35) {
          animateTurn('next');
        } else if (g.dx > 35) {
          animateTurn('prev');
        }
      },
    })
  ).current;

  const rotateY = flipAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-35deg', '0deg', '35deg'],
  });

  const translateX = flipAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-28, 0, 28],
  });

  const pageOpacity = flipAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [0.35, 1, 0.35],
  });

  const one = albumPrice(
    priceOf(ALBUM_COVERS, cover),
    priceOf(ALBUM_FORMATS, format),
    priceOf(ALBUM_LAMINATION, lam),
    priceOf(ALBUM_PAPERS, paper),
    spreads
  );
  const total = one * qty;
  const fmtName = ALBUM_FORMATS.find((f) => f.id === format)?.name ?? format;

  const lowCount = useMemo(() => {
    const allUsed = spreadList.flat().filter(Boolean);
    return allUsed.filter((p) => Math.min(p.width, p.height) < ALBUM_MIN_PX)
      .length;
  }, [spreadList]);

  const addSpread = () => {
    if (spreads >= MAX_SPREADS) return;
    const k = spreads;
    const nextPair = photos.length
      ? [photos[(2 * k) % photos.length], photos[(2 * k + 1) % photos.length]]
      : [];
    setSpreadList((prev) => [...prev, nextPair]);
    setSpread(k);
  };

  const removeSpread = (index: number) => {
    if (spreads <= 1) return;
    setSpreadList((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (spread >= next.length) {
        setSpread(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const replaceSpreadPhoto = async (spreadIdx: number, slotIdx: number) => {
    const picked = await pickPhotos();
    if (!picked.length) return;
    setSpreadList((prev) =>
      prev.map((pair, idx) => {
        if (idx !== spreadIdx) return pair;
        const copy = [...pair];
        copy[slotIdx] = picked[0];
        return copy;
      })
    );
  };

  const toCart = () =>
    addItem({
      kind: 'album',
      title: 'Фотоальбом',
      details: `${fmtName} · ${spreads} разв. · ${qty} шт.`,
      total,
      payload: {
        cover,
        format,
        lam,
        paper,
        spreads,
        qty,
        title,
        photos: spreadList.flat(),
      },
    });

  const shareAlbum = async () => {
    const shareUrl = `https://picpac.app{encodeURIComponent(
      title || 'Фотоальбом'
    )}&spreads=${spreads}`;

    try {
      await Share.share({
        message: `Присоединяйся к редактированию фотоальбома «${title}» (${fmtName}, ${spreads} разв.): ${shareUrl}`,
        url: shareUrl,
      });
    } catch {
      // Пользователь отменил отправку
    }
  };

  const currentPair = spreadList[spread] ?? [];

  return (
    <Screen>
      <Header title="Создание альбома" onBack={onBack} />
      <Text style={styles.text}>Фотоальбом · фото: {photos.length}</Text>

      {lowCount > 0 && (
        <View style={styles.warn}>
          <Text style={[styles.text, { fontWeight: '800', color: colors.red }]}>
            Низкое разрешение: {lowCount} фото
          </Text>
          <Text style={styles.text}>
            Эти снимки меньше {ALBUM_MIN_PX} px по короткой стороне, в альбоме
            они будут нечёткими. Замените их по нажатию.
          </Text>
        </View>
      )}

      <Card>
        <View style={styles.spreadHeaderRow}>
          <Text style={[styles.text, { color: colors.red, fontWeight: '800' }]}>
            {spreads} разворотов ({spreads * 2} стр.)
          </Text>
          <Text style={styles.hintText}>
            +{money(SPREAD_PRICE)} / разв. (свыше {MIN_SPREADS})
          </Text>
        </View>

        {/* Лента миниатюр для быстрого перехода */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingVertical: 10, paddingRight: 8 }}
        >
          {spreadList.map((pair, k) => (
            <View key={k} style={styles.spWrapper}>
              <Pressable
                accessibilityLabel={`Разворот ${k + 1}`}
                onPress={() => setSpread(k)}
                style={[styles.sp, k === spread && { borderColor: colors.red }]}
              >
                <View style={styles.spThumbs}>
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

              {spreads > 1 && (
                <Pressable
                  accessibilityLabel={`Удалить разворот ${k + 1}`}
                  onPress={() => removeSpread(k)}
                  hitSlop={6}
                  style={styles.removeBadge}
                >
                  <Text style={styles.removeBadgeText}>×</Text>
                </Pressable>
              )}
            </View>
          ))}

          {spreads < MAX_SPREADS && (
            <Pressable
              accessibilityLabel="Добавить разворот"
              onPress={addSpread}
              style={styles.spAdd}
            >
              <Text style={styles.spAddPlus}>+</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Большое интерактивное превью активного разворота */}
        <View {...panResponder.panHandlers} style={styles.bigSpreadOuter}>
          <Animated.View
            style={[
              styles.bigSpreadCard,
              {
                opacity: pageOpacity,
                transform: [{ perspective: 900 }, { translateX }, { rotateY }],
              },
            ]}
          >
                       {/* Крестик в правом верхнем углу большого разворота */}
            {spreads > 1 && (
              <Pressable
                accessibilityLabel={`Удалить разворот ${spread + 1}`}
                onPress={() => removeSpread(spread)}
                hitSlop={8}
                style={styles.bigRemoveBadge}
              >
                <Text style={styles.bigRemoveBadgeText}>×</Text>
              </Pressable>
            )}

            <View style={styles.bigSpreadPages}>
              {[0, 1].map((slotIdx) => {
                const photo = currentPair[slotIdx];
                const isLow =
                  photo && Math.min(photo.width, photo.height) < ALBUM_MIN_PX;

                return (
                  <Pressable
                    key={slotIdx}
                    accessibilityLabel={`Заменить фото ${slotIdx + 1} на развороте ${spread + 1}`}
                    onPress={() => replaceSpreadPhoto(spread, slotIdx)}
                    style={[
                      styles.bigPageSlot,
                      slotIdx === 0 ? styles.leftPage : styles.rightPage,
                      isLow && styles.lowResBorder,
                    ]}
                  >
                    {photo ? (
                      <>
                        <PhotoPreview
                          uri={photo.uri}
                          style={styles.bigPagePhoto}
                        />
                        {isLow && (
                          <View style={styles.lowResBadge}>
                            <Text style={styles.lowResBadgeText}>!</Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <View style={styles.emptySlot}>
                        <Text style={styles.emptySlotText}>+ Фото</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Навигация и подсказка под разворотом */}
            <View style={styles.spreadFooter}>
              <Pressable
                onPress={() => animateTurn('prev')}
                disabled={spread === 0}
                style={[styles.navBtn, spread === 0 && styles.navBtnDisabled]}
              >
                <Text style={styles.navBtnText}>‹ Назад</Text>
              </Pressable>

              <Text style={styles.spreadHint}>
                Разворот {spread + 1} из {spreads} · нажмите на фото для замены
              </Text>

              <Pressable
                onPress={() => animateTurn('next')}
                disabled={spread >= spreads - 1}
                style={[
                  styles.navBtn,
                  spread >= spreads - 1 && styles.navBtnDisabled,
                ]}
              >
                <Text style={styles.navBtnText}>Вперёд ›</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Card>

      {/* Название на обложке */}
      <Card>
        <Input
          label="Надпись на обложке"
          value={title}
          onChangeText={setTitle}
          placeholder="Введите заголовок альбома"
        />
      </Card>

      {/* Выбор формата */}
      <Card>
        <Text style={styles.sectionTitle}>Формат альбома</Text>
        <View style={{ gap: 8 }}>
          {ALBUM_FORMATS.map((item) => (
            <ParamOption
              key={item.id}
              title={item.name}
              note={item.note}
              price={item.price}
              selected={format === item.id}
              onPress={() => setFormat(item.id)}
            />
          ))}
        </View>
      </Card>

      {/* Выбор обложки */}
      <Card>
        <Text style={styles.sectionTitle}>Тип обложки</Text>
        <View style={{ gap: 8 }}>
          {ALBUM_COVERS.map((item) => (
            <ParamOption
              key={item.id}
              title={item.name}
              note={item.note}
              price={item.price}
              selected={cover === item.id}
              onPress={() => setCover(item.id)}
            />
          ))}
        </View>
      </Card>

      {/* Ламинация */}
      <Card>
        <Text style={styles.sectionTitle}>Ламинация страниц</Text>
        <View style={{ gap: 8 }}>
          {ALBUM_LAMINATION.map((item) => (
            <ParamOption
              key={item.id}
              title={item.name}
              note={item.note}
              price={item.price}
              selected={lam === item.id}
              onPress={() => setLam(item.id)}
            />
          ))}
        </View>
      </Card>

      {/* Бумага */}
      <Card>
        <Text style={styles.sectionTitle}>Бумага</Text>
        <View style={{ gap: 8 }}>
          {ALBUM_PAPERS.map((item) => (
            <ParamOption
              key={item.id}
              title={item.name}
              note={item.note}
              price={item.price}
              selected={paper === item.id}
              onPress={() => setPaper(item.id)}
            />
          ))}
        </View>
      </Card>

      {/* Количество, итоговая стоимость и кнопки действий */}
      <Card>
        <View style={styles.qtyRow}>
          <Text style={styles.sectionTitle}>Количество экземпляров</Text>
          <View style={styles.qtyControls}>
            <Pressable
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </Pressable>
            <Text style={styles.qtyValue}>{qty}</Text>
            <Pressable
              onPress={() => setQty((q) => q + 1)}
              style={styles.qtyBtn}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.priceNote}>
          Доп. разворот: +{money(SPREAD_PRICE)} · Итого за 1 шт.: {money(one)}
        </Text>

        <Text style={styles.totalPrice}>Итого: {money(total)}</Text>

        <View style={{ width: '100%', alignSelf: 'stretch', gap: 8, marginTop: 12 }}>
          <Button
            label="В корзину"
            fullWidth
            onPress={() => {
              toCart();
              onGoCart();
            }}
          />
          <Button
            label="Оформить сразу"
            fullWidth
            variant="outline"
            onPress={() => {
              toCart();
              onCheckout();
            }}
          />
          <Button
            label="Поделиться для совместного редактирования"
            fullWidth
            variant="outline"
            onPress={shareAlbum}
          />

        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  
  text: {
    fontWeight: '800',
    fontSize: 16,
    textAlign: 'center',
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 10,
  },
  spreadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: '#666666',
  },
  warn: {
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },

  /* Миниатюры в ленте */
  spWrapper: {
    position: 'relative',
  },
  sp: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  spThumbs: {
    flexDirection: 'row',
    borderRadius: 4,
    overflow: 'hidden',
  },
  spText: {
    fontSize: 11,
    marginTop: 4,
    color: '#444444',
    fontWeight: '600',
  },
  spAdd: {
    width: 76,
    height: 70,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#BDBDBD',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  spAddPlus: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '600',
  },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 1.5,
  },
  removeBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 15,
  },

  /* Большой разворот */
  bigSpreadOuter: {
    marginTop: 10,
    paddingTop: 6,
    paddingRight: 6,
  },
  bigSpreadCard: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E2E2',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bigRemoveBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2.5,
  },
  bigRemoveBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  bigSpreadPages: {
    flexDirection: 'row',
    height: 190,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F3F3',
  },
  bigPageSlot: {
    flex: 1,
    height: '100%',
    position: 'relative',
    backgroundColor: '#EAEAEA',
  },
  leftPage: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.18)',
  },
  rightPage: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.6)',
  },
  bigPagePhoto: {
    width: '100%',
    height: '100%',
  },
  lowResBorder: {
    borderWidth: 2,
borderColor: colors.red,
},
lowResBadge: {
position: 'absolute',
bottom: 6,
right: 6,
width: 20,
height: 20,
borderRadius: 10,
backgroundColor: colors.red,
alignItems: 'center',
justifyContent: 'center',
},
lowResBadgeText: {
color: '#FFFFFF',
fontWeight: '800',
fontSize: 12,
},
emptySlot: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
},
emptySlotText: {
color: '#777777',
fontWeight: '600',
fontSize: 13,
},
spreadFooter: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginTop: 10,
gap: 6,
},
spreadHint: {
flex: 1,
textAlign: 'center',
fontSize: 11,
color: '#666666',
},
navBtn: {
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 6,
backgroundColor: '#F2F2F2',
},
navBtnDisabled: {
opacity: 0.35,
},
navBtnText: {
fontSize: 12,
fontWeight: '600',
color: '#222222',
},
/* Опции параметров */
optionCard: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
padding: 12,
borderRadius: 10,
borderWidth: 1.5,
borderColor: '#E5E5E5',
backgroundColor: '#FFFFFF',
},
optionCardSelected: {
borderColor: colors.red,
backgroundColor: '#FFF7F7',
},
optionTitle: {
fontSize: 14,
fontWeight: '700',
color: '#222222',
},
optionNote: {
fontSize: 12,
color: '#666666',
marginTop: 2,
},
optionPrice: {
fontSize: 14,
fontWeight: '700',
color: '#333333',
},
optionTextSelected: {
color: colors.red,
},
/* Количество и итог */
qtyRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 8,
},
qtyControls: {
flexDirection: 'row',
alignItems: 'center',
gap: 12,
},
qtyBtn: {
width: 32,
height: 32,
borderRadius: 8,
backgroundColor: '#F0F0F0',
alignItems: 'center',
justifyContent: 'center',
},
qtyBtnText: {
fontSize: 18,
fontWeight: '700',
color: '#222222',
},
qtyValue: {
fontSize: 16,
fontWeight: '700',
minWidth: 20,
textAlign: 'center',
},
priceNote: {
fontSize: 12,
color: '#666666',
marginBottom: 4,
},
totalPrice: {
fontSize: 20,
fontWeight: '800',
color: colors.red,
marginTop: 4,
},
});