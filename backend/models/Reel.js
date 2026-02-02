const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  serviceName: { type: mongoose.Schema.Types.Mixed, default: '' }, // store name or {en, hi} object
  description: { type: mongoose.Schema.Types.Mixed, default: '' }, // store description or {en, hi} object
  videoUrl: { type: String, required: true },
  pinnedComment: { type: String, default: '' },
  replies: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likedByUsers: { type: [String], default: [] }, // array of user IDs who liked
}, { timestamps: true });

module.exports = mongoose.model('Reel', reelSchema);
