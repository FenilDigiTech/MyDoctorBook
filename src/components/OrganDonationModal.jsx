import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Heart, Search, PhoneCall, Plus, CheckCircle2, User, MapPin, X, ShieldCheck, Download, Award, AlertCircle, Trash2, Activity } from 'lucide-react';

const ORGAN_TYPES = [
  'All Organs',
  'Nose',
  'Eyes / Cornea',
  'Kidneys',
  'Heart',
  'Liver',
  'Lungs',
  'Skin / Tissues',
  'Bone Marrow',
  'Pancreas',
  'Heart Valves',
  'Ears',
  'Hands / Limbs',
  'Whole Body Donation'
];

export default function OrganDonationModal({ isOpen, onClose, patientData }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' (Find Donors) or 'register'
  const [selectedOrgan, setSelectedOrgan] = useState('All Organs');
  const [cityQuery, setCityQuery] = useState('');
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Form State
  const [pledgedOrgans, setPledgedOrgans] = useState(['Eyes / Cornea', 'Nose', 'Kidneys', 'Heart']);
  const [donorName, setDonorName] = useState(patientData?.name || '');
  const [donorAge, setDonorAge] = useState(patientData?.age || '28');
  const [donorGender, setDonorGender] = useState(patientData?.gender || 'Male');
  const [emergencyPhone, setEmergencyPhone] = useState(patientData?.phone || '9876543210');
  const [bloodGroup, setBloodGroup] = useState(patientData?.blood_group || 'O+');
  const [donorCity, setDonorCity] = useState(patientData?.city || 'Bangalore');
  const [registeredCard, setRegisteredCard] = useState(null);

  const [myRegisteredOrganDonor, setMyRegisteredOrganDonor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mydoctorbook_my_organ_donor') || 'null');
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchOrganDonors();
    }
  }, [isOpen, selectedOrgan, cityQuery]);

  const getDeletedKeys = (type) => {
    try {
      const all = JSON.parse(localStorage.getItem('mdb_deleted_items_db') || '{}');
      return new Set((all[type] || []).map(k => String(k).toLowerCase()));
    } catch {
      return new Set();
    }
  };

  const fetchOrganDonors = () => {
    setLoading(true);
    try {
      // Seed organ donors database with complete fields (Age, Gender, Blood Group, City, Phone, Organs)
      let stored = JSON.parse(localStorage.getItem('mdb_organ_donors_db') || '[]');
      if (stored.length === 0) {
        stored = [
          {
            id: 201,
            donorId: 'DONOR-91823901',
            name: 'Dr. Rajesh Mehta',
            age: '34',
            gender: 'Male',
            bloodGroup: 'O+',
            city: 'Bangalore',
            phone: '9845012345',
            organs: ['Eyes / Cornea', 'Nose', 'Kidneys'],
            date: '10/01/2026'
          },
          {
            id: 202,
            donorId: 'DONOR-88239102',
            name: 'Kavita Patel',
            age: '29',
            gender: 'Female',
            bloodGroup: 'A+',
            city: 'Ahmedabad',
            phone: '9825098765',
            organs: ['Heart', 'Liver', 'Lungs', 'Bone Marrow'],
            date: '15/01/2026'
          },
          {
            id: 203,
            donorId: 'DONOR-77291034',
            name: 'Suresh Kumar',
            age: '42',
            gender: 'Male',
            bloodGroup: 'B+',
            city: 'Mumbai',
            phone: '9819054321',
            organs: ['Eyes / Cornea', 'Nose', 'Whole Body Donation'],
            date: '02/02/2026'
          }
        ];
        localStorage.setItem('mdb_organ_donors_db', JSON.stringify(stored));
      }

      // CRITICAL: Filter out any organ donor deleted by Super Admin!
      const deletedODonors = getDeletedKeys('organ_donors');
      let filtered = stored.filter(d => {
        const idStr = String(d.id || '').toLowerCase();
        const donorIdStr = String(d.donorId || '').toLowerCase();
        const phoneStr = String(d.phone || '').toLowerCase();
        return !deletedODonors.has(idStr) && !deletedODonors.has(donorIdStr) && !deletedODonors.has(phoneStr);
      });

      if (selectedOrgan && selectedOrgan !== 'All Organs') {
        filtered = filtered.filter(d => (d.organs || []).some(o => o.toLowerCase().includes(selectedOrgan.toLowerCase())));
      }
      if (cityQuery.trim()) {
        filtered = filtered.filter(d => (d.city || '').toLowerCase().includes(cityQuery.toLowerCase().trim()));
      }

      // Merge my local registration if available
      const localDonor = JSON.parse(localStorage.getItem('mydoctorbook_my_organ_donor') || 'null');
      if (localDonor) {
        const exists = filtered.some(d => d.donorId === localDonor.donorId || d.phone === localDonor.phone);
        if (!exists) {
          filtered = [localDonor, ...filtered];
        }
      }

      setDonors(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const toggleOrgan = (organ) => {
    if (pledgedOrgans.includes(organ)) {
      setPledgedOrgans(pledgedOrgans.filter(o => o !== organ));
    } else {
      setPledgedOrgans([...pledgedOrgans, organ]);
    }
  };

  const handleRegisterDonor = (e) => {
    e.preventDefault();
    if (pledgedOrgans.length === 0) {
      alert('Please select at least 1 organ/tissue to pledge.');
      return;
    }

    const donorId = `DONOR-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const donorData = {
      id: Date.now(),
      donorId,
      name: donorName || patientData?.name || 'Registered Organ Donor',
      age: donorAge || '28',
      gender: donorGender || 'Male',
      bloodGroup,
      city: donorCity,
      phone: emergencyPhone,
      organs: pledgedOrgans,
      date: new Date().toLocaleDateString('en-IN')
    };

    setRegisteredCard(donorData);
    setMyRegisteredOrganDonor(donorData);
    localStorage.setItem('mydoctorbook_my_organ_donor', JSON.stringify(donorData));

    try {
      const stored = JSON.parse(localStorage.getItem('mdb_organ_donors_db') || '[]');
      stored.unshift(donorData);
      localStorage.setItem('mdb_organ_donors_db', JSON.stringify(stored));
    } catch (e) {}

    fetchOrganDonors();
  };

  const handleCancelRegistration = () => {
    try {
      localStorage.removeItem('mydoctorbook_my_organ_donor');
      const stored = JSON.parse(localStorage.getItem('mdb_organ_donors_db') || '[]');
      const updated = stored.filter(d => d.phone !== emergencyPhone && d.phone !== patientData?.phone);
      localStorage.setItem('mdb_organ_donors_db', JSON.stringify(updated));

      setMyRegisteredOrganDonor(null);
      setRegisteredCard(null);
      setShowCancelConfirm(false);
      alert('❌ Your Organ Donor Pledge Registration has been cancelled.');
      fetchOrganDonors();
    } catch (e) {
      console.error(e);
    }
  };

  const downloadDonorCardPDF = (card = registeredCard) => {
    if (!card) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(225, 29, 72);
      doc.text('MyDoctorBook.in — Official Organ Donor Card', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('National Organ & Tissue Donation Pledge Certificate', 14, 27);
      doc.text('─'.repeat(70), 14, 33);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Donor Pledge ID: ${card.donorId}`, 14, 44);
      doc.text(`Donor Full Name: ${card.name}`, 14, 52);
      doc.text(`Age & Gender: ${card.age || '28'} Yrs • ${card.gender || 'Male'}`, 14, 60);
      doc.text(`Blood Group: ${card.bloodGroup}`, 14, 68);
      doc.text(`City / Location: ${card.city || 'India'}`, 14, 76);
      doc.text(`Emergency Contact: ${card.phone}`, 14, 84);

      doc.text('─'.repeat(70), 14, 92);
      doc.setFontSize(12);
      doc.text('Pledged Organs & Tissues:', 14, 102);
      doc.setFontSize(10);
      (card.organs || []).forEach((o, idx) => {
        doc.text(`• ${o}`, 14, 112 + (idx * 8));
      });

      doc.setFontSize(9);
      doc.setTextColor(225, 29, 72);
      doc.text('❤️ "Donate Life — Gift Hope to Someone in Need"', 14, 160);
      doc.save(`Organ_Donor_Card_${card.donorId}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[92vh]">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-950 via-red-950 to-slate-900 border-b border-rose-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Heart className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Organ & Body Part Donor Network
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  LIVE PLEDGE NETWORK ❤️
                </span>
              </h3>
              <p className="text-xs text-slate-400">Search Pledged Donors & Register Organ Donation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'search'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" /> Find Organ Donors Network ({donors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-rose-600 text-white shadow-lg'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" /> Register / Pledge Organ Donation
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* TAB 1: SEARCH ORGAN DONORS */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              
              {/* Search Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by Organ / Tissue</label>
                  <select
                    value={selectedOrgan}
                    onChange={e => setSelectedOrgan(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs"
                  >
                    {ORGAN_TYPES.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Filter by City</label>
                  <input
                    type="text"
                    placeholder="Enter city (e.g. Bangalore, Ahmedabad)..."
                    value={cityQuery}
                    onChange={e => setCityQuery(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold text-xs"
                  />
                </div>
              </div>

              {/* Registered Donors List */}
              {loading ? (
                <div className="text-center py-12 text-slate-400">Loading organ donors network...</div>
              ) : donors.length === 0 ? (
                <div className="p-8 bg-slate-950/60 rounded-2xl border border-slate-800 text-center space-y-2">
                  <Heart className="w-10 h-10 text-rose-500 mx-auto opacity-50" />
                  <h4 className="font-bold text-sm text-white">No Donors Found</h4>
                  <p className="text-slate-400 text-xs">No registered organ donors matched your current filter criteria.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {donors.map(d => (
                    <div
                      key={d.id || d.donorId}
                      className="p-4 bg-slate-800/90 border border-slate-700 hover:border-rose-500/50 rounded-2xl space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-sm text-white">{d.name}</h4>
                          <span className="px-2 py-0.5 bg-slate-900 text-slate-300 border border-slate-700 rounded-full text-[10px] font-extrabold">
                            {d.age || '28'} Yrs • {d.gender || 'Male'}
                          </span>
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full text-[10px] font-extrabold">
                            {d.bloodGroup}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-extrabold">
                            PLEDGED DONOR ✓
                          </span>
                        </div>

                        <p className="text-slate-300 text-xs flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>City: <strong>{d.city}</strong> • Contact: <strong>+91 {d.phone}</strong></span>
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {(d.organs || []).map(organName => (
                            <span key={organName} className="px-2 py-0.5 bg-slate-900 text-rose-300 border border-rose-800/60 rounded-md text-[10px] font-bold flex items-center gap-1">
                              🫀 {organName}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 flex gap-2">
                        <a
                          href={`tel:${d.phone}`}
                          className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                        >
                          <PhoneCall className="w-3.5 h-3.5" /> Call Coordinator / Donor 📞
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: REGISTER ORGAN PLEDGE */}
          {activeTab === 'register' && (
            <div className="space-y-4">
              
              {myRegisteredOrganDonor ? (
                /* Registered Card View */
                <div className="p-6 bg-slate-800/90 border border-rose-500/50 rounded-2xl text-center space-y-4 shadow-xl">
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-400 mx-auto shadow-inner">
                    <Heart className="w-8 h-8 fill-rose-400 animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-black text-lg text-white">Your Organ Donor Pledge is Active!</h4>
                    <p className="text-xs text-rose-400 font-mono font-bold">{myRegisteredOrganDonor.donorId}</p>
                    <p className="text-xs text-slate-300">Name: <strong>{myRegisteredOrganDonor.name}</strong> ({myRegisteredOrganDonor.age || '28'} Yrs • {myRegisteredOrganDonor.gender || 'Male'})</p>
                    <p className="text-xs text-slate-300">Blood Group: <strong>{myRegisteredOrganDonor.bloodGroup}</strong> • City: <strong>{myRegisteredOrganDonor.city}</strong></p>
                    <p className="text-xs text-slate-300">Pledged Organs: <strong className="text-rose-300">{myRegisteredOrganDonor.organs?.join(', ')}</strong></p>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => downloadDonorCardPDF(myRegisteredOrganDonor)}
                      className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 hover:from-rose-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Official Digital Organ Donor Card PDF 📄
                    </button>

                    {!showCancelConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowCancelConfirm(true)}
                        className="py-2.5 bg-slate-900 border border-red-800 text-red-400 hover:bg-red-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Cancel / Opt-Out Organ Donor Registration ❌
                      </button>
                    ) : (
                      <div className="p-3 bg-red-950/80 border border-red-700 rounded-xl space-y-2">
                        <p className="text-xs font-bold text-white">Are you sure you want to cancel your organ donor pledge?</p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleCancelRegistration}
                            className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold rounded-lg"
                          >
                            Yes, Cancel Pledge ❌
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCancelConfirm(false)}
                            className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-lg"
                          >
                            Keep Active
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Registration Form */
                <form onSubmit={handleRegisterDonor} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300 block">Select Organs & Tissues to Pledge *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {ORGAN_TYPES.filter(o => o !== 'All Organs').map(organ => (
                        <button
                          key={organ}
                          type="button"
                          onClick={() => toggleOrgan(organ)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                            pledgedOrgans.includes(organ)
                              ? 'bg-rose-600 border-rose-400 text-white shadow'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}
                        >
                          <span>{organ}</span>
                          {pledgedOrgans.includes(organ) && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Donor Full Name *</label>
                      <input
                        type="text"
                        required
                        value={donorName}
                        onChange={e => setDonorName(e.target.value)}
                        placeholder="Your Name..."
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Age (Years) *</label>
                      <input
                        type="number"
                        required
                        value={donorAge}
                        onChange={e => setDonorAge(e.target.value)}
                        placeholder="28"
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Gender *</label>
                      <select
                        value={donorGender}
                        onChange={e => setDonorGender(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Blood Group *</label>
                      <select
                        value={bloodGroup}
                        onChange={e => setBloodGroup(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                      >
                        <option>A+</option><option>A-</option>
                        <option>B+</option><option>B-</option>
                        <option>O+</option><option>O-</option>
                        <option>AB+</option><option>AB-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">City / Location *</label>
                      <input
                        type="text"
                        required
                        value={donorCity}
                        onChange={e => setDonorCity(e.target.value)}
                        placeholder="Bangalore, Ahmedabad..."
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Emergency Phone *</label>
                      <input
                        type="text"
                        required
                        value={emergencyPhone}
                        onChange={e => setEmergencyPhone(e.target.value)}
                        placeholder="10-digit mobile..."
                        className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:from-rose-500 text-white font-black text-xs rounded-xl shadow-xl flex items-center justify-center gap-2"
                    >
                      <Heart className="w-4 h-4 text-white fill-white" /> Register Organ Donor Pledge & Generate Card →
                    </button>
                  </div>
                </form>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
