import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen from '../components/Screen';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Stepper from '../components/Stepper';
import OptionCard from '../components/OptionCard';
import PhotoPreview from '../components/PhotoPreview';
import { useCart } from '../state/CartContext';
import {
  ALBUM_COVERS, ALBUM_FORMATS, ALBUM_LAMINATION, ALBUM_MIN_PX, ALBUM_PAPERS, MAX_SPREADS, MIN_SPREADS,
  Photo, SPREAD_PRICE, albumPrice, money,
} from '../types/order';
import { colors } from '../theme';

interface Props { photos: Photo[]; onBack: () => void; onGoCart: () => void; onCheckout: () => void }

const priceOf = (list: { id: string; price: number }[], id: string) => list.find((x) => x.id === id)!.price;
const plus = (n: number) => (n ? `+${money(n)}` : undefined);

export default function AlbumScreen({ photos, onBack, onGoCart, onCheckout }: Props) {
  const { addItem } = useCart();
  const [cover, setCover] = useState('hard');
  const [format, setFormat] = useState('20x20');
  const [lam, setLam] = useState('gloss');
  const [paper, setPaper] = useState('silk');
  const [spreads, setSpreads] = useState(MIN_SPREADS);
  const [qty, setQty] = useState(1);
  const [textInput, setTextInput] = useState('НАШИ ВОСПОМИНАНИЯ');
  const [title, setTitle] = useState('НАШИ ВОСПОМИНАНИЯ');
  const [spread, setSpread] = useState(0);
  const [preview, setPreview] = useState(false);

  const one = albumPrice(priceOf(ALBUM_COVERS, cover), priceOf(ALBUM_FORMATS, format), priceOf(ALBUM_LAMINATION, lam), priceOf(ALBUM_PAPERS, paper), spreads);
  const total = one * qty;
  const fmtName = ALBUM_FORMATS.find((f) => f.id === format)!.name;
  const lowCount = photos.filter((p) => Math.min(p.width, p.height) < ALBUM_MIN_PX).length;

  // Раскладка: на каждый разворот по 2 фото по кругу. Позже заменим на раскладку из проекта в базе.
  const spreadPhotos = (k: number): Photo[] => (photos.length ? [photos[(2 * k) % photos.length], photos[(2 * k + 1) % photos.length]] : []);
  const toCart = () => addItem({ kind: 'album', title: 'Фотоальбом', details: `${fmtName} · ${spreads} разв. · ${qty} шт.`, total, payload: { cover, format, lam, paper, spreads, qty, title, photos } });

  return (
    <Screen>
      <Header title="Создание альбома" onBack={onBack} />
      <Text style={styles.text}>Фотоальбом · фото: {photos.length}</Text>

      {lowCount > 0 && (
        <View style={styles.warn}>
          <Text style={[styles.text, { fontWeight: '800', color: colors.red }]}>Низкое разрешение: {lowCount} фото</Text>
          <Text style={styles.text}>Эти снимки меньше {ALBUM_MIN_PX} px по короткой стороне, в альбоме они будут нечёткими. Замените их или продолжите осознанно.</Text>
        </View>
      )}

      <Card>
        <View style={styles.row}>
          <Text style={styles.h3}>Превью: обложка</Text>
          <Button label="Превью разворота" variant="solid" onPress={() => setPreview(true)} />
        </View>
        <View style={styles.coverWrap}>
          {photos[0] && <PhotoPreview uri={photos[0].uri} style={styles.cover} />}
          <View style={styles.coverText}><Text style={styles.coverTitle} numberOfLines={2}>{title}</Text></View>
        </View>

        <Text style={styles.h3}>Навигация по разворотам:</Text>
        <Text style={[styles.text, { color: colors.red, fontWeight: '800' }]}>{spreads} разворотов ({spreads * 2} стр.)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
          {Array.from({ length: spreads }, (_, k) => (
            <Pressable key={k} accessibilityLabel={`Разворот ${k + 1}`} onPress={() => { setSpread(k); setPreview(true); }} style={[styles.sp, k === spread && { borderColor: colors.red }]}>
              <View style={{ flexDirection: 'row' }}>
                {spreadPhotos(k).map((p, i) => <PhotoPreview key={i} uri={p.uri} style={{ width: 34, height: 44 }} />)}
              </View>
              <Text style={styles.spText}>Разв. {k + 1}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Input label="Надпись на обложке:" value={textInput} onChangeText={setTextInput} />
        <View style={{ marginTop: 8 }}><Button label="OK" onPress={() => setTitle(textInput)} /></View>
      </Card>

      <Card>
        <Text style={styles.h2}>Параметры альбома</Text>
        <Text style={styles.label}>Тип обложки ({ALBUM_COVERS.length} варианта)</Text>
        <View style={styles.wrap}>{ALBUM_COVERS.map((c) => <OptionCard key={c.id} title={c.name} note={c.note} selected={cover === c.id} onPress={() => setCover(c.id)} />)}</View>

        <Text style={styles.label}>Формат альбома</Text>
        <View style={styles.wrap}>{ALBUM_FORMATS.map((f) => <OptionCard key={f.id} title={f.name} note={f.note} price={plus(f.price)} selected={format === f.id} onPress={() => setFormat(f.id)} />)}</View>

        <Text style={styles.label}>Ламинация обложки</Text>
        <View style={styles.wrap}>{ALBUM_LAMINATION.map((l) => <OptionCard key={l.id} title={l.name} note={l.note} price={plus(l.price)} selected={lam === l.id} onPress={() => setLam(l.id)} />)}</View>

        <Text style={styles.label}>Тип бумаги разворотов</Text>
        <View style={styles.wrap}>{ALBUM_PAPERS.map((p) => <OptionCard key={p.id} title={p.name} note={p.note} price={plus(p.price)} selected={paper === p.id} onPress={() => setPaper(p.id)} />)}</View>

        <View style={[styles.row, { marginTop: 14 }]}>
          <Text style={styles.bold}>Количество разворотов:</Text>
          <Stepper value={spreads} min={MIN_SPREADS} max={MAX_SPREADS} onChange={setSpreads} />
        </View>
        <View style={{ marginVertical: 10 }}>
          <Button label={`+ Добавить разворот (+${SPREAD_PRICE} BYN)`} variant="outline" onPress={() => setSpreads(Math.min(MAX_SPREADS, spreads + 1))} />
        </View>
        <View style={styles.row}><Text style={styles.bold}>Количество альбомов:</Text><Stepper value={qty} onChange={setQty} /></View>
      </Card>

      <Card>
        <Text style={styles.text}>Выбранные параметры: {fmtName} · {spreads} разв.</Text>
        <View style={styles.row}><Text style={styles.bold}>Итоговая стоимость:</Text><Text style={styles.total}>{money(total)}</Text></View>
        <Text style={[styles.text, { fontSize: 12, opacity: 0.7 }]}>Цена альбома = обложка + формат + ламинация + бумага + {SPREAD_PRICE} BYN × разворотов, умножить на количество.</Text>
        <View style={[styles.row, { marginTop: 8 }]}>
          <Button label="В корзину" variant="outline" onPress={() => { toCart(); onGoCart(); }} />
          <Button label="Оформить заказ" onPress={() => { toCart(); onCheckout(); }} />
        </View>
      </Card>

      <Modal visible={preview} transparent animationType="fade" onRequestClose={() => setPreview(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.h2}>Разворот {spread + 1} из {spreads}</Text>
            <View style={styles.spreadBig}>
              {spreadPhotos(spread).map((p, i) => <PhotoPreview key={i} uri={p.uri} style={{ flex: 1, height: 200 }} />)}
              <View style={styles.fold} pointerEvents="none" />
            </View>
            <Text style={[styles.text, { fontSize: 12, opacity: 0.7 }]}>Демо-превью. Генерацию макета разворота подключим позже.</Text>
            <View style={[styles.row, { marginTop: 10 }]}>
              <Button label="← Назад" variant="outline" onPress={() => setSpread(Math.max(0, spread - 1))} />
              <Button label="Далее →" variant="outline" onPress={() => setSpread(Math.min(spreads - 1, spread + 1))} />
              <Button label="Закрыть" onPress={() => setPreview(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 15, color: colors.ink, lineHeight: 22 },
  bold: { fontSize: 16, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  h2: { fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 6 },
  h3: { fontSize: 16, fontWeight: '800', color: colors.ink },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink, marginTop: 14, marginBottom: 6 },
  total: { fontSize: 26, fontWeight: '800', color: colors.red },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  warn: { borderLeftWidth: 5, borderLeftColor: colors.red, paddingLeft: 10, backgroundColor: 'rgba(250,167,169,0.3)', paddingVertical: 6 },
  coverWrap: { alignSelf: 'center', marginVertical: 14, width: 170, height: 170, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.pink },
  cover: { width: 170, height: 170 },
  coverText: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 8, backgroundColor: 'rgba(56,51,56,0.65)' },
  coverTitle: { color: colors.cream, fontWeight: '800', fontSize: 14 },
  sp: { borderWidth: 2, borderColor: 'transparent', borderRadius: 10, padding: 2, alignItems: 'center' },
  spText: { fontSize: 11, color: colors.ink, marginTop: 2 },
  modalBg: { flex: 1, backgroundColor: 'rgba(56,51,56,0.6)', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: colors.cream, borderRadius: 20, padding: 16 },
  spreadBig: { flexDirection: 'row', marginVertical: 10, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.pink },
  fold: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(56,51,56,0.4)' },
});
