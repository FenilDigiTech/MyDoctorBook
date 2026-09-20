const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Apply Super Admin middleware to all routes in admin router
router.use(verifyToken, requireRole('admin'));

// GET /api/admin/stats - Super Admin Overview Stats
router.get('/stats', async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const totalDocs = await db.getAsync('SELECT COUNT(*) as count FROM doctors');
    const activeDocs = await db.getAsync('SELECT COUNT(*) as count FROM doctors WHERE is_active = 1');
    const inactiveDocs = await db.getAsync('SELECT COUNT(*) as count FROM doctors WHERE is_active = 0');

    const totalPatients = await db.getAsync("SELECT COUNT(*) as count FROM users WHERE role = 'patient'");

    const totalApps = await db.getAsync('SELECT COUNT(*) as count FROM appointments');
    const pendingApps = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE status = 'Pending'");
    const confirmedApps = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE status = 'Confirmed'");
    const cancelledApps = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE status = 'Cancelled'");
    const completedApps = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE status = 'Completed'");

    const todayApps = await db.getAsync('SELECT COUNT(*) as count FROM appointments WHERE date = ?', [todayStr]);

    const unreadMessages = await db.getAsync('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0');
    const unreadNotifications = await db.getAsync('SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = 0');

    const totalRev = await db.getAsync(
      `SELECT SUM(d.fee) as total
       FROM appointments a
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.status IN ('Confirmed', 'Completed')`
    );

    return res.json({
      totalDoctors: totalDocs.count,
      activeDoctors: activeDocs.count,
      inactiveDoctors: inactiveDocs.count,
      pendingDoctorApprovals: inactiveDocs.count,
      totalPatients: totalPatients.count,
      totalAppointments: totalApps.count,
      pendingAppointments: pendingApps.count,
      confirmedAppointments: confirmedApps.count,
      cancelledAppointments: cancelledApps.count,
      completedAppointments: completedApps.count,
      todayAppointments: todayApps.count,
      unreadMessages: unreadMessages.count,
      unreadNotifications: unreadNotifications.count,
      totalRevenue: totalRev.total || 0
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return res.status(500).json({ message: 'Server error fetching admin stats.' });
  }
});

