const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  videoUrl: { type: String, required: true },
  description: { type: String, default: '' },
  pinnedComment: { type: String, default: '' },
  replies: { type: [String], default: [] },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Reel', reelSchema);
