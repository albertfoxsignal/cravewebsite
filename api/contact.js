const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    firstName,
    lastName,
    email,
    organization,
    phone,
    inquiryType,
    message,
  } = req.body || {};

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  try {
    const { data, error } = await resend.emails.send({
      // ─── DOMAIN NOTE ───────────────────────────────────────────────────────
      // Change this to 'noreply@craverobotics.co' once your domain is verified
      // in Resend (Resend dashboard → Domains). Until then, use the line below.
      from: 'CraveBot <onboarding@resend.dev>',
      to: 'albert@craverobotics.co',
      replyTo: email,
      subject: `New inquiry: ${inquiryType || 'General'} — ${firstName || ''} ${lastName || ''}`.trim(),
      html: `
        <h2 style="font-family:sans-serif;">New Contact Form Submission</h2>
        <table cellpadding="8" style="font-family:sans-serif;border-collapse:collapse;width:100%;max-width:560px;">
          <tr style="background:#f5f5f5;"><td><strong>Name</strong></td><td>${firstName || '—'} ${lastName || ''}</td></tr>
          <tr><td><strong>Email</strong></td><td><a href="mailto:${email}">${email}</a></td></tr>
          <tr style="background:#f5f5f5;"><td><strong>Organization</strong></td><td>${organization || '—'}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phone || '—'}</td></tr>
          <tr style="background:#f5f5f5;"><td><strong>Inquiry type</strong></td><td>${inquiryType || '—'}</td></tr>
        </table>
        <h3 style="font-family:sans-serif;margin-top:24px;">Message</h3>
        <p style="font-family:sans-serif;white-space:pre-wrap;background:#f9f9f9;padding:16px;border-radius:6px;">${message}</p>
      `,
    });

    // Resend returns an error object rather than throwing in some cases
    if (error) {
      console.error('Resend returned error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Email sent, id:', data?.id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend threw:', err);
    return res.status(500).json({ error: err.message || 'Failed to send email' });
  }
};
