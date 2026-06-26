import nodemailer from 'nodemailer';
import order from '../models/Orders.js';
import book from '../models/book.js';
import user from '../models/user.js';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

class NotificationService {

    getTransporter() {
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
            tls: { servername: 'smtp.gmail.com' },
            family: 4
        });
    }

    async sendOrderNotifications(orderId) {
        console.log(`📧 sendOrderNotifications called — orderId: ${orderId}`);
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ EMAIL_USER or EMAIL_PASS missing');
            return;
        }

        try {
            const orderDoc = await order.findById(orderId)
                .populate('book')
                .populate('user')
                .populate('owner');

            if (!orderDoc) {
                console.error(`❌ Order ${orderId} not found`);
                return;
            }

            const bookData = orderDoc.book;
            const userData = orderDoc.user;
            if (!userData?.email) {
                console.error('❌ User has no email');
                return;
            }

            const uniqueId = orderId.toString().slice(-6).toUpperCase();
            const bookTitle = `${bookData.brand}${bookData.model && bookData.model !== 'Single Book' ? ' ' + bookData.model : ''}`;
            const pdfUrl = bookData.pdfUrl || 
                `${process.env.FRONTEND_URL || 'https://kids-stories-olive.vercel.app'}/TheMindroo_Kids_Activity_Book.pdf`;

            const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
  <div style="background: #6c3fc5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📚 Order Confirmed!</h1>
    <p style="color: #ddd0ff; margin: 8px 0 0;">Order #${uniqueId}</p>
  </div>
  <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Hi <strong>${userData.name}</strong>,</p>
    <p style="color: #333;">Your order is confirmed and your book is ready to read! 🎉</p>

    <div style="background: #f0e8ff; border-left: 4px solid #6c3fc5; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0;"><strong>📖 Book:</strong> ${bookTitle}</p>
      <p style="margin: 8px 0 0;"><strong>🧾 Order ID:</strong> #${uniqueId}</p>
      <p style="margin: 8px 0 0;"><strong>💰 Amount Paid:</strong> ₹${orderDoc.price}</p>
    </div>

    <!-- Download button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${pdfUrl}" style="display: inline-block; background: #6c3fc5; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
        📖 Download Your Book Now
      </a>
      <p style="color: #888; font-size: 13px; margin-top: 8px;">(Right-click and "Save link as" to save the PDF)</p>
    </div>

    <p style="color: #888; font-size: 13px; margin-top: 28px;">Questions? Just reply to this email.</p>
    <p style="color: #6c3fc5; font-weight: bold; font-size: 15px;">Happy reading! 📖✨<br>— The KidsStories Team</p>
  </div>
</div>`;

            const transporter = this.getTransporter();
            const result = await transporter.sendMail({
                from: `"KidsStories" <${process.env.EMAIL_USER}>`,
                to: userData.email,
                subject: `📚 Your Book is Ready — Order #${uniqueId} Confirmed!`,
                html: emailHtml,
                text: `Hi ${userData.name},\n\nOrder #${uniqueId} confirmed!\nBook: ${bookTitle}\nAmount: ₹${orderDoc.price}\n\nDownload your book here: ${pdfUrl}\n\nHappy reading!\n— KidsStories Team`
            });

            console.log(`✅ Order email sent to ${userData.email} | MessageID: ${result.messageId}`);

        } catch (error) {
            console.error('❌ sendOrderNotifications FAILED:', error.message);
            console.error(error.stack);
        }
    }

    async sendCartNotification(cart, userId) {
        console.log(`📧 sendCartNotification called — userId: ${userId}`);
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ EMAIL_USER or EMAIL_PASS missing');
            return;
        }

        try {
            const userData = await user.findById(userId);
            if (!userData?.email) {
                console.error('❌ User not found or no email');
                return;
            }

            const bookIds = cart.map(i => i.id).filter(id => id && id.length === 24);
            let booksInDb = [];
            if (bookIds.length) {
                booksInDb = await book.find({ _id: { $in: bookIds } });
            }

            const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const uniqueId = Math.floor(100000 + Math.random() * 900000);

            let itemRows = cart.map(item => {
                const dbBook = booksInDb.find(b => b._id.toString() === item.id);
                const pdfUrl = (dbBook && dbBook.pdfUrl) ? dbBook.pdfUrl :
                    `${process.env.FRONTEND_URL || 'https://kids-stories-olive.vercel.app'}/TheMindroo_Kids_Activity_Book.pdf`;
                return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">📖 ${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">×${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        <a href="${pdfUrl}" style="color: #6c3fc5; font-weight: bold;">Download</a>
      </td>
    </tr>`;
            }).join('');

            const emailHtml = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
  <div style="background: #6c3fc5; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Order Confirmed!</h1>
    <p style="color: #ddd0ff; margin: 8px 0 0;">Order #${uniqueId}</p>
  </div>
  <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px;">Hi <strong>${userData.name}</strong>, thank you for your purchase!</p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
      <thead>
        <tr style="background: #f0e8ff; color: #333;">
          <th style="padding: 10px; text-align: left;">Book</th>
          <th style="padding: 10px; text-align: center;">Qty</th>
          <th style="padding: 10px; text-align: right;">Price</th>
          <th style="padding: 10px; text-align: center;">Download</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
      <tfoot>
        <tr style="background: #f9f9f9; font-weight: bold; font-size: 15px;">
          <td colspan="2" style="padding: 12px; text-align: right; color: #555;">Total Paid:</td>
          <td colspan="2" style="padding: 12px; text-align: left; color: #6c3fc5;">₹${total}</td>
        </tr>
      </tfoot>
    </table>
    <p style="color: #888; font-size: 13px; margin-top: 24px;">Questions? Just reply to this email.</p>
    <p style="color: #6c3fc5; font-weight: bold;">Happy reading! 📖✨<br>— The KidsStories Team</p>
  </div>
</div>`;

            const transporter = this.getTransporter();
            const result = await transporter.sendMail({
                from: `"KidsStories Store" <${process.env.EMAIL_USER}>`,
                to: userData.email,
                subject: `🎉 Your KidsStories Order #${uniqueId} is Confirmed!`,
                html: emailHtml,
                text: `Hi ${userData.name},\n\nOrder #${uniqueId} confirmed! Total: ₹${total}\n\nDownload links for each book:\n${cart.map(i => `${i.name}: ${i.pdfUrl || 'fallback'}`).join('\n')}\n\nHappy reading!\n— KidsStories Team`
            });

            console.log(`✅ Cart email sent to ${userData.email} | MessageID: ${result.messageId}`);
        } catch (error) {
            console.error('❌ sendCartNotification FAILED:', error.message);
            console.error(error.stack);
        }
    }
}

export default new NotificationService();
