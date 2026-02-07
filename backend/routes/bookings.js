const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Allowed booking start hours: 13..18 (end must be <= 19)
const HOURS_START = Array.from({ length: 6 }, (_, i) => 13 + i); // 13,14,15,16,17,18

// Helper: Convert 24-hour to 12-hour format
const convert24To12 = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
};

// GET user's bookings (Pending/Done)
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`📥 Fetching bookings for user: ${userId}`);
    
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    console.log(`✅ Found ${bookings.length} bookings for user`);
    
    res.json(bookings);
  } catch (err) {
    console.error('❌ Error fetching user bookings:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
  }
});

router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { serviceId, date, durationMinutes: queryDurationMinutes } = req.query;
    if (!serviceId || !date) return res.status(400).json({ error: 'serviceId and date required' });
    
    // Try to find service by ObjectId or by string match
    let service = await Service.findById(serviceId).catch(() => null);
    if (!service) {
      service = await Service.findOne({ _id: serviceId }).catch(() => null);
    }
    if (!service) return res.status(404).json({ error: 'Service not found' });
    
    // Use duration from query params (for multi-service cart) or fall back to service duration
    let durationMinutes = queryDurationMinutes ? parseInt(queryDurationMinutes, 10) : (service.durationMinutes || 60);
    if (isNaN(durationMinutes) || durationMinutes < 1) durationMinutes = 60; // Safety check
    
    // For a single worker setup we must consider bookings across all services
    const bookings = await Booking.find({ date });
    const blocked = new Set();
    bookings.forEach(b => {
      for (let h = b.startHour; h < b.endHour; h++) blocked.add(h);
    });
    
    const slots = [];
    
    // Get current time to filter past slots
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const isToday = date === today;
    
    console.log(`📥 Fetching available slots for date: ${date}, serviceId: ${serviceId}, duration: ${durationMinutes}min, isToday: ${isToday}, currentHour: ${currentHour}`);
    
    // Helper: Convert decimal hours (like 0.83 for 50 min) to minutes
    const hoursToMinutes = (decimalHours) => Math.round(decimalHours * 60);
    
    // Generate all slots from 1 PM to 7 PM (13:00-19:00)
    HOURS_START.forEach(h => {
      // Calculate end time: start hour + duration in fractional hours
      const durationHours = durationMinutes / 60;
      const endHourDecimal = h + durationHours;
      
      // If end time exceeds 19:00 (7 PM), skip this slot
      if (endHourDecimal > 19) {
        console.log(`⏭️ Slot ${h}:00 would end at ${convert24To12(Math.floor(endHourDecimal))} (exceeds 19:00 limit)`);
        return;
      }
      
      // Check if this slot overlaps with any booked hours
      let ok = true;
      for (let k = h; k < Math.ceil(endHourDecimal); k++) {
        if (blocked.has(k)) { ok = false; break; }
      }
      
      // Filter out past/current slots if selecting today - only show slots where h > currentHour
      if (isToday && h <= currentHour) {
        console.log(`⏭️ Skipping slot ${h}:00 (current hour: ${currentHour})`);
        return;
      }
      
      // Only show slots that are available (not booked)
      if (ok) {
        const startLabel = convert24To12(h);
        const endMinutes = (durationMinutes % 60);
        const endHour = Math.floor(endHourDecimal);
        const endLabel = endMinutes === 0 
          ? convert24To12(endHour) 
          : `${endHour < 12 ? endHour : endHour === 12 ? 12 : endHour - 12}:${String(endMinutes).padStart(2, '0')} ${endHour >= 12 ? 'PM' : 'AM'}`;
        
        // Store with integer endHour (ceiling of decimal) and keep durationMinutes for reference
        slots.push({ 
          startHour: h, 
          endHour: Math.ceil(endHourDecimal), 
          durationMinutes, 
          label: `${startLabel} - ${endLabel}` 
        });
        console.log(`✅ Slot available: ${startLabel} - ${endLabel} (${durationMinutes}min service)`);
      } else {
        const endHourDecimal2 = h + durationMinutes / 60;
        console.log(`❌ Slot booked: ${convert24To12(h)} - ${convert24To12(Math.floor(endHourDecimal2))}`);
      }
    });
    
    console.log(`✅ Returned ${slots.length} available slots for ${date}`);
    res.json({ slots });
  } catch (err) {
    console.error('❌ Error fetching available slots:', err.message);
    res.status(500).json({ error: 'Failed to fetch available slots', details: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Creating booking:', { userId: req.user.userId, body: req.body });
    const { serviceId, date, startHour, endHour, customerName, address, totalPrice, totalDuration, servicesArray } = req.body;
    if (!serviceId || !date || startHour == null || endHour == null) {
      return res.status(400).json({ error: 'Missing fields: serviceId, date, startHour, endHour required' });
    }
    // Validate allowed hours (13:00-19:00 window)
    if (startHour < 13 || startHour > 18 || endHour <= startHour || endHour > 19) {
      return res.status(400).json({ error: 'Invalid slot. Bookings allowed between 13:00 and 19:00 only' });
    }

    // Reject bookings for past time slots
    const now = new Date();
    const bookingDateTime = new Date(`${date}T${String(startHour).padStart(2, '0')}:00:00`);
    if (bookingDateTime < now) {
      console.warn('⚠️ Attempted booking for past time:', { date, startHour, now: now.toISOString() });
      return res.status(400).json({ error: 'Cannot book for past time. Please select a future slot.' });
    }

    // CRITICAL: Real-time double-booking check BEFORE creating booking
    // Check if ANY booking overlaps with requested slot
    const clashes = await Booking.findOne({
      date,
      $or: [
        { startHour: { $lt: endHour, $gte: startHour } },
        { endHour: { $gt: startHour, $lte: endHour } },
        { startHour: { $lte: startHour }, endHour: { $gte: endHour } }
      ]
    });

    if (clashes) {
      console.warn('⚠️ Slot conflict detected! Another booking overlaps:', { clashes: clashes._id, requestedSlot: { startHour, endHour } });
      return res.status(409).json({ 
        error: 'This slot is already booked by another user. Please refresh and select a different slot.',
        bookedSlot: { startHour: clashes.startHour, endHour: clashes.endHour }
      });
    }

    // Safe to create booking with optional customerName, address, and services array
    const bookingData = { 
      userId: req.user.userId, 
      serviceId, 
      date, 
      startHour, 
      endHour, 
      status: 'Pending',
      customerName: customerName || null,
      address: address || null,
      totalPrice: totalPrice || 0,
      totalDuration: totalDuration || null,
      services: servicesArray || [] // Store array of selected services with their details
    };

    const b = await Booking.create(bookingData);
    
    console.log('✅ Booking created successfully:', { bookingId: b._id, slot: `${startHour}-${endHour}`, customerName, servicesCount: servicesArray?.length || 1 });
    // Create admin notifications and try to push to subscribed admins
    try {
      // Create a readable message
      const msg = `New booking for service ${serviceId} on ${date} at ${startHour}:00`;
      // Save Notification for each admin user
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({ userId: admin._id, bookingId: b._id, title: 'New Booking', message: msg, type: 'booking' });
      }

      // Send web-push if configured
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails('mailto:admin@yourdomain.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
        const subs = await PushSubscription.find();
        const payload = JSON.stringify({ title: '🔔 New Booking', message: msg, type: 'booking', bookingId: b._id });
        for (const s of subs) {
          try {
            await webpush.sendNotification(s.subscription, payload);
          } catch (err) {
            console.warn('❌ Failed to send push to', s._id, err && err.message);
          }
        }
      }
    } catch (pushErr) {
      console.error('❌ Booking push/notification error:', pushErr && pushErr.message);
    }

    res.json(b);
  } catch (err) {
    console.error('❌ Error creating booking:', err.message);
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
});

module.exports = router;
