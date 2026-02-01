const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  category: { 
    type: String, 
    enum: ['Bleach', 'Makeup', 'Facial', 'Cleanup', 'Waxing', 'Hair Cut', 'Hair Style', 'Polishing'],
    default: 'Bleach' 
  },
  imageUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  durationMinutes: { type: Number, default: 60 },
  baseRate: { type: Number, default: 0 },
  offerOn: { type: Boolean, default: false },
}, { timestamps: true });

// Transform service to include multilingual fields
serviceSchema.set('toJSON', {
  transform: function(doc, ret) {
    return {
      _id: ret._id,
      id: ret._id.toString(),
      name: {
        en: ret.name,
        hi: ret.name // Keep same for now, can be translated
      },
      features: {
        en: ret.description,
        hi: ret.description
      },
      category: ret.category,
      imageUrl: ret.imageUrl,
      thumbnail: ret.imageUrl,
      videoUrl: ret.videoUrl,
      time: `${ret.durationMinutes} min`,
      rate: `₹${ret.baseRate}`,
      baseRate: ret.baseRate,
      durationMinutes: ret.durationMinutes,
      offerOn: ret.offerOn,
      createdAt: ret.createdAt,
      updatedAt: ret.updatedAt
    };
  }
});

module.exports = mongoose.model('Service', serviceSchema);
