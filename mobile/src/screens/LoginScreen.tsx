import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Input from '../components/Input';
import Logo from '../components/Logo';

export default function LoginScreen({
  onLogin,
  onGuest,
}: {
  onLogin: (phone: string) => void;
  onGuest: () => void;
}) {
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
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Логотип */}
          <View style={styles.headerBlock}>
            <View style={styles.logoWrapper}>
              <Logo height={90} />
            </View>
          </View>

          {/* Карточка с градиентом из правого нижнего угла */}
          <LinearGradient
            colors={['rgba(253, 214, 214, 0.94)', 'rgba(255, 255, 255, 0.97)']}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.gradientCard}
          >
            <Text style={styles.cardTitle}>Вход в аккаунт</Text>
            <View style={styles.divider} />

            <View style={styles.formGap}>
              <Input
                label="Номер телефона"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoFocus
                selection={phone === '+375' ? { start: 4, end: 4 } : undefined}
                maxLength={13}
                error={error}
                style={[
                  styles.phoneInput,
                  { color: phone === '+375' ? '#8E8690' : '#1E2025' },
                ]}
              />

              {/* Кнопка «Войти» со скруглением 15 во всю ширину поля ввода */}
              <Pressable
                onPress={submit}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.loginButtonText}>Войти</Text>
              </Pressable>
            </View>
          </LinearGradient>

          {/* Кнопка «Продолжить как гость» с градиентом из правого нижнего угла */}
          <Pressable
            onPress={onGuest}
            style={({ pressed }) => [
              styles.guestButtonWrapper,
              pressed && styles.buttonPressed,
            ]}
          >
            <LinearGradient
              colors={['rgba(253, 214, 214, 0.94)', 'rgba(255, 255, 255, 0.97)']}
              start={{ x: 1, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={styles.guestButtonGradient}
            >
              <Text style={styles.guestButtonText}>Продолжить как гость</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const CORAL = '#E55454';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAD4D4',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 150,
  },
  headerBlock: {
    marginBottom: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 10,
  },
  gradientCard: {
    width: '100%',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#C84B4B',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E2025',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(229, 84, 84, 0.14)',
    marginVertical: 14,
  },
  formGap: {
    width: '100%',
    gap: 14,
  },
  phoneInput: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 15,
    backgroundColor: CORAL,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CORAL,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  guestButtonWrapper: {
    width: '100%',
    marginTop: 14,
    borderRadius: 15,
    shadowColor: '#C84B4B',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  guestButtonGradient: {
    width: '100%',
    height: 50,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: CORAL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    color: CORAL,
    fontSize: 15,
    fontWeight: '700',
  },
});
