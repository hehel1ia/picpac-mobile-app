import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Screen from '../components/Screen';
import Header from '../components/Header';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import StatusRibbon from '../components/StatusRibbon';
import { SAMPLE_ORDERS } from '../mock/sample';
import { priceText } from '../api/products';
import { colors } from '../theme';

const o = SAMPLE_ORDERS[0];

export default function OrderScreen({ onBack }: { onBack: () => void }) {
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  return (
    <Screen>
      <Header title={`Заказ ${o.id}`} onBack={onBack} />
      <Card>
        <Text style={styles.bold}>{o.product}</Text>
        <Text style={styles.text}>{o.variant} × {o.qty} · {o.date}</Text>
        <Text style={[styles.bold, { color: colors.red, marginTop: 6 }]}>{priceText(o.total)}</Text>
      </Card>
      <Text style={styles.h2}>Статус</Text>
      <Card><StatusRibbon status={o.status} /></Card>

      <Text style={styles.h2}>Поддержка по этому заказу</Text>
      {sent.map((s, i) => <Card key={i}><Text style={styles.text}>{s}</Text><Text style={[styles.text, { fontSize: 13, opacity: 0.8 }]}>Открыто · ответим в течение 24 часов</Text></Card>)}
      <Input label="Сообщение" value={msg} onChangeText={setMsg} placeholder="Опишите вопрос по заказу" multiline />
      <Button label="Отправить обращение" onPress={() => { if (msg.trim()) { setSent([...sent, msg.trim()]); setMsg(''); } }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  bold: { fontSize: 17, fontWeight: '800', color: colors.ink },
});
