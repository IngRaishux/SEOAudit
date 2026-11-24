import { isIP } from 'node:net';
import { lookup } from 'node:dns/promises';

export type Resolver = (hostname: string) => Promise<string[]>;

export type PublicUrlError =
  | 'format'
  | 'protocol'
  | 'credentials'
  | 'port'
  | 'internal-host'
  | 'ip-literal'
  | 'private-address'
  | 'unresolvable';

export type PublicUrlResult = { ok: true; url: URL } | { ok: false; error: PublicUrlError };

const defaultResolver: Resolver = async (hostname) =>
  (await lookup(hostname, { all: true, verbatim: true })).map((entry) => entry.address);

// Nombres que nunca son sitios públicos
const INTERNAL_SUFFIXES = ['.localhost', '.local', '.internal', '.lan', '.home.arpa', '.intranet', '.corp'];

// [red, bits] de rangos no públicos IPv4: propio, privados, CGNAT, loopback, link-local (metadata de nubes),
// documentación, benchmark, multicast y reservados
const PRIVATE_V4: Array<[string, number]> = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

function v4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => acc * 256 + Number(octet), 0);
}

export function isPrivateIPv4(ip: string): boolean {
  const value = v4ToInt(ip);
  return PRIVATE_V4.some(([network, bits]) => {
    const size = 2 ** (32 - bits);
    const start = v4ToInt(network);
    return value >= start && value < start + size;
  });
}

/** Expande una IPv6 a sus 8 grupos de 16 bits (admite "::" y sufijo IPv4). */
function expandIPv6(ip: string): number[] {
  let address = ip.toLowerCase().split('%')[0];
  const v4Suffix = address.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (v4Suffix) {
    const n = v4ToInt(v4Suffix[1]);
    address = address.slice(0, -v4Suffix[1].length) + `${(n >>> 16).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const [head, tail] = address.split('::');
  const headGroups = head ? head.split(':') : [];
  const tailGroups = tail !== undefined && tail !== '' ? tail.split(':') : [];
  const missing = address.includes('::') ? 8 - headGroups.length - tailGroups.length : 0;
  return [...headGroups, ...Array(missing).fill('0'), ...tailGroups].map((g) => parseInt(g, 16));
}

export function isPrivateIPv6(ip: string): boolean {
  const g = expandIPv6(ip);
  if (g.length !== 8 || g.some(Number.isNaN)) return true;
  const allZeroUntil = (n: number) => g.slice(0, n).every((x) => x === 0);
  if (allZeroUntil(7) && (g[7] === 0 || g[7] === 1)) return true; // :: y ::1
  // IPv4 mapeada (::ffff:a.b.c.d), compatible (::a.b.c.d) y NAT64 (64:ff9b::/96): se mira la IPv4
  const embeddedV4 = () => `${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`;
  if (allZeroUntil(5) && (g[5] === 0xffff || g[5] === 0)) return isPrivateIPv4(embeddedV4());
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return isPrivateIPv4(embeddedV4());
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 locales únicas
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentación
  return false;
}

export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIPv4(ip);
  if (version === 6) return isPrivateIPv6(ip);
  return true;
}

/**
 * Valida que una URL apunte a un sitio público: http(s), sin credenciales, puerto estándar,
 * nombre de dominio (no IP) y que todas sus direcciones resuelvan a IPs públicas.
 */
export async function validatePublicUrl(input: string, resolve: Resolver = defaultResolver): Promise<PublicUrlResult> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return { ok: false, error: 'format' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { ok: false, error: 'protocol' };
  if (url.username || url.password) return { ok: false, error: 'credentials' };
  if (url.port !== '') return { ok: false, error: 'port' };

  // WHATWG ya normaliza formas raras de IPv4 (0x7f.1, 2130706433) a 127.0.0.1
  const hostname = url.hostname.replace(/\.$/, '').toLowerCase();
  if (hostname.startsWith('[') || isIP(hostname)) return { ok: false, error: 'ip-literal' };
  if (hostname === 'localhost' || !hostname.includes('.') || INTERNAL_SUFFIXES.some((s) => hostname.endsWith(s))) {
    return { ok: false, error: 'internal-host' };
  }

  let addresses: string[];
  try {
    addresses = await resolve(hostname);
  } catch {
    return { ok: false, error: 'unresolvable' };
  }
  if (addresses.length === 0) return { ok: false, error: 'unresolvable' };
  if (addresses.some(isPrivateAddress)) return { ok: false, error: 'private-address' };

  return { ok: true, url };
}
