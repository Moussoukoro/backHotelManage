const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Créer un transporteur
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // 2. Définir les options de l'email
  const mailOptions = {
    from: 'RED PRODUCT <votre-email@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // 3. Envoyer l'email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;