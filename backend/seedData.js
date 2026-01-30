/**
 * Seed Database Script
 * Populates MongoDB with sample services and reels for testing
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');
const Reel = require('./models/Reel');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || (() => {
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASS;
  const host = process.env.MONGO_HOST || 'cluster0.ia1xxxb.mongodb.net';
  const db = process.env.MONGO_DB || '';
  if (user && pass) {
    const escUser = encodeURIComponent(user);
    const escPass = encodeURIComponent(pass);
    return `mongodb+srv://${escUser}:${escPass}@${host}/${db}`;
  }
  return 'mongodb://localhost:27017/pastel-service';
})();

console.log('🌱 Starting database seed...');
console.log('📊 MongoDB URI:', MONGODB_URI.replace(/:[^:]*@/, ':***@'));

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(async () => {
    console.log('✅ MongoDB connected');

    try {
      // Check existing data
      const serviceCount = await Service.countDocuments();
      const reelCount = await Reel.countDocuments();
      console.log(`📊 Current data: ${serviceCount} services, ${reelCount} reels`);

      // Sample Services
      const sampleServices = [
        {
          name: '💅 Bridal Makeup',
          description: 'Complete bridal makeup with HD coverage, waterproof finish and traditional techniques',
          category: 'Makeup',
          imageUrl: 'https://via.placeholder.com/400x300?text=Bridal+Makeup',
          durationMinutes: 90,
          baseRate: 2500,
          offerOn: true
        },
        {
          name: '💇 Hair Styling',
          description: 'Professional hair cutting, coloring, and styling for all occasions',
          category: 'Hair',
          imageUrl: 'https://via.placeholder.com/400x300?text=Hair+Styling',
          durationMinutes: 60,
          baseRate: 800,
          offerOn: false
        },
        {
          name: '💅 Nail Art',
          description: 'Creative nail art designs with gel polish and decorative elements',
          category: 'Nails',
          imageUrl: 'https://via.placeholder.com/400x300?text=Nail+Art',
          durationMinutes: 45,
          baseRate: 600,
          offerOn: true
        },
        {
          name: '🧖 Facial Treatment',
          description: 'Relaxing facial with cleansing, exfoliation, massage and moisturizing',
          category: 'Skincare',
          imageUrl: 'https://via.placeholder.com/400x300?text=Facial+Treatment',
          durationMinutes: 60,
          baseRate: 900,
          offerOn: false
        },
        {
          name: '🪮 Hair Spa',
          description: 'Deep conditioning hair spa treatment for damaged and dry hair',
          category: 'Hair',
          imageUrl: 'https://via.placeholder.com/400x300?text=Hair+Spa',
          durationMinutes: 75,
          baseRate: 1200,
          offerOn: true
        }
      ];

      // Clear existing services if needed (uncomment to reset)
      // await Service.deleteMany({});
      
      // Insert services only if collection is empty
      if (serviceCount === 0) {
        const createdServices = await Service.insertMany(sampleServices);
        console.log(`✅ Created ${createdServices.length} sample services`);

        // Sample Reels (referencing the created services)
        const sampleReels = [
          {
            serviceId: createdServices[0]._id,
            videoUrl: 'https://example.com/bridal-makeup-demo.mp4',
            description: '✨ Stunning bridal makeup transformation in 90 minutes! Perfect for weddings and special occasions.',
            pinnedComment: '🌟 Book now for your special day!',
            replies: ['Beautiful work!', 'Love the finish!', 'Booking soon!'],
            views: 1250,
            likes: 342
          },
          {
            serviceId: createdServices[1]._id,
            videoUrl: 'https://example.com/hair-styling-demo.mp4',
            description: '💇‍♀️ Professional hair styling that transforms your look instantly. Trending styles for 2026!',
            pinnedComment: '💕 Get this look today!',
            replies: ['Gorgeous!', 'Amazing transformation!', 'Want this haircut'],
            views: 2100,
            likes: 567
          },
          {
            serviceId: createdServices[2]._id,
            videoUrl: 'https://example.com/nail-art-demo.mp4',
            description: '💅 Creative nail art designs that pop! Perfect for any occasion - weddings, parties, or just self-care.',
            pinnedComment: '✨ Which design is your favorite?',
            replies: ['All so pretty!', 'Need this ASAP', 'Your designs rock'],
            views: 1890,
            likes: 456
          },
          {
            serviceId: createdServices[3]._id,
            videoUrl: 'https://example.com/facial-demo.mp4',
            description: '🧖 Relaxing facial treatment for glowing, refreshed skin. Feel pampered and rejuvenated!',
            pinnedComment: '😍 Your skin will thank you!',
            replies: ['So relaxing', 'Skin looks amazing', 'Booking appointment now'],
            views: 1456,
            likes: 298
          },
          {
            serviceId: createdServices[4]._id,
            videoUrl: 'https://example.com/hair-spa-demo.mp4',
            description: '🪮 Deep conditioning hair spa - goodbye frizz and dry hair! Healthy, shiny hair in 75 minutes.',
            pinnedComment: '💆‍♀️ Pamper yourself today!',
            replies: ['Hair looks so soft!', 'Definitely coming', 'Worth every penny'],
            views: 1678,
            likes: 423
          }
        ];

        // Insert reels
        const createdReels = await Reel.insertMany(sampleReels);
        console.log(`✅ Created ${createdReels.length} sample reels`);
      } else {
        console.log('⏭️ Database already has services, skipping insertion');
      }

      console.log('✅ Seed completed successfully!');
      console.log('📱 Frontend should now load data without "Loading reels" spinner');
      process.exit(0);

    } catch (err) {
      console.error('❌ Seed error:', err.message);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
