
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false, // STARTTLS
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password
    },
});

// Always send from your Gmail address
async function sendMail({ to, subject, text, html }) {
    const fromName = process.env.FROM_NAME || 'Vetheary';
    const gmailAddress = process.env.GMAIL_USER;
    const from = `"${fromName}" <${gmailAddress}>`;

    const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
    });

    console.log('nodemailer sendMail info:', info && (info.messageId || info.response || info));
    return info;
}

exports.sendResetEmail = async (email, name, url) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    await transporter.sendMail({
        from: `PhoneShop <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Reset your password",
        html: `
      <p>Hello ${name},</p>
      <p>You requested to reset your password.</p>
      <p>Click here to reset:</p>
      <a href="${url}">${url}</a>
      <p>This link expires in 1 hour.</p>
    `,
    });
};

module.exports = { sendMail, transporter };
