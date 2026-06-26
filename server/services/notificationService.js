import nodemailer from 'nodemailer';
import order from '../models/Orders.js';
import book from '../models/book.js';
import user from '../models/user.js';
import https from 'https';
import http from 'http';

class NotificationService {

    // ✅ FIX 1: Never build transporter at import time.
    // Always create fresh — env vars are read at call time, not cold-start.
    getTransporter() {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
        });
    }

    // ✅ FIX 2: Download PDF from a URL into a Buffer (no filesystem — works on Vercel)
    fetchPdfBuffer(url) {
        return new Promise((resolve, reject) => {
            const get = url.startsWith('https') ? https.get.bind(https) : http.get.bind(http);

            const doGet = (targetUrl) => {
                get(targetUrl, (res) => {
                    // Follow redirects (301/302)
                    if (res.statusCode === 301 || res.statusCode === 302) {
                        return doGet(res.headers.location);
                    }
                    if (res.statusCode !== 200) {
                        return reject(new Error(`PDF fetch failed with status ${res.statusCode}`));
                    }
                    const chunks = [];
                    res.on('data', chunk => chunks.push(chunk));
                    res.on('end', () => resolve(Buffer.concat(chunks)));
                    res.on('error', reject);
                }).on('error', reject);
            };

            doGet(url);
        });
    }

    // Download PDF and return nodemailer attachment array
    async buildPdfAttachment(pdfUrl, fileName = 'YourBook.pdf') {
        try {
            console.log(`📥 Fetching PDF from: ${pdfUrl}`);
            const pdfBuffer = await this.fetchPdfBuffer(pdfUrl);
            console.log(`✅ PDF fetched — size: ${pdfBuffer.length} bytes`);
            return [{
                filename: fileName,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }];
        } catch (err) {
            // Graceful fallback — email still sends, just without attachment
            console.error('⚠️ Could not fetch PDF for attachment:', err.message);
            return [];
        }
    }

    // ─────────────────────────────────────────────
    // SEND ORDER NOTIFICATION (single book purchase)
    // ─────────────────────────────────────────────
    async sendOrderNotifications(orderId) {
        console.log(`📧 sendOrderNotifications called — orderId: ${orderId}`);

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ EMAIL_USER or EMAIL_PASS missing from environment!');
            return;
        }

        try {
            const orderDoc = await order.findById(orderId)
                .populate('book')
                .populate('user')
                .populate('owner');

            if (!orderDoc) {
                console.error(`❌ Order ${orderId} not found in DB`);
                return;
            }

            const bookData = orderDoc.book;
            const userData = orderDoc.user;

            if (!userData?.email) {
                console.error('❌ User has no email address');
                return;
            }

            const uniqueId = orderId.toString().slice(-6).toUpperCase();
            const bookTitle = `${bookData.brand}${bookData.model && bookData.model !== 'Single Book' ? ' ' + bookData.model : ''}`;
            const pdfUrl = bookData.pdfUrl ||
                `${process.env.FRONTEND_URL || 'https://kids-stories-olive.vercel.app'}/TheMindroo_Kids_Activity_Book.pdf`;
            const safeFileName = `${bookData.brand.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

            // ✅ Attach the PDF
            const attachments = await this.buildPdfAttachment(pdfUrl, safeFileName);
            const hasAttachment = attachments.length > 0;

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

    ${hasAttachment
        ? `<div style="background: #e8f5e9; border: 2px dashed #4caf50; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 18px; margin: 0; color: #2e7d32;">📎 <strong>Your book PDF is attached to this email!</strong></p>
        <p style="color: #555; margin: 8px 0 0; font-size: 14px;">Open the attachment to read it. Save it to your device for offline access anytime.</p>
      </div>`
        : `<div style="background: #fff3e0; border: 2px solid #ff9800; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 16px; margin: 0;">📥 <strong>Download your book here:</strong></p>
        <a href="${pdfUrl}" style="display: inline-block; margin-top: 12px; background: #6c3fc5; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px;">
          📖 Download PDF
        </a>
      </div>`
    }

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
                text: `Hi ${userData.name},\n\nOrder #${uniqueId} confirmed!\nBook: ${bookTitle}\nAmount: ₹${orderDoc.price}\n\n${hasAttachment ? 'Your PDF is attached to this email!' : `Download here: ${pdfUrl}`}\n\nHappy reading!\n— KidsStories Team`,
                attachments
            });

            console.log(`✅ Order email sent to ${userData.email} | MessageID: ${result.messageId} | PDF attached: ${hasAttachment}`);

        } catch (error) {
            console.error('❌ sendOrderNotifications FAILED:', error.message);
            console.error(error.stack);
        }
    }

    // ─────────────────────────────────────────────
    // SEND CART NOTIFICATION (multi-book purchase)
    // ─────────────────────────────────────────────
    async sendCartNotification(cart, userId) {
        console.log(`📧 sendCartNotification called — userId: ${userId}`);

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ EMAIL_USER or EMAIL_PASS missing from environment!');
            return;
        }

        try {
            const userData = await user.findById(userId);
            if (!userData?.email) {
                console.error('❌ User not found or has no email');
                return;
            }

            // Fetch real DB books to get pdfUrls
            const validBookIds = cart.map(i => i.id).filter(id => id && id.length === 24);
            let booksInDb = [];
            if (validBookIds.length > 0) {
                booksInDb = await book.find({ _id: { $in: validBookIds } });
            }

            const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const uniqueId = Math.floor(100000 + Math.random() * 900000);

            // Build deduplicated PDF attachments
            const allAttachments = [];
            const attachedUrls = new Set();

            for (const item of cart) {
                const dbBook = booksInDb.find(b => b._id.toString() === item.id);
                const pdfUrl = (dbBook && dbBook.pdfUrl)
                    ? dbBook.pdfUrl
                    : `${process.env.FRONTEND_URL || 'https://kids-stories-olive.vercel.app'}/TheMindroo_Kids_Activity_Book.pdf`;

                if (!attachedUrls.has(pdfUrl)) {
                    attachedUrls.add(pdfUrl);
                    const safeFileName = `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                    const att = await this.buildPdfAttachment(pdfUrl, safeFileName);
                    allAttachments.push(...att);
                }
            }

            const hasAttachments = allAttachments.length > 0;

            // Build item rows for HTML email
            const itemRows = cart.map(item => {
                const dbBook = booksInDb.find(b => b._id.toString() === item.id);
                const pdfUrl = (dbBook && dbBook.pdfUrl)
                    ? dbBook.pdfUrl
                    : `${process.env.FRONTEND_URL || 'https://kids-stories-olive.vercel.app'}/TheMindroo_Kids_Activity_Book.pdf`;
                return `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">📖 ${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">×${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
      ${!hasAttachments ? `<td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;"><a href="${pdfUrl}" style="color: #6c3fc5; font-weight: bold;">Download</a></td>` : '<td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #4caf50;">📎 Attached</td>'}
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
          <th style="padding: 10px; text-align: center;">${hasAttachments ? 'Status' : 'Download'}</th>
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

    ${hasAttachments
        ? `<div style="background: #e8f5e9; border: 2px dashed #4caf50; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <p style="font-size: 17px; margin: 0; color: #2e7d32;">📎 <strong>All your PDFs are attached to this email!</strong></p>
        <p style="color: #555; font-size: 13px; margin: 8px 0 0;">Save them to your device for offline access anytime.</p>
      </div>`
        : `<div style="background: #fff3e0; padding: 15px; border-radius: 8px; border: 1px solid #ffcc80;">
        <p style="margin: 0; color: #e65c00;">⚠️ PDFs couldn't be attached directly — use the download links in the table above.</p>
      </div>`
    }

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
                text: `Hi ${userData.name},\n\nOrder #${uniqueId} confirmed! Total: ₹${total}\n\n${hasAttachments ? 'All PDFs are attached to this email!' : 'Use the download links in the HTML version of this email.'}\n\nHappy reading!\n— KidsStories Team`,
                attachments: allAttachments
            });

            console.log(`✅ Cart email sent to ${userData.email} | MessageID: ${result.messageId} | PDFs attached: ${allAttachments.length}`);

        } catch (error) {
            console.error('❌ sendCartNotification FAILED:', error.message);
            console.error(error.stack);
        }
    }
}

export default new NotificationService();
