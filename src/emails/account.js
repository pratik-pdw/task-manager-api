const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

sgMail.setApiKey(SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "pratik.wadekar2810@gmail.com",
    subject: "Thanks for joining in!!",
    text: `
    Welcome to the app, ${name}. Let me know how you get along with the app.
    `,
  });
};

module.exports = {
  sendWelcomeEmail,
};
