import { useCallback, useEffect, useState } from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import { getProducts, Product } from '../api/products';
import { colors } from '../theme';
import Logo from '../components/Logo';

interface Draft { productName: string; photos: number; minPhotos: number }
interface Props { userName?: string; onOpenProduct: (p: Product) => void; onOpenProject: () => void }

const CARD_IMAGES: ImageSourcePropType[] = [
  require('../../assets/pic1.png'),
  require('../../assets/pic2.png'),
  require('../../assets/pic3.png'),
  require('../../assets/pic4.png'),
];

export default function HomeScreen({ onOpenProduct, onOpenProject }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setProducts(await getProducts()); }
    catch (e: any) { setError(e?.message ?? 'неизвестная ошибка'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    AsyncStorage.getItem('picpac_draft').then((raw) => raw && setDraft(JSON.parse(raw))).catch(() => {});
  }, [load]);

  return (
    <Screen>
      <View style={styles.header}>
        <Logo height={70} />
      </View>

      {draft && (
        <Card solid style={{ marginBottom: 16 }}>
          <View style={{ gap: 8 }}>
            <Text style={styles.onRed}>Вы остановились на проекте</Text>
            <Text style={styles.bannerTitle}>{draft.productName}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.min(draft.photos / draft.minPhotos, 1) * 100}%` }]} />
            </View>
            <Text style={styles.onRed}>Добавлено {draft.photos} из {draft.minPhotos} фото</Text>
            <Button label="Продолжить проект" variant="light" onPress={onOpenProject} />
          </View>
        </Card>
      )}

      {loading && <Text style={styles.muted}>Загружаем каталог…</Text>}

      {!!error && (
        <Card>
          <Text style={{ color: colors.ink, marginBottom: 10 }}>
            Не удалось загрузить каталог: {error}. Проверьте сеть и повторите.
          </Text>
          <Button label="Повторить" onPress={load} />
        </Card>
      )}

      <View style={styles.grid}>
        {products.map((p, index) => {
          const isPrint = p.name.toLowerCase().includes('фотопечать');
          const imageSource = isPrint ? CARD_IMAGES[3] : CARD_IMAGES[index];

          return (
            <Pressable
              key={p.id}
              onPress={() => onOpenProduct(p)}
              style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]}
            >
              <View style={[styles.blobBase, styles.blobBack]} />
              <View style={[styles.blobBase, styles.blobFront]} />

              <View style={{ zIndex: 2 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>{p.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>{p.description}</Text>
              </View>

              <View style={styles.bottomArea}>
                {imageSource ? (
                  <Image source={imageSource} style={styles.cardImage} resizeMode="contain" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderText}>Фото</Text>
                  </View>
                )}

                <View style={styles.arrowBtn}>
                  <Text style={styles.arrowText}>→</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10, 
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  tile: {
    width: '48%',
    minHeight: 245,
    backgroundColor: '#FFF8F7',
    borderRadius: 24,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  blobBase: {
    position: 'absolute',
    zIndex: 0,
  },
  blobBack: {
    backgroundColor: colors.coral,
    opacity: 0.35,
    width: 220,
    height: 140,
    bottom: -55,
    right: -40,
    borderRadius: 110,
    transform: [{ rotate: '-18deg' }],
  },
  blobFront: {
    backgroundColor: colors.red,
    opacity: 0.85,
    width: 200,
    height: 120,
    bottom: -50,
    right: -30,
    borderRadius: 100,
    transform: [{ rotate: '-12deg' }],
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 23,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.ink,
    opacity: 0.65,
    lineHeight: 16,
  },
  bottomArea: {
    height: 115,
    marginTop: 10,
    justifyContent: 'flex-end',
    alignItems: 'center',
    zIndex: 2,
  },
  cardImage: {
    width: '125%',
    height: 118,
    marginBottom: 7,
  },
  imagePlaceholder: {
    width: 85,
    height: 75,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.coral,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 11,
    color: colors.ink,
    opacity: 0.5,
  },
  arrowBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF8F7',
  },
  arrowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: -2,
  },
  muted: { fontSize: 14, color: colors.ink, opacity: 0.8 },
  onRed: { color: colors.cream, fontSize: 15 },
  bannerTitle: { color: colors.cream, fontSize: 22, fontWeight: '800', lineHeight: 26 },
  track: { height: 8, borderRadius: 99, backgroundColor: colors.coral },
  fill: { height: 8, borderRadius: 99, backgroundColor: colors.cream },
});
