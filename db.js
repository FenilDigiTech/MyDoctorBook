const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'mydoctorbook.db');
const db = new sqlite3.Database(dbPath);

// Helper wrapper for async database operations
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function initDb() {
  db.serialize(async () => {
    // 1. Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'patient',
        blood_group TEXT,
        allergies TEXT,
        emergency_contact TEXT,
        health_id_qr TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`ALTER TABLE users ADD COLUMN blood_group TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN allergies TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN emergency_contact TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN health_id_qr TEXT`, () => {});

    // 2. Doctors Table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        degree TEXT NOT NULL,
        specialization TEXT NOT NULL,
        clinic_address TEXT,
        city TEXT,
        fee REAL DEFAULT 500,
        repeat_fee REAL DEFAULT 400,
        payment_modes TEXT DEFAULT 'Both',
        qr_code_image TEXT,
        avatar TEXT,
        experience_years INTEGER DEFAULT 5,
        languages_spoken TEXT DEFAULT 'English, Hindi, Gujarati',
        awards TEXT,
        gallery_images TEXT,
        certificates TEXT,
        bio TEXT,
        rating REAL DEFAULT 4.9,
        review_count INTEGER DEFAULT 42,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.run(`ALTER TABLE doctors ADD COLUMN repeat_fee REAL DEFAULT 400`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN gallery_images TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN certificates TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN languages_spoken TEXT DEFAULT 'English, Hindi, Gujarati'`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN awards TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN maps_location TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN blood_group TEXT DEFAULT 'O+'`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN hospital_name TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN aadhaar_id TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN is_aadhaar_verified INTEGER DEFAULT 1`, () => {});
    db.run(`ALTER TABLE lab_centers ADD COLUMN hospital_name TEXT`, () => {});
    db.run(`ALTER TABLE lab_centers ADD COLUMN available_tests_json TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN aadhaar_id TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN abha_id TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN aadhaar_doc TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN doc_type TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN state TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN city TEXT`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'approved'`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 1`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN is_approved INTEGER DEFAULT 1`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN status TEXT DEFAULT 'approved'`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN state TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN aadhaar_doc TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN license_doc TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN gst_number TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN gst_doc TEXT`, () => {});
    db.run(`ALTER TABLE doctors ADD COLUMN degree_certificates_json TEXT`, () => {});
    db.run(`ALTER TABLE lab_centers ADD COLUMN user_id INTEGER`, () => {});
    db.run(`ALTER TABLE lab_centers ADD COLUMN status TEXT DEFAULT 'pending'`, () => {});
    db.run(`ALTER TABLE lab_centers ADD COLUMN is_approved INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE lab_centers ADD COLUMN home_collection_charge REAL DEFAULT 50`, () => {});
    db.run(`ALTER TABLE lab_centers ADD COLUMN state TEXT`, () => {});
    db.run(`ALTER TABLE pharmacies ADD COLUMN user_id INTEGER`, () => {});
    db.run(`ALTER TABLE pharmacies ADD COLUMN status TEXT DEFAULT 'pending'`, () => {});
    db.run(`ALTER TABLE pharmacies ADD COLUMN is_approved INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE pharmacies ADD COLUMN is_active INTEGER DEFAULT 1`, () => {});
    db.run(`ALTER TABLE pharmacies ADD COLUMN delivery_charge REAL DEFAULT 30`, () => {});
    db.run(`ALTER TABLE pharmacies ADD COLUMN state TEXT`, () => {});
    db.run(`ALTER TABLE lab_tests ADD COLUMN is_active INTEGER DEFAULT 1`, () => {});
    db.run(`ALTER TABLE lab_bookings ADD COLUMN test_details_json TEXT`, () => {});
    db.run(`ALTER TABLE lab_bookings ADD COLUMN home_collection_charge REAL DEFAULT 0`, () => {});
    db.run(`ALTER TABLE lab_bookings ADD COLUMN total_price REAL`, () => {});
    db.run(`ALTER TABLE appointments ADD COLUMN prescription_text TEXT`, () => {});
    db.run(`ALTER TABLE appointments ADD COLUMN medicines_json TEXT`, () => {});
    db.run(`ALTER TABLE appointments ADD COLUMN lab_test_references TEXT`, () => {});
    db.run(`ALTER TABLE appointments ADD COLUMN video_room_id TEXT`, () => {});

    // Blood Donors Table
    db.run(`
      CREATE TABLE IF NOT EXISTS blood_donors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        blood_group TEXT NOT NULL,
        city TEXT NOT NULL,
        phone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Organ Donors Table
    db.run(`
      CREATE TABLE IF NOT EXISTS organ_donors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        age INTEGER,
        gender TEXT,
        blood_group TEXT NOT NULL,
        city TEXT NOT NULL,
        phone TEXT NOT NULL,
        organs TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Kiosks Table
    db.run(`
      CREATE TABLE IF NOT EXISTS kiosks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT UNIQUE NOT NULL,
        kiosk_name TEXT NOT NULL,
        location TEXT NOT NULL,
        passcode TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        token_version INTEGER DEFAULT 1,
        last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Doctor Referrals Table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctor_referrals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referring_doctor_id INTEGER NOT NULL,
        referred_doctor_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        patient_name TEXT NOT NULL,
        patient_phone TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(referring_doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY(referred_doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY(patient_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Lab Notifications Table
    db.run(`
      CREATE TABLE IF NOT EXISTS lab_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lab_id INTEGER,
        patient_name TEXT,
        doctor_name TEXT,
        test_name TEXT,
        notes TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Doctor Branches Table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctor_branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        hospital_name TEXT NOT NULL,
        full_address TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT,
        pin_code TEXT,
        maps_location TEXT,
        contact_number TEXT,
        assigned_days TEXT DEFAULT 'Mon, Tue, Wed, Thu, Fri, Sat',
        start_time TEXT DEFAULT '10:00',
        end_time TEXT DEFAULT '13:00',
        has_split_shift INTEGER DEFAULT 1,
        shift2_start_time TEXT DEFAULT '15:00',
        shift2_end_time TEXT DEFAULT '17:00',
        working_hours TEXT DEFAULT '10:00 AM - 01:00 PM & 03:00 PM - 05:00 PM',
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

    // 4. Doctor Schedules Table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        day_of_week TEXT NOT NULL,
        is_working_day INTEGER DEFAULT 1,
        start_time TEXT DEFAULT '10:00',
        end_time TEXT DEFAULT '13:00',
        has_split_shift INTEGER DEFAULT 1,
        shift2_start_time TEXT DEFAULT '15:00',
        shift2_end_time TEXT DEFAULT '17:00',
        slot_duration_mins INTEGER DEFAULT 30,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

    // 5. Doctor Blocked Dates Table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctor_blocked_dates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        reason TEXT DEFAULT 'Holiday',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

    // 6. Doctor Blocked Slots Table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctor_blocked_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        reason TEXT DEFAULT 'Slot Blocked',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

    // 7. Appointments Table
    db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        patient_id INTEGER NOT NULL,
        branch_id INTEGER,
        date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        patient_age INTEGER,
        patient_gender TEXT,
        patient_phone TEXT,
        symptom_reason TEXT,
        payment_mode TEXT DEFAULT 'Cash',
        payment_status TEXT DEFAULT 'Pending',
        payment_proof_image TEXT,
        fee REAL DEFAULT 500,
        is_repeat_patient INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
        FOREIGN KEY(patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(branch_id) REFERENCES doctor_branches(id) ON DELETE SET NULL
      )
    `);

    db.run(`ALTER TABLE appointments ADD COLUMN is_repeat_patient INTEGER DEFAULT 0`, () => {});

    // 8. Contact Messages Table
    db.run(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Admin Notifications Table
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. Doctor AI Knowledge Base (AI Clone)
    db.run(`
      CREATE TABLE IF NOT EXISTS doctor_ai_knowledge (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT DEFAULT 'General',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

    // 11. Doctor Clinic Notice Board Table
    db.run(`
      CREATE TABLE IF NOT EXISTS doctor_notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doctor_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        badge_type TEXT DEFAULT 'Notice',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
      )
    `);

    // 12. Lab Centers Marketplace Table
    db.run(`
      CREATE TABLE IF NOT EXISTS lab_centers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        address TEXT NOT NULL,
        rating REAL DEFAULT 4.9,
        home_collection_available INTEGER DEFAULT 1,
        logo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 13. Lab Tests Table
    db.run(`
      CREATE TABLE IF NOT EXISTS lab_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lab_id INTEGER NOT NULL,
        test_name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        preparation_instructions TEXT,
        report_delivery_hours INTEGER DEFAULT 24,
        available_slots TEXT DEFAULT '08:00 AM, 10:00 AM, 02:00 PM, 05:00 PM',
        FOREIGN KEY(lab_id) REFERENCES lab_centers(id) ON DELETE CASCADE
      )
    `);

    // 14. Lab Bookings Table
    db.run(`
      CREATE TABLE IF NOT EXISTS lab_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        lab_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        booking_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        is_home_collection INTEGER DEFAULT 1,
        address TEXT NOT NULL,
        price REAL NOT NULL,
        status TEXT DEFAULT 'Confirmed',
        technician_name TEXT DEFAULT 'Ramesh Sharma',
        technician_phone TEXT DEFAULT '+91 98765 00112',
        sample_status TEXT DEFAULT 'Sample Collection Scheduled',
        report_pdf TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(lab_id) REFERENCES lab_centers(id) ON DELETE CASCADE,
        FOREIGN KEY(test_id) REFERENCES lab_tests(id) ON DELETE CASCADE
      )
    `);

    // 15. Patient Health Records (Health Time Capsule & Health Locker)
    db.run(`
      CREATE TABLE IF NOT EXISTS patient_health_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER,
        record_type TEXT NOT NULL,
        title TEXT NOT NULL,
        file_url TEXT,
        details_json TEXT,
        record_year INTEGER NOT NULL,
        record_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 16. Patient Medicine Reminder System
    db.run(`
      CREATE TABLE IF NOT EXISTS patient_medicine_reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL,
        medicine_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        morning INTEGER DEFAULT 1,
        afternoon INTEGER DEFAULT 0,
        night INTEGER DEFAULT 1,
        start_date TEXT NOT NULL,
        duration_days INTEGER DEFAULT 7,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patient_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 17. Medicine Adherence Log
    db.run(`
      CREATE TABLE IF NOT EXISTS medicine_adherence_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reminder_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        time_of_day TEXT NOT NULL,
        status TEXT DEFAULT 'Taken',
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(reminder_id) REFERENCES patient_medicine_reminders(id) ON DELETE CASCADE
      )
    `);

    await seedInitialData();
  });
}

async function seedInitialData() {
  try {
    const adminEmail = 'adminfenil@gmail.com';
    const hashedAdminPassword = await bcrypt.hash('D290882fbpatel', 10);
    const existingAdmin = await db.getAsync('SELECT * FROM users WHERE email = ?', [adminEmail]);

    if (!existingAdmin) {
      await db.runAsync(
        'INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
        ['Fenil Patel (Super Admin)', adminEmail, '8485929882', hashedAdminPassword, 'admin']
      );
      console.log('Super Admin user created successfully.');
    } else {
      await db.runAsync(
        'UPDATE users SET password = ?, role = ? WHERE email = ?',
        [hashedAdminPassword, 'admin', adminEmail]
      );
      console.log('Super Admin credentials synced & updated.');
    }

    // Seed Lab Centers if empty
    const labCount = await db.getAsync('SELECT COUNT(*) as count FROM lab_centers');
    if (labCount.count === 0) {
      const labs = [
        {
          name: 'Apex Diagnostic & MRI Center',
          city: 'Bangalore',
          address: '42 MG Road, Indiranagar, Bangalore',
          tests: [
            { name: 'Full Body Health Checkup (72 Parameters)', category: 'Full Body Checkup', price: 1499, prep: 'Fast for 10-12 hours before sample collection', hours: 24 },
            { name: 'Complete Blood Count (CBC)', category: 'Blood Test', price: 350, prep: 'No special preparation needed', hours: 12 },
            { name: 'Brain & Spine MRI Scan (1.5 Tesla)', category: 'MRI', price: 4500, prep: 'Remove all metallic objects and wear light clothing', hours: 24 },
            { name: 'Chest X-Ray Digital (PA View)', category: 'X-Ray', price: 400, prep: 'No metal jewelry around neck', hours: 6 },
            { name: 'HbA1c & Fasting Blood Sugar', category: 'Blood Test', price: 550, prep: 'Fast for 8 hours overnight', hours: 12 }
          ]
        },
        {
          name: 'Thyrocare National Reference Lab',
          city: 'Mumbai',
          address: '102 Hill Road, Bandra West, Mumbai',
          tests: [
            { name: 'Thyroid Profile (T3, T4, TSH)', category: 'Blood Test', price: 499, prep: 'Morning sample preferred', hours: 24 },
            { name: 'Lipid Profile & Cholesterol Test', category: 'Blood Test', price: 699, prep: '12 hours fasting mandatory', hours: 12 },
            { name: 'Abdominal CT Scan (Contrast)', category: 'CT Scan', price: 3800, prep: 'Fast for 4 hours prior to scan', hours: 24 }
          ]
        }
      ];

      for (const lab of labs) {
        const labRes = await db.runAsync(
          'INSERT INTO lab_centers (name, city, address, rating, home_collection_available) VALUES (?, ?, ?, 4.9, 1)',
          [lab.name, lab.city, lab.address]
        );
        const labId = labRes.lastID;
        for (const test of lab.tests) {
          await db.runAsync(
            'INSERT INTO lab_tests (lab_id, test_name, category, price, preparation_instructions, report_delivery_hours) VALUES (?, ?, ?, ?, ?, ?)',
            [labId, test.name, test.category, test.price, test.prep, test.hours]
          );
        }
      }
      console.log('Lab Marketplace seeded successfully.');
    }

    // Seed Sample AI Clone FAQ Knowledge Base for Doctors
    const doctors = await db.allAsync('SELECT id FROM doctors');
    for (const doc of doctors) {
      const faqCount = await db.getAsync('SELECT COUNT(*) as count FROM doctor_ai_knowledge WHERE doctor_id = ?', [doc.id]);
      if (faqCount.count === 0) {
        const faqs = [
          { q: 'What are your consultation fees?', a: 'New Patient Consultation Fee is ₹800. Repeat / Follow-up Patient Consultation Fee is ₹400.' },
          { q: 'What are your clinic timings?', a: 'Morning Shift: 10:00 AM to 01:00 PM. Evening Shift: 03:00 PM to 07:00 PM (Monday to Saturday).' },
          { q: 'Do you offer online payments?', a: 'Yes! We accept both Cash at Clinic and Instant Online UPI/QR Payments for 100% guaranteed slot booking.' },
          { q: 'What conditions do you treat?', a: 'We specialize in General Consultation, Cardiology, High BP, Chest Pain, Heart Checkup, and Preventive Care.' }
        ];
        for (const f of faqs) {
          await db.runAsync(
            'INSERT INTO doctor_ai_knowledge (doctor_id, question, answer) VALUES (?, ?, ?)',
            [doc.id, f.q, f.a]
          );
        }
      }
    }
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}

initDb();

module.exports = db;
