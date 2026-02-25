// ─────────────────────────────────────────────────────────
//  test-scraper.js — Local test for the Puppeteer scraper
// ─────────────────────────────────────────────────────────
// Run: node test-scraper.js https://example-college.edu

require('dotenv').config(); // Load env for Cloudinary if testing upload
const scraperService = require('./services/scraper.service');

const targetUrl = process.argv[2] || 'https://www.amity.edu/';

(async () => {
    try {
        console.log(`🚀 Starting local scraper test for: ${targetUrl}\n`);
        const start = Date.now();

        // We can mock Cloudinary uploads to false inside the service if we just want JSON,
        // but running it fully tests the cloudinary config too.
        const result = await scraperService.scrapeCollege(targetUrl);

        console.log('\n✅ Scrape Successful!');
        console.log(JSON.stringify(result, null, 2));

        const duration = (Date.now() - start) / 1000;
        console.log(`\n⏳ Time taken: ${duration} seconds`);

        process.exit(0);
    } catch (err) {
        console.error(`\n❌ Scrape Failed:`, err);
        process.exit(1);
    }
})();
