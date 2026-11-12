import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Photo } from '../types/order';

// Открывает галерею телефона и возвращает выбранные JPEG/PNG.
export async function pickPhotos(limit = 100): Promise<Photo[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Нет доступа к галерее', 'Разрешите доступ к фото в настройках телефона и попробуйте снова.');
    return [];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: limit, quality: 1,
  });
  if (res.canceled) return [];
  const ok = res.assets.filter((a) => !a.mimeType || ['image/jpeg', 'image/png'].includes(a.mimeType));
  const skipped = res.assets.length - ok.length;
  if (skipped > 0) Alert.alert('Часть файлов пропущена', `Поддерживаются только JPEG и PNG. Пропущено файлов: ${skipped}.`);
  return ok.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
}
