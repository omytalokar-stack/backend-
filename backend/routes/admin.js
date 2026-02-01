const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/admin');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Reel = require('../models/Reel');
const Notification = require('../models/Notification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary from CLOUDINARY_URL or individual env vars
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ url: process.env.CLOUDINARY_URL });
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Upload configuration
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

let upload;
if (cloudinary.config().cloud_name) {
  // Use memory storage and upload via Cloudinary upload_stream to avoid local files
  upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
  console.log('✅ Using Cloudinary uploader (memory storage) for uploads');
} else {
  // If Cloudinary not configured, do NOT fall back to local uploads for safety.
  console.error('❌ Cloudinary not configured. Set CLOUDINARY_URL or CLOUDINARY_* env vars to enable persistent uploads. Local storage is disabled to avoid data loss.');
  // Provide a dummy multer that always errors so uploads fail loudly
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => cb(new Error('Cloudinary not configured'))
  });
}

// TEMP: Seed endpoint (no auth) - for testing/development only
router.post('/seed', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const seedData = [
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
    await Service.deleteMany({});
    const inserted = await Service.insertMany(seedData);
    console.log('✅ Seeded', inserted.length, 'services');
    res.json({ message: 'Database seeded successfully', count: inserted.length });
  } catch (e) {
    console.error('❌ Seed error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

router.post('/services', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const s = await Service.create(req.body);
    
    // Auto-create a Reel if videoUrl is provided
    if (req.body.videoUrl) {
      const reel = await Reel.create({
        serviceId: s._id,
        videoUrl: req.body.videoUrl,
        description: req.body.name || 'Service Reel',
        views: 0,
        likes: 0
      });
      console.log('✅ Auto-created Reel for Service:', s._id);
    }
    
    res.json(s);
  } catch (e) {
    console.error('❌ Error creating service:', e.message);
    res.status(400).json({ error: 'Failed to create service', details: e.message });
  }
});

// Public endpoint - anyone can view all services
router.get('/services-public', async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (err) {
    console.error('❌ Error fetching services:', err.message);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.get('/services', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const list = await Service.find().sort({ createdAt: -1 });
    const safe = list.map(s => ({
      _id: s._id,
      name: s.name || 'Unnamed Service',
      description: s.description || '',
      category: s.category || 'General',
      baseRate: s.baseRate || 0,
      durationMinutes: s.durationMinutes || 60,
      imageUrl: s.imageUrl || '',
      videoUrl: s.videoUrl || '',
      offerOn: !!s.offerOn,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }));
    res.json(safe);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

router.post('/upload', authenticateToken, ensureAdmin, upload.single('file'), async (req, res) => {
  try {
    console.log('📥 Upload request received');
    console.log('File info:', req.file ? `${req.file.originalname} (${req.file.size} bytes)` : 'NO FILE');
    
    if (!req.file) {
      console.error('❌ No file in request');
      return res.status(400).json({ error: 'No file provided' });
    }
    // If Cloudinary is configured we expect a buffer from multer.memoryStorage
    if (req.file && req.file.buffer && cloudinary.config().cloud_name) {
      // Upload via stream to Cloudinary
      const streamifier = require('streamifier');
      const folder = process.env.CLOUDINARY_FOLDER || 'pastelservice';
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload_stream error:', error && error.message);
            return res.status(500).json({ error: 'Cloudinary upload failed', details: error && error.message });
          }
          const url = result.secure_url || result.url;
          console.log(`✅ Upload successful to Cloudinary: ${url}`);
          return res.json({ url, public_id: result.public_id, originalName: req.file.originalname, size: req.file.size, mimetype: req.file.mimetype });
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      return; // response will be sent from callback
    }

    // Cloudinary not configured or no file buffer
    console.error('❌ Upload failed: Cloudinary not configured or no file provided');
    return res.status(500).json({ error: 'Upload failed - Cloudinary not configured or no file' });
  } catch (e) {
    console.error('❌ Upload error:', e.message);
    console.error('Stack:', e.stack);
    res.status(500).json({ error: `Failed to upload file: ${e.message}` });
  }
});

router.put('/services/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const s = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!s) return res.status(404).json({ error: 'Service not found' });
    res.json(s);
  } catch (e) {
    res.status(400).json({ error: 'Failed to update service' });
  }
});

router.delete('/services/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const r = await Service.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: 'Service not found' });
    
    // Cascade delete: Remove associated Reel
    await Reel.deleteMany({ serviceId: req.params.id });
    console.log('✅ Cascade deleted Reel(s) for Service:', req.params.id);
    
    res.json({ deleted: true });
  } catch (e) {
    console.error('❌ Error deleting service:', e.message);
    res.status(400).json({ error: 'Failed to delete service' });
  }
});

