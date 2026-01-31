const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: String, ref: 'Service', required: true },
  date: { type: String, required: true },
  startHour: { type: Number, required: true },
  endHour: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Done'], default: 'Pending' },
}, { timestamps: true });

// Index to speed up overlapping-slot queries (non-unique; overlap logic handled in app)
bookingSchema.index({ date: 1, startHour: 1, endHour: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
