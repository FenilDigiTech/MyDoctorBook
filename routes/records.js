const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/records/timeline - Patient Lifetime Health Time Capsule
router.get('/timeline', verifyToken, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { query } = req.query;

    let sql = 'SELECT * FROM patient_health_records WHERE patient_id = ?';
    const params = [patientId];

    if (query) {
      sql += ' AND (title LIKE ? OR record_type LIKE ? OR details_json LIKE ?)';
      const q = `%${query}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY record_year DESC, record_date DESC, id DESC';

    const records = await db.allAsync(sql, params);

    // Group records by Year
    const timelineByYear = {};
    for (const rec of records) {
      const yr = rec.record_year || new Date().getFullYear();
      if (!timelineByYear[yr]) {
        timelineByYear[yr] = [];
      }
      let parsedDetails = null;
      try {
        parsedDetails = JSON.parse(rec.details_json);
      } catch (e) {
        parsedDetails = rec.details_json;
      }
      timelineByYear[yr].push({ ...rec, details: parsedDetails });
    }

    return res.json({ timeline: timelineByYear, totalRecords: records.length });
  } catch (err) {
    console.error('Error fetching timeline:', err);
    return res.status(500).json({ message: 'Server error fetching health timeline.' });
  }
});

// POST /api/records/upload - Upload record to Health Locker
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { record_type, title, file_url, details, record_date } = req.body;

    if (!title || !record_type) {
      return res.status(400).json({ message: 'Title and record type are required.' });
    }

    const recDate = record_date || new Date().toISOString().split('T')[0];
    const recYear = parseInt(recDate.split('-')[0]) || new Date().getFullYear();

    const result = await db.runAsync(
      `INSERT INTO patient_health_records (patient_id, record_type, title, file_url, details_json, record_year, record_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        record_type,
        title,
        file_url || null,
        typeof details === 'object' ? JSON.stringify(details) : details || null,
        recYear,
        recDate
      ]
    );

    const record = await db.getAsync('SELECT * FROM patient_health_records WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      message: 'Health record saved into timeline successfully!',
      record
    });
  } catch (err) {
    console.error('Error uploading record:', err);
    return res.status(500).json({ message: 'Server error saving record.' });
  }
});

// GET /api/records/one-health-id - One Health ID QR payload
router.get('/one-health-id', verifyToken, async (req, res) => {
  try {
    const patientId = req.user.id;
    const user = await db.getAsync('SELECT id, name, email, phone, blood_group, allergies FROM users WHERE id = ?', [patientId]);
    if (!user) {
      return res.status(404).json({ message: 'Patient not found.' });
    }

    const apps = await db.allAsync(
      `SELECT a.*, d.name as doctor_name, d.specialization
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.patient_id = ? AND a.status IN ('Confirmed', 'Completed')
       ORDER BY a.id DESC LIMIT 5`,
      [patientId]
    );

    const healthIdData = {
      healthId: `MDB-HID-${user.id.toString().padStart(6, '0')}`,
      patientName: user.name,
      phone: user.phone || 'N/A',
      bloodGroup: user.blood_group || 'O+',
      allergies: user.allergies || 'None Specified',
      recentAppointments: apps.map(a => ({ doctor: a.doctor_name, date: a.date, slot: a.time_slot }))
    };

    return res.json({ healthIdData });
  } catch (err) {
    console.error('Error fetching One Health ID:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/records/medicine-reminders - Get patient's medicine reminders
router.get('/medicine-reminders', verifyToken, async (req, res) => {
  try {
    const patientId = req.user.id;
    const reminders = await db.allAsync('SELECT * FROM patient_medicine_reminders WHERE patient_id = ? AND is_active = 1', [patientId]);

    const todayStr = new Date().toISOString().split('T')[0];
    const remindersWithLogs = await Promise.all(
      reminders.map(async (rem) => {
        const logs = await db.allAsync('SELECT * FROM medicine_adherence_logs WHERE reminder_id = ? AND date = ?', [rem.id, todayStr]);
        return { ...rem, todayLogs: logs };
      })
    );

    return res.json({ reminders: remindersWithLogs });
  } catch (err) {
    console.error('Error fetching medicine reminders:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/records/medicine-reminders - Create medicine reminder
router.post('/medicine-reminders', verifyToken, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { medicine_name, dosage, morning, afternoon, night, duration_days } = req.body;

    if (!medicine_name || !dosage) {
      return res.status(400).json({ message: 'Medicine name and dosage are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const result = await db.runAsync(
      `INSERT INTO patient_medicine_reminders (patient_id, medicine_name, dosage, morning, afternoon, night, start_date, duration_days)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        medicine_name,
        dosage,
        morning ? 1 : 0,
        afternoon ? 1 : 0,
        night ? 1 : 0,
        todayStr,
        duration_days || 7
      ]
    );

    const reminder = await db.getAsync('SELECT * FROM patient_medicine_reminders WHERE id = ?', [result.lastID]);
    return res.status(201).json({ message: 'Medicine reminder created!', reminder });
  } catch (err) {
    console.error('Error creating medicine reminder:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/records/medicine-reminders/:id/log - Log status (Taken / Skipped)
router.put('/medicine-reminders/:id/log', verifyToken, async (req, res) => {
  try {
    const reminderId = req.params.id;
    const { time_of_day, status } = req.body;

    const todayStr = new Date().toISOString().split('T')[0];
    await db.runAsync(
      `INSERT INTO medicine_adherence_logs (reminder_id, date, time_of_day, status)
       VALUES (?, ?, ?, ?)`,
      [reminderId, todayStr, time_of_day || 'Morning', status || 'Taken']
    );

    return res.json({ message: `Medicine logged as ${status || 'Taken'}` });
  } catch (err) {
    console.error('Error logging medicine adherence:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
