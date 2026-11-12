import type { RequestHandler } from 'express';

export const requestLog: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}мс`);
  });
  next();
};
