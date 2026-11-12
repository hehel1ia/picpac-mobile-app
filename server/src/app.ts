import cors from 'cors';
import express from 'express';
import { errorHandler, notFound } from './middleware/error.js';
import { requestLog } from './middleware/requestLog.js';
import { api } from './routes/index.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(requestLog);

app.use('/api', api);

app.use(notFound);
app.use(errorHandler);
