const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();
const connectDB = require('./db');

connectDB();

const app = express();
app.use(cors({
  origin: ['https://www.hopegordon.com', 'https://hopegordon.com'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/churches', require('./routes/churches'));
app.use('/api/events', require('./routes/events'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/promo', require('./routes/promo'));
app.use('/api/pastor-resources', require('./routes/pastorResources'));
app.use('/api/blewer-forms', require('./routes/blewerForms'));

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// Blewer intake form — sends to Blewer staff AND confirmation to submitter
app.post('/api/blewer-intake', async (req, res) => {
  const { firstName, lastName, address, city, state, zip, phone, email,
          householdSize, monthlyIncome, needReason, firstVisit, referredBy } = req.body;

  if (!firstName || !lastName || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const formSummary = [
    `CLIENT INTAKE FORM SUBMISSION`,
    ``,
    `Name:             ${firstName} ${lastName}`,
    `Address:          ${address}, ${city}, ${state} ${zip}`,
    `Phone:            ${phone}`,
    `Email:            ${email || 'Not provided'}`,
    `Household Size:   ${householdSize}`,
    `Monthly Income:   ${monthlyIncome || 'Not provided'}`,
    `First Visit:      ${firstVisit === 'yes' ? 'Yes' : 'No'}`,
    `Referred By:      ${referredBy || 'Not provided'}`,
    `Reason for Need:  ${needReason || 'Not provided'}`,
  ].join('\n');

  try {
    // Email 1: notify Blewer staff
    await transporter.sendMail({
      from: `"Blewer Food Center Intake" <${process.env.SMTP_USER}>`,
      replyTo: email || process.env.SMTP_USER,
      to: 'blewerfoodcenter@gmail.com',
      subject: `New Client Intake: ${firstName} ${lastName}`,
      text: formSummary,
    });

    // Email 2: confirmation to the person who submitted (only if they provided an email)
    if (email) {
      await transporter.sendMail({
        from: `"Blewer Food Center" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `We received your intake form`,
        text: [
          `Dear ${firstName},`,
          ``,
          `Thank you for submitting your intake form to the Blewer Food Center.`,
          `We have received your information and will be in touch soon.`,
          ``,
          `If you have any questions, please contact us:`,
          `Phone: (706) 263-2570`,
          `Email: blewerfoodcenter@gmail.com`,
          `Address: 373 Morrow Rd SE, Calhoun, GA 30701`,
          ``,
          `Here is a copy of what you submitted:`,
          ``,
          formSummary,
        ].join('\n'),
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Blewer intake email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Contact form email
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields required' });
  try {
    await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      replyTo: email,
      to: process.env.RECIPIENT_EMAIL,
      subject: `Contact Form: ${name}`,
      text: `From: ${name} (${email})\n\n${message}`,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
