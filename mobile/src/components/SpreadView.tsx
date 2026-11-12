import { Pressable, StyleSheet, Text, View } from 'react-native';
import PhotoPreview from './PhotoPreview';
import { colors } from '../theme';
import type { SlotRect } from '../types/order';
import type { Slot } from '../lib/spreads';

interface Props { slots: SlotRect[]; photos: Slot[]; aspect: number; onSlotPress?: (i: number) => void }

const pct = (v: number) => `${v * 100}%` as `${number}%`;

export default function SpreadView({ slots, photos, aspect, onSlotPress }: Props) {
  return (
    <View style={[styles.sheet, { aspectRatio: aspect }]}>
      {slots.map((s, i) => (
        <Pressable
          key={i}
          disabled={!onSlotPress}
          onPress={() => onSlotPress?.(i)}
          accessibilityLabel={`Фото ${i + 1}: нажмите, чтобы заменить`}
          style={{ position: 'absolute', left: pct(s.x), top: pct(s.y), width: pct(s.w), height: pct(s.h) }}
        >
          {photos[i]
            ? <PhotoPreview uri={photos[i]!.uri} style={{ flex: 1 }} />
            : <View style={styles.empty}><Text style={styles.plus}>+</Text></View>}
        </Pressable>
      ))}
      <View pointerEvents='none' style={styles.fold} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { width: '100%', backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.coral, borderRadius: 8, overflow: 'hidden' },
  empty: { flex: 1, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  plus: { fontSize: 28, fontWeight: '800', color: colors.cream },
  fold: { position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(56,51,56,0.25)' },
});