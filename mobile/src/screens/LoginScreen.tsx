import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors } from '../theme';
import Logo from '../components/Logo';

export default function LoginScreen({ onLogin, onGuest }: { onLogin: (phone: string) => void; onGuest: () => void }) {
  const [phone, setPhone] = useState('+375');
  const [error, setError] = useState('');

  const handlePhoneChange = (text: string) => {
    let digits = text.replace(/\D/g, '');

    if (digits.startsWith('375')) {
      digits = digits.slice(3);
    } else if (text.length < 4) {
      digits = '';
    }

    setPhone(`+375${digits.slice(0, 9)}`);
    if (error) setError('');
  };

  const submit = () => {
    const digits = phone.replace(/\D/g, '');
    if (!phone.startsWith('+375') || digits.length !== 12) {
      return setError('Введите номер полностью');
    }
    setError('');
    onLogin(phone);
  };

  return (
    <Screen>
      <View style={{ marginTop: 40 }}>
        <Logo height={70} />
        <Text style={styles.sub}>Закажите фотопродукцию прямо с телефона</Text>
      </View>
      <Card>
        <View style={{ gap: 14 }}>
          <Input
            label="Номер телефона"
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            autoFocus
            selection={phone === '+375' ? { start: 4, end: 4 } : undefined}
            maxLength={13}
            error={error}
            style={{ color: phone === '+375' ? '#837b85' : colors.ink }}
          />
          <Button label="Войти" onPress={submit} />
        </View>
      </Card>
      <Button label="Продолжить как гость" variant="outline" onPress={onGuest} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { fontSize: 40, fontWeight: '800', color: colors.red },
  sub: { fontSize: 18, color: colors.ink, marginTop: 4 },
  hint: { fontSize: 13, color: colors.ink, opacity: 0.8 },
});
