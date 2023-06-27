import { Dataset, createPuppeteerRouter } from 'crawlee';
import fs from 'fs';
import path from 'path';

export const router = createPuppeteerRouter();

function getBmsIdFromUrl(url) {
    const regex = /\/bms\/(\d+)/;
    const match = url.match(regex);
    if (match) {
        return match[1];
    }
    return null;
}

router.addDefaultHandler(async ({ enqueueLinks, log }) => {
    log.info(`enqueueing new URLs`);
    await enqueueLinks({
        globs: ['https://www.xn--mngelmelder-l8a.de/**'],
        label: 'detail',
    });
});

router.addHandler('detail', async ({ request, page, log }) => {
    const title = await page.title();
    log.info(`${title}`, { url: request.loadedUrl });

    await Dataset.pushData({
        url: request.loadedUrl,
        title,
    });

    const bmsId = getBmsIdFromUrl(request.loadedUrl);
    if (bmsId) {
        const scrapedDataFolderPath = path.join('../', 'scraped_data');
        const folderPath = path.join(scrapedDataFolderPath, bmsId);
        const htmlFilePath = path.join(folderPath, `${bmsId}.html`);

        if (!fs.existsSync(htmlFilePath)) {
            const htmlContent = await page.content();
            fs.mkdirSync(folderPath, { recursive: true });
            fs.writeFileSync(htmlFilePath, htmlContent);
        }
    }
});

export async function crawlExistingBmsIds(crawler) {
    const scrapedDataFolderPath = path.join('../', 'scraped_data');
    const folderNames = fs.readdirSync(scrapedDataFolderPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    for (const folderName of folderNames) {
        const bmsId = folderName;
        const folderPath = path.join(scrapedDataFolderPath, folderName);
        const htmlFilePath = path.join(folderPath, `${bmsId}.html`);

        if (!fs.existsSync(htmlFilePath)) {
            const url = `https://www.xn--mngelmelder-l8a.de/bms/${bmsId}`;
            await crawler.run([url]);
        }
    }
}
