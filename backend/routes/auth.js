const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Verify Google User
router.post('/verify-google', authController.verifyGoogle);

// Send OTP
router.post('/send-otp', authController.sendOTP);

// Verify OTP
router.post('/verify-otp', authController.verifyOTP);

// Verify Firebase User
router.post('/verify-firebase', authController.verifyFirebase);

// Setup Profile (requires authentication)
router.post('/setup-profile', authenticateToken, authController.setupProfile);

// Update user name
router.put('/update-name', authenticateToken, authController.updateName);

// Get current user profile
router.get('/me', authenticateToken, authController.getProfile);

// Save reel
router.post('/save-reel', authenticateToken, authController.saveReel);

// Mark offer used
router.post('/mark-offer-used', authenticateToken, authController.markOfferUsed);

// Claim offer
router.post('/claim-offer', authenticateToken, authController.claimOffer);

module.exports = router;
