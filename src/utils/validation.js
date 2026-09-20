/**
 * Validation utilities for MyDoctorBook V2.0
 */

// Google Maps URL pattern validation
export const isValidGoogleMapsUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '') return false;
  const mapsRegex = /^(https?:\/\/)?(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|goo\.gl\/maps|maps\.app\.goo\.gl)\/.+/i;
  return mapsRegex.test(trimmed);
};

// Phone number validation (10 digit Indian numbers)
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const clean = String(phone).replace(/\D/g, '');
  return clean.length === 10;
};

// Email validation
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

// Indian States & Union Territories
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
  'Other'
];

// Major Indian Cities
export const MAJOR_CITIES = [
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Gandhinagar',
  'Bhavnagar',
  'Jamnagar',
  'Junagadh',
  'Mumbai',
  'Pune',
  'Nagpur',
  'Thane',
  'Nashik',
  'Bengaluru',
  'Mysuru',
  'Chennai',
  'Coimbatore',
  'Hyderabad',
  'New Delhi',
  'Gurugram',
  'Noida',
  'Kolkata',
  'Jaipur',
  'Udaipur',
  'Lucknow',
  'Kanpur',
  'Indore',
  'Bhopal',
  'Chandigarh',
  'Kochi',
  'Thiruvananthapuram',
  'Other'
];

// Standard Predefined Lab Tests
export const PREDEFINED_LAB_TESTS = [
  'Complete Blood Count (CBC) with ESR',
  'Fasting Blood Sugar (FBS)',
  'Postprandial Blood Sugar (PPBS)',
  'HbA1c Glycated Hemoglobin',
  'Lipid Profile Complete (Cholesterol, Triglycerides, HDL, LDL)',
  'Thyroid Profile Total (T3, T4, TSH)',
  'Liver Function Test (LFT) - Bilirubin, SGOT, SGPT',
  'Kidney Function Test (KFT) - Urea, Creatinine, Uric Acid',
  'Vitamin D3 (25-OH) & Vitamin B12 Combo Pack',
  'Urine Routine & Microscopic Examination',
  'Stool Routine & Occult Blood',
  'Dengue NS1 Antigen & IgM/IgG Antibody',
  'Malaria Antigen & Smear Examination',
  'High-Resolution Chest X-Ray (PA View)',
  'Abdominal & Pelvis Ultrasound Scan',
  'ECG (Electrocardiogram) 12 Lead',
  'Full Body Executive Health Checkup (72 Parameters)',
  'Other'
];
