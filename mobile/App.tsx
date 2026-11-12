import { ReactElement, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProductScreen from './src/screens/ProductScreen';
import ProjectScreen from './src/screens/ProjectScreen';
import CartScreen from './src/screens/CartScreen';
import OrderScreen from './src/screens/OrderScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { colors } from './src/theme';
import CheckoutScreen from './src/screens/CheckoutScreen';

const NAV_ITEMS = [
  { key: 'Главная', label: 'Главная' },
  { key: 'История', label: 'Профиль' },
  { key: 'Корзина', label: 'Корзина' },
] as const;

function NavIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? colors.red : colors.ink;

  if (name === 'Главная') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
          fill={active ? color : 'none'}
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (name === 'История') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" fill={active ? color : 'none'} stroke={color} strokeWidth={1.8} />
        <Path
          d="M4.5 20C4.5 16.5 7.8 14 12 14C16.2 14 19.5 16.5 19.5 20"
          fill={active ? color : 'none'}
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 4H5.5L7.5 15H18.5L20.5 7H6.5"
        fill={active ? color : 'none'}
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="19.5" r="1.5" fill={color} />
      <Circle cx="17" cy="19.5" r="1.5" fill={color} />
    </Svg>
  );
}

export default function App() {
  const [tab, setTab] = useState('Вход');
  const [userPhone, setUserPhone] = useState<string | null>(null);

  const handleLogin = (phone: string) => {
    setUserPhone(phone);
    setTab('Главная');
  };

  const handleGuest = () => {
    setUserPhone(null);
    setTab('Главная');
  };

  const screens: Record<string, ReactElement> = {
    'Вход': <LoginScreen onLogin={handleLogin} onGuest={handleGuest} />,
    'Главная': <HomeScreen onOpenProduct={() => setTab('Продукт')} onOpenProject={() => setTab('Проект')} />,
    'Продукт': <ProductScreen onBack={() => setTab('Главная')} onStart={() => setTab('Проект')} />,
    'Проект': <ProjectScreen onBack={() => setTab('Продукт')} onCheck={() => Alert.alert('Проверка', 'Здесь будет проверка проекта')} />,
        'Корзина': <CartScreen onBack={() => setTab('Проект')} onConfirm={() => setTab('Оформление')} />,
    'Оформление': <CheckoutScreen onBack={() => setTab('Корзина')} onSuccess={() => setTab('Заказ')} />,
    'Заказ': <OrderScreen onBack={() => setTab('История')} />,
    'История': (
      <HistoryScreen
        isGuest={!userPhone}
        phone={userPhone ?? undefined}
        onLoginPress={() => setTab('Вход')}
        onOpenOrder={() => setTab('Заказ')}
      />
    ),
  };

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <View style={{ flex: 1 }}>{screens[tab]}</View>

        {['Главная', 'История', 'Корзина'].includes(tab) && (
          <View style={styles.navWrapper} pointerEvents="box-none">
            <View style={styles.navBar}>
              {NAV_ITEMS.map((item) => {
                const isActive = tab === item.key;
                return (
                  <Pressable key={item.key} onPress={() => setTab(item.key)} style={styles.navItem}>
                    <NavIcon name={item.key} active={isActive} />
                    <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
                    <View style={[styles.indicator, !isActive && { opacity: 0 }]} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  navWrapper: { position: 'absolute', bottom: 20, left: 16, right: 16 },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F7',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 6,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 72, gap: 3 },
  navLabel: { fontSize: 12, fontWeight: '600', color: colors.ink },
  navLabelActive: { color: colors.red, fontWeight: '700' },
  indicator: { marginTop: 2, width: 38, height: 3.5, borderRadius: 2, backgroundColor: colors.red },
});