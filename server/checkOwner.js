import mongoose from 'mongoose';
import dotenv from 'dotenv';
import user from './models/user.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const u1 = await user.findOne({ email: 'rupesh.madhuvarsu2005@gmail.com' });
  const u2 = await user.findOne({ email: 'sruthikommalapati1998@gmail.com' });
  
  console.log("Rupesh User:", u1 ? { email: u1.email, role: u1.role } : "Not found");
  console.log("Sruthi User:", u2 ? { email: u2.email, role: u2.role } : "Not found");
  
  if (u2 && u2.role !== 'owner') {
    u2.role = 'owner';
    await u2.save();
    console.log("Updated Sruthi to owner!");
  }
  
  process.exit();
}

check();