// GET /api/admin/doctors - Doctor Management List
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await db.allAsync(
      `SELECT d.*, u.email, u.phone
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.id DESC`
    );

    const doctorsWithStats = await Promise.all(
      doctors.map(async (doc) => {
        const appStats = await db.getAsync(
          `SELECT
            COUNT(id) as total,
            SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed,
            SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
           FROM appointments WHERE doctor_id = ?`,
          [doc.id]
        );
        const branches = await db.allAsync('SELECT * FROM doctor_branches WHERE doctor_id = ?', [doc.id]);
        return {
          ...doc,
          analytics: {
            totalAppointments: appStats.total || 0,
            confirmedAppointments: appStats.confirmed || 0,
            rejectedAppointments: appStats.rejected || 0,
            completedAppointments: appStats.completed || 0
          },
          branches
        };
      })
    );

    return res.json({ doctors: doctorsWithStats });
  } catch (err) {
    console.error('Error fetching admin doctors:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/doctors/:id/approve - Approve Doctor (sets is_active = 1)
router.put('/doctors/:id/approve', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doc = await db.getAsync('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    if (!doc) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    await db.runAsync('UPDATE doctors SET is_active = 1 WHERE id = ?', [doctorId]);

    await db.runAsync(
      `INSERT INTO admin_notifications (type, title, message, link)
       VALUES ('doctor_approval', 'Doctor Account Approved', ?, '/admin/doctors')`,
      [`Doctor ${doc.name} was approved by Super Admin and is now live.`]
    );

    return res.json({ message: `Doctor ${doc.name} approved successfully! Profile is now live.` });
  } catch (err) {
    console.error('Error approving doctor:', err);
    return res.status(500).json({ message: 'Server error approving doctor.' });
  }
});

// PUT /api/admin/doctors/:id/toggle-active - Activate / Deactivate Doctor
router.put('/doctors/:id/toggle-active', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doc = await db.getAsync('SELECT is_active FROM doctors WHERE id = ?', [doctorId]);
    if (!doc) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const newActiveState = doc.is_active === 1 ? 0 : 1;
    await db.runAsync('UPDATE doctors SET is_active = ? WHERE id = ?', [newActiveState, doctorId]);

    return res.json({
      message: `Doctor status updated to ${newActiveState === 1 ? 'Active' : 'Inactive'}.`,
      is_active: newActiveState
    });
  } catch (err) {
    console.error('Error toggling doctor active state:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/admin/doctors/:id
router.delete('/doctors/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const doc = await db.getAsync('SELECT user_id FROM doctors WHERE id = ?', [doctorId]);
    if (!doc) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    await db.runAsync('DELETE FROM doctors WHERE id = ?', [doctorId]);
    await db.runAsync('DELETE FROM users WHERE id = ?', [doc.user_id]);

    return res.json({ message: 'Doctor and user account deleted successfully.' });
  } catch (err) {
    console.error('Error deleting doctor:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/patients - Patient Management List & History
router.get('/patients', async (req, res) => {
  try {
    const patients = await db.allAsync("SELECT id, name, email, phone, role, created_at FROM users WHERE role = 'patient' ORDER BY id DESC");

    const patientsWithHistory = await Promise.all(
      patients.map(async (p) => {
        const appointmentHistory = await db.allAsync(
          `SELECT a.*, d.name as doctor_name, d.specialization
           FROM appointments a
           JOIN doctors d ON a.doctor_id = d.id
           WHERE a.patient_id = ?
           ORDER BY a.created_at DESC`,
          [p.id]
        );

        const doctorsVisited = await db.allAsync(
          `SELECT DISTINCT d.id, d.name, d.specialization
           FROM appointments a
           JOIN doctors d ON a.doctor_id = d.id
           WHERE a.patient_id = ?`,
          [p.id]
        );

        return {
          ...p,
          totalVisits: appointmentHistory.length,
          appointmentHistory,
          doctorsVisited
        };
      })
    );

    return res.json({ patients: patientsWithHistory });
  } catch (err) {
    console.error('Error fetching admin patients:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/admin/patients/:id
router.delete('/patients/:id', async (req, res) => {
  try {
    const patientId = req.params.id;
    await db.runAsync('DELETE FROM users WHERE id = ? AND role = "patient"', [patientId]);
    await db.runAsync('DELETE FROM appointments WHERE patient_id = ?', [patientId]);

    return res.json({ message: 'Patient account removed.' });
  } catch (err) {
    console.error('Error removing patient:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/contact-messages - Contact Submissions
router.get('/contact-messages', async (req, res) => {
  try {
    const messages = await db.allAsync('SELECT * FROM contact_messages ORDER BY created_at DESC');
    await db.runAsync('UPDATE contact_messages SET is_read = 1 WHERE is_read = 0');
    return res.json({ messages });
  } catch (err) {
    console.error('Error fetching contact messages:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await db.allAsync('SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 50');
    const unreadCount = await db.getAsync('SELECT COUNT(*) as count FROM admin_notifications WHERE is_read = 0');
    return res.json({ notifications, unreadCount: unreadCount.count });
  } catch (err) {
    console.error('Error fetching admin notifications:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/notifications/mark-read
router.put('/notifications/mark-read', async (req, res) => {
  try {
    await db.runAsync('UPDATE admin_notifications SET is_read = 1 WHERE is_read = 0');
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Error marking notifications read:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/admin/labs - Lab Center Management List
router.get('/labs', async (req, res) => {
  try {
    const labs = await db.allAsync('SELECT * FROM lab_centers ORDER BY id DESC');
    return res.json({ labs });
  } catch (err) {
    console.error('Error fetching admin labs:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/labs/:id/toggle-active - Activate / Deactivate Lab Center
router.put('/labs/:id/toggle-active', async (req, res) => {
  try {
    const labId = req.params.id;
    const lab = await db.getAsync('SELECT is_active FROM lab_centers WHERE id = ?', [labId]);
    if (!lab) {
      return res.status(404).json({ message: 'Lab center not found.' });
    }

    const newActiveState = lab.is_active === 1 ? 0 : 1;
    await db.runAsync('UPDATE lab_centers SET is_active = ? WHERE id = ?', [newActiveState, labId]);

    return res.json({
      message: `Lab center status updated to ${newActiveState === 1 ? 'Active' : 'Inactive'}.`,
      is_active: newActiveState
    });
  } catch (err) {
    console.error('Error toggling lab active state:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/labs/:id/approve - Approve Lab Center
router.put('/labs/:id/approve', async (req, res) => {
  try {
    const labId = req.params.id;
    const lab = await db.getAsync('SELECT * FROM lab_centers WHERE id = ?', [labId]);
    if (!lab) return res.status(404).json({ message: 'Lab center not found.' });

    await db.runAsync("UPDATE lab_centers SET is_approved = 1, is_active = 1, status = 'approved' WHERE id = ?", [labId]);
    if (lab.user_id) {
      await db.runAsync("UPDATE users SET is_approved = 1, is_active = 1, status = 'approved' WHERE id = ?", [lab.user_id]);
    }

    return res.json({ message: `Lab center ${lab.name} approved successfully! It is now live on MyDoctorBook.` });
  } catch (err) {
    console.error('Error approving lab:', err);
    return res.status(500).json({ message: 'Server error approving lab.' });
  }
});

// GET /api/admin/pharmacies - Pharmacy List
router.get('/pharmacies', async (req, res) => {
  try {
    const pharmacies = await db.allAsync('SELECT * FROM pharmacies ORDER BY id DESC');
    return res.json({ pharmacies });
  } catch (err) {
    console.error('Error fetching admin pharmacies:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/admin/pharmacies/:id/approve - Approve Pharmacy
router.put('/pharmacies/:id/approve', async (req, res) => {
  try {
    const pharmId = req.params.id;
    const pharm = await db.getAsync('SELECT * FROM pharmacies WHERE id = ?', [pharmId]);
    if (!pharm) return res.status(404).json({ message: 'Pharmacy not found.' });

    await db.runAsync("UPDATE pharmacies SET is_approved = 1, is_active = 1, status = 'approved' WHERE id = ?", [pharmId]);
    if (pharm.user_id) {
      await db.runAsync("UPDATE users SET is_approved = 1, is_active = 1, status = 'approved' WHERE id = ?", [pharm.user_id]);
    }

    return res.json({ message: `Pharmacy ${pharm.store_name} approved successfully! It is now live on MyDoctorBook.` });
  } catch (err) {
    console.error('Error approving pharmacy:', err);
    return res.status(500).json({ message: 'Server error approving pharmacy.' });
  }
});

// KIOSK MANAGEMENT ENDPOINTS
router.get('/kiosks', async (req, res) => {
  try {
    const kiosks = await db.allAsync('SELECT * FROM kiosks ORDER BY id DESC');
    return res.json({ kiosks });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/kiosks', async (req, res) => {
  try {
    const { device_id, kiosk_name, location, passcode } = req.body;
    if (!device_id || !kiosk_name) {
      return res.status(400).json({ message: 'Device ID and Kiosk Name are required.' });
    }
    await db.runAsync(
      "INSERT INTO kiosks (device_id, kiosk_name, location, passcode, status, token_version) VALUES (?, ?, ?, ?, 'active', 1)",
      [device_id, kiosk_name, location || 'Main Clinic Lobby', passcode || '1234']
    );
    const created = await db.getAsync('SELECT * FROM kiosks WHERE device_id = ?', [device_id]);
    return res.status(201).json({ message: 'Kiosk registered successfully!', kiosk: created });
  } catch (err) {
    return res.status(500).json({ message: 'Server error registering kiosk.' });
  }
});

router.put('/kiosks/:id/deactivate', async (req, res) => {
  try {
    const kioskId = req.params.id;
    const kiosk = await db.getAsync('SELECT * FROM kiosks WHERE id = ? OR device_id = ?', [kioskId, kioskId]);
    if (!kiosk) return res.status(404).json({ message: 'Kiosk not found.' });

    await db.runAsync("UPDATE kiosks SET status = 'deactivated', token_version = token_version + 1 WHERE id = ?", [kiosk.id]);
    return res.json({ message: `Kiosk ${kiosk.kiosk_name} has been globally deactivated across all devices.`, status: 'deactivated' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error deactivating kiosk.' });
  }
});

router.delete('/kiosks/:id', async (req, res) => {
  try {
    const kioskId = req.params.id;
    await db.runAsync('DELETE FROM kiosks WHERE id = ? OR device_id = ?', [kioskId, kioskId]);
    return res.json({ message: 'Kiosk removed.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DONORS MANAGEMENT ENDPOINTS
router.get('/donors/blood', async (req, res) => {
  try {
    const donors = await db.allAsync('SELECT * FROM blood_donors ORDER BY id DESC');
    return res.json({ donors });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/donors/blood', async (req, res) => {
  try {
    const { name, age, gender, blood_group, city, phone } = req.body;
    await db.runAsync(
      'INSERT INTO blood_donors (name, age, gender, blood_group, city, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, age || 28, gender || 'Male', blood_group || 'O+', city || 'Ahmedabad', phone]
    );
    const donors = await db.allAsync('SELECT * FROM blood_donors ORDER BY id DESC');
    return res.json({ message: 'Blood donor registered.', donors });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

router.delete('/donors/blood/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM blood_donors WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Blood donor record removed.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

router.get('/donors/organ', async (req, res) => {
  try {
    const donors = await db.allAsync('SELECT * FROM organ_donors ORDER BY id DESC');
    return res.json({ donors });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

router.post('/donors/organ', async (req, res) => {
  try {
    const { name, age, gender, blood_group, city, phone, organs } = req.body;
    await db.runAsync(
      'INSERT INTO organ_donors (name, age, gender, blood_group, city, phone, organs) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, age || 28, gender || 'Male', blood_group || 'O+', city || 'Ahmedabad', phone, Array.isArray(organs) ? organs.join(', ') : (organs || 'Eyes, Heart')]
    );
    const donors = await db.allAsync('SELECT * FROM organ_donors ORDER BY id DESC');
    return res.json({ message: 'Organ donor registered.', donors });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

router.delete('/donors/organ/:id', async (req, res) => {
  try {
    await db.runAsync('DELETE FROM organ_donors WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Organ donor record removed.' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
