const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// Get all notifications for user
router.get('/', authenticateToken, notificationController.getNotifications);

// Mark notification as read
router.post('/mark-read', authenticateToken, notificationController.markAsRead);

// Delete notification
router.post('/delete', authenticateToken, notificationController.deleteNotification);

// Clear all notifications
router.post('/clear-all', authenticateToken, notificationController.clearAll);

// Send notification (admin only)
router.post('/send', authenticateToken, notificationController.sendNotification);

module.exports = router;
