const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

// Google OAuth Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || '468951644581-vg4g2h17p37qdq3o02aa8i5dlkb8krn8.apps.googleusercontent.com'
);

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Verify Google User
exports.verifyGoogle = async (req, res) => {
  try {
    const { email, name, picture, googleId, idToken } = req.body;

    console.log('\n📱 Google Login Attempt:', { email, googleId: googleId?.substring(0, 10) + '...' });

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Email and Google ID are required' });
    }

    console.log('✅ Received email and googleId from frontend');

    // Find or create user
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Phone can be null/undefined from Google login - that's OK
      user = new User({
        email,
        name,
        picture,
        googleId,
        phone: null,
        isSetupComplete: false
      });
      
      // Check if this email is admin email
      if (email === 'omrtalokar146@gmail.com') {
        user.role = 'admin';
        console.log(`\n👑 Admin user created: ${email}\n`);
      } else {
        console.log(`\n✅ New user created: ${email}\n`);
      }

      try {
        await user.save();
      } catch (e) {
        // Handle duplicate key errors gracefully (e.g., legacy unique index conflicts)
        if (e && e.code === 11000) {
          console.warn('⚠️ Duplicate key on user save, recovering via upsert:', e.message);
          user = await User.findOne({ email }) || await User.findOne({ googleId });
          isNewUser = false;
          if (!user) {
            // Fallback: upsert by email
            user = await User.findOneAndUpdate(
              { email },
              { $setOnInsert: { email, name, picture, googleId, isSetupComplete: false } },
              { new: true, upsert: true }
            );
          }
        } else {
          throw e;
        }
      }
    } else {
      // Update Google ID if needed
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      console.log(`\n✅ Existing user logged in: ${email}\n`);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      isNewUser,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        isSetupComplete: user.isSetupComplete,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('❌ Error in verifyGoogle:', err.message);
    res.status(500).json({ error: 'Failed to verify Google user: ' + err.message });
  }
};

// Send OTP
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Find or create user
    let user = await User.findOne({ phone });

    if (!user) {
      user = new User({ phone, otp, otpExpiresAt });
    } else {
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
    }

    await user.save();

    // Mock SMS - Log OTP to terminal
    console.log(`\n📱 OTP for ${phone}: ${otp}`);
    console.log(`⏱️  OTP expires in 10 minutes\n`);

    res.json({
      message: 'OTP sent successfully',
      isNew: !user.isSetupComplete,
    });
  } catch (err) {
    console.error('Error in sendOTP:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Check OTP expiry
    if (new Date() > user.otpExpiresAt) {
      return res.status(401).json({ error: 'OTP has expired' });
    }

    // Check if this phone is admin phone
    if (phone === '8767619160') {
      user.role = 'admin';
    }

    // Clear OTP
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        isSetupComplete: user.isSetupComplete,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('Error in verifyOTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

// Verify Firebase User
exports.verifyFirebase = async (req, res) => {
  try {
    const { phone, firebaseUid } = req.body;

    if (!phone || !firebaseUid) {
      return res.status(400).json({ error: 'Phone and firebaseUid are required' });
    }

    // Find or create user
    let user = await User.findOne({ phone });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = new User({
        phone,
        firebaseUid,
        isSetupComplete: false
      });
      
      // Check if this phone is admin phone
      if (phone === '8767619160') {
        user.role = 'admin';
      }

      await user.save();
    } else {
      // Update Firebase UID if needed
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
        await user.save();
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      isNewUser,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        isSetupComplete: user.isSetupComplete,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error('Error in verifyFirebase:', err);
    res.status(500).json({ error: 'Failed to verify Firebase user' });
  }
};

exports.setupProfile = async (req, res) => {
  try {
    const { nickname, avatarUrl, name } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!nickname && !avatarUrl && !name) {
      return res.status(400).json({ error: 'Nickname, name, or avatarUrl required' });
    }

    // Update user profile
    const update = {
      ...(nickname ? { nickname } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
      ...(name ? { name } : {}),
      isSetupComplete: true,
    };
    const user = await User.findByIdAndUpdate(userId, update, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile setup completed',
      user: {
        id: user._id,
        phone: user.phone,
        nickname: user.nickname,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isSetupComplete: user.isSetupComplete,
      },
    });
  } catch (err) {
    console.error('Error in setupProfile:', err);
    res.status(500).json({ error: 'Failed to setup profile' });
  }
};

// Update user name
exports.updateName = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await User.findByIdAndUpdate(userId, { name: name.trim() }, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Name updated successfully',
      user: {
        id: user._id,
        name: user.name,
        nickname: user.nickname,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Error in updateName:', err);
    res.status(500).json({ error: 'Failed to update name' });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // include orderCount so frontend can decide one-time-offer eligibility
    const Booking = require('../models/Booking');
    const orderCount = await Booking.countDocuments({ userId: user._id });
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        isOfferClaimed: !!user.isOfferClaimed,
        isOfferActive: !!user.isOfferActive,
        isOfferUsed: !!user.isOfferUsed,
        savedReels: user.savedReels || [],
        orderCount: orderCount || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Save a reel for current user
exports.saveReel = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { reelId, serviceId } = req.body;
    const id = reelId || serviceId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!id) return res.status(400).json({ error: 'reelId or serviceId is required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const current = Array.from(new Set([...(user.savedReels || [])]));
    if (current.length >= 15 && !current.includes(id)) {
      return res.status(400).json({ error: 'Storage Full! 15 reels limit reached.' });
    }
    user.savedReels = Array.from(new Set([...current, id]));
    await user.save();
    res.json({ message: 'Reel saved', savedReels: user.savedReels });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save reel' });
  }
};

// Mark offer as used
exports.markOfferUsed = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findByIdAndUpdate(
      userId,
      { isOfferUsed: true },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Offer marked as used', isOfferUsed: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark offer used' });
  }
};

// Claim offer (activate 20% off for the user)
exports.claimOffer = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isOfferUsed) {
      return res.status(400).json({ error: 'Offer already used' });
    }
    if (user.isOfferClaimed) {
      return res.json({ message: 'Offer already claimed', isOfferClaimed: true });
    }
    user.isOfferClaimed = true;
    user.isOfferActive = true;
    await user.save();
    res.json({ message: 'Offer claimed', isOfferClaimed: true, isOfferActive: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim offer' });
  }
};
