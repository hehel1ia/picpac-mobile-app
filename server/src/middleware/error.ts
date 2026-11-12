import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Маршрут не найден: ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof z.ZodError) {
    appError = new AppError(
      422,
      'VALIDATION',
      'Проверьте введённые данные',
      err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    );
  } else if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.parse.failed') {
    appError = new AppError(400, 'BAD_REQUEST', 'Некорректный JSON в запросе');
  } else if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.too.large') {
    appError = new AppError(413, 'PAYLOAD_TOO_LARGE', 'Запрос слишком большой');
  } else {
    console.error('[error]', err);
    appError = new AppError(500, 'INTERNAL', 'Что-то пошло не так, попробуйте ещё раз');
  }

  const body: { code: string; message: string; details?: unknown } = {
    code: appError.code,
    message: appError.message,
  };
  if (appError.details !== undefined) body.details = appError.details;

  res.status(appError.status).json({ error: body });
};
