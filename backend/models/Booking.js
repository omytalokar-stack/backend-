const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Legacy single-service reference (nullable). Multi-service bookings use `serviceIds` + `services` array.
  serviceId: { type: String, ref: 'Service', required: false },
  // For cart/multi-service bookings: store referenced service ids
  serviceIds: [{ type: String }],
  date: { type: String, required: true },
  startHour: { type: Number, required: true },
  endHour: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Done', 'completed', 'pending'], default: 'Pending' },
  customerName: { type: String, default: null },
  address: { type: String, default: null },
  totalPrice: { type: Number, default: 0 },
  totalDuration: { type: String, default: null },
  // Array of services for bulk/cart bookings
  services: [{
    serviceId: { type: String },
    serviceName: { type: String, default: '' },
    price: { type: Number, default: 0 },
    duration: { type: String, default: '' }
  }],
}, { timestamps: true });

// Index to speed up overlapping-slot queries (non-unique; overlap logic handled in app)
bookingSchema.index({ date: 1, startHour: 1, endHour: 1 });
bookingSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
