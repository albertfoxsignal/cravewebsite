const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const AUDIENCE_ID = '15b6cf27-e47e-4f0f-8a1d-f8d1fd4c839c';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    await resend.contacts.create({
      email,
      audienceId: AUDIENCE_ID,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to save email' });
  }
};
