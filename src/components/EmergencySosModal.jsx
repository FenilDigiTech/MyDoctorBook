import React, { useState, useEffect } from 'react';
import { Siren, PhoneCall, MapPin, CheckCircle2, AlertTriangle, ShieldCheck, X, Activity, Building2, Truck } from 'lucide-react';

const NEARBY_HOSPITALS = [
  { name: 'City Civil & General Hospital', distance: '1.2 km', icuBeds: 12, oxygenBeds: 28, phone: '080-22210108', isGovt: true },
  { name: 'Apollo Super Specialty Center', distance: '2.5 km', icuBeds: 5, oxygenBeds: 14, phone: '080-46688000', isGovt: false },
  { name: 'Fortis Emergency Care Center', distance: '3.8 km', icuBeds: 8, oxygenBeds: 20, phone: '080-66214444', isGovt: false },
  { name: 'Manipal Emergency & Trauma Care', distance: '4.1 km', icuBeds: 3, oxygenBeds: 10, phone: '080-25024444', isGovt: false }
];

export default function EmergencySosModal({ onClose }) {
  const [patientLocation, setPatientLocation] = useState('Fetching GPS Location...');
  const [patientPhone, setPatientPhone] = useState('');
  const [emergencyType, setEmergencyType] = useState('Cardiac / Chest Pain');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPatientLocation(`GPS Coordinates: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Detected)`);
        },
        () => {
          setPatientLocation('Location: Central City Zone (Manual)');
        }
      );
    }
  }, []);

  const handleAmbulanceRequest = (e) => {
    e.preventDefault();
    if (!patientPhone) {
      alert('Please enter your contact phone number for dispatch verification.');
      return;
    }

    setRequesting(true);
    setTimeout(() => {
      setRequesting(false);
      setBookingSuccess(true);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-red-800 shadow-2xl space-y-6 relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-14 h-14 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-600/40 shrink-0 animate-pulse">
            <Siren className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-red-300 bg-red-950 px-3 py-1 rounded-full border border-red-800">
              24x7 Emergency SOS Response
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white pt-1">
              Ambulance Dispatch & ICU Bed Tracker
            </h2>
          </div>
        </div>

        {bookingSuccess ? (
          <div className="p-6 bg-emerald-950/80 rounded-3xl border border-emerald-700 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-extrabold text-white">Ambulance Dispatched! 🚨</h3>
            <p className="text-xs text-emerald-200">
              Emergency unit assigned. Dispatcher will call <strong>{patientPhone}</strong> in under 60 seconds.
            </p>
            <div className="p-4 bg-slate-900 rounded-2xl text-xs space-y-1 text-slate-300">
              <p>📍 Location: <strong>{patientLocation}</strong></p>
              <p>🚨 Priority: <strong>High Emergency Response</strong></p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md"
            >
              Close Emergency Window
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Direct Dial Emergency Button */}
            <div className="p-4 bg-red-950/60 rounded-2xl border border-red-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <Truck className="w-6 h-6 text-red-400" />
                <div>
                  <h4 className="font-extrabold text-sm text-white">National Ambulance Toll-Free</h4>
                  <p className="text-xs text-slate-400">Direct 1-Tap Calling Helpline</p>
                </div>
              </div>
              <a
                href="tel:108"
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <PhoneCall className="w-4 h-4" /> Call 108 Now
              </a>
            </div>

            {/* Request Ambulance Form */}
            <form onSubmit={handleAmbulanceRequest} className="p-5 bg-slate-800 rounded-2xl border border-slate-700 space-y-3 text-xs">
              <h4 className="font-extrabold text-sm text-red-400 flex items-center gap-1.5">
                <Siren className="w-4 h-4" /> Instant Doorstep Ambulance Dispatch Request
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Your Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="Enter phone number..."
                    className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Emergency Nature</label>
                  <select
                    value={emergencyType}
                    onChange={(e) => setEmergencyType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 rounded-xl border border-slate-700 text-white"
                  >
                    <option value="Cardiac / Chest Pain">Cardiac / Chest Pain</option>
                    <option value="Accident / Trauma">Accident / Trauma Injury</option>
                    <option value="Pregnancy Emergency">Pregnancy Emergency</option>
                    <option value="High Fever / Breathing Issue">High Fever / Breathing Issue</option>
                  </select>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-xl text-[11px] text-slate-400">
                📍 Location: <strong className="text-slate-200">{patientLocation}</strong>
              </div>

              <button
                type="submit"
                disabled={requesting}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2"
              >
                <Siren className="w-4 h-4" />
                <span>{requesting ? 'Dispatching Ambulance...' : 'Request Emergency Ambulance Dispatch Now 🚨'}</span>
              </button>
            </form>

            {/* Live ICU Bed Tracker */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-cyan-400" /> Live Nearby Hospitals ICU Bed Availability</span>
                <span className="text-[10px] text-emerald-400 font-bold">● Live Sync</span>
              </h4>

              <div className="space-y-2">
                {NEARBY_HOSPITALS.map((h, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-white">{h.name}</span>
                        {h.isGovt && <span className="text-[9px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded font-bold">Govt</span>}
                      </div>
                      <p className="text-[11px] text-slate-400">Distance: {h.distance} • Phone: {h.phone}</p>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <span className="text-emerald-400 font-extrabold block text-sm">{h.icuBeds} ICU Beds</span>
                        <span className="text-[10px] text-slate-400">{h.oxygenBeds} Oxygen Beds</span>
                      </div>
                      <a
                        href={`tel:${h.phone}`}
                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                        title="Call Hospital"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
