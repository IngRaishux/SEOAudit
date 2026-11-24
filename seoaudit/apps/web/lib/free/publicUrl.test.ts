import { describe, expect, it } from 'vitest';
import { isPrivateAddress, validatePublicUrl, type Resolver } from './publicUrl';

const dns: Record<string, string[]> = {
  'hotel.example.com': ['93.184.216.34'],
  'dual.example.com': ['93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946'],
  'rebind.example.com': ['10.0.0.8'],
  'mixto.example.com': ['93.184.216.34', '127.0.0.1'],
  'v6local.example.com': ['fd00::1'],
};
const resolver: Resolver = async (host) => {
  if (!(host in dns)) throw new Error('ENOTFOUND');
  return dns[host];
};
const check = (url: string) => validatePublicUrl(url, resolver);

describe('isPrivateAddress', () => {
  it.each([
    '127.0.0.1',
    '10.0.0.1',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.10',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '::1',
    '::',
    'fe80::1',
    'fd12:3456::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '64:ff9b::a00:1',
  ])('%s no es pública', (ip) => expect(isPrivateAddress(ip)).toBe(true));

  it.each(['93.184.216.34', '8.8.8.8', '172.32.0.1', '100.128.0.1', '2606:2800:220:1:248:1893:25c8:1946', '::ffff:8.8.8.8'])(
    '%s es pública',
    (ip) => expect(isPrivateAddress(ip)).toBe(false),
  );
});

describe('validatePublicUrl', () => {
  it('acepta un dominio público, con o sin barra y con ruta', async () => {
    expect((await check('https://hotel.example.com')).ok).toBe(true);
    expect((await check('http://hotel.example.com/es/')).ok).toBe(true);
    expect((await check('  https://dual.example.com  ')).ok).toBe(true);
  });

  it.each([
    ['no es una url', 'format'],
    ['ftp://hotel.example.com', 'protocol'],
    ['javascript:alert(1)', 'protocol'],
    ['https://user:pass@hotel.example.com', 'credentials'],
    ['https://hotel.example.com:8080', 'port'],
    ['http://localhost:3000', 'port'],
    ['http://localhost', 'internal-host'],
    ['http://app.localhost', 'internal-host'],
    ['http://intranet', 'internal-host'],
    ['http://printer.local', 'internal-host'],
    ['http://127.0.0.1', 'ip-literal'],
    ['http://192.168.1.10', 'ip-literal'],
    ['http://169.254.169.254/latest/meta-data', 'ip-literal'],
    ['http://0x7f.1', 'ip-literal'],
    ['http://2130706433', 'ip-literal'],
    ['http://[::1]', 'ip-literal'],
    ['http://[fe80::1]', 'ip-literal'],
    ['https://rebind.example.com', 'private-address'],
    ['https://mixto.example.com', 'private-address'],
    ['https://v6local.example.com', 'private-address'],
    ['https://no-existe.example.com', 'unresolvable'],
  ])('rechaza %s (%s)', async (url, error) => {
    expect(await check(url)).toEqual({ ok: false, error });
  });
});
