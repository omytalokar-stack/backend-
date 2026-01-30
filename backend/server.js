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
const defaultAllowed = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'https://wonderful-baklava-a7cfea.netlify.app'
];
const allowedOrigins = process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : defaultAllowed;
const corsOptions = {
  origin: true, // Allow all origins for testing
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
// Support either a full MONGODB_URI or building it from parts
const MONGODB_URI = process.env.MONGODB_URI || (() => {
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || 'cluster0.ia1xxxb.mongodb.net';
  const db = process.env.MONGO_DB || ''; // optional
  if (user && pass) {
    const escUser = encodeURIComponent(user);
    const escPass = encodeURIComponent(pass);
    return `mongodb+srv://${escUser}:${escPass}@${host}/${db}?retryWrites=true&w=majority`;
  }
  return undefined;
})();

if (!MONGODB_URI) {
  console.error('❌ No MongoDB URI configured. Set MONGODB_URI or MONGO_USER/MONGO_PASS env vars.');
  process.exit(1);
}

// Log a masked URI for debugging (do not print credentials)
try {
  const masked = MONGODB_URI.replace(/mongodb\+srv:\/\/(.*?):(.*?)@/, 'mongodb+srv://<user>:<pass>@');
  console.log('🔗 MongoDB URI:', masked);
} catch (e) {}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected to DB:', mongoose.connection.name || 'unknown');
    
    // Auto-seed default services if none exist
    try {
      const Service = require('./models/Service');
      const count = await Service.countDocuments();
      if (count === 0) {
        console.log('📦 No services found, seeding defaults...');
        const defaults = [
          {
            name: { en: 'Luxury Spa', hi: 'लक्जरी स्पा' },
            features: { en: 'Body massage, Steam, Glow', hi: 'बॉडी मसाज, स्टीम, ग्लो' },
            category: 'Spa',
            imageUrl: 'https://picsum.photos/seed/spa/400/600',
            thumbnail: 'https://picsum.photos/seed/spa/400/600',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-getting-a-facial-massage-at-a-spa-32750-large.mp4',
            durationMinutes: 60,
            baseRate: 1500,
            offerOn: false,
            time: '60 min',
            rate: '₹1500'
          },
          {
            name: { en: 'House Cleaning', hi: 'घर की सफाई' },
            features: { en: 'Deep clean, Vacuuming, Sanitizing', hi: 'डीप क्लीन, वैक्यूमिंग, सैनिटाइजिंग' },
            category: 'Cleaning',
            imageUrl: 'https://picsum.photos/seed/clean/400/600',
            thumbnail: 'https://picsum.photos/seed/clean/400/600',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-cleaning-glass-with-a-spray-and-rag-41618-large.mp4',
            durationMinutes: 120,
            baseRate: 800,
            offerOn: false,
            time: '120 min',
            rate: '₹800'
          },
          {
            name: { en: 'Makeup Artistry', hi: 'मेकअप आर्टिस्ट्री' },
            features: { en: 'Bridal, Party, Minimal', hi: 'ब्राइडल, पार्टी, मिनिमल' },
            category: 'Makeup',
            imageUrl: 'https://picsum.photos/seed/makeup/400/600',
            thumbnail: 'https://picsum.photos/seed/makeup/400/600',
            videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-applying-makeup-to-her-face-with-a-brush-34533-large.mp4',
            durationMinutes: 90,
            baseRate: 2500,
            offerOn: false,
            time: '90 min',
            rate: '₹2500'
          }
        ];
        await Service.insertMany(defaults);
        console.log('✅ Seeded 3 default services');
      }
    } catch (seedErr) {
      console.warn('⚠️ Auto-seed warning:', seedErr.message);
    }
    
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
