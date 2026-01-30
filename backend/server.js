require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const reelsRoutes = require('./routes/reels');
const adminRoutes = require('./routes/admin');
const bookingRoutes = require('./routes/bookings');
const notificationRoutes = require('./routes/notifications');

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// Configure multer with disk storage (faster for large files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  }
});

// Middleware - Reasonable limits for file uploads (100MB for stability)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// CORS configuration - allow frontend connections
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'https://princess-kpy33gr9q-1alolololol4a-4381s-projects.vercel.app',
    'https://princess-6fv7uqb0l-1alolololola-4381s-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Set header to allow cross-origin resources (external images/scripts)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

// Serve uploaded files as static files
app.use('/uploads', express.static(uploadsDir));

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    // Drop any accidental unique index on phone to allow multiple nulls
    const db = mongoose.connection.db;
    const users = db.collection('users');
    Promise.resolve(users.dropIndex('phone_1'))
      .then(() => {
        console.log('🔧 Dropped phone_1 index for null support');
      })
      .catch((err) => {
        // Index doesn't exist or already sparse - this is fine
        if (err.errmsg && err.errmsg.includes('index not found')) {
          console.log('✅ No problematic phone index found');
        } else {
          console.warn('⚠️ Index warning:', err.message);
        }
      });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reels', reelsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handler - prevent server crash
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // Don't exit, just log it
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running 🎀' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
