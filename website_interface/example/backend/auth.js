import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Middleware to verify JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Register new user
export async function registerUser(req, res) {
  try {
    const { email, username, password, uc_CourseInfo } = req.body;

    // Validate input
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM USER WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert user
    const result = db.prepare(
      'INSERT INTO USER (email, username, password_hash, uc_CourseInfo) VALUES (?, ?, ?, ?)'
    ).run(email, username, password_hash, uc_CourseInfo || null);

    const User_ID = result.lastInsertRowid;

    // Generate JWT token
    const token = jwt.sign(
      { User_ID, email, username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { User_ID, email, username, uc_CourseInfo }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Login user
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = db.prepare('SELECT * FROM USER WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { User_ID: user.User_ID, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password hash from response
    delete user.password_hash;

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get current user
export function getCurrentUser(req, res) {
  try {
    const user = db.prepare(`
      SELECT u.User_ID, u.email, u.username, u.uc_CourseInfo, u.created_at,
             uc.uc_Name, uc.uc_Term
      FROM USER u
      LEFT JOIN UCinfo uc ON u.uc_CourseInfo = uc.uc_CourseInfo
      WHERE u.User_ID = ?
    `).get(req.user.User_ID);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default { registerUser, loginUser, getCurrentUser, authenticateToken };