import mongoose from 'mongoose';
import order from './models/Orders.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        await mongoose.connect('mongodb+srv://rupeshmadhuvarsu2005_db_user:4m1migNxvZlilIL1@cluster0.2fv1v15.mongodb.net/wise_pascal?appName=Cluster0');
        const indexes = await order.collection.indexes();
        console.log("Indexes on orders collection:");
        console.log(indexes);
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
check();
