import { Image } from 'react-native';

const source = require('../../assets/logo.png');

export default function Logo({ height: h = 40 }: { height?: number }) {
  const resolved = Image.resolveAssetSource ? Image.resolveAssetSource(source) : null;
  const ratio = resolved?.width && resolved?.height ? resolved.width / resolved.height : 3;

  return (
    <Image
      source={source}
      style={{ height: h, aspectRatio: ratio, alignSelf: 'center' }}
      resizeMode="contain"
      accessibilityLabel="picPac.by"
    />
  );
}
