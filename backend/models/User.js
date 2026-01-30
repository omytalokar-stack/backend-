const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: null,
    },
    picture: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      default: null,
    },
    firebaseUid: {
      type: String,
      default: null,
    },
    nickname: {
      type: String,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    savedReels: {
      type: [String],
      default: [],
    },
    isOfferClaimed: {
      type: Boolean,
      default: false,
    },
    isOfferActive: {
      type: Boolean,
      default: false,
    },
    isOfferUsed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isSetupComplete: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Ensure phone index is sparse so multiple nulls are allowed
userSchema.index({ phone: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema);
