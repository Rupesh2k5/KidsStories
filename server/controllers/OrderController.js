import order from "../models/Orders.js"
import book from "../models/book.js"



const checkAvailability=async(book,pickupDate,returnDate)=>{
    const orders=await order.find({
        book,
        status: { $in: ['pending', 'confirmed'] },
        pickupDate:{$lte:returnDate},
        returnDate:{$gte:pickupDate},
    })
    return orders.length===0
}

export const getCarBookedDates = async (req, res) => {
    try {
        const { bookId } = req.params;
        const orders = await order.find({ 
            book: bookId, 
            status: { $in: ['pending', 'confirmed'] } 
        }).select('pickupDate returnDate -_id');

        res.json({ success: true, bookedDates: orders });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
}

export const checkAvailabilityofCar=async(req,res)=>{
    try{
        const {location,pickupDate,returnDate}=req.body

        const books=await book.find({location,isAvailable:true})

        const availableCarsPromises=books.map(async(indi)=>{
            const isAvailable=await checkAvailability(indi._id,pickupDate,returnDate)
            return {...indi._doc,isAvailable:isAvailable}
        })

        let availableCars=await Promise.all(availableCarsPromises)
        availableCars=availableCars.filter(indi=>indi.isAvailable==true)

        res.json({success: true, availableCars})

    }
    catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}

export const getAvailableBooks = async (req, res) => {
    try {
        let books = await book.find({ isAvailable: true }).lean();
        
        // Remove localhost references from the database output
        books = books.map(b => {
            if (b.image && b.image.includes('localhost')) b.image = '';
            if (b.pdfUrl && b.pdfUrl.includes('localhost')) b.pdfUrl = '';
            return b;
        });

        res.json({ success: true, books });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
};

import Razorpay from 'razorpay';
import crypto from 'crypto';
import NotificationService from '../services/notificationService.js';

export const createRazorpayOrder = async (req, res) => {
    try {
        const { bookId, pickupDate, returnDate } = req.body;

        const isAvailable = await checkAvailability(bookId, pickupDate, returnDate);
        if (!isAvailable) {
            return res.json({ success: false, message: 'Book is not Available' });
        }

        const bookData = await book.findById(bookId);
        
        if (bookData.pricingModel === 'perLiter') {
            return res.json({ success: true, bypassPayment: true, price: 0 });
        }

        const picked = new Date(pickupDate);
        const returned = new Date(returnDate);
        const noOfDays = Math.max(1, Math.ceil((returned - picked) / (1000 * 60 * 60 * 24)));
        const totalPrice = bookData.pricePerDay * noOfDays;
        
        // Advance amount fixed to 500 or total price if total is less than 500
        const advanceAmount = Math.min(500, totalPrice);

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
        });

        const options = {
            amount: advanceAmount * 100, // paisa
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        // Return both advanceAmount (for UI and DB) and totalPrice (for DB)
        res.json({ success: true, order, advanceAmount, totalPrice });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
};

export const verifyAndCreateOrder = async (req, res) => {
    try {
        const { _id } = req.user;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

        const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.json({ success: false, message: "Payment verification failed" });
        }

        const { bookId, pickupDate, returnDate, totalPrice, advanceAmount } = orderData;
        const bookDetails = await book.findById(bookId);
        
        const balanceAmount = totalPrice - advanceAmount;

        const newOrder = new order({
            book: bookId,
            user: _id,
            owner: bookDetails.owner,
            pickupDate,
            returnDate,
            status: "confirmed",
            price: totalPrice,
            advancePaid: advanceAmount,
            balanceAmount: balanceAmount,
            paymentId: razorpay_payment_id
        });

        await newOrder.save();

        // Send Notifications
        NotificationService.sendOrderNotifications(newOrder._id).catch(err => console.error("Notification Error:", err));

        res.json({ success: true, message: 'Order Created and Payment Verified' });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
};

export const createCartRazorpayOrder = async (req, res) => {
    try {
        const { totalAmount } = req.body;
        const key_id = process.env.RAZORPAY_KEY_ID || 'dummy_key_id';
        const razorpay = new Razorpay({
            key_id: key_id,
            key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
        });
        const options = {
            amount: totalAmount * 100, // paisa
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };
        const orderInfo = await razorpay.orders.create(options);
        res.json({ success: true, order: orderInfo, key_id: key_id });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
};

export const verifyCartOrder = async (req, res) => {
    try {
        const { _id } = req.user;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cart } = req.body;

        const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== razorpay_signature) {
            return res.json({ success: false, message: "Payment verification failed" });
        }

        // For each cart item, create an order. Dummy dates since they are books.
        for (let item of cart) {
            // Find an admin owner to assign if needed, or just use user ID as owner for simplicity
            const newOrder = new order({
                book: item.id.length === 24 ? item.id : '60d5ecb74d6bb830b8e71111', // Dummy ID if hardcoded
                user: _id,
                owner: _id, // Set owner to self for dummy
                pickupDate: new Date(),
                returnDate: new Date(),
                status: "confirmed",
                price: item.price * item.quantity,
                advancePaid: item.price * item.quantity,
                balanceAmount: 0,
                paymentId: razorpay_payment_id
            });
            await newOrder.save();
        }

        NotificationService.sendCartNotification(cart, _id).catch(err => console.error("Notification Error:", err));

        res.json({ success: true, message: 'Cart Payment Verified and Orders Created!' });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
};

export const createBypassedOrder = async (req, res) => {
    try {
        const { _id } = req.user;
        const { bookId, pickupDate, returnDate } = req.body;

        const isAvailable = await checkAvailability(bookId, pickupDate, returnDate);
        if (!isAvailable) {
            return res.json({ success: false, message: 'Book is not Available' });
        }

        const bookData = await book.findById(bookId);

        if (bookData.pricingModel !== 'perLiter') {
            return res.json({ success: false, message: 'This book requires upfront payment' });
        }

        const newOrder = await order.create({
            book: bookId,
            owner: bookData.owner,
            user: _id,
            pickupDate,
            returnDate,
            price: 0,
            paymentId: 'pay_later'
        });

        NotificationService.sendOrderNotifications(newOrder._id).catch(err => console.error("Notification Error:", err));

        res.json({ success: true, message: 'Order Created Successfully (Pay Later)' });

    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
};


export const getUserOrders= async(req,res)=>{
    try{
        const {_id} =req.user;
        const orders=await order.find({user:_id}).populate("book").sort({createdAt:-1})
        res.json({success:true, orders})
    }
    catch(err){
        console.log(err.message)
        res.json({success:false, message:err.message})
    }
}

export const getOwnerOrders=async(req,res)=>{
    try{
        if(req.user.role!=='owner'){
            return res.json({success:false, message:'Unauthorized'})
        }
        const orders=await order.find({owner:req.user._id}).populate('book user').select('-user.password').sort({createdAt:-1})
        res.json({success:true, orders})
    }
    catch(err){
        console.log(err.message)
        res.json({success:false,message:err.message})
    }
}

export const changeOrderStatus=async(req,res)=>{
    try{
        const {_id}=req.user
        const {orderId,status}=req.body
        const orderDoc=await order.findById(orderId)
        if(orderDoc.owner.toString()!==_id.toString()){
            return res.json({success:false, message:'Unauthorized'})
        }
        orderDoc.status=status
        await orderDoc.save()
        res.json({success:true, message:'Status Updated'})
    }
    catch(err){
        console.log(err.message)
        res.json({success:false,message:err.message})
    }
}