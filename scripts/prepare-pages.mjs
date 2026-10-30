import { readFile, writeFile, appendFile, readdir, rm, stat } from 'node:fs/promises';
import { resolve, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(appRoot, 'dist');
const cloudflareProduction = process.argv.includes('--cloudflare') && process.env.CF_PAGES === '1' &&
  Boolean(process.env.SITE_URL) && Boolean(process.env.PAGES_PRODUCTION_BRANCH) &&
  process.env.CF_PAGES_BRANCH === process.env.PAGES_PRODUCTION_BRANCH;
const production = process.argv.includes('--production') || cloudflareProduction;
let site;
if (production) {
  try {
    site = new URL(process.env.SITE_URL);
    if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash || site.username || site.password || site.hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(site.hostname)) throw new Error();
  } catch {
    throw new Error('Release requires SITE_URL=https://your-real-domain with no path, credentials or query.');
  }
}

// Remove only obsolete video copies from dist. Never touch public or original footage.
for (const number of [1, 2, 3]) {
  for (const suffix of ['', '-web']) {
    const target = resolve(output, `media/flight/${number}${suffix}.mp4`);
    if (!target.startsWith(output + sep)) throw new Error('Unsafe output path');
    await rm(target, { force: true });
  }
}

let html = await readFile(join(output, 'index.html'), 'utf8');
if (production) {
  html = html.replace('content="noindex,nofollow"', 'content="index,follow"');
  html = html.replace('</head>', `  <link rel="canonical" href="${site.origin}/" />\n    <meta property="og:url" content="${site.origin}/" />\n  </head>`);
  await writeFile(join(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`);
  await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${site.origin}/</loc></url></urlset>\n`);
  await writeFile(join(output, '_redirects'), `https://chishuxiao-personal-site.pages.dev/* ${site.origin}/:splat 301\n`);
}
await writeFile(join(output, 'index.html'), html);
await writeFile(join(output, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n${production ? '' : '  X-Robots-Tag: noindex, nofollow\n'}/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/media/*\n  Cache-Control: public, max-age=3600\n/\n  Cache-Control: public, max-age=0, must-revalidate\n/index.html\n  Cache-Control: public, max-age=0, must-revalidate\n`);
await appendFile(join(output, '_headers'), '/media/flight/hls/*.m3u8\n  Content-Type: application/vnd.apple.mpegurl\n/media/flight/hls/*.m4s\n  Content-Type: video/mp4\n');
// Pages would otherwise serve the SPA HTML for missing images/videos as well.
await writeFile(join(output, '404.html'), '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>页面未找到 · 池树孝</title><body style="background:#0b0d10;color:#eef2f6;font:18px system-ui;padding:10vw"><h1>页面未找到</h1><p>这个地址暂时没有内容。</p><a href="/" style="color:#a7c8ff">回到首页</a></body></html>');

let bytes = 0, files = 0;
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await inspect(path); continue; }
    const info = await stat(path);
    if (info.size > 25 * 1024 * 1024) throw new Error(`Pages asset exceeds 25 MiB: ${relative(output, path)}`);
    files++; bytes += info.size;
  }
}
await inspect(output);
console.log(`Pages ${production ? 'release' : 'preview'} ready: ${files} files, ${(bytes / 1024 / 1024).toFixed(2)} MiB; every asset <=25 MiB.`);
