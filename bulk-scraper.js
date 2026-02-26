require('dotenv').config();
const { scrapeCollege } = require('./services/scraper.service');
const { query } = require('./db');

// Disable standard logs to keep output clean initially
console.warn = () => { };

const colleges = [
    // IITs
    { url: 'http://www.iitb.ac.in', fallback: 'IIT Bombay' },
    { url: 'http://www.iitd.ac.in', fallback: 'IIT Delhi' },
    { url: 'http://www.iitm.ac.in', fallback: 'IIT Madras' },
    { url: 'http://www.iitk.ac.in', fallback: 'IIT Kanpur' },
    { url: 'http://www.iitkgp.ac.in', fallback: 'IIT Kharagpur' },
    { url: 'https://www.iitr.ac.in', fallback: 'IIT Roorkee' },
    { url: 'http://www.iitg.ac.in', fallback: 'IIT Guwahati' },
    { url: 'http://www.iith.ac.in', fallback: 'IIT Hyderabad' },
    { url: 'http://www.iitbbs.ac.in', fallback: 'IIT Bhubaneswar' },
    { url: 'http://www.iitgn.ac.in', fallback: 'IIT Gandhinagar' },
    { url: 'http://www.iiti.ac.in', fallback: 'IIT Indore' },
    { url: 'https://www.iitj.ac.in', fallback: 'IIT Jodhpur' },
    { url: 'https://www.iitp.ac.in', fallback: 'IIT Patna' },
    { url: 'https://www.iitrpr.ac.in', fallback: 'IIT Ropar' },
    { url: 'http://www.iitmandi.ac.in', fallback: 'IIT Mandi' },
    { url: 'https://www.iitbhu.ac.in', fallback: 'IIT (BHU) Varanasi' },
    { url: 'https://iitpkd.ac.in', fallback: 'IIT Palakkad' },
    { url: 'https://iittp.ac.in', fallback: 'IIT Tirupati' },
    { url: 'https://www.iitgoa.ac.in', fallback: 'IIT Goa' },
    { url: 'https://iitjammu.ac.in', fallback: 'IIT Jammu' },
    { url: 'https://www.iitdh.ac.in', fallback: 'IIT Dharwad' },
    { url: 'https://www.iitbhila.ac.in', fallback: 'IIT Bhilai' },
    { url: 'https://www.iitism.ac.in', fallback: 'IIT Dhanbad (ISM)' },

    // NITs
    { url: 'http://www.nita.ac.in', fallback: 'NIT Agartala' },
    { url: 'http://www.mnnit.ac.in', fallback: 'MNNIT Allahabad' },
    { url: 'http://www.nitandhra.ac.in', fallback: 'NIT Andhra Pradesh' },
    { url: 'http://www.nitap.ac.in', fallback: 'NIT Arunachal Pradesh' },
    { url: 'http://www.manit.ac.in', fallback: 'MANIT Bhopal' },
    { url: 'http://www.nitc.ac.in', fallback: 'NIT Calicut' },
    { url: 'http://www.nitdelhi.ac.in', fallback: 'NIT Delhi' },
    { url: 'http://www.nitdgp.ac.in', fallback: 'NIT Durgapur' },
    { url: 'http://www.nitgoa.ac.in', fallback: 'NIT Goa' },
    { url: 'http://www.nith.ac.in', fallback: 'NIT Hamirpur' },
    { url: 'http://www.mnit.ac.in', fallback: 'MNIT Jaipur' },
    { url: 'http://www.nitj.ac.in', fallback: 'NIT Jalandhar' },
    { url: 'http://www.nitjsr.ac.in', fallback: 'NIT Jamshedpur' },
    { url: 'http://www.nitkkr.ac.in', fallback: 'NIT Kurukshetra' },
    { url: 'http://www.nitmanipur.ac.in', fallback: 'NIT Manipur' },
    { url: 'http://www.nitm.ac.in', fallback: 'NIT Meghalaya' },
    { url: 'http://www.nitmz.ac.in', fallback: 'NIT Mizoram' },
    { url: 'http://www.nitnagaland.ac.in', fallback: 'NIT Nagaland' },
    { url: 'http://www.vnit.ac.in', fallback: 'VNIT Nagpur' },
    { url: 'http://www.nitp.ac.in', fallback: 'NIT Patna' },
    { url: 'http://www.nitpy.ac.in', fallback: 'NIT Puducherry' },
    { url: 'http://www.nitrr.ac.in', fallback: 'NIT Raipur' },
    { url: 'http://www.nitrkl.ac.in', fallback: 'NIT Rourkela' },
    { url: 'http://www.nitsikkim.ac.in', fallback: 'NIT Sikkim' },
    { url: 'http://www.nits.ac.in', fallback: 'NIT Silchar' },
    { url: 'http://www.nitsri.ac.in', fallback: 'NIT Srinagar' },
    { url: 'http://www.svnit.ac.in', fallback: 'SVNIT Surat' },
    { url: 'http://www.nitk.ac.in', fallback: 'NITK Surathkal' },
    { url: 'http://www.nitt.edu', fallback: 'NIT Tiruchirappalli' },
    { url: 'http://www.nituk.ac.in', fallback: 'NIT Uttarakhand' },
    { url: 'http://www.nitw.ac.in', fallback: 'NIT Warangal' },

    // IIITs
    { url: 'https://www.iiita.ac.in', fallback: 'IIIT Allahabad' },
    { url: 'http://www.iiitm.ac.in', fallback: 'ABV-IIITM Gwalior' },
    { url: 'http://www.iiitdmj.ac.in', fallback: 'IIITDM Jabalpur' },
    { url: 'http://www.iiitdm.ac.in', fallback: 'IIITDM Kancheepuram' },
    { url: 'http://www.iiits.ac.in', fallback: 'IIIT Sri City' },
    { url: 'http://www.iiitg.ac.in', fallback: 'IIIT Guwahati' },
    { url: 'http://iiitvadodara.ac.in', fallback: 'IIIT Vadodara' },
    { url: 'https://iiitkota.ac.in', fallback: 'IIIT Kota' },
    { url: 'http://www.iiitt.ac.in', fallback: 'IIIT Tiruchirappalli' },
    { url: 'https://iiitu.ac.in', fallback: 'IIIT Una' },
    { url: 'http://iiitsonepat.ac.in', fallback: 'IIIT Sonepat' },
    { url: 'http://iiitkalyani.ac.in', fallback: 'IIIT Kalyani' },
    { url: 'https://iiitl.ac.in', fallback: 'IIIT Lucknow' },
    { url: 'https://iiitdwd.ac.in', fallback: 'IIIT Dharwad' },
    { url: 'https://iiitk.ac.in', fallback: 'IIIT Kurnool' },
    { url: 'https://www.iiitkottayam.ac.in', fallback: 'IIIT Kottayam' },
    { url: 'http://www.iiitmanipur.ac.in', fallback: 'IIIT Manipur' },
    { url: 'https://iiitn.ac.in', fallback: 'IIIT Nagpur' },
    { url: 'https://www.iiitp.ac.in', fallback: 'IIIT Pune' },
    { url: 'https://iiitranchi.ac.in', fallback: 'IIIT Ranchi' },
    { url: 'http://www.iiitsurat.ac.in', fallback: 'IIIT Surat' },
    { url: 'https://iiitbhopal.ac.in', fallback: 'IIIT Bhopal' },
    { url: 'https://www.iiitbh.ac.in', fallback: 'IIIT Bhagalpur' },
    { url: 'https://iiitagartala.ac.in', fallback: 'IIIT Agartala' },
    { url: 'https://iiitr.ac.in', fallback: 'IIIT Raichur' },
    { url: 'https://www.iiit.ac.in', fallback: 'IIIT Hyderabad' },
    { url: 'https://www.iiitb.ac.in', fallback: 'IIIT Bangalore' },
    { url: 'https://www.iiitd.ac.in', fallback: 'IIIT Delhi' },
    { url: 'https://www.iiit-bh.ac.in', fallback: 'IIIT Bhubaneswar' },
    { url: 'https://www.iiitnr.ac.in', fallback: 'IIIT Naya Raipur' },

    // AIIMS (Medical)
    { url: 'https://www.aiims.edu', fallback: 'AIIMS New Delhi' },
    { url: 'https://www.aiimsbhopal.edu.in', fallback: 'AIIMS Bhopal' },
    { url: 'https://www.aiimsbhubaneswar.edu.in', fallback: 'AIIMS Bhubaneswar' },
    { url: 'https://www.aiimsjodhpur.edu.in', fallback: 'AIIMS Jodhpur' },
    { url: 'https://aiimspatna.edu.in', fallback: 'AIIMS Patna' },
    { url: 'https://www.aiimsraipur.edu.in', fallback: 'AIIMS Raipur' },
    { url: 'https://aiimsrishikesh.edu.in', fallback: 'AIIMS Rishikesh' }
];

