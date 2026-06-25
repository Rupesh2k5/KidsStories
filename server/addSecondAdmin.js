import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/user.js';

dotenv.config();

const addSecondAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const email = 'sruthikommalapati1998@gmail.com';
    const password = 'Sruthi@2026';

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists. Updating to admin and changing password...');
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(password, salt);
      existingUser.role = 'owner';
      await existingUser.save();
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newAdmin = new User({
        name: 'Sruthi Admin',
        email: email,
        password: hashedPassword,
        role: 'owner'
      });

      await newAdmin.save();
      console.log('✅ Second Admin user created successfully!');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addSecondAdmin();
