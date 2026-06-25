import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/user.js';
import Book from './models/book.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Seeding');

    // 1. Create an Admin User
    const adminEmail = 'rupesh.madhuvarsu2005@gmail.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt); // Default password: admin123
      
      admin = new User({
        name: 'Rupesh Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'owner', // Make them an admin
        phone: '8500617107'
      });
      await admin.save();
      console.log('✅ Admin user created! (Email: rupesh.madhuvarsu2005@gmail.com | Pass: admin123)');
    } else {
      console.log('ℹ️ Admin user already exists.');
    }

    // 2. Create Initial Books
    const existingBooksCount = await Book.countDocuments();
    if (existingBooksCount === 0) {
      const initialBooks = [
        {
          brand: 'The Magic Forest',
          model: 'Single Book',
          description: 'A magical journey through an enchanted forest filled with wonderful creatures.',
          pricePerDay: 199,
          image: '/src/assets/book1.png',
          isAvailable: true,
          owner: admin._id
        },
        {
          brand: 'Space Explorer',
          model: 'Single Book',
          description: 'Blast off into space and learn about the planets and stars!',
          pricePerDay: 199,
          image: '/src/assets/book2.png',
          isAvailable: true,
          owner: admin._id
        },
        {
          brand: 'Super Combo',
          model: 'Bundle',
          description: 'Get both The Magic Forest and Space Explorer at a discounted price!',
          pricePerDay: 350,
          image: '/src/assets/book3.png',
          isAvailable: true,
          owner: admin._id
        }
      ];

      await Book.insertMany(initialBooks);
      console.log('✅ Initial books seeded successfully!');
    } else {
      console.log('ℹ️ Books already exist, skipping seed.');
    }

    console.log('🎉 Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
