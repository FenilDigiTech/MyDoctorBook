const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/appointments - Book an appointment (Starts in Pending state)
router.post('/', verifyToken, requireRole('patient'), async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, branchId, patient_name, patient_age, patient_gender, patient_phone, date, time_slot, symptom_reason, payment_mode, payment_proof_image, fee, is_repeat_patient } = req.body;

    if (!doctorId || !patient_name || !patient_phone || !date || !time_slot) {
      return res.status(400).json({ message: 'Doctor, Patient Name, Phone, Date, and Time Slot are required.' });
    }

    // Check if slot is already booked/confirmed for this doctor and date
    const existing = await db.getAsync(
      "SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time_slot = ? AND status IN ('Pending', 'Confirmed', 'Completed')",
      [doctorId, date, time_slot]
    );

    if (existing) {
      return res.status(400).json({ message: 'This time slot is already booked or pending confirmation. Please choose another slot.' });
    }

    const payStatus = payment_mode === 'Online' ? (payment_proof_image ? 'Paid' : 'Pending Verification') : 'Pending';
    const appFee = fee ? parseFloat(fee) : 500;
    const isRepeat = is_repeat_patient ? 1 : 0;

    const result = await db.runAsync(
      `INSERT INTO appointments (patient_id, doctor_id, branch_id, patient_name, patient_age, patient_gender, patient_phone, date, time_slot, symptom_reason, payment_mode, payment_status, payment_proof_image, fee, is_repeat_patient, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        patientId,
        doctorId,
        branchId || null,
        patient_name,
        patient_age || null,
        patient_gender || 'Other',
        patient_phone,
        date,
        time_slot,
        symptom_reason || 'General Consultation',
        payment_mode || 'Cash',
        payStatus,
        payment_proof_image || null,
        appFee,
        isRepeat
      ]
    );

    const newAppointment = await db.getAsync('SELECT * FROM appointments WHERE id = ?', [result.lastID]);

    // Create notification for Doctor/Admin
    await db.runAsync(
      `INSERT INTO admin_notifications (type, title, message, link)
       VALUES ('appointment', 'New Appointment Request', ?, '/doctor/appointments')`,
      [`New appointment requested by ${patient_name} for ${date} at ${time_slot}`]
    );

    return res.status(201).json({
      message: 'Appointment requested successfully! It will remain Pending until the doctor approves.',
      appointment: newAppointment
    });
  } catch (err) {
    console.error('Error booking appointment:', err);
    return res.status(500).json({ message: 'Server error during booking.' });
  }
});

// GET /api/appointments/patient - Fetch logged in patient's appointments & cashback progress
router.get('/patient', verifyToken, requireRole('patient'), async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await db.allAsync(
      `SELECT a.*, d.name as doctor_name, d.specialization, d.degree, d.avatar, d.clinic_address, b.hospital_name as branch_name, b.full_address as branch_address
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       LEFT JOIN doctor_branches b ON a.branch_id = b.id
       WHERE a.patient_id = ?
       ORDER BY a.created_at DESC`,
      [patientId]
    );

    const completedApps = appointments.filter((app) => app.status === 'Confirmed' || app.status === 'Completed');
    const cashbackProgress = {
      completedCount: completedApps.length,
      target: 10,
      rewardAmount: 200,
      isUnlocked: completedApps.length >= 10
    };

    return res.json({ appointments, cashbackProgress });
  } catch (err) {
    console.error('Error fetching patient appointments:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/appointments/patient/notifications - Fetch patient notifications
router.get('/patient/notifications', verifyToken, requireRole('patient'), async (req, res) => {
  try {
    const patientId = req.user.id;
    const notifications = await db.allAsync('SELECT * FROM patient_notifications WHERE patient_id = ? ORDER BY created_at DESC LIMIT 50', [patientId]);
    const unreadCount = await db.getAsync('SELECT COUNT(*) as count FROM patient_notifications WHERE patient_id = ? AND is_read = 0', [patientId]);

    return res.json({ notifications, unreadCount: unreadCount.count });
  } catch (err) {
    console.error('Error fetching patient notifications:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/appointments/patient/notifications/mark-read
router.put('/patient/notifications/mark-read', verifyToken, requireRole('patient'), async (req, res) => {
  try {
    const patientId = req.user.id;
    await db.runAsync('UPDATE patient_notifications SET is_read = 1 WHERE patient_id = ? AND is_read = 0', [patientId]);
    return res.json({ message: 'Notifications marked as read.' });
  } catch (err) {
    console.error('Error marking notifications read:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// Helper to reliably resolve doctorId from token user
async function resolveDoctorId(req) {
  if (req.user && req.user.doctorId) {
    return req.user.doctorId;
  }
  if (req.user && req.user.id) {
    const doc = await db.getAsync('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
    if (doc) return doc.id;
  }
  return null;
}

// GET /api/appointments/doctor - Fetch logged in doctor's appointments
router.get('/doctor', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.json({ appointments: [] });
    }

    const appointments = await db.allAsync(
      `SELECT a.*, b.hospital_name as branch_name, b.full_address as branch_address
       FROM appointments a
       LEFT JOIN doctor_branches b ON a.branch_id = b.id
       WHERE a.doctor_id = ?
       ORDER BY a.created_at DESC`,
      [doctorId]
    );

    return res.json({ appointments });
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/appointments/:id/status - Doctor Accept / Reject / Reschedule / Complete
router.put('/:id/status', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    const appointmentId = req.params.id;
    const { status, new_date, new_time_slot, payment_status } = req.body;

    if (!['Pending', 'Confirmed', 'Rejected', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid appointment status.' });
    }

    const app = await db.getAsync('SELECT * FROM appointments WHERE id = ? AND doctor_id = ?', [appointmentId, doctorId]);
    if (!app) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    const doctor = await db.getAsync('SELECT name FROM doctors WHERE id = ?', [doctorId]);
    const docName = doctor ? doctor.name : 'Your doctor';

    let updateSql = 'UPDATE appointments SET status = ?';
    const params = [status];

    if (payment_status) {
      updateSql += ', payment_status = ?';
      params.push(payment_status);
    }

    if (new_date && new_time_slot) {
      updateSql += ', date = ?, time_slot = ?';
      params.push(new_date, new_time_slot);
    }

    updateSql += ' WHERE id = ?';
    params.push(appointmentId);

    await db.runAsync(updateSql, params);

    // Create Notification for Patient when status changes
    if (status === 'Confirmed') {
      await db.runAsync(
        `INSERT INTO patient_notifications (patient_id, appointment_id, title, message)
         VALUES (?, ?, 'Appointment Accepted! 🎉', ?)`,
        [
          app.patient_id,
          appointmentId,
          `${docName} has ACCEPTED your appointment for ${app.date} at ${app.time_slot}.`
        ]
      );
    } else if (status === 'Rejected') {
      await db.runAsync(
        `INSERT INTO patient_notifications (patient_id, appointment_id, title, message)
         VALUES (?, ?, 'Appointment Rejected', ?)`,
        [
          app.patient_id,
          appointmentId,
          `${docName} was unable to accept your appointment for ${app.date} at ${app.time_slot}.`
        ]
      );
    } else if (new_date && new_time_slot) {
      await db.runAsync(
        `INSERT INTO patient_notifications (patient_id, appointment_id, title, message)
         VALUES (?, ?, 'Appointment Rescheduled 📅', ?)`,
        [
          app.patient_id,
          appointmentId,
          `${docName} rescheduled your appointment to ${new_date} at ${new_time_slot}.`
        ]
      );
    }

    const updatedApp = await db.getAsync('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    return res.json({ message: `Appointment status updated to ${status}.`, appointment: updatedApp });
  } catch (err) {
    console.error('Error updating appointment status:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/appointments/:id - Cancel appointment (Patient or Doctor)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const userId = req.user.id;

    const app = await db.getAsync('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (!app) {
      return res.status(404).json({ message: 'Appointment not found.' });
    }

    if (req.user.role === 'patient' && app.patient_id !== userId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    await db.runAsync("UPDATE appointments SET status = 'Cancelled' WHERE id = ?", [appointmentId]);
    return res.json({ message: 'Appointment cancelled successfully.' });
  } catch (err) {
    console.error('Error cancelling appointment:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/appointments/send-prescription - Save digital prescription and send instant notification to Lab Center
router.post('/send-prescription', verifyToken, async (req, res) => {
  try {
    const { appointmentId, prescriptionText, medicines, labTestReferral, labId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ message: 'Appointment ID is required.' });
    }

    const app = await db.getAsync('SELECT * FROM appointments WHERE id = ?', [appointmentId]);
    if (!app) {
      return res.status(404).json({ message: 'Appointment record not found.' });
    }

    const doc = await db.getAsync('SELECT name FROM doctors WHERE id = ?', [app.doctor_id]);
    const doctorName = doc ? doc.name : 'Dr. Consultant';

    const medsJSON = JSON.stringify(medicines || []);
    await db.runAsync(
      `UPDATE appointments SET prescription_text = ?, medicines_json = ?, lab_test_references = ?, status = 'Completed' WHERE id = ?`,
      [prescriptionText, medsJSON, labTestReferral || null, appointmentId]
    );

    if (labTestReferral && labId) {
      await db.runAsync(
        `INSERT INTO lab_notifications (lab_id, patient_name, doctor_name, test_name, notes) VALUES (?, ?, ?, ?, ?)`,
        [labId, app.patient_name, doctorName, labTestReferral, prescriptionText]
      );
    }

    return res.json({ message: 'Prescription saved and Lab Referral Notification dispatched successfully!' });
  } catch (err) {
    console.error('Error sending prescription:', err);
    return res.status(500).json({ message: 'Server error saving prescription.' });
  }
});

module.exports = router;
