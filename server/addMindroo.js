import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from './models/book.js';
import User from './models/user.js';

dotenv.config();

const addMindrooBook = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const adminUser = await User.findOne({ email: 'rupesh.madhuvarsu2005@gmail.com' });
    if (!adminUser) {
      console.log('Admin user not found. Cannot add book.');
      process.exit(1);
    }

    const newBook = new Book({
      owner: adminUser._id,
      brand: 'TheMindroo Kids Activity Book',
      model: 'E-Book',
      pricePerDay: 99, // Set a price
      image: 'http', // Just a placeholder so it falls back to default image in Home.jsx
      description: 'A fun and engaging activity book filled with puzzles and coloring pages for kids!',
      isAvailable: true
    });

    await newBook.save();
    console.log('✅ TheMindroo Kids Activity Book added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addMindrooBook();