async function insertCollege(payload) {
    const defaultCover = 'https://res.cloudinary.com/dttkujw12/image/upload/v1708899882/zplus/default-college-cover_m8z9qx.png';
    const defaultLogo = 'https://res.cloudinary.com/dttkujw12/image/upload/v1708899881/zplus/default-college-logo_b2q6z3.png';

    const insertSql = `
        INSERT INTO colleges 
        (name, description, city, state, country, website, type, established_year, rating, is_featured, cover_image_url, logo_url, courses, affiliation, reviews_summary, fee_structure)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING id;
    `;
    const values = [
        payload.name || payload.fallback,
        payload.description || 'A premier educational institution in India dedicated to excellence in engineering and technology.',
        payload.city || 'India',
        payload.state || 'State',
        payload.country || 'India',
        payload.website,
        payload.name.includes('IIT') || payload.name.includes('NIT') || payload.name.includes('IIIT') ? 'Public' : 'Private',
        payload.established_year || 2000,
        payload.rating || 4.5, // High rating for premium institutes
        true, // Make them featured
        payload.cover_image_url || defaultCover,
        payload.logo_url || defaultLogo,
        payload.courses ? JSON.stringify(payload.courses) : '[]',
        payload.affiliation || null,
        payload.reviews_summary || null,
        payload.fee_structure || null
    ];

    try {
        const result = await query(insertSql, values);
        return result.rows[0].id; // successfully inserted id
    } catch (e) {
        console.error('DB Insert Error for ' + payload.name + ':', e.message);
        return null;
    }
}

