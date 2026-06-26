import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'sruthikommalapati1998@gmail.com',
        pass: 'otumlixvhjzhbjrf'
    }
});

async function run() {
    try {
        const uniqueId = Math.floor(100000 + Math.random() * 900000);
        let info = await transporter.sendMail({
            from: '"KidsStories Store" <sruthikommalapati1998@gmail.com>',
            to: "rupesh.2k5chandra@gmail.com",
            subject: `Test Multiple Email ${uniqueId}`,
            text: "This is a test to see if multiple emails work."
        });
        console.log("Sent successfully! Message ID:", info.messageId);
    } catch (e) {
        console.error("Error:", e);
    }
}
run();
