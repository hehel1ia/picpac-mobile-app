import { app } from './app.js';
import { config } from './config.js';

app.listen(config.PORT, () => {
  console.log(`Сервер запущен: http://localhost:${config.PORT}`);
});
