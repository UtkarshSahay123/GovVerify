// --- Import Dependencies ---
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // Added from second snippet

// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'database.json');
const SALT_ROUNDS = 10;

// --- Core Middleware ---
app.use(cors()); // Added from second snippet for cross-origin requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// --- Security Headers Middleware ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Serve static files from the root directory (for frontend HTML, CSS, JS)
app.use(express.static(__dirname));

// Serve the student dashboard directory so the redirect works
app.use('/student-dashboard', express.static(path.join(__dirname, '../student-dashboard')));

// Serve the employee directories so they can be accessed via the same server
app.use('/employee-login', express.static(path.join(__dirname, '../employee-login')));
app.use('/employee-dashboard', express.static(path.join(__dirname, '../employee-dashboard')));

// --- Database Helper Functions ---
function readDB() {
  // Ensure the database file exists before reading
  if (!fs.existsSync(DB_PATH)) {
    fs.writeJsonSync(DB_PATH, { students: [], employees: [] });
  }
  return fs.readJsonSync(DB_PATH);
}

function writeDB(data) {
  fs.writeJsonSync(DB_PATH, data, { spaces: 2 });
}

/**
 * Finds a user by username, case-insensitively.
 * @param {string} type - The key in the DB ('students' or 'employees').
 * @param {string} username - The username to find.
 * @returns {object|undefined} The user object or undefined if not found.
 */
function findUser(type, username) {
  const db = readDB();
  const lowerCaseUsername = username.toLowerCase();
  return db[type].find(u => u.username.toLowerCase() === lowerCaseUsername);
}

// --- Authentication Middleware ---
function requireAuth(req, res, next) {
  const authCookie = req.cookies.auth;
  if (!authCookie) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  try {
    // Attach session data to the request object
    req.session = JSON.parse(authCookie);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid session. Please log in again.' });
  }
}

// --- API Routes ---

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Signup route for both students and employees
app.post('/api/signup', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !['student', 'employee'].includes(role)) {
    return res.status(400).json({ error: 'Invalid input: username, password, and role are required.' });
  }

  const db = readDB();
  const userType = role + 's'; // 'students' or 'employees'

  if (findUser(userType, username)) {
    return res.status(409).json({ error: 'Username is already taken.' });
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = { username, password: hashedPassword };

  db[userType].push(newUser);
  writeDB(db);

  res.status(201).json({ message: 'Signup successful! You can now log in.' });
});

// Login route for both students and employees
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !['student', 'employee'].includes(role)) {
    return res.status(400).json({ error: 'Invalid input: username, password, and role are required.' });
  }

  const userType = role + 's';
  const user = findUser(userType, username);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  // Set a secure, httpOnly session cookie
  res.cookie('auth', JSON.stringify({ username: user.username, role }), {
    httpOnly: true, // Prevents client-side script access
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    sameSite: 'strict', // Mitigates CSRF attacks
  });

  res.json({ message: 'Login successful!' });
});

// --- Protected Routes ---

// Student dashboard endpoint
app.get('/api/student/dashboard', requireAuth, (req, res) => {
  if (req.session.role !== 'student') {
    return res.status(403).json({ error: 'Access forbidden: Not a student.' });
  }
  // Return student-specific data (e.g., username)
  res.json({
    message: `Welcome to your dashboard, ${req.session.username}!`,
    user: { username: req.session.username, role: req.session.role }
  });
});

// Employee dashboard endpoint
app.get('/api/employee/dashboard', requireAuth, (req, res) => {
  if (req.session.role !== 'employee') {
    return res.status(403).json({ error: 'Access forbidden: Not an employee.' });
  }
  // Return employee-specific data
  res.json({
    message: `Welcome to the employee dashboard, ${req.session.username}!`,
    user: { username: req.session.username, role: req.session.role }
  });
});

// --- General Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});