const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: String, ref: 'Service', required: true },
  date: { type: String, required: true },
  startHour: { type: Number, required: true },
  endHour: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Done', 'completed', 'pending'], default: 'Pending' },
  customerName: { type: String, default: null },
  address: { type: String, default: null },
  totalPrice: { type: Number, default: 0 },
  totalDuration: { type: String, default: null },
}, { timestamps: true });

// Index to speed up overlapping-slot queries (non-unique; overlap logic handled in app)
bookingSchema.index({ date: 1, startHour: 1, endHour: 1 });
bookingSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
