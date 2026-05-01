import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, organization, phone, inquiryType, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  try {
    await resend.emails.send({
      from: 'CraveBot Website <noreply@craverobotics.co>',
      to: 'help@craverobotics.co',
      replyTo: email,
      subject: `New inquiry: ${inquiryType || 'General'} — ${firstName} ${lastName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <table cellpadding="8" style="border-collapse:collapse;width:100%;max-width:560px;">
          <tr><td><strong>Name</strong></td><td>${firstName} ${lastName}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Organization</strong></td><td>${organization || '—'}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phone || '—'}</td></tr>
          <tr><td><strong>Inquiry type</strong></td><td>${inquiryType || '—'}</td></tr>
        </table>
        <h3 style="margin-top:24px;">Message</h3>
        <p style="white-space:pre-wrap;">${message}</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
