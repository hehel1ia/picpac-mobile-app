import { useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Canvas, ColorMatrix, Image as SkImage, useImage } from '@shopify/react-native-skia';
import { buildMatrix, isIdentity } from '../lib/colorMatrix';
import { Adjust, Filter, NO_ADJUST } from '../types/order';

interface Props { uri: string; filter?: Filter; adjust?: Adjust; style?: StyleProp<ViewStyle> }

export default function PhotoPreview({ uri, filter = 'Оригинал', adjust = NO_ADJUST, style }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const img = useImage(uri);
  const m = buildMatrix(filter, adjust);
  const plain = isIdentity(m) || !img || !size.w;

  return (
    <View
      style={[{ overflow: 'hidden' }, style]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {plain ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode='cover' />
      ) : (
        <Canvas style={StyleSheet.absoluteFill}>
          <SkImage image={img} x={0} y={0} width={size.w} height={size.h} fit='cover'>
            <ColorMatrix matrix={m} />
          </SkImage>
        </Canvas>
      )}
    </View>
  );
}