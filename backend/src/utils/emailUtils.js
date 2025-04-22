const nodemailer = require('nodemailer');

// Email küldés konfigurálása
const sendEmail = async (options) => {
  try {
    // Gmail transporter létrehozása
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'eirattarto@gmail.com',
        pass: 'ebpw cnml cdrh eglr'
      }
    });

    // Email konfigurálása
    const mailOptions = {
      from: '"IdCard App" <eirattarto@gmail.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', options.to);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

module.exports = { sendEmail };

exports.isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};