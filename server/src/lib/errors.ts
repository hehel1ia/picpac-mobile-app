export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL';

/** Ошибка, текст которой безопасно показать пользователю. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

interface DbError {
  code?: string;
  message: string;
}

/**
 * Превращает ошибку Postgres/PostgREST в HTTP-ошибку.
 *   28000 -> 401, 42501 -> 403, P0002 -> 404, 22023 -> 422
 * Сообщения 28000, P0002, 22023 написаны нами в миграции и безопасны для показа.
 */
export function fromDbError(e: DbError): AppError {
  switch (e.code) {
    case '28000':
      return new AppError(401, 'UNAUTHORIZED', e.message);
    case '42501':
      return new AppError(403, 'FORBIDDEN', 'Недостаточно прав');
    case 'P0002':
      return new AppError(404, 'NOT_FOUND', e.message);
    case 'PGRST116':
      return new AppError(404, 'NOT_FOUND', 'Данные не найдены');
    case '22023':
      return new AppError(422, 'VALIDATION', e.message);
    case '22P02':
      return new AppError(422, 'VALIDATION', 'Некорректный формат данных');
    case '23505':
      return new AppError(409, 'CONFLICT', 'Такая запись уже существует');
    case '23503':
      return new AppError(422, 'VALIDATION', 'Связанная запись не найдена');
    case '23514':
      return new AppError(422, 'VALIDATION', 'Значение не прошло проверку');
    default:
      console.error('[db] необработанная ошибка:', e.code, e.message);
      return new AppError(500, 'INTERNAL', 'Ошибка сервера, попробуйте ещё раз');
  }
}

/** Возвращает data или бросает ошибку. Если data пустая, это 404. */
export function unwrap<T>(res: { data: T | null; error: DbError | null }): T {
  if (res.error) throw fromDbError(res.error);
  if (res.data === null) throw new AppError(404, 'NOT_FOUND', 'Данные не найдены');
  return res.data;
}

/** Для запросов без результата (rpc void, delete): бросает ошибку, если она есть. */
export function ensure(res: { error: DbError | null }): void {
  if (res.error) throw fromDbError(res.error);
}
