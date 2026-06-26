import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'sruthikommalapati1998@gmail.com',
        pass: 'pjakziifwfdqpfyi' // Testing new password
    },
    tls: { servername: 'smtp.gmail.com' },
    family: 4
});

transporter.verify((error, success) => {
    if (error) {
        console.log("Error:", error);
    } else {
        console.log("Server is ready to take our messages");
    }
});
