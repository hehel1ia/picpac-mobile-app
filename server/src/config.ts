import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

// Сообщения валидации zod по-русски
z.config(z.locales.ru());

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(5001),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  console.error(`Ошибка настройки. Проверьте server/.env (образец: .env.example):\n${problems}`);
  process.exit(1);
}

export const config = parsed.data;
