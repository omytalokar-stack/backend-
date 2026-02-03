const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  note: { type: String, default: '' }
}, { timestamps: true });

holidaySchema.set('toJSON', {
  transform: function(doc, ret) {
    return { _id: ret._id, date: ret.date, note: ret.note };
  }
});

module.exports = mongoose.model('Holiday', holidaySchema);
