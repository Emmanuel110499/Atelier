import { createRepository } from './db.js';
import { createApp } from './app.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL est obligatoire. Voir .env.example.');
const repository = createRepository(process.env.DATABASE_URL);
await repository.init();
const server = createApp(repository);
const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
server.listen(port, host, () => console.log(`Atelier API : http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => { await repository.close(); clearTimeout(timeout); process.exit(0); });
  });
}
