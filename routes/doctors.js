const express = require('express');
const db = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

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

// Symptom to Specialization mapping engine
const symptomMap = {
  fever: 'General Physician',
  cough: 'General Physician',
  cold: 'General Physician',
  toothache: 'Dentist',
  teeth: 'Dentist',
  dental: 'Dentist',
  gum: 'Dentist',
  heart: 'Cardiologist',
  chest: 'Cardiologist',
  bp: 'Cardiologist',
  blood: 'Cardiologist',
  bone: 'Orthopedic',
  fracture: 'Orthopedic',
  joint: 'Orthopedic',
  knee: 'Orthopedic',
  skin: 'Dermatologist',
  rash: 'Dermatologist',
  acne: 'Dermatologist',
  child: 'Child Specialist',
  baby: 'Child Specialist',
  pediatric: 'Child Specialist',
  women: 'Gynecologist',
  pregnancy: 'Gynecologist',
  period: 'Gynecologist',
  brain: 'Neurologist',
  headache: 'Neurologist',
  nerves: 'Neurologist'
};

function format12Hour(hour, minute) {
  const h = hour % 12 || 12;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const m = minute.toString().padStart(2, '0');
  return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
}

// GET /api/doctors/me/profile - Doctor's own full profile
router.get('/me/profile', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const doctor = await db.getAsync('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const branches = await db.allAsync('SELECT * FROM doctor_branches WHERE doctor_id = ?', [doctorId]);
    const schedule = await db.allAsync('SELECT * FROM doctor_schedules WHERE doctor_id = ?', [doctorId]);
    const blockedDates = await db.allAsync('SELECT * FROM doctor_blocked_dates WHERE doctor_id = ?', [doctorId]);

    return res.json({
      doctor: {
        ...doctor,
        branches,
        schedule,
        blockedDates
      }
    });
  } catch (err) {
    console.error('Error fetching doctor me profile:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/doctors/compare?doc1=X&doc2=Y - Doctor Battle Comparison
router.get('/compare', async (req, res) => {
  try {
    const { doc1, doc2 } = req.query;
    if (!doc1 || !doc2) {
      return res.status(400).json({ message: 'Both doc1 and doc2 IDs are required for comparison.' });
    }

    const doctor1 = await db.getAsync('SELECT * FROM doctors WHERE id = ?', [doc1]);
    const doctor2 = await db.getAsync('SELECT * FROM doctors WHERE id = ?', [doc2]);

    if (!doctor1 || !doctor2) {
      return res.status(404).json({ message: 'One or both doctor profiles not found.' });
    }

    const branches1 = await db.allAsync('SELECT * FROM doctor_branches WHERE doctor_id = ?', [doc1]);
    const branches2 = await db.allAsync('SELECT * FROM doctor_branches WHERE doctor_id = ?', [doc2]);

    return res.json({
      doctor1: { ...doctor1, branches: branches1 },
      doctor2: { ...doctor2, branches: branches2 }
    });
  } catch (err) {
    console.error('Error comparing doctors:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/doctors/me/notices - Get logged-in doctor's own clinic notices
router.get('/me/notices', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.json({ notices: [] });
    }
    const notices = await db.allAsync('SELECT * FROM doctor_notices WHERE doctor_id = ? ORDER BY id DESC', [doctorId]);
    return res.json({ notices });
  } catch (err) {
    console.error('Error fetching doctor me notices:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/doctors/:id/notices - Get Clinic Notices for Doctor
router.get('/:id/notices', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const notices = await db.allAsync('SELECT * FROM doctor_notices WHERE doctor_id = ? AND is_active = 1 ORDER BY id DESC', [doctorId]);
    return res.json({ notices });
  } catch (err) {
    console.error('Error fetching doctor notices:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/doctors/notices - Create Clinic Notice (Doctor Dashboard)
router.post('/notices', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const { title, content, badge_type } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const result = await db.runAsync(
      'INSERT INTO doctor_notices (doctor_id, title, content, badge_type, is_active) VALUES (?, ?, ?, ?, 1)',
      [doctorId, title, content, badge_type || 'Notice']
    );

    const notice = await db.getAsync('SELECT * FROM doctor_notices WHERE id = ?', [result.lastID]);
    return res.status(201).json({ message: 'Clinic Notice posted successfully!', notice });
  } catch (err) {
    console.error('Error posting clinic notice:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/doctors/notices/:id - Edit / Update Clinic Notice
router.put('/notices/:id', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    const noticeId = req.params.id;
    const { title, content, badge_type } = req.body;

    const existing = await db.getAsync('SELECT * FROM doctor_notices WHERE id = ? AND doctor_id = ?', [noticeId, doctorId]);
    if (!existing) {
      return res.status(404).json({ message: 'Clinic notice not found.' });
    }

    await db.runAsync(
      'UPDATE doctor_notices SET title = COALESCE(?, title), content = COALESCE(?, content), badge_type = COALESCE(?, badge_type) WHERE id = ? AND doctor_id = ?',
      [title, content, badge_type, noticeId, doctorId]
    );

    const updated = await db.getAsync('SELECT * FROM doctor_notices WHERE id = ?', [noticeId]);
    return res.json({ message: 'Clinic Notice updated successfully!', notice: updated });
  } catch (err) {
    console.error('Error updating clinic notice:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/doctors/notices/:id - Remove / Delete Clinic Notice
router.delete('/notices/:id', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    const noticeId = req.params.id;

    await db.runAsync('DELETE FROM doctor_notices WHERE id = ? AND doctor_id = ?', [noticeId, doctorId]);
    return res.json({ message: 'Clinic Notice deleted successfully.' });
  } catch (err) {
    console.error('Error deleting clinic notice:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/doctors - Search & List Verified Doctors
router.get('/', async (req, res) => {
  try {
    const { query, city, category } = req.query;

    let sql = 'SELECT * FROM doctors WHERE is_active = 1';
    const params = [];

    let matchedSpecialization = null;

    if (query) {
      const cleanQuery = query.trim().toLowerCase();
      if (symptomMap[cleanQuery]) {
        matchedSpecialization = symptomMap[cleanQuery];
      }
    }

    if (category) {
      sql += ' AND specialization = ?';
      params.push(category);
    } else if (matchedSpecialization) {
      sql += ' AND specialization = ?';
      params.push(matchedSpecialization);
    } else if (query) {
      sql += ' AND (name LIKE ? OR specialization LIKE ? OR degree LIKE ? OR clinic_address LIKE ? OR city LIKE ? OR hospital_name LIKE ?)';
      const q = `%${query}%`;
      params.push(q, q, q, q, q, q);
    }

    if (city) {
      sql += ' AND LOWER(city) = ?';
      params.push(city.trim().toLowerCase());
    }

    sql += ' ORDER BY id ASC';

    const doctors = await db.allAsync(sql, params);

    const doctorsWithBranches = await Promise.all(
      doctors.map(async (doc) => {
        const branches = await db.allAsync('SELECT * FROM doctor_branches WHERE doctor_id = ?', [doc.id]);
        return {
          ...doc,
          branches
        };
      })
    );

    return res.json({ doctors: doctorsWithBranches });
  } catch (err) {
    console.error('Error searching doctors:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/doctors/:id - Get Doctor Detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await db.getAsync('SELECT * FROM doctors WHERE id = ? AND is_active = 1', [id]);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found or pending verification.' });
    }

    const branches = await db.allAsync('SELECT * FROM doctor_branches WHERE doctor_id = ?', [id]);
    const schedule = await db.allAsync('SELECT * FROM doctor_schedules WHERE doctor_id = ?', [id]);

    return res.json({
      doctor: {
        ...doctor,
        branches,
        schedule
      }
    });
  } catch (err) {
    console.error('Error fetching doctor details:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/doctors/:id/available-slots - Calculate Dynamic Available Slots
router.get('/:id/available-slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, branchId } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required.' });
    }

    const doctor = await db.getAsync('SELECT * FROM doctors WHERE id = ?', [id]);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const blocked = await db.getAsync('SELECT * FROM doctor_blocked_dates WHERE doctor_id = ? AND date = ?', [id, date]);
    if (blocked) {
      return res.json({
        isBlocked: true,
        reason: blocked.reason || 'Doctor is on holiday / unavailable on this date.',
        slots: []
      });
    }

    const dateObj = new Date(date);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[dateObj.getDay()];

    let schedule = await db.getAsync(
      'SELECT * FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?',
      [id, dayOfWeek]
    );

    if (schedule && schedule.is_working_day === 0) {
      return res.json({
        isBlocked: true,
        reason: `Doctor does not consult on ${dayOfWeek}s.`,
        slots: []
      });
    }

    let branch = null;
    if (branchId) {
      branch = await db.getAsync('SELECT * FROM doctor_branches WHERE id = ? AND doctor_id = ?', [branchId, id]);
    } else {
      branch = await db.getAsync('SELECT * FROM doctor_branches WHERE doctor_id = ? LIMIT 1', [id]);
    }

    let slotMins = schedule ? schedule.slot_duration_mins || 30 : 30;

    let s1Start = schedule ? schedule.start_time : '10:00';
    let s1End = schedule ? schedule.end_time : '13:00';

    let hasSplit = schedule ? schedule.has_split_shift === 1 : true;
    let s2Start = schedule ? schedule.shift2_start_time || '15:00' : '15:00';
    let s2End = schedule ? schedule.shift2_end_time || '17:00' : '17:00';

    if (branch) {
      if (branch.start_time) s1Start = branch.start_time;
      if (branch.end_time) s1End = branch.end_time;
      hasSplit = branch.has_split_shift === 1;
      if (branch.shift2_start_time) s2Start = branch.shift2_start_time;
      if (branch.shift2_end_time) s2End = branch.shift2_end_time;
    }

    const bookedApps = await db.allAsync(
      "SELECT time_slot FROM appointments WHERE doctor_id = ? AND date = ? AND status IN ('Pending', 'Confirmed', 'Completed')",
      [id, date]
    );
    const bookedSlotsSet = new Set(bookedApps.map((a) => a.time_slot));

    const slots = [];

    function generateRangeSlots(startStr, endStr, shiftName) {
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);

      let current = new Date(2026, 0, 1, sh, sm, 0);
      const end = new Date(2026, 0, 1, eh, em, 0);

      while (current < end) {
        const next = new Date(current.getTime() + slotMins * 60000);
        if (next > end) break;

        const curH = current.getHours();
        const curM = current.getMinutes();
        const nxtH = next.getHours();
        const nxtM = next.getMinutes();

        const curStr = `${curH.toString().padStart(2, '0')}:${curM.toString().padStart(2, '0')}`;
        const nxtStr = `${nxtH.toString().padStart(2, '0')}:${nxtM.toString().padStart(2, '0')}`;

        const curDisp = format12Hour(curH, curM);
        const nxtDisp = format12Hour(nxtH, nxtM);
        const slotDisplay = `${curDisp} - ${nxtDisp}`;

        const isBooked = bookedSlotsSet.has(slotDisplay) || bookedSlotsSet.has(curDisp);

        slots.push({
          display: slotDisplay,
          startTimeDisplay: curDisp,
          startTime24: curStr,
          endTime24: nxtStr,
          shift: shiftName,
          isBooked,
          isAvailable: !isBooked
        });

        current = next;
      }
    }

    generateRangeSlots(s1Start, s1End, 'Shift 1');

    if (hasSplit) {
      generateRangeSlots(s2Start, s2End, 'Shift 2');
    }

    const s1StartDisp = format12Hour(...s1Start.split(':').map(Number));
    const s1EndDisp = format12Hour(...s1End.split(':').map(Number));
    const s2StartDisp = format12Hour(...s2Start.split(':').map(Number));
    const s2EndDisp = format12Hour(...s2End.split(':').map(Number));

    return res.json({
      isBlocked: false,
      date,
      dayOfWeek,
      shift1_display: `${s1StartDisp} - ${s1EndDisp}`,
      shift2_display: hasSplit ? `${s2StartDisp} - ${s2EndDisp}` : null,
      slots
    });
  } catch (err) {
    console.error('Error computing available slots:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/doctors/profile - Doctor Profile & Payment Settings Update
router.put('/profile', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    const userId = req.user.id;
    if (!doctorId) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const { name, email, phone, degree, specialization, clinic_address, city, fee, repeat_fee, blood_group, maps_location, languages_spoken, payment_modes, experience_years, bio, qr_code_image, avatar } = req.body;

    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    const cleanPhone = phone ? phone.toString().replace(/\D/g, '') : undefined;

    // Update users table
    if (cleanEmail || name || cleanPhone || blood_group) {
      await db.runAsync(
        `UPDATE users
         SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), blood_group = COALESCE(?, blood_group)
         WHERE id = ?`,
        [name, cleanEmail, cleanPhone, blood_group, userId]
      );
    }

    // Update doctors table
    await db.runAsync(
      `UPDATE doctors
       SET name = ?, degree = ?, specialization = ?, clinic_address = ?, city = ?, fee = ?, repeat_fee = ?, blood_group = ?, maps_location = ?, languages_spoken = ?, payment_modes = ?, experience_years = ?, bio = ?, qr_code_image = ?, avatar = ?
       WHERE id = ?`,
      [
        name,
        degree,
        specialization,
        clinic_address,
        city,
        fee ? parseFloat(fee) : 500,
        repeat_fee ? parseFloat(repeat_fee) : 400,
        blood_group || 'O+',
        maps_location || null,
        languages_spoken || 'English, Hindi, Gujarati',
        payment_modes || 'Both',
        experience_years || 5,
        bio,
        qr_code_image || null,
        avatar || null,
        doctorId
      ]
    );

    const updatedDoc = await db.getAsync('SELECT * FROM doctors WHERE id = ?', [doctorId]);
    return res.json({ message: 'Doctor profile, contact details, and Payment QR updated successfully!', doctor: updatedDoc });
  } catch (err) {
    console.error('Error updating doctor profile:', err);
    return res.status(500).json({ message: 'Server error updating profile.' });
  }
});

// PUT /api/doctors/schedule - Save Weekly Day-by-Day Schedule
router.put('/schedule', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const { slot_duration_mins = 30, day_schedules } = req.body;

    if (!Array.isArray(day_schedules)) {
      return res.status(400).json({ message: 'day_schedules array required.' });
    }

    for (const item of day_schedules) {
      const { day_of_week, is_working_day, start_time, end_time, has_split_shift, shift2_start_time, shift2_end_time } = item;
      const existing = await db.getAsync('SELECT id FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?', [doctorId, day_of_week]);

      if (existing) {
        await db.runAsync(
          `UPDATE doctor_schedules
           SET is_working_day = ?, start_time = ?, end_time = ?, has_split_shift = ?, shift2_start_time = ?, shift2_end_time = ?, slot_duration_mins = ?
           WHERE id = ?`,
          [is_working_day ? 1 : 0, start_time, end_time, has_split_shift ? 1 : 0, shift2_start_time, shift2_end_time, slot_duration_mins, existing.id]
        );
      } else {
        await db.runAsync(
          `INSERT INTO doctor_schedules (doctor_id, day_of_week, is_working_day, start_time, end_time, has_split_shift, shift2_start_time, shift2_end_time, slot_duration_mins)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [doctorId, day_of_week, is_working_day ? 1 : 0, start_time, end_time, has_split_shift ? 1 : 0, shift2_start_time, shift2_end_time, slot_duration_mins]
        );
      }
    }

    return res.json({ message: 'Doctor weekly schedule updated successfully.' });
  } catch (err) {
    console.error('Error updating doctor schedule:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/doctors/branches - Add Branch
router.post('/branches', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.status(404).json({ message: 'Doctor profile not found.' });
    }

    const { hospital_name, full_address, city, state, pin_code, contact_number, assigned_days, start_time, end_time, has_split_shift, shift2_start_time, shift2_end_time } = req.body;

    const s1Start = start_time || '10:00';
    const s1End = end_time || '13:00';
    const s2Start = shift2_start_time || '15:00';
    const s2End = shift2_end_time || '17:00';
    const daysStr = assigned_days || 'Mon, Wed, Fri';

    const working_hours = `${daysStr} (${format12Hour(...s1Start.split(':').map(Number))} - ${format12Hour(...s1End.split(':').map(Number))})`;

    const result = await db.runAsync(
      `INSERT INTO doctor_branches (doctor_id, hospital_name, full_address, city, state, pin_code, contact_number, assigned_days, start_time, end_time, has_split_shift, shift2_start_time, shift2_end_time, working_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [doctorId, hospital_name, full_address, city, state || '', pin_code || '', contact_number || '', daysStr, s1Start, s1End, has_split_shift ? 1 : 0, s2Start, s2End, working_hours]
    );

    const newBranch = await db.getAsync('SELECT * FROM doctor_branches WHERE id = ?', [result.lastID]);
    return res.json({ message: 'Branch added successfully!', branch: newBranch });
  } catch (err) {
    console.error('Error adding branch:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/doctors/branches/:id - Delete Branch
router.delete('/branches/:id', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    const branchId = req.params.id;

    await db.runAsync('DELETE FROM doctor_branches WHERE id = ? AND doctor_id = ?', [branchId, doctorId]);
    return res.json({ message: 'Branch deleted.' });
  } catch (err) {
    console.error('Error deleting branch:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/doctors/blocked-dates - Mark Holiday Date
router.post('/blocked-dates', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    const { date, reason } = req.body;

    const result = await db.runAsync(
      'INSERT INTO doctor_blocked_dates (doctor_id, date, reason) VALUES (?, ?, ?)',
      [doctorId, date, reason || 'Holiday']
    );

    return res.json({ message: 'Date blocked.', id: result.lastID });
  } catch (err) {
    console.error('Error blocking date:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/doctors/blocked-dates/:id - Unblock Date
router.delete('/blocked-dates/:id', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    const dateId = req.params.id;

    await db.runAsync('DELETE FROM doctor_blocked_dates WHERE id = ? AND doctor_id = ?', [dateId, doctorId]);
    return res.json({ message: 'Date unblocked.' });
  } catch (err) {
    console.error('Error unblocking date:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/doctors/dashboard/stats - Doctor Dashboard Stats
router.get('/dashboard/stats', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    if (!doctorId) {
      return res.json({
        todayAppointmentsCount: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        completedAppointments: 0,
        rejectedAppointments: 0,
        cancelledAppointments: 0,
        totalAppointments: 0,
        totalEarnings: 0,
        totalPatients: 0,
        returningPatients: 0
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const todayCount = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND date = ?", [doctorId, todayStr]);
    const pendingCount = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = 'Pending'", [doctorId]);
    const confirmedCount = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = 'Confirmed'", [doctorId]);
    const completedCount = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = 'Completed'", [doctorId]);
    const rejectedCount = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = 'Rejected'", [doctorId]);
    const cancelledCount = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND status = 'Cancelled'", [doctorId]);
    const totalAppsCount = await db.getAsync("SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?", [doctorId]);

    const doctor = await db.getAsync('SELECT fee FROM doctors WHERE id = ?', [doctorId]);
    const fee = doctor ? doctor.fee : 500;
    const totalEarnings = (completedCount.count + confirmedCount.count) * fee;

    const totalPatients = await db.getAsync("SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = ?", [doctorId]);
    const returningPatients = await db.getAsync(
      `SELECT COUNT(*) as count FROM (
        SELECT patient_id FROM appointments WHERE doctor_id = ? GROUP BY patient_id HAVING COUNT(id) > 1
      )`,
      [doctorId]
    );

    return res.json({
      todayAppointmentsCount: todayCount.count,
      pendingAppointments: pendingCount.count,
      confirmedAppointments: confirmedCount.count,
      completedAppointments: completedCount.count,
      rejectedAppointments: rejectedCount.count,
      cancelledAppointments: cancelledCount.count,
      totalAppointments: totalAppsCount.count,
      totalEarnings,
      totalPatients: totalPatients.count,
      returningPatients: returningPatients.count
    });
  } catch (err) {
    console.error('Error computing dashboard stats:', err);
    return res.status(500).json({ message: 'Server error computing dashboard stats.' });
  }
});

// POST /api/doctors/referrals - Create Doctor Referral
router.post('/referrals', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    const { referred_doctor_id, patient_id, patient_name, patient_phone, reason } = req.body;

    if (!referred_doctor_id || (!patient_id && !patient_name) || !reason) {
      return res.status(400).json({ message: 'Referred Doctor, Patient details, and Reason for referral are required.' });
    }

    // Check for duplicate pending referral
    const existing = await db.getAsync(
      `SELECT id FROM doctor_referrals
       WHERE referring_doctor_id = ? AND referred_doctor_id = ? AND (patient_id = ? OR patient_phone = ?) AND status = 'pending'`,
      [doctorId, referred_doctor_id, patient_id || 0, patient_phone || '']
    );

    if (existing) {
      return res.status(400).json({ message: '⚠️ A pending referral for this patient to the selected specialist already exists.' });
    }

    const result = await db.runAsync(
      `INSERT INTO doctor_referrals (referring_doctor_id, referred_doctor_id, patient_id, patient_name, patient_phone, reason, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [doctorId, referred_doctor_id, patient_id || 0, patient_name || 'Patient', patient_phone || '', reason]
    );

    const newRef = await db.getAsync('SELECT * FROM doctor_referrals WHERE id = ?', [result.lastID]);

    return res.status(201).json({ message: 'Referral sent successfully to specialist!', referral: newRef });
  } catch (err) {
    console.error('Error creating referral:', err);
    return res.status(500).json({ message: 'Server error creating referral.' });
  }
});

// GET /api/doctors/referrals - Get Doctor Referrals (Incoming & Outgoing)
router.get('/referrals', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    if (!doctorId) return res.json({ incoming: [], outgoing: [] });

    const incoming = await db.allAsync(
      `SELECT r.*, d.name as referring_doctor_name, d.specialization as referring_doctor_specialization, d.hospital_name as referring_hospital
       FROM doctor_referrals r
       JOIN doctors d ON r.referring_doctor_id = d.id
       WHERE r.referred_doctor_id = ?
       ORDER BY r.created_at DESC`,
      [doctorId]
    );

    const outgoing = await db.allAsync(
      `SELECT r.*, d.name as referred_doctor_name, d.specialization as referred_doctor_specialization, d.hospital_name as referred_hospital
       FROM doctor_referrals r
       JOIN doctors d ON r.referred_doctor_id = d.id
       WHERE r.referring_doctor_id = ?
       ORDER BY r.created_at DESC`,
      [doctorId]
    );

    return res.json({ incoming, outgoing });
  } catch (err) {
    console.error('Error fetching doctor referrals:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/doctors/referrals/:id/status - Update Referral Status
router.put('/referrals/:id/status', verifyToken, requireRole('doctor'), async (req, res) => {
  try {
    const doctorId = await resolveDoctorId(req);
    const refId = req.params.id;
    const { status } = req.body; // 'accepted' | 'completed' | 'rejected'

    await db.runAsync(
      'UPDATE doctor_referrals SET status = ? WHERE id = ? AND (referred_doctor_id = ? OR referring_doctor_id = ?)',
      [status || 'accepted', refId, doctorId, doctorId]
    );

    return res.json({ message: `Referral status updated to ${status}.` });
  } catch (err) {
    console.error('Error updating referral status:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/doctors/referrals/patient - Get Patient's Referrals
router.get('/referrals/patient', verifyToken, requireRole('patient'), async (req, res) => {
  try {
    const patientId = req.user.id;
    const referrals = await db.allAsync(
      `SELECT r.*, d1.name as referring_doctor_name, d1.specialization as referring_doctor_spec,
              d2.name as referred_doctor_name, d2.specialization as referred_doctor_spec, d2.clinic_address, d2.hospital_name
       FROM doctor_referrals r
       JOIN doctors d1 ON r.referring_doctor_id = d1.id
       JOIN doctors d2 ON r.referred_doctor_id = d2.id
       WHERE r.patient_id = ? OR r.patient_phone = ?
       ORDER BY r.created_at DESC`,
      [patientId, req.user.phone || '']
    );

    return res.json({ referrals });
  } catch (err) {
    console.error('Error fetching patient referrals:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
