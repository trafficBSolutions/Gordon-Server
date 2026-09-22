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

// HTML email builder
const buildIntakeHtml = (data, isConfirmation = false) => {
  const { name, ss4, dob, date, spouseName, spouseSs4, spouseDob, phone,
          address, city, state, zip, members, income1, income2, income3,
          churchMembership, wantsVisit, signature, signatureDate } = data;

  const householdRows = (members || []).filter(m => m.name).map(m => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${m.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${m.ss4 || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${m.dob || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${m.relationship || '—'}</td>
    </tr>`).join('');

  const field = (label, value) => `
    <tr>
      <td style="padding:6px 12px;font-weight:600;color:#374151;width:40%;">${label}</td>
      <td style="padding:6px 12px;color:#111827;">${value || '—'}</td>
    </tr>`;

  const section = (title) => `
    <tr>
      <td colspan="2" style="padding:14px 12px 4px;font-size:11px;font-weight:700;text-transform:uppercase;
        letter-spacing:0.08em;color:#6b7280;border-top:2px solid #facc15;">${title}</td>
    </tr>`;

  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:30px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;
          overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#111827;padding:28px 32px;">
              <p style="margin:0;font-size:11px;color:#facc15;text-transform:uppercase;letter-spacing:0.1em;">Gordon Memorial Baptist Association</p>
              <h1 style="margin:6px 0 0;font-size:22px;color:#ffffff;">Blewer Food Center</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#9ca3af;">
                ${isConfirmation ? 'Confirmation — We received your intake form' : 'New Client Intake Form Submission'}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr><td style="padding:24px 32px;">
            ${isConfirmation ? `
              <p style="margin:0 0 20px;font-size:15px;color:#111827;">
                Dear <strong>${name}</strong>,<br><br>
                Thank you for submitting your intake form to the Blewer Food Center.
                We have received your information and will be in touch soon.
              </p>` : ''}

            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:14px;">

              ${section('Primary Applicant')}
              ${field('Name', name)}
              ${field('Last 4 of SS#', ss4)}
              ${field('Date of Birth', dob)}
              ${field('Date', date)}

              ${section('Spouse')}
              ${field('Spouse Name', spouseName)}
              ${field('Last 4 of SS#', spouseSs4)}
              ${field('Date of Birth', spouseDob)}
              ${field('Phone', phone)}

              ${section('Address')}
              ${field('Address', `${address}, ${city}, ${state} ${zip}`)}

              ${section('Income')}
              ${field('Source 1 (per month)', income1)}
              ${field('Source 2 (per month)', income2)}
              ${field('Source 3 (per month)', income3)}

              ${section('Church & Visit')}
              ${field('Church Membership', churchMembership)}
              ${field('Wants call/visit from church', wantsVisit === 'yes' ? 'Yes' : wantsVisit === 'no' ? 'No' : '—')}

              ${section('Signature')}
              ${field('Signature', signature)}
              ${field('Date Signed', signatureDate)}
            </table>

            ${(members || []).filter(m => m.name).length > 0 ? `
            <p style="margin:20px 0 8px;font-size:11px;font-weight:700;text-transform:uppercase;
              letter-spacing:0.08em;color:#6b7280;">Others in Household</p>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:13px;">
              <tr style="background:#f9fafb;">
                <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Name</th>
                <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Last 4 SS#</th>
                <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Date of Birth</th>
                <th style="padding:8px 12px;text-align:left;color:#6b7280;font-size:11px;text-transform:uppercase;">Relationship</th>
              </tr>
              ${householdRows}
            </table>` : ''}

            <p style="margin:20px 0 0;font-size:12px;color:#9ca3af;font-style:italic;border-top:1px solid #e5e7eb;padding-top:16px;">
              I declare that the above information is correct. I also understand that this information
              may be shared with other service agencies in Gordon County.
            </p>
          </td></tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;">
                <strong style="color:#111827;">Blewer Food Center</strong><br>
                Judy Craig, Director &nbsp;|&nbsp; (706) 263-2570<br>
                blewerfoodcenter@gmail.com &nbsp;|&nbsp; 373 Morrow Rd SE, Calhoun, GA 30701
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
};

// Blewer intake form — sends to Blewer staff AND confirmation to submitter
app.post('/api/blewer-intake', async (req, res) => {
  const { name, phone } = req.body;
  const submitterEmail = req.body.email;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  try {
    // Email 1: notify Blewer staff
    await transporter.sendMail({
      from: `"Blewer Food Center Intake" <${process.env.SMTP_USER}>`,
      to: 'blewerfoodcenter@gmail.com',
      subject: `New Client Intake: ${name}`,
      html: buildIntakeHtml(req.body, false),
    });

    // Email 2: confirmation to submitter
    if (submitterEmail) {
      await transporter.sendMail({
        from: `"Blewer Food Center" <${process.env.SMTP_USER}>`,
        to: submitterEmail,
        subject: `We received your intake form`,
        html: buildIntakeHtml(req.body, true),
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
