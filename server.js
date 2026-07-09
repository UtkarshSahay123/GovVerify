const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const crypto = require('crypto');
const fs = require('fs');
const fsExtra = require('fs-extra');
const path = require('path');
const sharp = require('sharp');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
const { Canvas, createCanvas, Image } = require('canvas');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'utkarshsahay321@gmail.com',
    pass: 'slgf itul rwmr etrt'
  }
});

const pool = new Pool({
  connectionString: 'postgresql://postgres:1234@localhost:5432/auth'
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  client.query(`
    CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        certificate_id VARCHAR(255) UNIQUE NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        certificate_name VARCHAR(255),
        certificate_type VARCHAR(255),
        issuing_authority VARCHAR(255),
        issue_date DATE,
        file_path VARCHAR(500) NOT NULL,
        sha256_hash VARCHAR(255) NOT NULL,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        identifier VARCHAR(255)
    );
  `, (err, result) => {
    release();
    if (err) {
      return console.error('Error executing setup query', err.stack);
    }
    console.log('PostgreSQL certificates table ready.');
  });
});

const app = express();
const port = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.json');
const SALT_ROUNDS = 10;

// --- Core Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Security Headers Middleware ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// --- In-memory "database" (for documents) ---
const masterHashes = new Set();
const studentVerifiedFiles = [];

if (!fs.existsSync('./verified_documents')) fs.mkdirSync('./verified_documents');

// Serve static files from subdirectories
app.use('/HomePage', express.static(path.join(__dirname, 'HomePage')));
app.use('/employee-login', express.static(path.join(__dirname, 'employee-login')));
app.use('/student-login', express.static(path.join(__dirname, 'student-login')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname)); // For any root level assets

// --- Database Helper Functions (User Auth) ---
// (Migrated to PostgreSQL - Local JSON DB functions removed)

// --- Authentication Middleware ---
function requireAuth(req, res, next) {
  const authCookie = req.cookies.auth;
  if (!authCookie) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  try {
    req.session = JSON.parse(authCookie);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid session. Please log in again.' });
  }
}

function requireAuthRedirect(req, res, next) {
  const authCookie = req.cookies.auth;
  if (!authCookie) {
    if (req.originalUrl.includes('/employee-dashboard')) return res.redirect('/employee-login/employee-login.html');
    if (req.originalUrl.includes('/student-dashboard')) return res.redirect('/student-login/student-login.html');
    return res.redirect('/HomePage/index.html');
  }
  try {
    const session = JSON.parse(authCookie);
    if (req.originalUrl.includes('/employee-dashboard') && session.role !== 'employee') {
      return res.redirect('/employee-login/employee-login.html');
    }
    if (req.originalUrl.includes('/student-dashboard') && session.role !== 'student') {
      return res.redirect('/student-login/student-login.html');
    }
    req.session = session;
    next();
  } catch (error) {
    res.clearCookie('auth');
    res.redirect('/HomePage/index.html');
  }
}

app.use('/employee-dashboard', requireAuthRedirect, express.static(path.join(__dirname, 'employee-dashboard')));
app.use('/student-dashboard', requireAuthRedirect, express.static(path.join(__dirname, 'student-dashboard')));

const upload = multer({ storage: multer.memoryStorage() });

// --- CanvasFactory for pdf.js rendering ---
class NodeCanvasFactory {
    create(width, height) {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext("2d");
        return { canvas, context };
    }
    reset(canvasAndContext, width, height) {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    }
}

async function processDocument(file) {
    let fullText = '';
    let hash = '';

    try {
        if (file.buffer && file.buffer.length > 0) {
            // --- Process PDF ---
            if (file.mimetype === 'application/pdf') {
                const pdf = await pdfjsLib.getDocument(file.buffer).promise;
                const numPages = pdf.numPages;
                let combinedText = '';

                for (let i = 1; i <= numPages; i++) {
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.5 });
                    const canvasFactory = new NodeCanvasFactory();
                    const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);
                    
                    await page.render({ canvasContext: context, viewport, canvasFactory }).promise;
                    
                    const imageBuffer = canvas.toBuffer('image/png');
                    const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng');
                    combinedText += text + '\n';
                }
                fullText = combinedText;

            // --- Process Image ---
            } else if (file.mimetype.startsWith('image/')) {
                try {
                    const metadata = await sharp(file.buffer).metadata();
                    if (metadata.width >= 10 && metadata.height >= 10) {
                        const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng');
                        fullText = text;
                    }
                } catch (e) {
                    console.warn("Sharp validation failed, falling back to raw hash:", e.message);
                }
            }
        }
    } catch (error) {
        console.warn("OCR processing failed, falling back to raw file hash:", error.message);
    }

    if (fullText && fullText.trim().length > 0) {
        const standardizedText = fullText.toLowerCase().replace(/[\W_]/g, '');
        hash = crypto.createHash('sha256').update(standardizedText).digest('hex');
    } else {
        // Fallback: If OCR failed, returned no text, or file is empty, hash the raw file bytes
        hash = crypto.createHash('sha256').update(file.buffer || Buffer.alloc(0)).digest('hex');
    }

    return { hash, text: fullText };
}