router.put('/services/:id/toggle-offer', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const s = await Service.findById(req.params.id);
    if (!s) return res.status(404).json({ error: 'Service not found' });
    s.offerOn = !!req.body.offerOn;
    await s.save();
    res.json(s);
  } catch {
    res.status(400).json({ error: 'Failed to toggle offer' });
  }
});

router.get('/reels', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const list = await Reel.find().sort({ createdAt: -1 });
    const safe = list.map(r => ({
      _id: r._id,
      videoUrl: r.videoUrl || '',
      description: r.description || 'No description',
      pinnedComment: r.pinnedComment || null,
      replies: Array.isArray(r.replies) ? r.replies : [],
      views: r.views || 0,
      likes: r.likes || 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
    res.json(safe);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
});

router.post('/reels', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const r = await Reel.create(req.body);
    res.json(r);
  } catch {
    res.status(400).json({ error: 'Failed to create reel' });
  }
});

router.put('/reels/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const r = await Reel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!r) return res.status(404).json({ error: 'Reel not found' });
    res.json(r);
  } catch {
    res.status(400).json({ error: 'Failed to update reel' });
  }
});

// Update analytics fields (likes/views) for a reel
router.put('/reels/:id/analytics', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const r = await Reel.findById(req.params.id);
    if (!r) return res.status(404).json({ error: 'Reel not found' });
    const { likes, views } = req.body;
    if (typeof likes === 'number') r.likes = likes;
    if (typeof views === 'number') r.views = views;
    await r.save();
    res.json(r);
  } catch (e) {
    res.status(400).json({ error: 'Failed to update analytics' });
  }
});

// PATCH likes only (safe, does not crash)
router.patch('/reels/:id/likes', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const likesRaw = req.body.likes;
    const likes = parseInt(likesRaw, 10);
    if (isNaN(likes)) return res.status(400).json({ error: 'Invalid likes value' });
    const r = await Reel.findById(id);
    if (!r) return res.status(404).json({ error: 'Reel not found' });
    r.likes = likes;
    await r.save();
    res.json({ success: true, likes: r.likes });
  } catch (e) {
    console.error('Failed to patch reel likes:', e && e.message);
    res.status(500).json({ error: 'Failed to update likes' });
  }
});

router.delete('/reels/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const r = await Reel.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ error: 'Reel not found' });
    res.json({ deleted: true });
  } catch {
    res.status(400).json({ error: 'Failed to delete reel' });
  }
});

router.get('/orders', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    console.log('📥 Fetching orders...');
    const list = await Booking.find()
      .sort({ createdAt: -1 });
    
    const now = new Date();
    // Auto-complete orders where end time has passed
    const safe = list.map(b => {
      let status = b.status || 'Pending';
      // If status is Pending and booking end time has passed, mark as Completed
      if (status === 'Pending' && b.date && b.endHour != null) {
        const endDateTime = new Date(`${b.date}T${String(b.endHour).padStart(2, '0')}:00:00`);
        if (endDateTime < now) {
          status = 'Completed';
          console.log(`✅ Auto-completed order ${b._id}: end time ${b.date} ${b.endHour}:00 has passed`);
        }
      }
      return {
        _id: b._id,
        userId: b.userId,
        serviceId: b.serviceId,
        date: b.date || '',
        startHour: b.startHour || 0,
        endHour: b.endHour || 0,
        status: status,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      };
    });
    
    console.log(`✅ Orders found: ${safe.length}`);
    res.json(safe || []);
  } catch (e) {
    console.error('❌ Orders fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch orders', details: e.message });
  }
});

