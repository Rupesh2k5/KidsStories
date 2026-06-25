import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/user.js';

dotenv.config();

const fixPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB to fix password');

    const adminEmail = 'rupesh.madhuvarsu2005@gmail.com';
    const user = await User.findOne({ email: adminEmail });
    
    if (user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Rupesh@2k5', salt);
      user.password = hashedPassword;
      await user.save();
      console.log('✅ Password successfully hashed and updated to Rupesh@2k5!');
    } else {
      console.log('❌ User not found.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing password:', error);
    process.exit(1);
  }
};

fixPassword();
