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

// Multer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed!'), false);
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

        if (!req.file) return res.status(400).json({ success: false, message: 'Resume PDF is required.' });

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
            timestamp:      new Date().toISOString()
        });

        fs.writeFileSync(DB_FILE, JSON.stringify(currentData, null, 2));
        console.log(`\x1b[32m  ✅ Application stored for: ${fullName}\x1b[0m`);
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
