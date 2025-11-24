const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail({ to, subject, text, html }) {
    const fromName = process.env.FROM_NAME || 'Vetheary';
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    const from = `${fromName} <${fromEmail}>`;

    const { data, error } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        text,
    });

    if (error) {
        console.error('Resend sendMail error:', error);
        throw error;
    }

    console.log('Resend email sent:', data);
    return data;
}

async function sendResetEmail(email, name, url) {
    return sendMail({
        to: email,
        subject: 'Reset your password',
        html: `
      <p>Hello ${name},</p>
      <p>You requested to reset your password.</p>
      <p>Click here to reset:</p>
      <a href="${url}">${url}</a>
      <p>This link expires in 1 hour.</p>
    `,
        text: `Hello ${name}, reset your password here: ${url}`,
    });
}

module.exports = { sendMail, sendResetEmail };
