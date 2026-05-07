import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { crawlSite } from '../apps/crawler/src/index.js';

async function main() {
  const args = process.argv.slice(2);
  const renderJs = args.includes('--render');
  const positional = args.filter((a) => !a.startsWith('--'));
  const siteUrl = positional[0];
  const maxUrls = positional[1] ? Number(positional[1]) : undefined;

  if (!siteUrl) {
    console.error('Usage: tsx scripts/test-crawl.ts <site-url> [maxUrls] [--render]');
    process.exit(1);
  }

  console.log(
    `Crawling ${siteUrl} (max=${maxUrls ?? 'all'}, renderJs=${renderJs})...\n`
  );

  const result = await crawlSite(siteUrl, {
    maxUrls,
    concurrency: 5,
    renderJs,
    onProgress: (processed, total) => {
      process.stdout.write(`\rProcesando ${processed} / ${total} URLs`);
    },
  });

  console.log('\n\nDone.');
  console.log(`Sitemap: ${result.sitemapUrl}`);
  console.log(`Pages crawled: ${result.pages.length}`);

  const outDir = resolve('data/exports');
  mkdirSync(outDir, { recursive: true });

  const fileName = `crawl-${new URL(siteUrl).hostname}-${Date.now()}.json`;
  const outPath = resolve(outDir, fileName);
  writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');

  console.log(`Saved to: ${outPath}`);
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
