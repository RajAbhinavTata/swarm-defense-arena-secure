import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

export class UnsafeTargetError extends Error {}

function ipv4Number(address: string): number {
  return address.split('.').reduce((value, part) => (value << 8) + Number(part), 0) >>> 0;
}

function inV4Range(address: string, base: string, bits: number): boolean {
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipv4Number(address) & mask) === (ipv4Number(base) & mask);
}

export function isPrivateAddress(address: string): boolean {
  const normalized = address.toLowerCase().split('%')[0];
  if (isIP(normalized) === 4) {
    return [
      ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
      ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.168.0.0', 16],
      ['198.18.0.0', 15], ['224.0.0.0', 4], ['240.0.0.0', 4],
    ].some(([base, bits]) => inV4Range(normalized, String(base), Number(bits)));
  }
  if (isIP(normalized) === 6) {
    return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') ||
      normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') ||
      normalized.startsWith('feb') || normalized.startsWith('ff') || normalized.startsWith('::ffff:127.') ||
      normalized.startsWith('::ffff:10.') || normalized.startsWith('::ffff:192.168.');
  }
  return true;
}

export async function validateTargetUrl(rawUrl: string, options: { allowLoopback?: boolean } = {}): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new UnsafeTargetError('targetUrl must be a valid URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new UnsafeTargetError('Only HTTP(S) targets are supported.');
  if (url.username || url.password) throw new UnsafeTargetError('Credentials in target URLs are not allowed.');

  const allowPrivate = process.env.SENTINEL_ALLOW_PRIVATE_TARGETS === 'true';
  const localName = url.hostname === 'localhost' || url.hostname.endsWith('.localhost');
  if (url.protocol !== 'https:' && !localName && !allowPrivate) {
    throw new UnsafeTargetError('External targets must use HTTPS.');
  }

  const addresses = await lookup(url.hostname, { all: true, verbatim: true }).catch(() => []);
  if (addresses.length === 0) throw new UnsafeTargetError('Target hostname could not be resolved.');
  if (!allowPrivate && !(options.allowLoopback && localName) && addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new UnsafeTargetError('Private, loopback, link-local, multicast, and reserved targets are blocked.');
  }
  return url;
}

export async function installNetworkGuard(
  context: import('playwright').BrowserContext,
  options: { allowLoopback?: boolean } = {},
): Promise<void> {
  const cache = new Map<string, boolean>();
  await context.route('**/*', async (route) => {
    const requestUrl = route.request().url();
    if (/^(data|blob|about):/.test(requestUrl)) return route.continue();
    try {
      const hostname = new URL(requestUrl).hostname;
      let allowed = cache.get(hostname);
      if (allowed === undefined) {
        await validateTargetUrl(requestUrl, options);
        allowed = true;
        cache.set(hostname, true);
      }
      return route.continue();
    } catch {
      return route.abort('blockedbyclient');
    }
  });
}
