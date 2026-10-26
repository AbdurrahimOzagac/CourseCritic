// See https://svelte.dev/docs/kit/types#app.d.ts
import type { Db } from '#lib/server/db/index.ts';
import type { SessionUser } from '#lib/server/auth.ts';

declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Locals {
			db: Db;
			env: Env;
			user: SessionUser | null;
		}

		interface Error {
			message: string;
		}
	}
}

export {};
