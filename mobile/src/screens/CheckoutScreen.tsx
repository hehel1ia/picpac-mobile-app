import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import Screen from '../components/Screen';
import { colors } from '../theme';

type PaymentMethod = 'card' | 'sbp' | 'cash';

interface Props {
  totalAmount?: number;
  itemsCount?: number;
  onBack: () => void;
  onSuccess: () => void;
}

const VALID_PROMOS = ['PICPAC', 'SALE10'];

export default function CheckoutScreen({
  totalAmount = 70,
  itemsCount = 2,
  onBack,
  onSuccess,
}: Props) {
  const [address, setAddress] = useState('');
  const [addressError, setAddressError] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('card');
  const [promo, setPromo] = useState('');
  const [promoError, setPromoError] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);

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

  const finalTotal = discountApplied ? totalAmount * 0.9 : totalAmount;

  const handleConfirm = () => {
    if (!address.trim()) {
      return setAddressError('Укажите адрес для курьерской доставки');
    }
    setAddressError('');
    Alert.alert('Заказ оформлен!', 'Мы начали работу над вашим заказом.', [
      { text: 'К заказу', onPress: onSuccess },
    ]);
  };

  return (
    <Screen>
      {/* Шапка экрана */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18L9 12L15 6"
              stroke={colors.ink}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Оформление заказа</Text>
          <Text style={styles.headerSub}>Доставка курьером</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Карточка 1: Адрес доставки */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFE4E6' }]}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 21C16 17 19 13.4183 19 9.5C19 5.35786 15.866 2 12 2C8.13401 2 5 5.35786 5 9.5C5 13.4183 8 17 12 21Z"
                stroke={colors.red}
                strokeWidth={2}
              />
            </Svg>
          </View>
          <Text style={styles.cardTitle}>Адрес доставки</Text>
        </View>

        <TextInput
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            if (addressError) setAddressError('');
          }}
          placeholder="Город, улица, дом, квартира"
          placeholderTextColor="#837b85"
          style={[styles.addressInput, !!addressError && { borderColor: colors.red }]}
        />
        {!!addressError && <Text style={styles.errorText}>{addressError}</Text>}

        <View style={styles.deliveryBanner}>
          <Text style={styles.deliveryBannerText}>Курьерская доставка до двери</Text>
        </View>
      </View>

      {/* Карточка 2: Способ оплаты */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#FFE4E6' }]}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Rect x="2" y="5" width="20" height="14" rx="3" stroke={colors.red} strokeWidth={2} />
              <Path d="M2 10H22" stroke={colors.red} strokeWidth={2} />
            </Svg>
          </View>
          <Text style={styles.cardTitle}>Способ оплаты</Text>
        </View>

        <View style={{ gap: 10 }}>
          {/* Вариант 1: Банковская карта */}
          <Pressable
            onPress={() => setPayment('card')}
            style={[styles.payOption, payment === 'card' && styles.payOptionActive]}
          >
            <View style={[styles.payIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect x="2" y="5" width="20" height="14" rx="2.5" stroke="#4F46E5" strokeWidth={1.8} />
                <Path d="M2 10H22" stroke="#4F46E5" strokeWidth={1.8} />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payTitle}>Банковская карта</Text>
              <Text style={styles.paySub}>Visa, Mastercard, БЕЛКАРТ</Text>
            </View>
            <View style={[styles.radioOuter, payment === 'card' && styles.radioOuterActive]}>
              {payment === 'card' && <View style={styles.radioInner} />}
            </View>
          </Pressable>

          {/* Вариант 2: ЕРИП / Оплати (QR-код) */}
          <Pressable
            onPress={() => setPayment('sbp')}
            style={[styles.payOption, payment === 'sbp' && styles.payOptionActive]}
          >
            <View style={[styles.payIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14ZM14 14H17V17H14V14ZM17 17H20V20H17V17Z"
                  stroke="#059669"
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payTitle}>Оплата по QR-коду (Оплати)</Text>
              <Text style={styles.paySub}>Быстрый платёж без ввода карты</Text>
            </View>
            <View style={[styles.radioOuter, payment === 'sbp' && styles.radioOuterActive]}>
              {payment === 'sbp' && <View style={styles.radioInner} />}
            </View>
          </Pressable>

          {/* Вариант 3: Оплата при получении */}
          <Pressable
            onPress={() => setPayment('cash')}
            style={[styles.payOption, payment === 'cash' && styles.payOptionActive]}
          >
            <View style={[styles.payIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Rect x="2" y="6" width="20" height="12" rx="2" stroke="#D97706" strokeWidth={1.8} />
                <Path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" stroke="#D97706" strokeWidth={1.8} />
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payTitle}>Оплата при получении</Text>
              <Text style={styles.paySub}>Наличными или картой курьеру</Text>
            </View>
            <View style={[styles.radioOuter, payment === 'cash' && styles.radioOuterActive]}>
              {payment === 'cash' && <View style={styles.radioInner} />}
            </View>
          </Pressable>
        </View>
      </View>

      {/* Карточка 3: Промокод */}
      <View style={styles.card}>
        <View style={styles.promoRow}>
          <TextInput
            value={promo}
            onChangeText={(text) => {
              setPromo(text);
              if (promoError) setPromoError('');
            }}
            autoCapitalize="characters"
            placeholder="Промокод на скидку"
            placeholderTextColor="#837b85"
            style={[styles.promoInput, !!promoError && { borderColor: colors.red }]}
          />
          <Pressable
            onPress={applyPromo}
            style={({ pressed }) => [
              styles.promoBtn,
              discountApplied && { backgroundColor: '#16A34A' },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.promoBtnText}>
              {discountApplied ? 'Применён' : 'Применить'}
            </Text>
          </Pressable>
        </View>
        {!!promoError && <Text style={styles.errorText}>{promoError}</Text>}
      </View>

      {/* Карточка 4: Расчёт стоимости */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, { marginBottom: 14 }]}>Расчёт стоимости</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Товары ({itemsCount})</Text>
          <Text style={styles.summaryVal}>{totalAmount.toFixed(2)} BYN</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Доставка (Курьер)</Text>
          <Text style={[styles.summaryVal, { color: '#16A34A' }]}>Бесплатно</Text>
        </View>

        {discountApplied && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Скидка по промокоду (10%)</Text>
            <Text style={[styles.summaryVal, { color: '#16A34A' }]}>
              −{(totalAmount * 0.1).toFixed(2)} BYN
            </Text>
          </View>
        )}

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Итого к оплате</Text>
            <Text style={styles.vatText}>Включая НДС</Text>
          </View>
          <Text style={styles.totalPrice}>{finalTotal.toFixed(2)} BYN</Text>
        </View>
      </View>

      {/* Кнопка подтверждения */}
      <Pressable
        onPress={handleConfirm}
        style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.confirmBtnText}>Подтвердить заказ →</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
header: {
marginTop: 10,
marginBottom: 16,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
},
backBtn: {
width: 40,
height: 40,
borderRadius: 20,
backgroundColor: '#FFF8F7',
alignItems: 'center',
justifyContent: 'center',
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.06,
shadowRadius: 6,
elevation: 2,
},
headerCenter: {
alignItems: 'center',
},
headerTitle: {
fontSize: 20,
fontWeight: '800',
color: colors.ink,
},
headerSub: {
fontSize: 12,
color: colors.ink,
opacity: 0.65,
marginTop: 2,
},
card: {
backgroundColor: '#FFF8F7',
borderRadius: 24,
padding: 16,
marginBottom: 14,
shadowColor: '#791515',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.06,
shadowRadius: 10,
elevation: 3,
},
cardTitleRow: {
flexDirection: 'row',
alignItems: 'center',
gap: 10,
marginBottom: 12,
},
iconCircle: {
width: 30,
height: 30,
borderRadius: 15,
alignItems: 'center',
justifyContent: 'center',
},
cardTitle: {
fontSize: 17,
fontWeight: '800',
color: colors.ink,
},
addressInput: {
backgroundColor: '#FFFFFF',
borderWidth: 1,
borderColor: '#EADAD8',
borderRadius: 14,
paddingHorizontal: 14,
paddingVertical: 11,
fontSize: 14,
color: colors.ink,
marginBottom: 10,
},
deliveryBanner: {
backgroundColor: '#FFEFEF',
borderRadius: 12,
paddingVertical: 10,
paddingHorizontal: 14,
},
deliveryBannerText: {
fontSize: 13,
fontWeight: '600',
color: colors.red,
},
payOption: {
flexDirection: 'row',
alignItems: 'center',
gap: 12,
backgroundColor: '#FFFFFF',
borderWidth: 1.5,
borderColor: '#F0E4E2',
borderRadius: 16,
padding: 12,
},
payOptionActive: {
borderColor: colors.red,
backgroundColor: '#FFFDFD',
},
payIconBox: {
width: 38,
height: 38,
borderRadius: 12,
alignItems: 'center',
justifyContent: 'center',
},
payTitle: {
fontSize: 14,
fontWeight: '700',
color: colors.ink,
},
paySub: {
fontSize: 11,
color: colors.ink,
opacity: 0.55,
marginTop: 2,
},
radioOuter: {
width: 20,
height: 20,
borderRadius: 10,
borderWidth: 1.5,
borderColor: '#D1D5DB',
alignItems: 'center',
justifyContent: 'center',
},
radioOuterActive: {
borderColor: colors.red,
},
radioInner: {
width: 10,
height: 10,
borderRadius: 5,
backgroundColor: colors.red,
},
promoRow: {
flexDirection: 'row',
alignItems: 'center',
gap: 10,
},
promoInput: {
flex: 1,
backgroundColor: '#FFFFFF',
borderWidth: 1,
borderColor: '#EADAD8',
borderRadius: 14,
paddingHorizontal: 14,
paddingVertical: 10,
fontSize: 14,
color: colors.ink,
},
promoBtn: {
backgroundColor: '#D5484E',
paddingHorizontal: 18,
paddingVertical: 12,
borderRadius: 14,
},
promoBtnText: {
color: '#FFFFFF',
fontSize: 13,
fontWeight: '700',
},
errorText: {
color: colors.red,
fontSize: 12,
fontWeight: '600',
marginTop: 6,
marginLeft: 4,
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
totalRow: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginTop: 6,
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
fontSize: 22,
fontWeight: '800',
color: colors.red,
},
confirmBtn: {
marginTop: 4,
marginBottom: 30,
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
confirmBtnText: {
color: '#FFFFFF',
fontSize: 17,
fontWeight: '800',
},
});