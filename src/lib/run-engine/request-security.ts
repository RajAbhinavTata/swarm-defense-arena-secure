import { timingSafeEqual } from 'node:crypto';

export class AccessError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function tokensEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function assertApiAccess(request: Request): void {
  const requestUrl = new URL(request.url);
  if (isLocalHostname(requestUrl.hostname)) return;

  const expected = process.env.ARENA_API_TOKEN?.trim();
  if (!expected) {
    throw new AccessError('Remote API access is disabled until ARENA_API_TOKEN is configured.', 403);
  }

  const authorization = request.headers.get('authorization') ?? '';
  const provided = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!provided || !tokensEqual(provided, expected)) throw new AccessError('Unauthorized.', 401);
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  if (!origin) return;
  if (origin !== new URL(request.url).origin) throw new AccessError('Cross-origin mutation rejected.', 403);
}

type RateEntry = { windowStartedAt: number; count: number };
const rateEntries = new Map<string, RateEntry>();

export function assertStartRateLimit(request: Request): void {
  const limit = Math.max(1, Number(process.env.ARENA_MAX_RUNS_PER_MINUTE ?? 6));
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const current = rateEntries.get(key);
  if (!current || now - current.windowStartedAt >= 60_000) {
    rateEntries.set(key, { windowStartedAt: now, count: 1 });
    return;
  }
  if (current.count >= limit) throw new AccessError('Run creation rate limit exceeded.', 429);
  current.count += 1;
}
