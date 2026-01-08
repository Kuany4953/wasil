/**
 * Wasil Auth Service - Main Entry Point
 * Handles user authentication with phone/OTP
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const redis = require('redis');
const jwt = require('jsonwebtoken');
const Joi = require('joi');

const app = express();

// ===========================================
// Configuration
// ===========================================

const config = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'wasil-secret-key-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '7d',
  otpExpiry: 5 * 60, // 5 minutes in seconds
  demoMode: process.env.DEMO_MODE === 'true' || true, // Enable demo mode for testing
  demoOtp: '123456',
};

// ===========================================
// Database Setup (PostgreSQL)
// ===========================================

const db = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wasil',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Initialize database tables
async function initDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(255),
        user_type VARCHAR(20) DEFAULT 'rider',
        profile_photo VARCHAR(500),
        rating DECIMAL(3,2) DEFAULT 5.0,
        total_rides INTEGER DEFAULT 0,
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        language VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    `);
    console.log('✅ Database tables initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
  }
}

// ===========================================
// Redis Setup (OTP Storage)
// ===========================================

let redisClient = null;
const otpStore = new Map(); // Fallback in-memory store

async function initRedis() {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    
    redisClient.on('error', (err) => {
      console.log('Redis error, using in-memory store:', err.message);
      redisClient = null;
    });
    
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch (error) {
    console.log('⚠️ Redis not available, using in-memory OTP store');
    redisClient = null;
  }
}

// OTP Storage helpers
async function storeOtp(phone, otp) {
  const key = `otp:${phone}`;
  if (redisClient) {
    await redisClient.setEx(key, config.otpExpiry, otp);
  } else {
    otpStore.set(key, { otp, expiry: Date.now() + config.otpExpiry * 1000 });
  }
}

async function getOtp(phone) {
  const key = `otp:${phone}`;
  if (redisClient) {
    return await redisClient.get(key);
  } else {
    const data = otpStore.get(key);
    if (data && data.expiry > Date.now()) {
      return data.otp;
    }
    otpStore.delete(key);
    return null;
  }
}

async function deleteOtp(phone) {
  const key = `otp:${phone}`;
  if (redisClient) {
    await redisClient.del(key);
  } else {
    otpStore.delete(key);
  }
}

// ===========================================
// Middleware
// ===========================================

app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { error: 'Too many OTP requests, please try again later' },
});

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ===========================================
// Validation Schemas
// ===========================================

const schemas = {
  sendOtp: Joi.object({
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
    country_code: Joi.string().default('+211'), // South Sudan
  }),
  verifyOtp: Joi.object({
    phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
    otp: Joi.string().length(6).required(),
  }),
  updateProfile: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    email: Joi.string().email(),
    profile_photo: Joi.string().uri(),
    language: Joi.string().valid('en', 'ar'),
  }),
};

// Validation middleware
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  req.validatedBody = value;
  next();
};

// JWT Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ===========================================
// Helper Functions
// ===========================================

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      phone: user.phone,
      user_type: user.user_type,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiry }
  );
}

function formatPhone(phone, countryCode = '+211') {
  // Remove any non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Add country code if not present
  if (!cleaned.startsWith('+')) {
    if (cleaned.startsWith('0')) {
      cleaned = countryCode + cleaned.slice(1);
    } else {
      cleaned = countryCode + cleaned;
    }
  }
  
  return cleaned;
}

// ===========================================
// SMS Sending (Demo mode for testing)
// ===========================================

async function sendSms(phone, message) {
  console.log(`📱 SMS to ${phone}: ${message}`);
  
  if (config.demoMode) {
    console.log('⚠️ Demo mode: SMS not actually sent');
    return true;
  }
  
  // Africa's Talking SMS (for South Sudan)
  if (process.env.AFRICASTALKING_API_KEY) {
    const AfricasTalking = require('africastalking')({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME,
    });
    
    try {
      await AfricasTalking.SMS.send({
        to: [phone],
        message: message,
      });
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }
  
  // Twilio fallback
  if (process.env.TWILIO_ACCOUNT_SID) {
    const twilio = require('twilio')(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    try {
      await twilio.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });
      return true;
    } catch (error) {
      console.error('Twilio send error:', error);
      return false;
    }
  }
  
  console.log('⚠️ No SMS provider configured');
  return true;
}

// ===========================================
// API Routes
// ===========================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service', timestamp: new Date() });
});

// ===========================================
// POST /auth/send-otp - Request OTP
// ===========================================
app.post('/auth/send-otp', otpLimiter, validate(schemas.sendOtp), async (req, res) => {
  try {
    const { phone, country_code } = req.validatedBody;
    const formattedPhone = formatPhone(phone, country_code);
    
    // Generate OTP (use demo OTP in demo mode)
    const otp = config.demoMode ? config.demoOtp : generateOtp();
    
    // Store OTP
    await storeOtp(formattedPhone, otp);
    
    // Send SMS
    const message = `Your Wasil verification code is: ${otp}. Valid for 5 minutes.`;
    await sendSms(formattedPhone, message);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      phone: formattedPhone,
      demo_mode: config.demoMode,
      hint: config.demoMode ? `Demo OTP: ${config.demoOtp}` : undefined,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// ===========================================
// POST /auth/verify-otp - Verify OTP & Login
// ===========================================
app.post('/auth/verify-otp', validate(schemas.verifyOtp), async (req, res) => {
  try {
    const { phone, otp } = req.validatedBody;
    const formattedPhone = formatPhone(phone);
    
    // Get stored OTP
    const storedOtp = await getOtp(formattedPhone);
    
    if (!storedOtp) {
      return res.status(400).json({ error: 'OTP expired or not found. Please request a new one.' });
    }
    
    if (storedOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }
    
    // OTP is valid - delete it
    await deleteOtp(formattedPhone);
    
    // Find or create user
    let user;
    const existingUser = await db.query(
      'SELECT * FROM users WHERE phone = $1',
      [formattedPhone]
    );
    
    if (existingUser.rows.length > 0) {
      user = existingUser.rows[0];
      // Update last login
      await db.query(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
    } else {
      // Create new user
      const newUser = await db.query(
        `INSERT INTO users (phone, is_verified) VALUES ($1, true) RETURNING *`,
        [formattedPhone]
      );
      user = newUser.rows[0];
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        user_type: user.user_type,
        profile_photo: user.profile_photo,
        rating: user.rating,
        is_verified: user.is_verified,
        is_new_user: !user.first_name, // True if profile not completed
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// ===========================================
// GET /auth/me - Get current user
// ===========================================
app.get('/auth/me', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    res.json({
      id: user.id,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      user_type: user.user_type,
      profile_photo: user.profile_photo,
      rating: user.rating,
      total_rides: user.total_rides,
      is_verified: user.is_verified,
      language: user.language,
      created_at: user.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ===========================================
// PUT /auth/profile - Update user profile
// ===========================================
app.put('/auth/profile', authenticate, validate(schemas.updateProfile), async (req, res) => {
  try {
    const updates = req.validatedBody;
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
    
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);
    
    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    const user = result.rows[0];
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        profile_photo: user.profile_photo,
        language: user.language,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ===========================================
// POST /auth/logout - Logout (optional)
// ===========================================
app.post('/auth/logout', authenticate, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // Optionally, we could blacklist the token in Redis
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// ===========================================
// Error Handler
// ===========================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ===========================================
// Start Server
// ===========================================

async function start() {
  await initDatabase();
  await initRedis();
  
  app.listen(config.port, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║     🔐 Wasil Auth Service Running         ║
╠═══════════════════════════════════════════╣
║  Port: ${config.port}                              ║
║  Demo Mode: ${config.demoMode ? 'ON (OTP: 123456)' : 'OFF'}           ║
║                                           ║
║  Endpoints:                               ║
║  POST /auth/send-otp    - Request OTP     ║
║  POST /auth/verify-otp  - Login           ║
║  GET  /auth/me          - Get profile     ║
║  PUT  /auth/profile     - Update profile  ║
╚═══════════════════════════════════════════╝
    `);
  });
}

start().catch(console.error);
