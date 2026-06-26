import express from 'express';
import { changeOrderStatus, checkAvailabilityofCar, createRazorpayOrder, verifyAndCreateOrder, createBypassedOrder, getOwnerOrders, getUserOrders, getCarBookedDates, createCartRazorpayOrder, verifyCartOrder, getAvailableBooks } from '../controllers/OrderController.js';
import { protect } from '../middleware/auth.js';
const orderRouter = express.Router();
orderRouter.post('/check-availability', checkAvailabilityofCar);
orderRouter.get('/books', getAvailableBooks);
orderRouter.post('/create-order', protect, createRazorpayOrder)
orderRouter.post('/verify-payment', protect, verifyAndCreateOrder)
orderRouter.post('/create-bypassed', protect, createBypassedOrder)
orderRouter.post('/cart/create-razorpay-order', protect, createCartRazorpayOrder)
orderRouter.post('/cart/verify-order', protect, verifyCartOrder)
orderRouter.get('/user',protect,getUserOrders)
orderRouter.get('/owner',protect,getOwnerOrders)
orderRouter.get('/dates/:bookId', getCarBookedDates)

import NotificationService from '../services/notificationService.js';

orderRouter.get('/test-email', async (req, res) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.json({ success: false, message: "Server is missing EMAIL_USER or EMAIL_PASS environment variables" });
        }
        const uniqueId = Math.floor(100000 + Math.random() * 900000);
        await NotificationService.transporter.sendMail({
            from: `"KidsStories Test" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `Test Email Successful! [Test #${uniqueId}]`,
            text: `If you are reading this, your email configuration on Render is working perfectly! You can now receive order emails.\n\nTest ID: ${uniqueId}`
        });
        res.json({ success: true, message: "Email sent successfully to " + process.env.EMAIL_USER });
    } catch (err) {
        res.json({ success: false, message: "Failed to send email: " + err.message });
    }
});

orderRouter.post('/change-status',protect,changeOrderStatus)
export default orderRouter