import { drizzle } from 'drizzle-orm/sqlite-proxy';

/**
 * Local-dev access to the production D1 database over Cloudflare's D1 HTTP
 * API, so `pnpm dev` and the deployed Worker share one database.
 *
 * Used only when there is no Workers `DB` binding (i.e. running under Node)
 * and D1_REMOTE_HTTP=true. Credentials:
 *   - CLOUDFLARE_ACCOUNT_ID + D1_DATABASE_ID (from .env.development)
 *   - CLOUDFLARE_API_TOKEN if set, otherwise the logged-in wrangler session
 *     (`wrangler auth token`, refreshed automatically).
 *
 * Statements run one by one — no batch atomicity. Fine for development.
 */

let cachedToken: { value: string; expiresAt: number } | null = null;
let pendingToken: Promise<string> | null = null;

async function fetchWranglerToken(): Promise<string> {
  const { execFile } = await import('node:child_process');
  const output = await new Promise<string>((resolve, reject) =>
    execFile(
      'npx',
      ['wrangler', 'auth', 'token'],
      { timeout: 60_000 },
      (error, stdout) => (error ? reject(error) : resolve(stdout))
    )
  );
  const value = output.trim().split(/\s+/).pop() || '';
  if (!value) {
    throw new Error(
      'Could not get a Cloudflare token: run `npx wrangler login`'
    );
  }
  // `wrangler auth token` may hand back a token that expires in a few
  // minutes (it only refreshes once expired), so keep the cache short; auth
  // failures also force a refresh in rawQuery.
  cachedToken = { value, expiresAt: Date.now() + 5 * 60_000 };
  return value;
}

async function getToken(forceRefresh = false): Promise<string> {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  if (!forceRefresh && cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }
  // Share one in-flight `wrangler auth token` across concurrent queries.
  pendingToken ??= fetchWranglerToken().finally(() => {
    pendingToken = null;
  });
  return pendingToken;
}

async function rawQuery(sql: string, params: unknown[]) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.D1_DATABASE_ID;
  if (!accountId || !databaseId) {
    throw new Error(
      'D1_REMOTE_HTTP needs CLOUDFLARE_ACCOUNT_ID and D1_DATABASE_ID in .env.development'
    );
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/raw`;

  let lastError: unknown;
  for (const retry of [false, true]) {
    let resp: Response;
    try {
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${await getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql, params }),
      });
    } catch (error) {
      // Network blip (e.g. a local proxy dropping the connection): retry once.
      lastError = error;
      continue;
    }
    // Expired or revoked token: refresh it and retry once.
    if ((resp.status === 401 || resp.status === 403) && !retry) {
      cachedToken = null;
      continue;
    }
    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.success) {
      const message =
        data?.errors?.map((e: any) => e.message).join('; ') ||
        `D1 HTTP ${resp.status}`;
      console.error(`[d1-http] ${message}`);
      throw new Error(message);
    }
    return (data.result?.[0]?.results?.rows ?? []) as unknown[][];
  }
  console.error('[d1-http] request failed', lastError);
  throw lastError instanceof Error
    ? lastError
    : new Error('D1 HTTP authentication failed');
}

let instance: ReturnType<typeof drizzle> | null = null;

export function createD1HttpDb() {
  if (instance) return instance;
  instance = drizzle(
    async (sql, params, method) => {
      const rows = await rawQuery(sql, params);
      // `get` expects a single row (or undefined), everything else a list.
      return { rows: method === 'get' ? (rows[0] as any) : rows };
    },
    async (queries: { sql: string; params: any[]; method: string }[]) => {
      const results = [];
      for (const q of queries) {
        const rows = await rawQuery(q.sql, q.params);
        results.push({ rows: q.method === 'get' ? (rows[0] as any) : rows });
      }
      return results;
    }
  );
  return instance;
}
