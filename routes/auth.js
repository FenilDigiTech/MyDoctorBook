const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper to format doctor response
async function getDoctorDetailsByUserId(userId) {
  const doctor = await db.getAsync('SELECT * FROM doctors WHERE user_id = ?', [userId]);
  if (!doctor) return null;

  const branches = await db.allAsync('SELECT * FROM doctor_branches WHERE doctor_id = ?', [doctor.id]);
  return { ...doctor, branches };
}

// Patient, Doctor & Lab Center Signup Workflow
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role, degree, specialization, clinic_address, city, fee, repeat_fee, payment_modes, avatar, qr_code_image, blood_group, maps_location, lab_address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check duplicate email
    const existingUser = await db.getAsync('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists. Please use a different email address or log in.' });
    }

    // Phone validation (Optional for Patient, or 10-digit if provided)
    const cleanPhone = (phone || '').toString().replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length !== 10) {
      return res.status(400).json({ message: 'Mobile number must be a valid 10-digit number (e.g. 9876543210).' });
    }

    const userRole = (role === 'doctor') ? 'doctor' : (role === 'lab') ? 'lab' : 'patient';
    const hashedPassword = await bcrypt.hash(password, 10);

    const userRes = await db.runAsync(
      'INSERT INTO users (name, email, phone, password, role, blood_group) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), cleanEmail, cleanPhone, hashedPassword, userRole, blood_group || 'O+']
    );

    const userId = userRes.lastID;

    // Auto-generate Universal One Health ID for every user
    const healthIdQr = `MDB-HID-${userId.toString().padStart(6, '0')}`;
    await db.runAsync('UPDATE users SET health_id_qr = ? WHERE id = ?', [healthIdQr, userId]);

    let doctorProfile = null;

    if (userRole === 'doctor') {
      const trimmedName = name.trim();
      const docName = trimmedName.startsWith('Dr.') ? trimmedName : `Dr. ${trimmedName}`;
      
      // Doctor registers with is_active = 0 (PENDING SUPER ADMIN APPROVAL)
      const docRes = await db.runAsync(
        `INSERT INTO doctors (user_id, name, degree, specialization, hospital_name, clinic_address, city, fee, repeat_fee, payment_modes, avatar, qr_code_image, maps_location, blood_group, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          userId,
          docName,
          degree || 'MBBS',
          specialization || 'General Physician',
          hospital_name || 'Main Hospital / Clinic',
          clinic_address || 'Main Clinic',
          city || 'Bangalore',
          fee ? parseFloat(fee) : 500,
          repeat_fee ? parseFloat(repeat_fee) : 400,
          payment_modes || 'Both',
          avatar || null,
          qr_code_image || null,
          maps_location || null,
          blood_group || 'O+'
        ]
      );

      const doctorId = docRes.lastID;

      // Add default primary branch
      await db.runAsync(
        `INSERT INTO doctor_branches (doctor_id, hospital_name, full_address, city, state, pin_code, contact_number, maps_location, working_hours)
         VALUES (?, ?, ?, ?, 'Karnataka', '560038', ?, ?, '10:00 AM - 01:00 PM & 03:00 PM - 05:00 PM')`,
        [
          doctorId,
          `${docName}'s Clinic`,
          clinic_address || 'Indiranagar Clinic',
          city || 'Bangalore',
          cleanPhone,
          maps_location || null
        ]
      );

      // Add default weekly schedule
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      for (const day of days) {
        await db.runAsync(
          `INSERT INTO doctor_schedules (doctor_id, day_of_week, is_working_day, start_time, end_time, slot_duration_mins)
           VALUES (?, ?, 1, '10:00', '13:00', 30)`,
          [doctorId, day]
        );
      }
      await db.runAsync(
        `INSERT INTO doctor_schedules (doctor_id, day_of_week, is_working_day, start_time, end_time, slot_duration_mins)
         VALUES (?, 'Sunday', 0, '10:00', '13:00', 30)`,
        [doctorId]
      );

      // Create Admin Notification for Doctor Approval Request
      await db.runAsync(
        `INSERT INTO admin_notifications (type, title, message, link)
         VALUES ('doctor_approval', 'New Doctor Verification Request', ?, '/admin/doctors')`,
        [`Doctor ${docName} (${specialization}) submitted registration. Approval required.`]
      );

      doctorProfile = await getDoctorDetailsByUserId(userId);

      return res.status(201).json({
        message: 'Doctor registration submitted! Your account is currently Pending Approval by the Super Admin.',
        requiresApproval: true,
        user: {
          id: userId,
          name: docName,
          email: cleanEmail,
          phone: cleanPhone,
          role: 'doctor',
          health_id_qr: healthIdQr,
          doctorProfile
        }
      });
    } else if (userRole === 'lab') {
      // Register Lab Center with is_active = 0 (PENDING SUPER ADMIN APPROVAL)
      await db.runAsync(
        `INSERT INTO lab_centers (name, city, address, rating, home_collection_available, logo)
         VALUES (?, ?, ?, 4.9, 1, ?)`,
        [name.trim(), city || 'Bangalore', lab_address || clinic_address || 'Diagnostic Center Road', avatar || null]
      );

      // Create Admin Notification for Lab Center Approval Request
      await db.runAsync(
        `INSERT INTO admin_notifications (type, title, message, link)
         VALUES ('lab_approval', 'New Lab Center Verification Request', ?, '/admin/dashboard')`,
        [`Lab Center "${name.trim()}" (${city || 'Bangalore'}) submitted registration. Approval required.`]
      );

      return res.status(201).json({
        message: 'Lab Center registration submitted! Your account is currently Pending Approval by the Super Admin.',
        requiresApproval: true,
        user: {
          id: userId,
          name: name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          role: 'lab'
        }
      });
    }

    const token = jwt.sign(
      { id: userId, email: cleanEmail, role: userRole },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        role: userRole,
        blood_group: blood_group || 'O+',
        health_id_qr: healthIdQr
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ message: 'Registration failed. Please check network connection or try a different email address.' });
  }
});

// Login Workflow
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.getAsync('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. User does not exist.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await getDoctorDetailsByUserId(user.id);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        blood_group: user.blood_group || 'O+',
        health_id_qr: user.health_id_qr || `MDB-HID-${user.id.toString().padStart(6, '0')}`,
        doctorProfile
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.getAsync('SELECT id, name, email, phone, role, blood_group, health_id_qr FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await getDoctorDetailsByUserId(user.id);
    }

    return res.json({
      user: {
        ...user,
        health_id_qr: user.health_id_qr || `MDB-HID-${user.id.toString().padStart(6, '0')}`,
        doctorProfile
      }
    });
  } catch (err) {
    console.error('Auth me error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/auth/profile - Update User Profile Details
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, blood_group, allergies } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '').toString().replace(/\D/g, '');

    await db.runAsync(
      'UPDATE users SET name = ?, email = ?, phone = ?, blood_group = ?, allergies = ? WHERE id = ?',
      [name.trim(), cleanEmail, cleanPhone, blood_group || 'O+', allergies || null, userId]
    );

    const updatedUser = await db.getAsync('SELECT id, name, email, phone, role, blood_group, allergies, health_id_qr FROM users WHERE id = ?', [userId]);

    return res.json({
      message: 'Profile details updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating user profile:', err);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
});

module.exports = router;
