import nodemailer from 'nodemailer';
import twilio from 'twilio';
import order from '../models/Orders.js';
import book from '../models/book.js';
import user from '../models/user.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Force Node.js to prefer IPv4 over IPv6 to fix Render timeout issues with Google SMTP
dns.setDefaultResultOrder('ipv4first');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NotificationService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Initialize Twilio client only if credentials exist
        if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
            this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        }
    }

    async sendCartNotification(cart, userId) {
        try {
            const userData = await user.findById(userId);
            if (!userData) return;

            const bookIds = cart.map(item => item.id);
            let booksInDb = [];
            try {
                // Filter out non-24-character hex strings to prevent CastError
                const validBookIds = bookIds.filter(id => id && id.length === 24);
                if (validBookIds.length > 0) {
                    booksInDb = await book.find({ _id: { $in: validBookIds } });
                }
            } catch (err) {
                console.log("Could not fetch books for notification (might be dummy books), proceeding with fallbacks.");
            }

            const itemsList = cart.map(item => {
                const dbBook = booksInDb.find(b => b._id.toString() === item.id);
                const pdfLink = (dbBook && dbBook.pdfUrl) ? dbBook.pdfUrl : `${process.env.FRONTEND_URL || 'https://kids-stories-olive.vercel.app'}/TheMindroo_Kids_Activity_Book.pdf`;
                return `📖 ${item.name} (Quantity: ${item.quantity}) - ₹${item.price * item.quantity}\n📥 Download Here: ${pdfLink}`;
            }).join('\n\n');
            
            const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            
            const uniqueId = Math.floor(100000 + Math.random() * 900000);
            const emailSubjectUser = `Your Magical Books Order is Confirmed! 🎉 [Order #${uniqueId}]`;
            const emailTextUser = `Hi ${userData.name},\n\nThank you for shopping with us! Your order (#${uniqueId}) has been successfully placed.\n\n=== YOUR DIGITAL BOOKS ===\n\n${itemsList}\n\n=========================\nTotal Paid: ₹${total}\n\nHappy reading! 📚✨\n\nBest regards,\nKidsStories Team`;

            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await this.transporter.sendMail({
                    from: `"KidsStories Store" <${process.env.EMAIL_USER}>`,
                    to: userData.email,
                    subject: emailSubjectUser,
                    text: emailTextUser
                });
            }
        } catch (error) {
            console.error("Notification Service Error:", error);
        }
    }

    async sendOrderNotifications(orderId) {
        try {
            const orderDoc = await order.findById(orderId).populate('book').populate('user').populate('owner');
            
            if (!orderDoc) return;

            const bookData = orderDoc.book;
            const userData = orderDoc.user;

            const uniqueId = orderId.toString().slice(-6).toUpperCase();
            const emailSubjectUser = `Order Confirmed: ${bookData.brand} ${bookData.model !== 'Single Book' ? bookData.model : ''} [Order #${uniqueId}]`;
            const pdfLink = bookData.pdfUrl ? bookData.pdfUrl : `${process.env.FRONTEND_URL || 'https://kids-stories-olive.vercel.app'}/TheMindroo_Kids_Activity_Book.pdf`;
            const emailTextUser = `Hi ${userData.name},\n\nYour order (#${uniqueId}) for ${bookData.brand} has been confirmed.\nAmount Paid: ₹${orderDoc.price}\n\n📥 DOWNLOAD LINK:\n${pdfLink}\n\nThank you for choosing KidsStories!`;

            // Send Emails
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await this.transporter.sendMail({
                    from: `"KidsStories" <${process.env.EMAIL_USER}>`,
                    to: userData.email,
                    subject: emailSubjectUser,
                    text: emailTextUser
                });
            }
        } catch (error) {
            console.error("Notification Service Error:", error);
        }
    }
}

export default new NotificationService();
