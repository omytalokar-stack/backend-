const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');

// Save push subscription for the authenticated user (admin should call this)
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) return res.status(400).json({ error: 'subscription is required' });

    const existing = await PushSubscription.findOne({ 'subscription.endpoint': subscription.endpoint });
    if (existing) {
      // update userId if missing
      if (!existing.userId && req.user && req.user.userId) {
        existing.userId = req.user.userId;
        await existing.save();
      }
      return res.json({ message: 'Subscription already saved' });
    }

    const doc = await PushSubscription.create({ userId: req.user.userId, subscription });
    res.json({ message: 'Subscription saved', id: doc._id });
  } catch (err) {
    console.error('❌ Subscribe error:', err && err.message);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

module.exports = router;

module.exports = router;
