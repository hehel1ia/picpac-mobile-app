import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { supabase } from './src/lib/supabase';

export default function App() {
  const [msg, setMsg] = useState('Проверяем подключение…');
  useEffect(() => {
    supabase.auth.getSession().then(({ error }) =>
      setMsg(error ? 'Ошибка: ' + error.message : 'Supabase подключён'));
  }, []);
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>{msg}</Text></View>;
}