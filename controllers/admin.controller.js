// ─────────────────────────────────────────────────────────
//  controllers/admin.controller.js — Admin specific operations
// ─────────────────────────────────────────────────────────
const { query } = require('../db');
const scraperService = require('../services/scraper.service');

// ─── POST /api/v1/admin/scrape-and-create ────────────────
// Admin only — Autogenerate a college from a website URL
exports.scrapeAndCreate = async (req, res, next) => {
    try {
        const { target_url } = req.body;

        if (!target_url) {
            return res.status(400).json({
                success: false,
                message: 'target_url is required'
            });
        }

        // 1. Run the headless scraper service
        const scrapedData = await scraperService.scrapeCollege(target_url);

        // 2. Insert into Supabase
        const result = await query(
            `INSERT INTO colleges
             (name, description, city, state, country,
              logo_url, cover_image_url, website,
              type, established_year, rating, is_featured)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             RETURNING *`,
            [
                scrapedData.name,
                scrapedData.description || null,
                scrapedData.city || null,
                scrapedData.state || null,
                scrapedData.country || 'India',
                scrapedData.logo_url || null,
                scrapedData.cover_image_url || null,
                scrapedData.website || null,
                scrapedData.type || 'Private',
                scrapedData.established_year || null,
                scrapedData.rating || 0,
                scrapedData.is_featured || false
            ]
        );

        res.status(201).json({
            success: true,
            message: 'College generated successfully',
            data: result.rows[0]
        });
    } catch (err) {
        // Pass to global error handler (e.g., if scraping fails)
        next(err);
    }
};
