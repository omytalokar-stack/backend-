const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  reelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel', required: true, index: true },
  userId: { type: String, required: true }, // User ID or "Anonymous"
  userName: { type: String, default: 'User' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