async function runScraperBatch() {
    console.log('--- STARTING BULK COLLEGE SCRAPE & INSERT ---');
    console.log('Total targets:', colleges.length);

    // We process in small chunks to avoid memory crashes with Puppeteer
    const CHUNK_SIZE = 3;

    for (let i = 0; i < colleges.length; i += CHUNK_SIZE) {
        const chunk = colleges.slice(i, i + CHUNK_SIZE);

        // Process multiple concurrently
        const promises = chunk.map(async (target) => {
            console.log(`[Pending] Scraping ${target.fallback}...`);
            try {
                // Fallback info in case scrape fails completely
                let scrapedData = { website: target.url, fallback: target.fallback, name: target.fallback, city: 'India' };

                try {
                    const result = await scrapeCollege(target.url);
                    scrapedData = { ...scrapedData, ...result };
                } catch (scrapedErr) {
                    console.log(`[Warn] Scraper failed for ${target.fallback}, using basic data. (${scrapedErr.message})`);
                }

                const dbId = await insertCollege(scrapedData);
                if (dbId) {
                    console.log(`[Success] Inserted ${scrapedData.name} -> ID: ${dbId}`);
                }
            } catch (err) {
                console.error(`[Error] Completely failed processing ${target.fallback}: ${err.message}`);
            }
        });

        await Promise.all(promises);
        console.log(`--- Finished chunk ${i / CHUNK_SIZE + 1} of ${Math.ceil(colleges.length / CHUNK_SIZE)} ---`);
    }

    console.log('--- BULK INSERT COMPLETE ---');
    process.exit(0);
}

runScraperBatch();
