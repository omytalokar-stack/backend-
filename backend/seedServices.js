require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');

const seedData = [
  {
    name: 'Luxury Spa',
    description: 'Body massage, Steam, Glow',
    category: 'Spa',
    imageUrl: 'https://picsum.photos/seed/spa/400/600',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-getting-a-facial-massage-at-a-spa-32750-large.mp4',
    durationMinutes: 60,
    baseRate: 1500,
    offerOn: false
  },
  {
    name: 'House Cleaning',
    description: 'Deep clean, Vacuuming, Sanitizing',
    category: 'Cleaning',
    imageUrl: 'https://picsum.photos/seed/clean/400/600',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-cleaning-glass-with-a-spray-and-rag-41618-large.mp4',
    durationMinutes: 120,
    baseRate: 800,
    offerOn: false
  },
  {
    name: 'Makeup Artistry',
    description: 'Bridal, Party, Minimal',
    category: 'Makeup',
    imageUrl: 'https://picsum.photos/seed/makeup/400/600',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-applying-makeup-to-her-face-with-a-brush-34533-large.mp4',
    durationMinutes: 90,
    baseRate: 2500,
    offerOn: false
  }
];

async function seedServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️  Cleared existing services');

    // Insert new services
    const inserted = await Service.insertMany(seedData);
    console.log(`✅ Inserted ${inserted.length} services:`);
    inserted.forEach(s => {
      console.log(`  - ${s.name} (ID: ${s._id})`);
    });

    await mongoose.connection.close();
    console.log('✅ Seeding complete!');
  } catch (err) {
    console.error('❌ Error seeding services:', err);
    process.exit(1);
  }
}

seedServices();
