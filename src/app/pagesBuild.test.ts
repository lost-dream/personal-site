import { afterEach, expect, it } from 'vitest';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const fixtures: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'csy-pages-'));
  fixtures.push(root);
  mkdirSync(join(root, 'scripts'));
  mkdirSync(join(root, 'dist/media/flight'), { recursive: true });
  mkdirSync(join(root, 'public/media/flight'), { recursive: true });
  copyFileSync('scripts/prepare-pages.mjs', join(root, 'scripts/prepare-pages.mjs'));
  copyFileSync('index.html', join(root, 'dist/index.html'));
  copyFileSync('public/robots.txt', join(root, 'dist/robots.txt'));
  writeFileSync(join(root, 'dist/media/flight/2.mp4'), 'unused original copy');
  writeFileSync(join(root, 'public/media/flight/2.mp4'), 'protected original');
  writeFileSync(join(root, 'dist/media/flight/new-desktop.mp4'), 'keep current media');
  return {
    root,
    run: (release = false, url = '') => execFileSync(process.execPath, [join(root, 'scripts/prepare-pages.mjs'), ...(release ? ['--production'] : [])], { env: { ...process.env, SITE_URL: url }, encoding: 'utf8', stdio: 'pipe' }),
    cloudflare: (branch: string, url = '') => execFileSync(process.execPath, [join(root, 'scripts/prepare-pages.mjs'), '--cloudflare'], { env: { ...process.env, CF_PAGES: '1', CF_PAGES_BRANCH: branch, PAGES_PRODUCTION_BRANCH: 'codex/site-launch', SITE_URL: url }, encoding: 'utf8', stdio: 'pipe' }),
    read: (name: string) => readFileSync(join(root, 'dist', name), 'utf8'),
  };
}
afterEach(() => {
  for (const root of fixtures.splice(0)) {
    if (!resolve(root).startsWith(join(tmpdir(), 'csy-pages-'))) throw new Error('Unsafe fixture cleanup');
    rmSync(root, { recursive: true, force: true });
  }
});

it('prepares a non-indexable preview and prunes only obsolete output copies', () => {
  const f = fixture(); f.run();
  expect(f.read('index.html')).toContain('noindex,nofollow');
  expect(f.read('_headers')).toContain('X-Robots-Tag: noindex, nofollow');
  expect(f.read('robots.txt')).toContain('Disallow: /');
  expect(existsSync(join(f.root, 'dist/media/flight/2.mp4'))).toBe(false);
  expect(f.read('media/flight/new-desktop.mp4')).toBe('keep current media');
  expect(readFileSync(join(f.root, 'public/media/flight/2.mp4'), 'utf8')).toBe('protected original');
  expect(f.read('404.html')).toContain('页面未找到');
});

it('requires an HTTPS site origin before preparing a searchable release', () => {
  const f = fixture();
  for (const value of ['', 'http://portfolio.test', 'https://portfolio.test/path', 'https://portfolio.test/?a=1']) {
    expect(() => f.run(true, value)).toThrow();
  }
  expect(f.read('index.html')).toContain('noindex,nofollow');
  f.run(true, 'https://portfolio.test');
  expect(f.read('index.html')).toContain('rel="canonical" href="https://portfolio.test/"');
  expect(f.read('index.html')).toContain('content="index,follow"');
  expect(f.read('_headers')).not.toContain('X-Robots-Tag');
  expect(f.read('robots.txt')).toContain('Sitemap: https://portfolio.test/sitemap.xml');
  expect(f.read('sitemap.xml')).toContain('<loc>https://portfolio.test/</loc>');
});

it('fails preparation when an unhandled oversized resource remains', () => {
  const f = fixture();
  writeFileSync(join(f.root, 'dist/media/too-large.mp4'), Buffer.alloc(25 * 1024 * 1024 + 1));
  expect(() => f.run()).toThrow();
});

it('keeps branch previews private even when the production domain is configured', () => {
  const preview = fixture(); preview.cloudflare('codex/preview', 'https://portfolio.test');
  expect(preview.read('index.html')).toContain('noindex,nofollow');
  expect(preview.read('_headers')).toContain('X-Robots-Tag: noindex, nofollow');
  const pending = fixture(); pending.cloudflare('codex/site-launch');
  expect(pending.read('robots.txt')).toContain('Disallow: /');
  const production = fixture(); production.cloudflare('codex/site-launch', 'https://portfolio.test');
  expect(production.read('index.html')).toContain('rel="canonical" href="https://portfolio.test/"');
  expect(production.read('robots.txt')).toContain('Allow: /');
});
