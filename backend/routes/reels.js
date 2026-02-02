const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const Reel = require('../models/Reel');
const Comment = require('../models/Comment');

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

module.exports = router;
