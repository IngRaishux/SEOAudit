// Quick smoke-test: crawl a single URL and print the SEO analysis result
const targetUrl = process.argv[2];

if (!targetUrl) {
  console.error('Usage: tsx scripts/test-crawl.ts <url>');
  process.exit(1);
}

console.log(`Crawling: ${targetUrl}`);

// TODO: import and call the crawler once apps/crawler is wired up
// import { crawlPage } from '../apps/crawler/src/crawler/index.js';
// const result = await crawlPage(targetUrl);
// console.log(JSON.stringify(result, null, 2));

console.log('Crawler not wired up yet — implement apps/crawler/src/crawler first.');
