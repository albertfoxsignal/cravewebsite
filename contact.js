// api/contact.js
// Receives contact form submissions and emails them via Resend.
// Required env var:  RESEND_API_KEY   (get from resend.com → API Keys)
// Optional env var:  CONTACT_TO_EMAIL (defaults to help@craverobotics.co)

const TO      = process.env.CONTACT_TO_EMAIL || 'help@craverobotics.co';
const FROM    = 'Contact Form <contact@craverobotics.co>';  // must be a verified Resend domain
const RESEND  = 'https://api.resend.com/emails';

export default async function handler(req, res) {
  // CORS — allow the website origin in production, all origins in dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email, organization, phone, inquiryType, message } = req.body || {};

  // Basic validation
  if (!email || !message) {
    return res.status(400).json({ error: 'email and message are required' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[contact] RESEND_API_KEY not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const name = [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';

  const html = `
    <div style="font-family:sans-serif;max-width:560px;color:#111;">
      <h2 style="font-size:1.2rem;margin-bottom:1rem;">New inquiry from craverobotics.co</h2>
      <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
        <tr><td style="padding:8px 0;color:#666;width:140px;">Name</td><td style="padding:8px 0;font-weight:600;">${name}</td></tr>
        <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
        ${organization ? `<tr><td style="padding:8px 0;color:#666;">Organization</td><td style="padding:8px 0;">${organization}</td></tr>` : ''}
        ${phone       ? `<tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${phone}</td></tr>` : ''}
        ${inquiryType ? `<tr><td style="padding:8px 0;color:#666;">Inquiry type</td><td style="padding:8px 0;">${inquiryType}</td></tr>` : ''}
      </table>
      <hr style="margin:1.2rem 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:0.9rem;color:#444;white-space:pre-wrap;">${message}</p>
      <hr style="margin:1.2rem 0;border:none;border-top:1px solid #eee;" />
      <p style="font-size:0.75rem;color:#999;">Submitted via craverobotics.co contact form</p>
    </div>
  `;

  try {
    const r = await fetch(RESEND, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:     FROM,
        to:       [TO],
        reply_to: email,
        subject:  `New inquiry from ${name}${organization ? ` — ${organization}` : ''}`,
        html,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error('[contact] Resend error:', data);
      return res.status(502).json({ error: 'Failed to send email', detail: data });
    }

    return res.status(200).json({ ok: true, id: data.id });
  } catch (err) {
    console.error('[contact] Unexpected error:', err);
    return res.status(500).json({ error: err.message });
  }
}
