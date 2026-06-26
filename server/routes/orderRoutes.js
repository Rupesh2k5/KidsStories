import express from 'express';
import {
    changeOrderStatus,
    checkAvailabilityofCar,
    createRazorpayOrder,
    verifyAndCreateOrder,
    createBypassedOrder,
    getOwnerOrders,
    getUserOrders,
    getCarBookedDates,
    createCartRazorpayOrder,
    verifyCartOrder,
    getAvailableBooks
} from '../controllers/OrderController.js';
import { protect } from '../middleware/auth.js';
import NotificationService from '../services/notificationService.js';

const orderRouter = express.Router();

orderRouter.post('/check-availability', checkAvailabilityofCar);
orderRouter.get('/books', getAvailableBooks);
orderRouter.post('/create-order', protect, createRazorpayOrder);
orderRouter.post('/verify-payment', protect, verifyAndCreateOrder);
orderRouter.post('/create-bypassed', protect, createBypassedOrder);
orderRouter.post('/cart/create-razorpay-order', protect, createCartRazorpayOrder);
orderRouter.post('/cart/verify-order', protect, verifyCartOrder);
orderRouter.get('/user', protect, getUserOrders);
orderRouter.get('/owner', protect, getOwnerOrders);
orderRouter.get('/dates/:bookId', getCarBookedDates);

// ✅ FIXED: use getTransporter() not .transporter (which no longer exists as a property)
// Test via: GET /api/order/test-email?email=yourname@gmail.com
orderRouter.get('/test-email', async (req, res) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.json({
                success: false,
                message: `❌ Missing env vars on server — EMAIL_USER: ${!!process.env.EMAIL_USER}, EMAIL_PASS: ${!!process.env.EMAIL_PASS}`
            });
        }

        const uniqueId = Math.floor(100000 + Math.random() * 900000);
        const targetEmail = req.query.email || 'rupesh.2k5chandra@gmail.com';

        // getTransporter() reads EMAIL_USER/PASS fresh at call time — never stale
        await NotificationService.getTransporter().sendMail({
            from: `"KidsStories Test" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            subject: `✅ Test Email Working! [Test #${uniqueId}]`,
            text: `Email config is working correctly!\n\nEMAIL_USER: ${process.env.EMAIL_USER}\nTest ID: ${uniqueId}\n\nIf you see this, order emails will now work.`
        });

        res.json({ success: true, message: `✅ Test email sent to ${targetEmail}` });

    } catch (err) {
        // Return the FULL error so you can see exactly what Gmail says
        res.json({
            success: false,
            message: `❌ Email failed: ${err.message}`,
            code: err.code,
            command: err.command
        });
    }
});

orderRouter.post('/change-status', protect, changeOrderStatus);

export default orderRouter;
