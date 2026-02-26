// ─────────────────────────────────────────────────────────
//  services/scraper.service.js — College Page Generator
// ─────────────────────────────────────────────────────────
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const { uploadToCloudinary } = require('../middleware/upload');

/**
 * Downloads a file from a URL to a Buffer string.
 */
const downloadFileToBuffer = async (url) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (err) {
        console.warn(`⚠️ Failed to download ${url}: ${err.message}`);
        return null;
    }
};

/**
 * Scrapes a target URL and extracts standardized college data.
 * @param {string} url - The target college website to scrape
 */
exports.scrapeCollege = async (url) => {
    let browser;
    try {
        console.log(`🤖 [Scraper] Launching Puppeteer for: ${url}`);

        // Use aggressive args to speed up rendering and fit Render's 512MB RAM free tier
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process',
                '--no-zygote',
                '--disable-gpu',
                '--js-flags="--max-old-space-size=256"'
            ]
        });

        const page = await browser.newPage();

        // Deep optimization: block unnecessary resources from ever downloading into RAM
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const rt = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media', 'websocket'].includes(rt)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Set a realistic viewport and user agent
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Go to URL and wait for DOM, don't wait for all background network requests to save RAM
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const html = await page.content();
        const $ = cheerio.load(html);

        // ─── 1. EXTRACT DATA ─────────────────────────────────

        // Name: try h1, else meta title, else title
        let name = $('h1').first().text().trim() ||
            $('meta[property="og:title"]').attr('content') ||
            $('title').text().trim().split('|')[0].trim();

        // Description: try meta description, else grab paragraphs from prominent divs
        let description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content');

        if (!description || description.length < 50) {
            // Find a chunky paragraph that likely contains the "About" text
            const paras = $('p').map((i, el) => $(el).text().trim()).get();
            const longestPara = paras.sort((a, b) => b.length - a.length)[0];
            if (longestPara && longestPara.length > 50) {
                description = longestPara;
            } else {
                description = "A premier educational institution dedicated to excellence in teaching and research.";
            }
        }

        // Try to guess city/state from footer or contact texts
        const bodyText = $('body').text();
        const cityMatch = bodyText.match(/(Mumbai|Delhi|Bangalore|Bengaluru|Hyderabad|Chennai|Kolkata|Pune|Ahmedabad)/i);
        const city = cityMatch ? cityMatch[1] : 'Unknown City';

        // Facilities (extract unordered lists that might be facilities)
        // We'll mock this slightly based on common college keywords if we can't find a clean list.
        const facilities = [];
        if (bodyText.toLowerCase().includes('hostel')) facilities.push('Hostel');
        if (bodyText.toLowerCase().includes('library')) facilities.push('Library');
        if (bodyText.toLowerCase().includes('wifi') || bodyText.toLowerCase().includes('wi-fi')) facilities.push('Campus Wi-Fi');
        if (bodyText.toLowerCase().includes('sports')) facilities.push('Sports Ground');
        if (bodyText.toLowerCase().includes('cafeteria')) facilities.push('Cafeteria');

        // Extract potential Logo URL
        let logoUrl = $('link[rel="icon"]').attr('href') ||
            $('link[rel="apple-touch-icon"]').attr('href') ||
            $('img[src*="logo"]').first().attr('src') ||
            $('meta[property="og:image"]').attr('content');

        // Resolve relative URLs
        if (logoUrl && !logoUrl.startsWith('http')) {
            logoUrl = new URL(logoUrl, url).href;
        }

        // Extract potential Cover Image (first large image)
        let coverImageUrl = $('meta[property="og:image"]').attr('content');
        if (!coverImageUrl) {
            // Find a hero image
            const firstImg = $('img').first().attr('src');
            if (firstImg) {
                coverImageUrl = firstImg.startsWith('http') ? firstImg : new URL(firstImg, url).href;
            }
        }

        // Extract Courses
        const courses = [];
        $('a, h2, h3, h4, li, p').each((i, el) => {
            const text = $(el).text().trim();
            if (text.match(/B\.Tech|M\.Tech|B\.Sc|M\.Sc|BBA|MBA|BCA|MCA|Ph\.D|Diploma/i) && text.length < 40) {
                if (!courses.includes(text)) courses.push(text);
            }
        });

        // Affiliation
        let affiliation = 'Public / Private University';
        if (bodyText.match(/AICTE|All India Council/i)) affiliation = 'AICTE Approved';
        else if (bodyText.match(/NBA /i)) affiliation = 'NBA Accredited';
        else if (bodyText.match(/NAAC/i)) affiliation = 'NAAC Accredited';
        else if (bodyText.match(/UGC/i)) affiliation = 'UGC Recognized';

        // Reviews
        let reviews_summary = 'Pioneering excellent standards of academic rigor and rich student life. High satisfaction reported.';
        if (bodyText.toLowerCase().includes('placement')) {
            reviews_summary = 'Highly rated for 100% placement track records and deep industry connections with top multinationals.';
        }

        // Fee structure
        let fee_structure = 'Contact admissions department for actual fee details.';
        const feeMatch = bodyText.match(/(?:INR|Rs\.?|\$)\s*([\d,LakhsKk]+(?:\s*-\s*[\d,LakhsKk]+)?)/i);
        if (feeMatch) {
            fee_structure = `Approx. ${feeMatch[0]} per academic year`;
        }

        // Compile base structured payload
        const payload = {
            name,
            description,
            city,
            state: city === 'Delhi' || city === 'New Delhi' ? 'Delhi' : 'State', // Simplified
            country: 'India',
            website: url,
            type: 'Private', // Default assumption
            established_year: parseInt($('body').text().match(/estd\.?\s*(\d{4})/i)?.[1] || '2000'),
            rating: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1), // Mock realistic rating
            is_featured: false,
            raw_logo_url: logoUrl,
            raw_cover_url: coverImageUrl,
            courses,
            affiliation,
            reviews_summary,
            fee_structure
        };

        console.log(`✅ [Scraper] Extraction complete for: ${name}`);

        // ─── 2. CLOUDINARY UPLOAD ────────────────────────────

        // We download the raw images directly and push to Cloudinary to get secure immutable URLs
        if (payload.raw_logo_url) {
            console.log(`☁️ [Scraper] Buffering & uploading Logo: ${payload.raw_logo_url}`);
            const buffer = await downloadFileToBuffer(payload.raw_logo_url);
            if (buffer) {
                const cl = await uploadToCloudinary(buffer, { folder: 'zplus/scraped_logos', resource_type: 'image' });
                payload.logo_url = cl.url;
            }
        }

        if (payload.raw_cover_url && payload.raw_cover_url !== payload.raw_logo_url) {
            console.log(`☁️ [Scraper] Buffering & uploading Cover: ${payload.raw_cover_url}`);
            const buffer = await downloadFileToBuffer(payload.raw_cover_url);
            if (buffer) {
                const cl = await uploadToCloudinary(buffer, { folder: 'zplus/scraped_covers', resource_type: 'image' });
                payload.cover_image_url = cl.url;
            }
        }

        // Clean up temporary tracking fields
        delete payload.raw_logo_url;
        delete payload.raw_cover_url;

        return payload;

    } catch (error) {
        console.error(`❌ [Scraper Error] ${error.message}`);
        throw new Error(`Failed to scrape website: ${error.message}`);
    } finally {
        if (browser) await browser.close();
    }
};
