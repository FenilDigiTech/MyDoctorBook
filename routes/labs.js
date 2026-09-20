const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/labs - Search Lab Centers & Tests
router.get('/', async (req, res) => {
  try {
    const { query, city, category } = req.query;

    let sql = `
      SELECT t.*, l.name as lab_name, l.city as lab_city, l.address as lab_address, l.rating as lab_rating, l.home_collection_available
      FROM lab_tests t
      JOIN lab_centers l ON t.lab_id = l.id
      WHERE 1=1
    `;
    const params = [];

    if (query) {
      sql += ' AND (t.test_name LIKE ? OR l.name LIKE ? OR t.category LIKE ?)';
      const q = `%${query}%`;
      params.push(q, q, q);
    }

    if (city) {
      sql += ' AND l.city LIKE ?';
      params.push(`%${city}%`);
    }

    if (category) {
      sql += ' AND t.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY t.id DESC';

    const tests = await db.allAsync(sql, params);
    const labs = await db.allAsync('SELECT * FROM lab_centers');

    return res.json({ tests, labs });
  } catch (err) {
    console.error('Error fetching labs:', err);
    return res.status(500).json({ message: 'Server error fetching lab tests.' });
  }
});

// POST /api/labs/book - Book Home Sample Collection
router.post('/book', verifyToken, requireRole('patient'), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { testId, labId, booking_date, time_slot, is_home_collection, address, price, tests, total_price, home_collection_charge } = req.body;

    const finalTestId = testId || (tests && tests.length > 0 ? tests[0].id : null);
    const finalLabId = labId || (tests && tests.length > 0 ? tests[0].lab_id : 1);
    const testDetailsJson = tests && tests.length > 0 ? JSON.stringify(tests) : null;
    const finalTotalPrice = total_price || price || 499;

    if (!finalLabId || !booking_date || !time_slot || !address) {
      return res.status(400).json({ message: 'Lab, Booking Date, Time Slot, and Address are required.' });
    }

    const result = await db.runAsync(
      `INSERT INTO lab_bookings (patient_id, lab_id, test_id, booking_date, time_slot, is_home_collection, address, price, total_price, home_collection_charge, test_details_json, status, sample_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', 'Sample Collection Technician Assigned')`,
      [
        patientId,
        finalLabId,
        finalTestId,
        booking_date,
        time_slot,
        is_home_collection ? 1 : 0,
        address,
        finalTotalPrice,
        finalTotalPrice,
        home_collection_charge || 0,
        testDetailsJson
      ]
    );

    const booking = await db.getAsync('SELECT * FROM lab_bookings WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      message: 'Lab sample collection booked successfully!',
      booking
    });
  } catch (err) {
    console.error('Error booking lab test:', err);
    return res.status(500).json({ message: 'Server error booking lab test.' });
  }
});

// GET /api/labs/my-bookings - Get patient's lab bookings
router.get('/my-bookings', verifyToken, async (req, res) => {
  try {
    const patientId = req.user.id;
    const bookings = await db.allAsync(
      `SELECT b.*, t.test_name, t.category, t.preparation_instructions, l.name as lab_name, l.address as lab_address
       FROM lab_bookings b
       JOIN lab_tests t ON b.test_id = t.id
       JOIN lab_centers l ON b.lab_id = l.id
       WHERE b.patient_id = ?
       ORDER BY b.id DESC`,
      [patientId]
    );

    return res.json({ bookings });
  } catch (err) {
    console.error('Error fetching patient lab bookings:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
