import mongoose from 'mongoose';
import dotenv from 'dotenv';
import NotificationService from './services/notificationService.js';
import user from './models/user.js';
import book from './models/book.js';
import order from './models/Orders.js';

dotenv.config({ path: '../.env' });

async function test() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect('mongodb+srv://rupesh2k5chandra:Rupesh123@cluster0.ooh8q.mongodb.net/wise-pascal?retryWrites=true&w=majority&appName=Cluster0');
        console.log("Connected.");
        
        // Find a recent order
        const recentOrder = await order.findOne().sort({ createdAt: -1 });
        if (!recentOrder) {
            console.log("No orders found.");
            return;
        }
        
        console.log("Found order:", recentOrder._id);
        
        // Manually set EMAIL_USER and EMAIL_PASS to ensure they are present for this test
        process.env.EMAIL_USER = 'sruthikommalapati1998@gmail.com';
        process.env.EMAIL_PASS = 'otumlixvhjzhbjrf';
        
        // Re-initialize transporter to pick up the env vars we just set
        NotificationService.transporter.options.auth.user = process.env.EMAIL_USER;
        NotificationService.transporter.options.auth.pass = process.env.EMAIL_PASS;
        
        console.log("Sending order notification...");
        await NotificationService.sendOrderNotifications(recentOrder._id);
        console.log("Done calling sendOrderNotifications.");
        
        // Let's also test cart notification
        console.log("Testing cart notification...");
        const dbUser = await user.findOne();
        const dbBook = await book.findOne();
        
        const cart = [{
            id: dbBook._id.toString(),
            name: dbBook.model,
            quantity: 1,
            price: 199
        }];
        
        await NotificationService.sendCartNotification(cart, dbUser._id);
        console.log("Done calling sendCartNotification.");
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

test();
