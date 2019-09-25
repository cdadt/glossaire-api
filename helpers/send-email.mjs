import nodemailer from 'nodemailer';

/**
 * Méthode permettant d'envoyer des emails
 * @param email L'adresse mail du destinataire
 * @param message Le message en HTML
 * @param subject Le sujet du message
 * @returns {Promise<void>}
 */
export const sendEmail = async (email, message, subject) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'serveur.test.hebergement@outlook.fr',
      pass: 'Serveurtest!19',
    },
  });

  await transporter.sendMail({
    from: '<serveur.test.hebergement@outlook.fr>',
    to: email,
    subject,
    text: message,
    html: message,
  });
};

export default sendEmail;
