require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'database.json');
const DIST_DIR = path.join(__dirname, 'dist');

// Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Required for Railway — tells Express to trust the proxy
app.set('trust proxy', 1);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many attempts from this IP, please try again later." }
});
app.use('/api/', limiter);

// Per-email rate limit — max 3 submissions per email per 24 hours
const emailSubmissions = {};
function isEmailRateLimited(email) {
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    if (!emailSubmissions[email]) {
        emailSubmissions[email] = [];
    }
    // Remove entries older than 24 hours
    emailSubmissions[email] = emailSubmissions[email].filter(t => now - t < windowMs);
    if (emailSubmissions[email].length >= 3) return true;
    emailSubmissions[email].push(now);
    return false;
}

// Multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Only PDF or Word files are allowed!'), false);
    }
});

// Cloudinary upload helper
function uploadToCloudinary(buffer, filename) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'raw', folder: 'modflirt_cvs', public_id: filename },
            (error, result) => { if (error) reject(error); else resolve(result); }
        );
        stream.end(buffer);
    });
}

// ── API ROUTES ────────────────────────────────────────────────────────────────

// Submit application
app.post('/api/apply', upload.single('resume'), async (req, res) => {
    try {
        const firstName = req.body.firstName || req.body.name || "Unknown";
        const lastName  = req.body.lastName  || "";
        const email     = req.body.email     || "No Email";
        const phone     = `${req.body.countryCode || ''} ${req.body.phoneNumber || ''}`.trim() || "No Phone";
        const fullName  = `${firstName} ${lastName}`.trim();

        // Honeypot check — if filled, silently pretend success
        if (req.body.honeypot && req.body.honeypot.trim() !== "") {
            console.log(`🍯 Honeypot triggered from IP: ${req.ip}`);
            return res.status(200).json({ success: true, message: 'Application received! We will be in touch shortly.' });
        }

        // Per-email rate limiting
        if (isEmailRateLimited(email)) {
            return res.status(429).json({ success: false, message: 'This email has already been submitted recently. Please wait before trying again.' });
        }

        if (!req.file) return res.status(400).json({ success: false, message: 'Resume (PDF or Word) is required.' });

        // Parse device info sent from frontend
        let deviceInfo = {};
        try {
            deviceInfo = JSON.parse(req.body.deviceInfo || "{}");
        } catch (e) {
            deviceInfo = {};
        }

        // Capture IP address
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || "Unknown";

        const safeName   = `${fullName.replace(/\s+/g, '_')}_Resume_${Date.now()}`;
        const cloudResult = await uploadToCloudinary(req.file.buffer, safeName);

        let currentData = [];
        if (fs.existsSync(DB_FILE)) {
            try { currentData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { currentData = []; }
        }

        currentData.push({
            id:             Date.now().toString(),
            name:           fullName,
            email,
            phone,
            experience:     req.body.experience     || '',
            motivation:     req.body.motivation     || '',
            hasComputer:    req.body.hasComputer    || '',
            stableInternet: req.body.stableInternet || '',
            cvUrl:          cloudResult.secure_url,
            cloudinaryId:   cloudResult.public_id,
            // Security & device info
            ipAddress,
            device:         deviceInfo.device     || 'Unknown',
            os:             deviceInfo.os         || 'Unknown',
            browser:        deviceInfo.browser    || 'Unknown',
            screenRes:      deviceInfo.screenRes  || 'Unknown',
            language:       deviceInfo.language   || 'Unknown',
            timezone:       deviceInfo.timezone   || 'Unknown',
            platform:       deviceInfo.platform   || 'Unknown',
            timestamp:      new Date().toISOString()
        });

        fs.writeFileSync(DB_FILE, JSON.stringify(currentData, null, 2));
        console.log(`\x1b[32m  ✅ Application stored for: ${fullName} | IP: ${ipAddress} | Device: ${deviceInfo.device} | OS: ${deviceInfo.os} | Browser: ${deviceInfo.browser}\x1b[0m`);
        return res.status(200).json({ success: true, message: 'Application received! We will be in touch shortly.' });

    } catch (error) {
        console.error('❌ Backend error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error. Please try again.' });
    }
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', port: PORT }));

// Admin data
app.get('/api/admin', (req, res) => {
    if (!req.query.password || req.query.password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ success: false, message: 'Unauthorised.' });

    let data = [];
    if (fs.existsSync(DB_FILE)) {
        try { data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { data = []; }
    }
    return res.json({ success: true, total: data.length, applications: data.reverse() });
});

// Admin delete
app.delete('/api/admin/:id', (req, res) => {
    if (!req.query.password || req.query.password !== process.env.ADMIN_PASSWORD)
        return res.status(401).json({ success: false, message: 'Unauthorised.' });

    let data = [];
    if (fs.existsSync(DB_FILE)) {
        try { data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { data = []; }
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data.filter(r => r.id !== req.params.id), null, 2));
    return res.json({ success: true, message: 'Record deleted.' });
});

// ── STATIC FILES ──────────────────────────────────────────────────────────────

// Admin dashboard (CSP cleared so inline scripts work)
app.get('/admin', (req, res) => {
    res.setHeader('Content-Security-Policy', '');
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve built React app for all other routes
app.use(express.static(DIST_DIR));
app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log("====================================================");
    console.log(`🚀  ModFlirt running on port ${PORT}`);
    console.log("====================================================");
});
