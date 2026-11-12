import { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors } from '../theme';

interface Props extends TextInputProps { label: string; error?: string }

export default function Input({ label, error, style, placeholderTextColor = '#9CA3AF', ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        accessibilityLabel={label}
        placeholderTextColor={placeholderTextColor}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        style={[
          styles.input,
          { borderColor: error || focused ? colors.red : colors.coral },
          style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.ink, fontWeight: '600' },
  input: { minHeight: 48, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, color: colors.ink, fontSize: 16 },
  error: { color: colors.red, fontSize: 13 },
});
