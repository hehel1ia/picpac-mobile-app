import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Header from '../components/Header';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Input from '../components/Input';
import Button from '../components/Button';
import { useCart } from '../state/CartContext';
import { money } from '../types/order';
import { colors } from '../theme';

const DELIVERY = [{ id: 'pickup', name: 'Самовывоз', price: 0 }, { id: 'courier', name: 'Курьер', price: 7 }, { id: 'post', name: 'Европочта', price: 4.5 }];
const PROMOS: Record<string, number> = { PICPAC10: 10, HELLO15: 15 };

export default function CartScreen({ onBack, onLogin, onConfirm, loggedIn }: {
  onBack: () => void;
  onLogin: () => void;
  onConfirm: () => void;
  loggedIn: boolean;
}) {
  const { items, removeItem } = useCart();

  const [delivery, setDelivery] = useState('pickup');
  const [promo, setPromo] = useState('');
  const [applied, setApplied] = useState(0);
  const [msg, setMsg] = useState('');
  if (!loggedIn) {
    return (
      <Screen>
        <Header title="Корзина" onBack={onBack} />
        <Card>
          <Text style={styles.bold}>Войдите в аккаунт</Text>
          <Text style={[styles.text, { marginVertical: 8 }]}>
            Чтобы увидеть корзину и оформить заказ, нужно войти.
          </Text>
          <Button label="Войти" onPress={onLogin} />
        </Card>
      </Screen>
    );
  }

  // итого = сумма позиций × (1 − скидка) + доставка
  const sub = items.reduce((s, i) => s + i.total, 0);
  const disc = (sub * applied) / 100;
  const del = DELIVERY.find((d) => d.id === delivery)!.price;
  const total = sub - disc + del;
  const apply = () => { const p = PROMOS[promo.trim().toUpperCase()]; setApplied(p ?? 0); setMsg(p ? `Промокод применён: −${p}%` : 'Промокод не найден'); };

  return (
    <Screen>
      <Header title="Корзина" onBack={onBack} />
      {items.length === 0 && <Text style={styles.text}>Корзина пуста. Выберите фотопечать или фотоальбом на главном экране.</Text>}
      {items.map((i) => (
        <Card key={i.id}>
          <View style={styles.row}><Text style={styles.bold}>{i.title}</Text><Text style={[styles.bold, { color: colors.red }]}>{money(i.total)}</Text></View>
          <Text style={styles.text}>{i.details}</Text>
          <View style={{ marginTop: 8 }}><Button label="Удалить" variant="outline" onPress={() => removeItem(i.id)} /></View>
        </Card>
      ))}

      {items.length > 0 && (
        <>
          <Text style={styles.h2}>Получение (тест)</Text>
          <View style={styles.wrap}>{DELIVERY.map((d) => <Chip key={d.id} label={`${d.name} · ${money(d.price)}`} selected={d.id === delivery} onPress={() => setDelivery(d.id)} />)}</View>

          <Input label="Промокод (тест: PICPAC10)" value={promo} onChangeText={setPromo} autoCapitalize="characters" />
          <Button label="Применить" variant="solid" onPress={apply} />
          {!!msg && <Text style={[styles.text, { color: applied ? colors.ink : colors.red }]}>{msg}</Text>}

          <Card>
            <View style={styles.row}><Text style={styles.text}>Сумма</Text><Text style={styles.text}>{money(sub)}</Text></View>
            <View style={styles.row}><Text style={styles.text}>Скидка</Text><Text style={styles.text}>−{money(disc)}</Text></View>
            <View style={styles.row}><Text style={styles.text}>Доставка</Text><Text style={styles.text}>{money(del)}</Text></View>
            <View style={styles.row}><Text style={styles.bold}>Итого</Text><Text style={[styles.bold, { color: colors.red }]}>{money(total)}</Text></View>
            <Text style={[styles.text, { fontSize: 13, opacity: 0.8, marginTop: 6 }]}>Тестовый заказ, деньги не списываются.</Text>
          </Card>
          <Button label="Подтвердить заказ" onPress={onConfirm} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  bold: { fontSize: 17, fontWeight: '800', color: colors.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
});
