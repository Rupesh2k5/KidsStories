import mongoose from 'mongoose';
import user from './models/user.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect('mongodb+srv://rupeshmadhuvarsu2005_db_user:4m1migNxvZlilIL1@cluster0.2fv1v15.mongodb.net/wise_pascal?appName=Cluster0');
        const users = await user.find({});
        console.log("Users in DB:");
        users.forEach(u => console.log(`- Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`));
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
