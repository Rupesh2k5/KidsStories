import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testEmail() {
    console.log("Testing email with user:", process.env.EMAIL_USER);
    
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const pdfAbsolutePath = path.join(__dirname, '../public/TheMindroo_Kids_Activity_Book.pdf');
    console.log("PDF Path Resolution:", pdfAbsolutePath);

    try {
        let info = await transporter.sendMail({
            from: `"KidsStories Store" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // send to self
            subject: "Test PDF Attachment",
            text: "Testing if the PDF attaches correctly...",
            attachments: [
                {
                    filename: 'TheMindroo_Kids_Activity_Book.pdf',
                    path: pdfAbsolutePath
                }
            ]
        });
        console.log("Email sent successfully! Message ID:", info.messageId);
    } catch (error) {
        console.error("Failed to send email:", error);
    }
}

testEmail();
