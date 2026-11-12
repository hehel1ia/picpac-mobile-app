import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Screen from '../components/Screen';
import Logo from '../components/Logo';
import { SAMPLE_ORDERS } from '../mock/sample';
import { priceText } from '../api/products';
import { colors } from '../theme';

const STEPS = ['Оформлен', 'В работе', 'Отправлен', 'Готов'];

interface Props {
  isGuest?: boolean;
  phone?: string;
  onLoginPress: () => void;
  onOpenOrder: () => void;
  onOpenSupport?: () => void;
}

function isWithinThreeMonths(dateStr: string): boolean {
  let parsed = new Date(dateStr);
  if (isNaN(parsed.getTime()) && dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.');
    parsed = new Date(`${year}-${month}-${day}`);
  }
  if (isNaN(parsed.getTime())) return true;

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  return parsed >= threeMonthsAgo;
}

export default function HistoryScreen({
  isGuest = false,
  phone = '+375 (29) 123-45-67',
  onLoginPress,
  onOpenOrder,
  onOpenSupport,
}: Props) {
  // У гостя заказов нет, у авторизованного — только за последние 3 месяца
  const recentOrders = isGuest ? [] : SAMPLE_ORDERS.filter((o) => isWithinThreeMonths(o.date));

  const handleSupportPress = () => {
    if (onOpenSupport) {
      onOpenSupport();
    } else {
      Alert.alert('ИИ-помощник picPac', 'Здесь откроется чат с ИИ-ботом поддержки');
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Logo height={70} />
      </View>

      {/* Карточка 1: Профиль и карты (или кнопка входа для гостя) */}
      <View style={styles.mainCard}>
        {isGuest ? (
          <>
            <Text style={styles.phoneText}>Гостевой режим</Text>
            <Text style={styles.guestHint}>
              Войдите по номеру телефона, чтобы привязать карту и отслеживать статусы заказов.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.loginBigBtn, pressed && { opacity: 0.88 }]}
              onPress={onLoginPress}
            >
              <Text style={styles.redPillText}>Войти</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.phoneText}>{phone}</Text>
            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Мои карты</Text>

            <View style={styles.cardsRow}>
              <View style={styles.bankCard}>
                <View style={styles.bankCardTop}>
                  <View style={styles.mcWrap}>
                    <View style={[styles.mcCircle, { backgroundColor: '#EB001B' }]} />
                    <View style={[styles.mcCircle, { backgroundColor: '#F79E1B', marginLeft: -8 }]} />
                  </View>
                  <Text style={styles.visaText}>VISA</Text>
                </View>
                <Text style={styles.cardDigits}>•••• 4589</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.redPillBtn, pressed && { opacity: 0.85 }]}
                onPress={() => Alert.alert('Карты', 'Здесь откроется форма привязки банковской карты')}
              >
                <Text style={styles.redPillText}>+ Привязать карту</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      {/* Карточка 2: Статус заказов */}
      <View style={styles.mainCard}>
        <Text style={styles.sectionTitle}>Статус заказов</Text>

        {recentOrders.length === 0 ? (
          <Text style={styles.emptyText}>
            {isGuest
              ? 'У гостя нет сохранённых заказов. Войдите в аккаунт, чтобы увидеть историю.'
              : 'За последние 3 месяца заказов не было.'}
          </Text>
        ) : (
          <View style={{ gap: 12 }}>
            {recentOrders.map((o) => {
              const currentStep = Math.max(0, Math.min(o.status, STEPS.length - 1));
              const progressPercent = (currentStep / (STEPS.length - 1)) * 100;

              return (
                <View key={o.id} style={styles.innerOrderCard}>
                  <Text style={styles.orderTitle}>Заказ #{o.id}</Text>

                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                      <View style={[styles.progressDot, { left: `${progressPercent}%` }]} />
                    </View>

                    <View style={styles.stepsRow}>
                      {STEPS.map((step, idx) => (
                        <Text
                          key={step}
                          style={[styles.stepLabel, idx === currentStep && styles.stepLabelActive]}
                        >
                          {step}
                        </Text>
                      ))}
                    </View>
                  </View>

                  <View style={styles.orderFooter}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.orderMeta} numberOfLines={2}>
                        {o.product} · {o.variant} × {o.qty}
                      </Text>
                      <Text style={styles.orderMeta}>
                        {o.date} · {priceText(o.total)}
                      </Text>
                    </View>

                    <Pressable
                      style={({ pressed }) => [styles.redPillBtn, styles.trackBtn, pressed && { opacity: 0.85 }]}
                      onPress={onOpenOrder}
                    >
                      <Text style={styles.redPillText}>Трек</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Карточка 3: Поддержка с ИИ-ботом (доступна и гостю, и пользователю) */}
      <View style={[styles.mainCard, isGuest && { marginBottom: 95 }]}>
        <View style={styles.supportHeader}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Поддержка</Text>
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>ИИ-бот 24/7</Text>
          </View>
        </View>

        <Text style={styles.supportDesc}>
          Подскажет по статусу заказа, срокам печати и поможет выбрать формат фотокниги.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.supportBtn, pressed && { opacity: 0.88 }]}
          onPress={handleSupportPress}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M21 11.5C21 16.1944 16.9706 20 12 20C10.5112 20 9.10665 19.6579 7.8698 19.0518L3 20.5L4.3822 16.3534C3.50592 14.961 3 13.2932 3 11.5C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z"
              stroke="#FFFFFF"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.redPillText}>Написать ИИ-помощнику</Text>
        </Pressable>
      </View>

      {/* Кнопка удаления аккаунта показывается только авторизованному пользователю */}
      {!isGuest && (
        <Pressable
          style={styles.deleteBtn}
          onPress={() => Alert.alert('Удаление данных', 'Вы уверены, что хотите удалить аккаунт?')}
        >
          <Text style={styles.deleteText}>Удалить аккаунт и данные</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginTop: 12, marginBottom: 14, marginLeft: 15, alignItems: 'flex-start' },
  mainCard: {
    backgroundColor: '#FFF8F7',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  phoneText: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: 0.3 },
  guestHint: { fontSize: 13, color: colors.ink, opacity: 0.7, lineHeight: 18, marginTop: 6, marginBottom: 14 },
  loginBigBtn: {
    backgroundColor: colors.red,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, backgroundColor: colors.coral, opacity: 0.25, marginVertical: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 12 },
  emptyText: { fontSize: 14, color: colors.ink, opacity: 0.65, lineHeight: 20 },
  cardsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  bankCard: {
    width: 132,
    height: 82,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    padding: 10,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  bankCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mcWrap: { flexDirection: 'row', alignItems: 'center' },
  mcCircle: { width: 18, height: 18, borderRadius: 9, opacity: 0.9 },
  visaText: { fontSize: 12, fontWeight: '900', fontStyle: 'italic', color: '#1E3A8A' },
  cardDigits: { fontSize: 12, fontWeight: '600', color: colors.ink, opacity: 0.7 },
  redPillBtn: {
    backgroundColor: colors.red,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redPillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  innerOrderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  orderTitle: { fontSize: 17, fontWeight: '800', color: colors.ink, marginBottom: 14 },
  progressContainer: { marginBottom: 14 },
  progressTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginHorizontal: 14,
    marginBottom: 8,
  justifyContent: 'center',
  },
  progressFill: { height: 4, backgroundColor: colors.red, borderRadius: 2 },
  progressDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: colors.red, marginLeft: -6 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepLabel: { fontSize: 11, color: colors.ink, opacity: 0.55, fontWeight: '500' },
  stepLabelActive: { opacity: 1, fontWeight: '800', color: colors.ink },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  orderMeta: { fontSize: 12, color: colors.ink, opacity: 0.65, lineHeight: 16 },
  trackBtn: { paddingHorizontal: 20, paddingVertical: 8 },
  supportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  aiBadge: { backgroundColor: colors.pink, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  aiBadgeText: { fontSize: 11, fontWeight: '700', color: colors.red },
  supportDesc: { fontSize: 13, color: colors.ink, opacity: 0.7, lineHeight: 18, marginBottom: 14 },
  supportBtn: {
  backgroundColor: colors.red,
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 999,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  },
  deleteBtn: { alignItems: 'center', paddingVertical: 12, marginBottom: 95 },
  deleteText: { fontSize: 13, color: colors.red, fontWeight: '600', opacity: 0.85 },
  });