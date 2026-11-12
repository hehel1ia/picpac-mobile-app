import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Header from '../components/Header';
import Card from '../components/Card';
import Chip from '../components/Chip';
import Button from '../components/Button';
import { SAMPLE_PRODUCT as P } from '../mock/sample';
import { priceText } from '../api/products';
import { colors } from '../theme';

export default function ProductScreen({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const [vi, setVi] = useState(0);
  return (
    <Screen>
      <Header title={P.name} onBack={onBack} />
      {/* Сюда позже подставим фото продукта (<Image source={...} />) */}
      <View style={styles.photo}><Text style={styles.letter}>{P.name[0]}</Text></View>
      <Text style={styles.text}>{P.description}</Text>

      <Text style={styles.h2}>Вариант</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {P.variants.map((v, i) => <Chip key={v.name} label={`${v.name} · ${priceText(v.price)}`} selected={i === vi} onPress={() => setVi(i)} />)}
      </View>

      <Card>
        <Text style={styles.price}>{priceText(P.variants[vi].price)}</Text>
        <Text style={styles.text}>Срок изготовления: около {P.leadDays} рабочих дней</Text>
      </Card>

      <Card>
        <Text style={styles.h2}>Требования к фото</Text>
        <Text style={styles.text}>Формат JPEG или PNG, размер до 15 МБ.{'\n'}Минимум {P.minPhotos} фото, короткая сторона не меньше {P.minPx} px, иначе печать получится нечёткой.</Text>
      </Card>

      <Button label="Создать проект" onPress={onStart} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { height: 200, borderRadius: 20, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 96, fontWeight: '800', color: colors.cream },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink },
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  price: { fontSize: 28, fontWeight: '800', color: colors.red },
});