// --- Auth API Endpoints ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.post('/api/signup', async (req, res) => {
  const { username, password, role, email, fullName, identifier } = req.body;
  if (!username || !password || !['student', 'employee'].includes(role)) {
    return res.status(400).json({ error: 'Invalid input: username, password, and role are required.' });
  }

  try {
    const existingUser = await pool.query('SELECT username FROM users WHERE LOWER(username) = LOWER($1) AND role = $2', [username, role]);
    
    if (existingUser.rowCount > 0) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    await pool.query(
      'INSERT INTO users (username, password, email, role, full_name, identifier) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, hashedPassword, email || '', role, fullName || '', identifier || '']
    );

    res.status(201).json({ message: 'Signup successful! You can now log in.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error during signup.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND role = $2', [username, role]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.cookie('auth', JSON.stringify({ username: user.username, role: user.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Login successful!', user: { username: user.username, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// --- OTP & User Profile Endpoints ---
const activeOtps = new Map(); // Store OTPs in memory: email -> { otp, expiry }

app.get('/api/me', requireAuth, async (req, res) => {
  const { username, role } = req.session;
  
  try {
    const result = await pool.query('SELECT username, email, role FROM users WHERE LOWER(username) = LOWER($1) AND role = $2', [username, role]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    // Return user info safely (without password)
    res.json({
      username: user.username,
      email: user.email || 'No email provided',
      role: user.role
    });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Internal server error fetching profile.' });
  }
});

app.post('/api/update-email', requireAuth, async (req, res) => {
  const { username, role } = req.session;
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  try {
    await pool.query(
      'UPDATE users SET email = $1 WHERE LOWER(username) = LOWER($2) AND role = $3',
      [email.trim(), username, role]
    );
    res.json({ message: 'Email updated successfully.' });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Internal server error updating email.' });
  }
});

app.post('/api/request-otp', requireAuth, async (req, res) => {
  const { username, role } = req.session;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND role = $2', [username, role]);
    const user = result.rows[0];
    
    if (!user || !user.email) {
      return res.status(400).json({ error: 'No email associated with this account.' });
    }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 mins expiry
  
  activeOtps.set(user.email, { otp, expiry });
  
  const mailOptions = {
    from: '"GovVerify" <utkarshsahay321@gmail.com>',
    to: user.email,
    subject: 'Your GovVerify Password Reset OTP',
    text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>GovVerify Password Reset</h2>
        <p>Hello ${user.fullName || user.username},</p>
        <p>Your One-Time Password (OTP) for resetting your password is:</p>
        <h1 style="color: #3b82f6; letter-spacing: 2px;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP sent: %s', info.messageId);
    res.json({ message: 'OTP sent successfully to your email.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email OTP. Please try again later.' });
  }
  } catch (error) {
    console.error('Database error in request-otp:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/forgot-password/request-otp', async (req, res) => {
  const { email, role } = req.body;
  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role required.' });
  }
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND role = $2', [email, role]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'no mail id is found' });
    }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 mins expiry
  
  activeOtps.set(user.email, { otp, expiry });
  
  const mailOptions = {
    from: '"GovVerify" <utkarshsahay321@gmail.com>',
    to: user.email,
    subject: 'Your GovVerify Password Reset OTP',
    text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2>GovVerify Password Reset</h2>
        <p>You requested a password reset. Use the OTP below to proceed:</p>
        <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Forgot Password OTP sent: %s', info.messageId);
    res.json({ message: 'OTP sent successfully to your registered email.', email: user.email });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP email.' });
  }
  } catch (err) {
    console.error('Database error in forgot-password/request-otp:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.post('/api/forgot-password/reset', async (req, res) => {
  const { email, otp, newPassword, role } = req.body;
  
  const otpRecord = activeOtps.get(email);
  if (!otpRecord) return res.status(400).json({ error: 'Invalid or expired OTP.' });
  if (Date.now() > otpRecord.expiry) {
    activeOtps.delete(email);
    return res.status(400).json({ error: 'OTP has expired.' });
  }
  if (otpRecord.otp !== otp) return res.status(400).json({ error: 'Incorrect OTP.' });
  
  // Update password in DB
  try {
    const result = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND role = $2', [email, role]);
    if (result.rowCount === 0) return res.status(400).json({ error: 'no mail id is found' });

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await pool.query('UPDATE users SET password = $1 WHERE LOWER(email) = LOWER($2) AND role = $3', [hashedPassword, email, role]);

    activeOtps.delete(email);
    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to update database.' });
  }
});

app.post('/api/change-password', requireAuth, async (req, res) => {
  const { otp, newPassword } = req.body;
  const { username, role } = req.session;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND role = $2', [username, role]);
    const user = result.rows[0];
    
    if (!user || !user.email) {
      return res.status(400).json({ error: 'User not found or no email associated.' });
    }
    
    if (!otp || !newPassword) {
      return res.status(400).json({ error: 'OTP and new password are required.' });
    }
  
  const record = activeOtps.get(user.email);
  if (!record) {
    return res.status(400).json({ error: 'No active OTP session. Please request a new OTP.' });
  }
  
  if (Date.now() > record.expiry) {
    activeOtps.delete(user.email);
    return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
  }
  
  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP.' });
  }
  
  // Valid OTP, update password
  try {
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Update in DB
    const result = await pool.query('UPDATE users SET password = $1 WHERE LOWER(username) = LOWER($2) AND role = $3', [hashedPassword, username, role]);
    
    if (result.rowCount > 0) {
      activeOtps.delete(user.email); // Clear the OTP
      res.json({ message: 'Password updated successfully!' });
    } else {
      res.status(500).json({ error: 'Failed to update database.' });
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update database.' });
  }
  } catch (error) {
    console.error('Database error in change-password:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const userResult = await pool.query('SELECT COUNT(*) FROM users');
    const usersCount = parseInt(userResult.rows[0].count);

    const certsResult = await pool.query('SELECT COUNT(*) FROM certificates');
    const uploadedCount = parseInt(certsResult.rows[0].count);

    const uniResult = await pool.query('SELECT COUNT(DISTINCT issuing_authority) FROM certificates');
    const uniCount = parseInt(uniResult.rows[0].count);

    const verifiedCount = uploadedCount; // Assuming all uploaded are verified in this simple schema

    res.json({
      users: usersCount,
      verified: verifiedCount,
      uploaded: uploadedCount,
      universities: uniCount
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/student/dashboard', requireAuth, (req, res) => {
  if (req.session.role !== 'student') {
    return res.status(403).json({ error: 'Access forbidden: Not a student.' });
  }
  res.json({
    message: `Welcome to your dashboard, ${req.session.username}!`,
    user: { username: req.session.username, role: req.session.role }
  });
});

app.get('/api/student/certificates', requireAuth, async (req, res) => {
  if (req.session.role !== 'student') {
    return res.status(403).json({ error: 'Access forbidden: Not a student.' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM certificates WHERE LOWER(student_name) = LOWER($1) ORDER BY issue_date DESC',
      [req.session.username]
    );
    const formattedCertificates = result.rows.map(row => ({
      id: row.id,
      title: row.certificate_name,
      issuer: row.issuing_authority,
      issueDate: row.issue_date,
      type: row.certificate_type,
      certificateId: row.certificate_id,
      fileUrl: row.file_path ? `/uploads/${row.file_path}` : null
    }));
    res.json({ certificates: formattedCertificates });
  } catch (error) {
    console.error("Error fetching student certificates:", error);
    res.status(500).json({ error: 'Failed to fetch certificates.' });
  }
});

app.get('/api/employee/dashboard', requireAuth, (req, res) => {
  if (req.session.role !== 'employee') {
    return res.status(403).json({ error: 'Access forbidden: Not an employee.' });
  }
  res.json({
    message: `Welcome to the employee dashboard, ${req.session.username}!`,
    user: { username: req.session.username, role: req.session.role }
  });
});

app.get('/api/certificates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM certificates ORDER BY issue_date DESC');
        const formattedCertificates = result.rows.map(row => ({
            id: row.id,
            name: row.certificate_name,
            issuedBy: row.issuing_authority,
            issueDate: row.issue_date,
            status: "active", // Default status for now
            type: row.certificate_type,
            certificateId: row.certificate_id,
            studentName: row.student_name,
            fileUrl: row.file_path ? `/uploads/${row.file_path}` : null
        }));
        res.json({ certificates: formattedCertificates });
    } catch (error) {
        console.error("Error fetching certificates:", error);
        res.status(500).json({ error: 'Failed to fetch certificates.' });
    }
});


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.post('/api/certificates/upload', upload.single('certFile'), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    
    console.log('Uploaded File info:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer ? req.file.buffer.length : null
    });
    
    const { certName, certType, issuingAuthority, issueDate, certificateId, studentName } = req.body;
    
    if (!certificateId || !studentName) {
        return res.status(400).json({ message: 'Certificate ID and Student Name are required.' });
    }

    try {
        const { hash } = await processDocument(req.file);
        
        // Save file to disk
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, req.file.buffer);
        
        // Insert into PostgreSQL
        const query = `
          INSERT INTO certificates (
            certificate_id, student_name, certificate_name, certificate_type, 
            issuing_authority, issue_date, file_path, sha256_hash
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        const values = [
          certificateId, studentName, certName, certType, 
          issuingAuthority, issueDate || null, fileName, hash
        ];
        
        await pool.query(query, values);

        res.json({ 
            message: 'Certificate uploaded and verified successfully!', 
            certificateId,
            fileUrl: `/uploads/${fileName}`
        });
    } catch (error) {
        console.error('Upload Error:', error);
        if (error.code === '23505') { // Postgres Unique Violation
           return res.status(409).json({ message: 'Certificate ID already exists.' });
        }
        res.status(500).json({ message: `Upload failed. ${error.message}` });
    }
});

app.post('/api/certificates/verify', upload.single('verifyFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const { hash } = await processDocument(req.file);

        const query = 'SELECT * FROM certificates WHERE sha256_hash = $1';
        const result = await pool.query(query, [hash]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Document is fake or tampered. Hash mismatch.' });
        }

        const cert = result.rows[0];
        res.json({
            message: 'Certificate verified successfully',
            certificate: {
                id: cert.certificate_id,
                name: cert.certificate_name,
                issuedBy: cert.issuing_authority,
                issueDate: cert.issue_date,
                type: cert.certificate_type,
                studentName: cert.student_name
            }
        });
    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({ error: 'Failed to verify certificate.' });
    }
});

app.delete('/api/certificates/:certificateId', async (req, res) => {
    const { certificateId } = req.params;
    try {
        const query = 'DELETE FROM certificates WHERE certificate_id = $1 RETURNING file_path';
        const result = await pool.query(query, [certificateId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Certificate not found.' });
        }
        
        // Optionally, delete the file from the filesystem too
        const filePath = path.join(__dirname, 'uploads', result.rows[0].file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        
        res.json({ message: 'Certificate deleted successfully.' });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete certificate.' });
    }
});

app.post('/api/certificates/search', express.json(), async (req, res) => {
    const { studentName, certificateId } = req.body;
    if (!studentName || !certificateId) {
        return res.status(400).json({ error: 'Student Name and Certificate ID are required.' });
    }

    try {
        const query = `SELECT * FROM certificates WHERE certificate_id = $1 AND student_name ILIKE $2`;
        const result = await pool.query(query, [certificateId, `%${studentName}%`]);
        
        if (result.rows.length === 0) {
             return res.status(404).json({ error: 'Certificate not found.' });
        }
        
        const cert = result.rows[0];
        res.json({
            message: 'Certificate found',
            certificate: {
                id: cert.id,
                certificateId: cert.certificate_id,
                studentName: cert.student_name,
                certName: cert.certificate_name,
                certType: cert.certificate_type,
                issuingAuthority: cert.issuing_authority,
                issueDate: cert.issue_date,
                uploadDate: cert.upload_date,
                hash: cert.sha256_hash,
                fileUrl: `/uploads/${cert.file_path}`
            }
        });
    } catch (err) {
        console.error('Search Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// --- Frontend Routes ---
app.get('/', (req, res) => res.redirect('/HomePage'));
app.get('/HomePage', (req, res) => res.sendFile(path.join(__dirname, 'HomePage', 'index.html')));
app.get('/employee', (req, res) => res.sendFile(path.join(__dirname, 'employee-login', 'employee-login.html')));
app.get('/student', (req, res) => res.sendFile(path.join(__dirname, 'student-login', 'student-login.html')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});