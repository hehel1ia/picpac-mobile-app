import type { RequestHandler } from 'express';

/** Одна строка в консоль на каждый запрос: метод, путь, статус, время. */
export const requestLog: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}мс`);
  });
  next();
};
