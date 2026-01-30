const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const Reel = require('../models/Reel');

router.post('/save', authenticateToken, authController.saveReel);

// Public: list reels (with analytics)
router.get('/', async (req, res) => {
	try {
		const list = await Reel.find().populate('serviceId', 'name category').sort({ createdAt: -1 });
		const safe = list.map(r => ({
			_id: r._id,
			serviceId: r.serviceId ? r.serviceId._id : null,
			videoUrl: r.videoUrl || '',
			description: r.description || '',
			likes: r.likes || 0,
			views: r.views || 0,
			createdAt: r.createdAt,
		}));
		res.json(safe);
	} catch (e) {
		console.error('❌ Error fetching reels:', e.message);
		res.status(500).json({ error: 'Failed to fetch reels' });
	}
});

module.exports = router;
