const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const Reel = require('../models/Reel');
const Comment = require('../models/Comment');
const PushSubscription = require('../models/PushSubscription');
const webpush = require('web-push');
const Notification = require('../models/Notification');
const User = require('../models/User');

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

// Get comments for a specific reel
router.get('/:reelId/comments', async (req, res) => {
	try {
		const { reelId } = req.params;
		const comments = await Comment.find({ reelId })
			.sort({ createdAt: -1 })
			.select('-updatedAt');
		console.log(`✅ Fetched ${comments.length} comments for reel ${reelId}`);
		res.json(comments);
	} catch (e) {
		console.error('❌ Error fetching comments:', e.message);
		res.status(500).json({ error: 'Failed to fetch comments' });
	}
});

// Add comment to a reel
router.post('/:reelId/comments', authenticateToken, async (req, res) => {
	try {
		const { reelId } = req.params;
		const { text, userName } = req.body;
		const userId = req.user.userId;

		if (!text || text.trim().length === 0) {
			return res.status(400).json({ error: 'Comment cannot be empty' });
		}

		// Verify reel exists
		const reel = await Reel.findById(reelId);
		if (!reel) {
			return res.status(404).json({ error: 'Reel not found' });
		}

		const comment = await Comment.create({
			reelId,
			userId,
			userName: userName || 'User',
			text: text.trim()
		});

		console.log(`✅ Comment added to reel ${reelId}: ${text.substring(0, 50)}...`);

		// Notify admins about new comment (lightweight)
		try {
			const msg = `New comment on reel ${reelId}: ${text.substring(0, 80)}`;
			const admins = await User.find({ role: 'admin' });
			for (const admin of admins) {
				await Notification.create({ userId: admin._id, bookingId: null, title: 'Reel Comment', message: msg, type: 'alert' });
			}

			if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
				webpush.setVapidDetails('mailto:admin@yourdomain.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
				const subs = await PushSubscription.find();
				const payload = JSON.stringify({ title: '💬 New Reel Comment', message: msg, type: 'comment', reelId });
				for (const s of subs) {
					try { await webpush.sendNotification(s.subscription, payload); } catch (e) { console.warn('❌ Failed push comment', e && e.message); }
				}
			}
		} catch (e) {
			console.error('❌ Error notifying admins about comment:', e && e.message);
		}

		res.json(comment);
	} catch (e) {
		console.error('❌ Error adding comment:', e.message);
		res.status(500).json({ error: 'Failed to add comment' });
	}
});

// Delete comment (for admin or comment owner)
router.delete('/:reelId/comments/:commentId', authenticateToken, async (req, res) => {
	try {
		const { reelId, commentId } = req.params;
		const userId = req.user.userId;
		const isAdmin = req.user.role === 'admin';

		const comment = await Comment.findById(commentId);
		if (!comment) {
			return res.status(404).json({ error: 'Comment not found' });
		}

		// Allow deletion if owner or admin
		if (comment.userId !== userId && !isAdmin) {
			return res.status(403).json({ error: 'Not authorized to delete this comment' });
		}

		await Comment.findByIdAndDelete(commentId);
		console.log(`✅ Comment ${commentId} deleted from reel ${reelId}`);
		res.json({ message: 'Comment deleted' });
	} catch (e) {
		console.error('❌ Error deleting comment:', e.message);
		res.status(500).json({ error: 'Failed to delete comment' });
	}
});

// Get single reel with metadata
router.get('/:id', async (req, res) => {
	try {
		const reel = await Reel.findById(req.params.id).populate('serviceId', 'name category');
		if (!reel) {
			return res.status(404).json({ error: 'Reel not found' });
		}
		res.json({
			_id: reel._id,
			serviceId: reel.serviceId ? reel.serviceId._id : null,
			videoUrl: reel.videoUrl || '',
			description: reel.description || '',
			likes: reel.likes || 0,
			views: reel.views || 0,
			createdAt: reel.createdAt,
		});
	} catch (e) {
		console.error('❌ Error fetching reel:', e.message);
		res.status(500).json({ error: 'Failed to fetch reel' });
	}
});

// Like/Unlike a reel
router.post('/:id/like', authenticateToken, async (req, res) => {
	try {
		const { id } = req.params;
		const { liked } = req.body;
		const userId = req.user.userId;

		const reel = await Reel.findById(id);
		if (!reel) {
			return res.status(404).json({ error: 'Reel not found' });
		}

		// Track user likes in a simple array or set (for demo; scale to LikeLog collection if needed)
		if (!reel.likedByUsers) reel.likedByUsers = [];

		const hasLiked = reel.likedByUsers.includes(userId);

		if (liked && !hasLiked) {
			reel.likedByUsers.push(userId);
			reel.likes = (reel.likes || 0) + 1;
			console.log(`❤️ User ${userId} liked reel ${id}`);
		} else if (!liked && hasLiked) {
			reel.likedByUsers = reel.likedByUsers.filter(uid => uid !== userId);
			reel.likes = Math.max(0, (reel.likes || 1) - 1);
			console.log(`💔 User ${userId} unliked reel ${id}`);
		}

		await reel.save();
		res.json({ likes: reel.likes, message: liked ? 'Liked' : 'Unliked' });
	} catch (e) {
		console.error('❌ Error updating like:', e.message);
		res.status(500).json({ error: 'Failed to update like' });
	}
});

module.exports = router;
