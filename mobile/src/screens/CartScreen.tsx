import { useState } from 'react';
import { Alert, Image, ImageSourcePropType, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Screen from '../components/Screen';
import Logo from '../components/Logo';
import { colors } from '../theme';

interface CartItem {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  price: number;
  oldPrice?: number;
  qty: number;
  statusText: string;
  statusOk: boolean;
  image?: ImageSourcePropType;
}

const INITIAL_CART: CartItem[] = [
  {
    id: '1',
    title: 'Фотокнига Классик',
    subtitle: '20×20 см · 24 страницы',
    badgeText: '20×20',
    price: 45,
    oldPrice: 49,
    qty: 1,
    statusText: 'Макет проверен',
    statusOk: true,
    image: require('../../assets/pic1.png'),
  },
  {
    id: '2',
    title: 'Печать фото 10×15',
    subtitle: '50 снимков · Глянцевая бумага',
    badgeText: '50 шт',
    price: 25,
    qty: 1,
    statusText: '50 файлов загружено',
    statusOk: false,
    image: require('../../assets/pic4.png'),
  },
];

const VALID_PROMOS = ['PICPAC', 'SALE10'];

interface Props {
  onBack?: () => void;
  onConfirm: () => void;
}

export default function CartScreen({ onBack, onConfirm }: Props) {
  const [items, setItems] = useState<CartItem[]>(INITIAL_CART);
  const [promo, setPromo] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [promoError, setPromoError] = useState('');

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    if (items.length === 0) return;
    Alert.alert('Очистить корзину', 'Удалить все товары из корзины?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Очистить', style: 'destructive', onPress: () => setItems([]) },
    ]);
  };

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) {
      setDiscountApplied(false);
      return setPromoError('Введите промокод');
    }
    if (!VALID_PROMOS.includes(code)) {
      setDiscountApplied(false);
      return setPromoError('Неверный промокод');
    }
    setPromoError('');
    setDiscountApplied(true);
  };

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const rawTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const finalTotal = discountApplied ? rawTotal * 0.9 : rawTotal;

  const pluralGoods = (n: number) => {
    if (n % 10 === 1 && n % 100 !== 11) return `${n} товар`;
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} товара`;
    return `${n} товаров`;
  };

  return (
    <Screen>
        <View style={styles.topHeader}>
        <View style={{ flexShrink: 1 }}>
          <Logo height={70} />
        </View>
        <View style={styles.countPill}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 7H18L19 20H5L6 7Z"
              stroke={colors.red}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Path
              d="M9 7V5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7"
              stroke={colors.red}
              strokeWidth={2}
            />
          </Svg>
          <Text style={styles.countPillText}>{pluralGoods(totalCount)}</Text>
        </View>
      </View>


      {/* Заголовок «Корзина» и кнопка «Очистить» */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Корзина</Text>
        {items.length > 0 && (
          <Pressable onPress={clearCart} style={styles.clearBtn}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 6H21M8 6V4C8 3.45 8.45 3 9 3H15C15.55 3 16 3.45 16 4V6M19 6V20C19 20.55 18.55 21 18 21H6C5.45 21 5 20.55 5 20V6"
                stroke={colors.ink}
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </Svg>
            <Text style={styles.clearText}>Очистить</Text>
          </Pressable>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>В корзине пока пусто</Text>
          <Text style={styles.emptySub}>Выберите фотокнигу или печать фото на главном экране.</Text>
        </View>
      ) : (
        <>
          {/* Список карточек товаров */}
          <View style={{ gap: 14 }}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemTop}>
                  <View style={styles.thumbBox}>
                    {item.image ? (
                      <Image source={item.image} style={styles.thumbImg} resizeMode="cover" />
                    ) : null}
                    <View style={styles.thumbBadge}>
                      <Text style={styles.thumbBadgeText}>{item.badgeText}</Text>
                    </View>
                  </View>

                  <View style={styles.itemInfo}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                      <Pressable onPress={() => removeItem(item.id)} hitSlop={8}>
                        <Text style={styles.removeIcon}>✕</Text>
                      </Pressable>
                    </View>

                    <Text style={styles.itemSub} numberOfLines={1}>{item.subtitle}</Text>

                    <View style={styles.priceQtyRow}>
                      <View>
                        {item.oldPrice ? (
                          <Text style={styles.oldPrice}>{(item.oldPrice * item.qty).toFixed(2)} BYN</Text>
                        ) : null}
                        <Text style={styles.price}>{(item.price * item.qty).toFixed(2)} BYN</Text>
                      </View>

                      <View style={styles.stepper}>
                        <Pressable onPress={() => updateQty(item.id, -1)} style={styles.stepBtn}>
                          <Text style={styles.stepSign}>−</Text>
                        </Pressable>
                        <Text style={styles.stepVal}>{item.qty}</Text>
                        <Pressable onPress={() => updateQty(item.id, 1)} style={styles.stepBtn}>
                          <Text style={styles.stepSign}>+</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.itemBottom}>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: item.statusOk ? '#22C55E' : colors.red }]} />
                    <Text style={styles.statusText}>{item.statusText}</Text>
                  </View>

                  <Pressable onPress={onBack} style={styles.editRow}>
                    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M11 4H4C3.45 4 3 4.45 3 5V20C3 20.55 3.45 21 4 21H19C19.55 21 20 20.55 20 20V13M18.5 2.5C19.33 1.67 20.67 1.67 21.5 2.5C22.33 3.33 22.33 4.67 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"
                        stroke={colors.red}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <Text style={styles.editText}>Редактировать</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          {/* Плашка промокода */}
          <View style={styles.promoCard}>
            <View style={styles.promoInputWrap}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 12V20H4V12M2 7H22V12H2V7ZM12 20V7M12 7H7.5C6.12 7 5 5.88 5 4.5C5 3.12 6.12 2 7.5 2C11 2 12 7 12 7ZM12 7H16.5C17.88 7 19 5.88 19 4.5C19 3.12 17.88 2 16.5 2C13 2 12 7 12 7Z"
                  stroke={colors.red}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <TextInput
                value={promo}
                onChangeText={setPromo}
                placeholder="Промокод на скидку"
                placeholderTextColor="#837b85"
                style={styles.promoInput}
              />
            </View>
            <Pressable
              onPress={applyPromo}
              style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.applyBtnText}>
                {discountApplied ? 'Применён' : 'Применить'}
              </Text>
            </Pressable>
          </View>

                <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Итого к оплате</Text>
                <Text style={styles.vatText}>Включая НДС</Text>
              </View>
              <Text style={styles.totalPrice}>{finalTotal.toFixed(2)} BYN</Text>
            </View>

          {/* Красная кнопка «Оформить заказ →» */}
          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [styles.checkoutBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.checkoutText}>Оформить заказ →</Text>
          </Pressable>

          {/* Гарантии под кнопкой */}
          <View style={styles.guaranteesRow}>
            <View style={styles.guaranteeItem}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M1 3H15V16H1V3ZM15 8H19L23 12V16H15V8Z"
                  stroke={colors.red}
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                />
                <Circle cx="5.5" cy="18.5" r="2.5" stroke={colors.red} strokeWidth={1.8} />
                <Circle cx="18.5" cy="18.5" r="2.5" stroke={colors.red} strokeWidth={1.8} />
              </Svg>
              <Text style={styles.guaranteeText}>Срок 1–2 дня</Text>
            </View>

            <Text style={styles.guaranteeDot}>·</Text>

            <View style={styles.guaranteeItem}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z"
                  stroke={colors.red}
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                />
                <Path
                  d="M9 12L11 14L15 10"
                  stroke={colors.red}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.guaranteeText}>Гарантия качества</Text>
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
topHeader: {
marginTop: 10,
marginBottom: 12,
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
countPill: {
flexDirection: 'row',
alignItems: 'center',
gap: 6,
backgroundColor: '#FFF8F7',
paddingHorizontal: 14,
paddingVertical: 8,
borderRadius: 999,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.06,
shadowRadius: 6,
elevation: 2,
},
countPillText: {
fontSize: 13,
fontWeight: '700',
color: colors.ink,
},
titleRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 14,
},
pageTitle: {
fontSize: 26,
fontWeight: '800',
color: colors.ink,
},
clearBtn: {
flexDirection: 'row',
alignItems: 'center',
gap: 5,
opacity: 0.65,
paddingVertical: 4,
},
clearText: {
fontSize: 13,
fontWeight: '600',
color: colors.ink,
},
emptyCard: {
backgroundColor: '#FFF8F7',
borderRadius: 24,
padding: 28,
alignItems: 'center',
marginTop: 10,
},
emptyTitle: {
fontSize: 18,
fontWeight: '800',
color: colors.ink,
marginBottom: 6,
},
emptySub: {
fontSize: 14,
color: colors.ink,
opacity: 0.65,
textAlign: 'center',
},
itemCard: {
backgroundColor: '#FFF8F7',
borderRadius: 22,
padding: 14,
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.06,
shadowRadius: 10,
elevation: 3,
},
itemTop: {
flexDirection: 'row',
gap: 12,
},
thumbBox: {
width: 78,
height: 78,
borderRadius: 16,
backgroundColor: '#F3E8E6',
overflow: 'hidden',
alignItems: 'center',
justifyContent: 'center',
},
thumbImg: {
width: '90%',
height: '90%',
},
thumbBadge: {
position: 'absolute',
bottom: 5,
right: 5,
backgroundColor: 'rgba(30, 30, 35, 0.8)',
paddingHorizontal: 6,
paddingVertical: 2,
borderRadius: 6,
},
thumbBadgeText: {
color: '#FFFFFF',
fontSize: 10,
fontWeight: '700',
},
itemInfo: {
flex: 1,
justifyContent: 'space-between',
},
itemTitleRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'flex-start',
gap: 6,
},
itemTitle: {
flex: 1,
fontSize: 16,
fontWeight: '800',
color: colors.ink,
},
removeIcon: {
fontSize: 14,
color: colors.ink,
opacity: 0.4,
paddingLeft: 4,
},
itemSub: {
fontSize: 12,
color: colors.ink,
opacity: 0.6,
marginTop: 2,
},
priceQtyRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'flex-end',
marginTop: 8,
},
oldPrice: {
fontSize: 11,
color: colors.ink,
opacity: 0.45,
textDecorationLine: 'line-through',
},
price: {
fontSize: 17,
fontWeight: '800',
color: colors.red,
},
stepper: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#FFFFFF',
borderRadius: 999,
borderWidth: 1,
borderColor: '#EADAD8',
paddingHorizontal: 4,
height: 32,
},
stepBtn: {
width: 26,
height: 26,
alignItems: 'center',
justifyContent: 'center',
},
stepSign: {
fontSize: 16,
fontWeight: '700',
color: colors.ink,
},
stepVal: {
minWidth: 20,
textAlign: 'center',
fontSize: 14,
fontWeight: '700',
color: colors.ink,
},
cardDivider: {
height: 1,
backgroundColor: colors.coral,
opacity: 0.2,
marginVertical: 12,
},
itemBottom: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
statusRow: {
flexDirection: 'row',
alignItems: 'center',
gap: 6,
},
statusDot: {
width: 7,
height: 7,
borderRadius: 3.5,
},
statusText: {
fontSize: 12,
color: colors.ink,
opacity: 0.65,
fontWeight: '500',
},
editRow: {
flexDirection: 'row',
alignItems: 'center',
gap: 5,
},
editText: {
fontSize: 12,
fontWeight: '700',
color: colors.red,
},
promoCard: {
marginTop: 14,
backgroundColor: '#FFF8F7',
borderRadius: 20,
padding: 8,
paddingLeft: 14,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
shadowColor: '#000',
shadowOffset: { width: 0, height: 3 },
shadowOpacity: 0.05,
shadowRadius: 8,
elevation: 2,
},
promoInputWrap: {
flex: 1,
flexDirection: 'row',
alignItems: 'center',
gap: 8,
},
promoInput: {
flex: 1,
fontSize: 14,
color: colors.ink,
paddingVertical: 8,
},
applyBtn: {
backgroundColor: '#1E1B24',
paddingHorizontal: 18,
paddingVertical: 11,
borderRadius: 999,
},
applyBtnText: {
color: '#FFFFFF',
fontSize: 13,
fontWeight: '700',
},
summaryCard: {
marginTop: 14,
backgroundColor: '#FFF8F7',
borderRadius: 22,
padding: 18,
shadowColor: '#000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.06,
shadowRadius: 10,
elevation: 3,
},
summaryTitle: {
fontSize: 18,
fontWeight: '800',
color: colors.ink,
marginBottom: 14,
},
summaryRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 10,
},
summaryLabel: {
fontSize: 14,
color: colors.ink,
opacity: 0.7,
},
summaryVal: {
fontSize: 14,
fontWeight: '700',
color: colors.ink,
},
freeBadge: {
backgroundColor: '#DCFCE7',
paddingHorizontal: 10,
paddingVertical: 3,
borderRadius: 999,
},
freeBadgeText: {
fontSize: 12,
fontWeight: '700',
color: '#16A34A',
},
totalRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginTop: 8,
paddingTop: 12,
borderTopWidth: 1,
borderTopColor: 'rgba(235, 130, 120, 0.2)',
},
totalLabel: {
fontSize: 16,
fontWeight: '800',
color: colors.ink,
},
vatText: {
fontSize: 11,
color: colors.ink,
opacity: 0.5,
marginTop: 2,
},
totalPrice: {
fontSize: 24,
fontWeight: '800',
color: colors.red,
},
checkoutBtn: {
marginTop: 16,
backgroundColor: colors.red,
paddingVertical: 16,
borderRadius: 999,
alignItems: 'center',
justifyContent: 'center',
shadowColor: colors.red,
shadowOffset: { width: 0, height: 6 },
shadowOpacity: 0.25,
shadowRadius: 12,
elevation: 5,
},
checkoutText: {
color: '#FFFFFF',
fontSize: 17,
fontWeight: '800',
},
guaranteesRow: {
flexDirection: 'row',
justifyContent: 'center',
alignItems: 'center',
gap: 8,
marginTop: 12,
marginBottom: 95,
},
guaranteeItem: {
flexDirection: 'row',
alignItems: 'center',
gap: 5,
},
guaranteeText: {
fontSize: 12,
color: colors.ink,
opacity: 0.65,
fontWeight: '500',
},
guaranteeDot: {
fontSize: 14,
color: colors.ink,
opacity: 0.4,
},
});