router.post('/cleanup-orders', authenticateToken, ensureAdmin, async (req, res) => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const r = await Booking.deleteMany({ status: 'Done', updatedAt: { $lt: cutoff } });
  res.json({ deleted: r.deletedCount || 0 });
});

// Booking Chart - Shows booked/free slots for a service on a date
router.get('/booking-chart', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { serviceId, date } = req.query;
    if (!serviceId || !date) {
      return res.status(400).json({ error: 'serviceId and date required' });
    }

    // Get service details
    const service = await Service.findById(serviceId).catch(() => null) || 
                    await Service.findOne({ _id: serviceId }).catch(() => null);
    if (!service) return res.status(404).json({ error: 'Service not found' });

    // Get all bookings for this service on this date
    const bookings = await Booking.find({ serviceId, date }).populate('userId', 'nickname email phone');

    // Create chart grid (1 PM to 7 PM = hours 13-19)
    const slots = [];
    for (let hour = 13; hour <= 18; hour++) {
      const booking = bookings.find(b => b.startHour === hour);
      const status = booking ? 'Booked' : 'Free';
      slots.push({
        hour,
        timeLabel: `${hour}:00-${hour + 1}:00`,
        status,
        booking: booking ? {
          _id: booking._id,
          userId: booking.userId?._id,
          userName: booking.userId?.nickname || 'Unknown',
          userEmail: booking.userId?.email,
          userPhone: booking.userId?.phone,
          serviceName: service.name,
          startHour: booking.startHour,
          endHour: booking.endHour,
          date: booking.date,
          status: booking.status
        } : null
      });
    }

    res.json({
      serviceName: service.name,
      date,
      slots
    });
  } catch (err) {
    console.error('❌ Error fetching booking chart:', err.message);
    res.status(500).json({ error: 'Failed to fetch booking chart' });
  }
});

router.get('/users', authenticateToken, ensureAdmin, async (req, res) => {
  const list = await User.find({}, { email: 1, phone: 1, role: 1, nickname: 1, avatarUrl: 1, isOfferClaimed: 1, isOfferUsed: 1 }).sort({ createdAt: -1 });
  res.json(list);
});

// Stats endpoint for dashboard with enhanced analytics
router.get('/stats', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const servicesCount = await Service.countDocuments();
    const reelsCount = await Reel.countDocuments();
    const usersCount = await User.countDocuments();
    const ordersCount = await Booking.countDocuments();
    
    // Get booking status breakdown
    const bookingStats = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Get total offer claims
    const offerStats = await User.aggregate([
      { $group: { _id: null, claimed: { $sum: { $cond: [{ $eq: ['$isOfferClaimed', true] }, 1, 0] } }, used: { $sum: { $cond: [{ $eq: ['$isOfferUsed', true] }, 1, 0] } } } }
    ]);
    
    // Get most booked services
    const trendingServices = await Booking.aggregate([
      { $group: { _id: '$serviceId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } }
    ]);
    
    res.json({
      services: servicesCount,
      reels: reelsCount,
      users: usersCount,
      orders: ordersCount,
      bookingStats: bookingStats.reduce((acc, b) => ({ ...acc, [b._id]: b.count }), {}),
      offers: offerStats[0] || { claimed: 0, used: 0 },
      trendingServices: trendingServices.map(t => ({ serviceId: t._id, count: t.count, name: t.service?.[0]?.name || 'Unknown' }))
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Notify user endpoint (admin sends notification to specific user after booking)
router.post('/notify', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { userId, bookingId, message } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const notificationText = message || 'Aap tayar ho jaiye, aapka service time aa gaya hai! Jaldi parlor mein aa jaiye. ✨';

    const notification = new Notification({
      userId,
      bookingId: bookingId || null,
      title: 'Service Ready',
      message: notificationText,
      type: 'admin',
    });

    await notification.save();

    res.json({
      message: 'Notification sent successfully',
      notification,
    });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;