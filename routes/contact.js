const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email, and message are required.' });
    }

    const result = await db.runAsync(
      `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, phone || '', subject || 'General Inquiry', message]
    );

    // Create unread Super Admin Notification
    await db.runAsync(
      `INSERT INTO admin_notifications (type, title, message, link)
       VALUES ('contact', 'New Contact Form Submission', ?, '/admin/notifications')`,
      [`Contact message from ${name} (${email}): "${subject || 'Inquiry'}"`]
    );

    return res.status(201).json({
      message: 'Thank you! Your message has been sent successfully. Our support team will get back to you soon.',
      id: result.lastID
    });
  } catch (err) {
    console.error('Error submitting contact form:', err);
    return res.status(500).json({ message: 'Server error sending message.' });
  }
});

module.exports = router;
