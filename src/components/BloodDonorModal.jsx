import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Heart, Search, PhoneCall, Plus, CheckCircle2, User, MapPin, X, ShieldCheck } from 'lucide-react';
import { calculateAge } from '../utils/age';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodDonorModal({ isOpen = true, onClose }) {
  if (isOpen === false) return null;
  const [activeTab, setActiveTab] = useState('search'); // 'search' (Find Donors) or 'register'
  const [selectedGroup, setSelectedGroup] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Donor Registration Form State
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorGroup, setDonorGroup] = useState('O+');
  const [donorCity, setDonorCity] = useState('Bangalore');
  const [donorDob, setDonorDob] = useState('2000-01-01');
  const [donorAge, setDonorAge] = useState(26);
  const [regSuccess, setRegSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [myRegisteredDonor, setMyRegisteredDonor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mydoctorbook_my_donor') || 'null');
    } catch (e) {
      return null;
    }
  });

  // Reset tab to 'search' (Find Donors) whenever modal opens and purge dummy seed records
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = JSON.parse(localStorage.getItem('mdb_donors_db') || '[]');
        const cleaned = stored.filter(d => d.id !== 101 && d.id !== 102 && d.id !== 103 && d.id !== 104 && d.id !== 105 && d.id !== 106);
        localStorage.setItem('mdb_donors_db', JSON.stringify(cleaned));
      } catch (e) {}

      setActiveTab('search');
      setSelectedGroup('');
      fetchDonors();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchDonors();
  }, [selectedGroup, cityQuery]);

  const getDeletedKeys = (type) => {
    try {
      const all = JSON.parse(localStorage.getItem('mdb_deleted_items_db') || '{}');
      return new Set((all[type] || []).map(k => String(k).toLowerCase()));
    } catch {
      return new Set();
    }
  };

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedGroup && selectedGroup !== 'ALL') params.blood_group = selectedGroup;
      if (cityQuery) params.city = cityQuery;

      let apiDonors = [];
      try {
        const res = await API.get('/donors', { params });
        apiDonors = (res.data.donors || []).filter(d =>
          d.id !== 101 && d.id !== 102 && d.id !== 103 && d.id !== 104 && d.id !== 105 && d.id !== 106 &&
          !['ramesh patel', 'priya sharma', 'amit verma', 'sneha reddy', 'vikram singh', 'ananya das'].includes((d.name || '').toLowerCase().trim())
        );
      } catch (err) {}

      let localDonors = [];
      try { localDonors = JSON.parse(localStorage.getItem('mdb_blood_donors_db') || localStorage.getItem('mdb_donors_db') || '[]'); } catch {}

      const localDonor = JSON.parse(localStorage.getItem('mydoctorbook_my_donor') || 'null');
      if (localDonor) localDonors.push(localDonor);

      const deletedBDonors = getDeletedKeys('blood_donors');
      const donorMap = new Map();

      [...localDonors, ...apiDonors].forEach(d => {
        const phoneStr = String(d.phone || d.phone_number || '').toLowerCase();
        const idStr = String(d.id || '').toLowerCase();
        const key = phoneStr || idStr;
        if (key && !deletedBDonors.has(key) && !deletedBDonors.has(idStr) && !deletedBDonors.has(phoneStr)) {
          donorMap.set(key, d);
        }
      });

      setDonors(Array.from(donorMap.values()));
    } catch (err) {
      console.error('Error fetching donors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = donorPhone.replace(/\D/g, '').slice(0, 10);
    const computedAge = calculateAge(donorDob) || parseInt(donorAge, 10) || 25;

    if (!donorName || cleanPhone.length !== 10) {
      alert('Please enter a valid name and 10-digit mobile number.');
      return;
    }

    if (!donorDob || computedAge < 18 || computedAge > 65) {
      alert('Please select a valid Date of Birth (Age must be between 18 and 65 years).');
      return;
    }

    const newDonor = {
      id: Date.now(),
      name: donorName,
      phone: cleanPhone,
      blood_group: donorGroup,
      city: donorCity,
      dob: donorDob,
      age: computedAge,
      is_available: 1
    };

    try {
      setSubmitting(true);
      const res = await API.post('/donors', newDonor);
      if (res.data?.donorId) {
        newDonor.id = res.data.donorId;
      }
    } catch (err) {
      console.error('Donor registration fallback:', err);
    } finally {
      setSubmitting(false);
      setMyRegisteredDonor(newDonor);
      localStorage.setItem('mydoctorbook_my_donor', JSON.stringify(newDonor));

      setRegSuccess(true);
      setDonors((prev) => [newDonor, ...prev.filter((d) => d.phone !== cleanPhone)]);
    }
  };

  const handleCancelDonation = async () => {
    if (!myRegisteredDonor) return;

    try {
      setSubmitting(true);
      await API.post('/donors/cancel', { id: myRegisteredDonor.id, phone: myRegisteredDonor.phone });
    } catch (err) {
      console.error('Error cancelling donor registration:', err);
    } finally {
      setSubmitting(false);
      setDonors((prev) => prev.filter((d) => d.phone !== myRegisteredDonor.phone && d.id !== myRegisteredDonor.id));
      localStorage.removeItem('mydoctorbook_my_donor');
      setMyRegisteredDonor(null);
      setRegSuccess(false);
      setShowCancelConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-red-600/30 shrink-0">
            🩸
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800">
              Emergency Blood Connect
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Live Blood Donor Directory
            </h2>
          </div>
        </div>

        {/* Tabs Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold space-x-6">
          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'search'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            🔍 Find Donors ({donors.length})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'register'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            🙋‍♂️ Become a Life-Saving Donor
          </button>
        </div>

        {/* Tab 1: Search Donors */}
        {activeTab === 'search' && (
          <div className="space-y-4 text-xs">
            {/* Filter Pills */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Filter by Blood Group:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedGroup('')}
                  className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                    selectedGroup === '' ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  All Groups
                </button>
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setSelectedGroup(selectedGroup === bg ? '' : bg)}
                    className={`px-3 py-1.5 rounded-xl font-bold border transition-all ${
                      selectedGroup === bg ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    🩸 {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* Donors List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {loading ? (
                <p className="text-center py-6 text-slate-400 font-bold">Searching verified donors...</p>
              ) : (() => {
                const filteredDonors = selectedGroup
                  ? donors.filter((d) => (d.blood_group || '').trim().toUpperCase() === selectedGroup.trim().toUpperCase())
                  : donors;

                if (filteredDonors.length === 0) {
                  return (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-3 border border-slate-200 dark:border-slate-700">
                      <Heart className="w-10 h-10 text-red-500 mx-auto animate-pulse" />
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">No Registered Donors Found</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No voluntary blood donors registered yet for {selectedGroup ? `Group ${selectedGroup}` : 'selected criteria'}.</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('register')}
                        className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white font-extrabold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Register as a Voluntary Blood Donor →
                      </button>
                    </div>
                  );
                }

                return filteredDonors.map((d) => (
                  <div key={d.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 font-extrabold flex items-center justify-center text-sm border border-red-200 dark:border-red-800">
                        {d.blood_group}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{d.name}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          📍 {d.city || 'Bangalore'} • Age: {d.age || 25} yrs
                        </p>
                      </div>
                    </div>

                    <a
                      href={`tel:${d.phone}`}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Call Donor
                    </a>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Tab 2: Register as Donor */}
        {activeTab === 'register' && (
          <div className="space-y-4 text-xs">
            {regSuccess || myRegisteredDonor ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Active Voluntary Blood Donor! 🩸</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Thank you, <strong>{myRegisteredDonor?.name || donorName}</strong>! Your availability ({myRegisteredDonor?.blood_group || donorGroup}) is listed on MediBook to help save lives.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('search')}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    View Live Donor Directory →
                  </button>

                  {showCancelConfirm ? (
                    <div className="w-full p-4 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-2xl space-y-2.5">
                      <p className="font-extrabold text-xs text-red-900 dark:text-red-200">
                        Are you sure you want to cancel your blood donor registration?
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelDonation}
                          disabled={submitting}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md"
                        >
                          {submitting ? 'Cancelling...' : 'Yes, Cancel Registration ❌'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(false)}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
                        >
                          Keep Active Donor
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(true)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>Cancel / Opt-Out Donor Registration ❌</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <p className="font-bold text-slate-700 dark:text-slate-300">Enter your details to register as a voluntary donor:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Phone Number (10 Digits Only) *</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit Mobile Number (e.g. 9876543210)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Blood Group *</label>
                    <select
                      value={donorGroup}
                      onChange={(e) => setDonorGroup(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs font-bold"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={donorCity}
                      onChange={(e) => setDonorCity(e.target.value)}
                      placeholder="e.g. Bangalore"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">Date of Birth (DOB) *</label>
                    <input
                      type="date"
                      required
                      max={new Date().toISOString().split('T')[0]}
                      value={donorDob}
                      onChange={(e) => {
                        const dobVal = e.target.value;
                        setDonorDob(dobVal);
                        const computed = calculateAge(dobVal);
                        setDonorAge(computed);
                      }}
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-bold ${
                        (calculateAge(donorDob) || donorAge) < 18
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
                          : 'border-slate-200 dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    />
                    {donorDob && (
                      <div className="mt-1.5 space-y-1">
                        {(calculateAge(donorDob) || donorAge) < 18 ? (
                          <div className="p-2.5 bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200 font-extrabold text-[11px] flex items-center gap-1.5 shadow-sm">
                            <span className="text-base">🚨</span>
                            <span>You are Under Age! Minimum age required to donate blood is 18 years old. (Current Age: {calculateAge(donorDob) || donorAge} yrs)</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold block">
                            ✨ Calculated Age: {calculateAge(donorDob) || donorAge} yrs (Eligible to donate blood 🩸)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || (calculateAge(donorDob) || donorAge) < 18}
                  className={`w-full py-3 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all ${
                    (calculateAge(donorDob) || donorAge) < 18
                      ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-75 shadow-none'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Registering...'
                      : (calculateAge(donorDob) || donorAge) < 18
                      ? '⚠️ You Are Under Age (Must be 18+ yrs)'
                      : 'Complete Blood Donor Registration 🩸'}
                  </span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
