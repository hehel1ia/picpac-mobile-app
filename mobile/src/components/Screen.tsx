import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

// Круглый градиент #FAA7A9 → прозрачный
function Blob({ id, size, style }: { id: string; size: number; style: object }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.pink} stopOpacity={1} />
            <Stop offset="1" stopColor={colors.pink} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

// Общий фон экрана: кремовый с тремя розовыми круглыми градиентами
export default function Screen({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <Blob id="b1" size={380} style={{ top: -140, left: -140 }} />
      <Blob id="b2" size={300} style={{ top: 340, right: -150 }} />
      <Blob id="b3" size={360} style={{ bottom: -120, left: -120 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
  content: { padding: 16, paddingBottom: 40, gap: 20 },
});
