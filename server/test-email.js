import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sruthikommalapati1998@gmail.com',
        pass: 'otumlixvhjzhbjrf'
    }
});

transporter.sendMail({
    from: '"KidsStories Store" <sruthikommalapati1998@gmail.com>',
    to: 'sruthikommalapati1998@gmail.com',
    subject: 'Test Email',
    text: 'This is a test email.'
}).then(() => {
    console.log("Email sent successfully!");
}).catch(err => {
    console.error("Error sending email:", err);
});
