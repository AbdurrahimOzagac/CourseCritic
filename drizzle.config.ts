import { defineConfig } from 'drizzle-kit';

// Sadece migration üretmek için kullanılır (`npm run db:generate`).
// Migration'lar wrangler ile uygulanır: `npm run db:migrate:local` / `npm run db:migrate:remote`.
export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './migrations',
	dialect: 'sqlite',
	verbose: true,
	strict: true
});
