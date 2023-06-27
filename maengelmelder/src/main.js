import { PuppeteerCrawler, ProxyConfiguration } from 'crawlee';
import { router, crawlExistingBmsIds } from './routes.js';

const startUrls = ['https://www.xn--mngelmelder-l8a.de/#pageid=1'];

const crawler = new PuppeteerCrawler({
    requestHandler: router,
    headless: false,
});

await crawler.run(startUrls);

await crawlExistingBmsIds(crawler);
