const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

// Allowed booking start hours: 13..18 (end must be <= 19)
const HOURS_START = Array.from({ length: 6 }, (_, i) => 13 + i); // 13,14,15,16,17,18

// Helper: Convert 24-hour to 12-hour format
const convert24To12 = (hour) => {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
};

router.get('/available', authenticateToken, async (req, res) => {
  try {
    const { serviceId, date } = req.query;
    if (!serviceId || !date) return res.status(400).json({ error: 'serviceId and date required' });
    
    // Try to find service by ObjectId or by string match
    let service = await Service.findById(serviceId).catch(() => null);
    if (!service) {
      service = await Service.findOne({ _id: serviceId }).catch(() => null);
    }
    if (!service) return res.status(404).json({ error: 'Service not found' });
    
    const duration = Math.max(1, Math.round(service.durationMinutes / 60));
    
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
    
    console.log(`📥 Fetching available slots for date: ${date}, serviceId: ${serviceId}, isToday: ${isToday}, currentHour: ${currentHour}`);
    
    // Generate all slots from 1 PM to 7 PM (13:00-19:00)
    HOURS_START.forEach(h => {
      const end = h + duration;
      if (end > 19) return; // ensure end time within 19:00
      
      // Check if this slot is already booked
      let ok = true;
      for (let k = h; k < end; k++) {
        if (blocked.has(k)) { ok = false; break; }
      }
      
      // Filter out past/current slots if selecting today - only show slots where h > currentHour
      if (isToday && h <= currentHour) {
        console.log(`⏭️ Skipping slot ${h}:00-${end}:00 (current hour: ${currentHour})`);
        return;
      }
      
      // Only show slots that are available (not booked)
      if (ok) {
        const startLabel = convert24To12(h);
        const endLabel = convert24To12(end);
        slots.push({ startHour: h, endHour: end, label: `${startLabel} - ${endLabel}` });
        console.log(`✅ Slot available: ${startLabel} - ${endLabel}`);
      } else {
        console.log(`❌ Slot booked: ${convert24To12(h)} - ${convert24To12(end)}`);
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
    const { serviceId, date, startHour, endHour } = req.body;
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

    // Safe to create booking
    const b = await Booking.create({ 
      userId: req.user.userId, 
      serviceId, 
      date, 
      startHour, 
      endHour, 
      status: 'Pending' 
    });
    
    console.log('✅ Booking created successfully:', { bookingId: b._id, slot: `${startHour}-${endHour}` });
    res.json(b);
  } catch (err) {
    console.error('❌ Error creating booking:', err.message);
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
});

module.exports = router;
