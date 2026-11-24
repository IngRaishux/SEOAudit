import { describe, expect, it, vi } from 'vitest';
import { isSameHost, sameHostFetch } from './sameHost';

const BASE = 'https://hotel.example.com/';

describe('isSameHost', () => {
  it.each(['https://hotel.example.com/a', 'http://hotel.example.com/', 'https://www.hotel.example.com/b', 'https://HOTEL.example.com./'])(
    'acepta %s',
    (url) => expect(isSameHost(url, BASE)).toBe(true),
  );

  it.each(['https://otro.com/', 'https://sub.hotel.example.com/', 'https://hotel.example.com:8080/', 'ftp://hotel.example.com/', 'no es url'])(
    'rechaza %s',
    (url) => expect(isSameHost(url, BASE)).toBe(false),
  );
});

describe('sameHostFetch', () => {
  const redirect = (location: string) => new Response(null, { status: 301, headers: { location } });

  it('sigue redirecciones dentro del host', async () => {
    const inner = vi.fn(async (url: string) => (url.endsWith('/old') ? redirect('/new') : new Response('ok')));
    const res = await sameHostFetch(BASE, inner as unknown as typeof fetch)('https://hotel.example.com/old');
    expect(await res.text()).toBe('ok');
    expect(inner).toHaveBeenLastCalledWith('https://hotel.example.com/new', expect.objectContaining({ redirect: 'manual' }));
  });

  it('bloquea una redirección hacia otro host sin pedirlo', async () => {
    const inner = vi.fn(async () => redirect('http://169.254.169.254/latest/meta-data/'));
    await expect(sameHostFetch(BASE, inner as unknown as typeof fetch)('https://hotel.example.com/robots.txt')).rejects.toThrow(/Blocked/);
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it('bloquea una URL inicial de otro host', async () => {
    const inner = vi.fn();
    await expect(sameHostFetch(BASE, inner as unknown as typeof fetch)('http://localhost/sitemap.xml')).rejects.toThrow(/Blocked/);
    expect(inner).not.toHaveBeenCalled();
  });

  it('corta los bucles de redirección', async () => {
    const inner = vi.fn(async () => redirect('/loop'));
    await expect(sameHostFetch(BASE, inner as unknown as typeof fetch, 3)('https://hotel.example.com/loop')).rejects.toThrow(/Too many/);
  });
});
