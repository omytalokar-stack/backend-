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

// Upload configuration - same as server.js
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
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

    // Generate URL for the uploaded file
    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    
    console.log(`✅ Upload successful: ${req.file.originalname} → ${fileUrl}`);
    res.json({ 
      url: fileUrl, 
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
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
    
    // Don't populate - return raw IDs so frontend can lookup
    const safe = list.map(b => ({
      _id: b._id,
      userId: b.userId,
      serviceId: b.serviceId,
      date: b.date || '',
      startHour: b.startHour || 0,
      endHour: b.endHour || 0,
      status: b.status || 'Pending',
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    }));
    
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