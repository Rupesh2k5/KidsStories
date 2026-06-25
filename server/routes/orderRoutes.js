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

orderRouter.post('/change-status',protect,changeOrderStatus)
export default orderRouter