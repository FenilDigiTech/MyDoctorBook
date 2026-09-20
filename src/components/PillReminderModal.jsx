import React, { useState, useEffect } from 'react';
import { Pill, Clock, Bell, Plus, Trash2, CheckCircle2, AlertCircle, X, Volume2, ShieldCheck } from 'lucide-react';

export default function PillReminderModal({ isOpen, onClose }) {
  const [reminders, setReminders] = useState(() => {
    try {
      const s = localStorage.getItem('mdb_pill_reminders');
      return s ? JSON.parse(s) : [
        { id: 1, name: 'Paracetamol 650mg', dosage: '1 Tablet', time: '09:00', slot: 'Morning 🌅', takenToday: true },
        { id: 2, name: 'Metformin 500mg', dosage: '1 Tablet', time: '14:00', slot: 'Afternoon ☀️', takenToday: false },
        { id: 3, name: 'B-Complex & Zinc', dosage: '1 Capsule', time: '21:00', slot: 'Night 🌙', takenToday: false }
      ];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPill, setNewPill] = useState({ name: '', dosage: '1 Tablet', time: '09:00', slot: 'Morning 🌅' });
  const [activeAlert, setActiveAlert] = useState(null);

  const saveReminders = (updated) => {
    setReminders(updated);
    localStorage.setItem('mdb_pill_reminders', JSON.stringify(updated));

    // AUTOMATIC HEALTH ID & USER PROFILE SYNC
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.pill_reminders = updated;
      localStorage.setItem('user', JSON.stringify(user));

      const patProfile = JSON.parse(localStorage.getItem('mydoctorbook_patient_profile') || '{}');
      patProfile.pill_reminders = updated;
      localStorage.setItem('mydoctorbook_patient_profile', JSON.stringify(patProfile));
    } catch (e) {}
  };

  // Alarm Ticker Check
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;

      const matched = reminders.find(r => r.time === currentTimeStr && !r.takenToday);
      if (matched && !activeAlert) {
        setActiveAlert(matched);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`⏰ MEDICINE ALARM TIME!`, {
            body: `Time to take ${matched.name} (${matched.dosage}) - ${matched.slot}`,
            icon: '/favicon.ico'
          });
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [reminders, activeAlert]);

  const handleAddPill = (e) => {
    e.preventDefault();
    if (!newPill.name.trim()) return;

    const record = { ...newPill, id: Date.now(), takenToday: false };
    const updated = [...reminders, record];
    saveReminders(updated);

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`⏰ Medicine Alarm Scheduled!`, {
          body: `${newPill.name} (${newPill.dosage}) scheduled at ${newPill.time} (${newPill.slot})`,
          icon: '/favicon.ico'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    setNewPill({ name: '', dosage: '1 Tablet', time: '09:00', slot: 'Morning 🌅' });
    setShowAddForm(false);
  };

  const handleToggleTaken = (id) => {
    const updated = reminders.map(r => r.id === id ? { ...r, takenToday: !r.takenToday } : r);
    saveReminders(updated);
  };

  const handleDeletePill = (id) => {
    saveReminders(reminders.filter(r => r.id !== id));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-pink-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-white max-h-[85vh]">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-pink-950 via-purple-950 to-slate-900 border-b border-pink-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400">
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Daily Medicine Alarm Engine
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-pink-500/20 text-pink-300 border border-pink-500/30 rounded-full flex items-center gap-1">
                  <Bell className="w-3 h-3 text-pink-400" /> ACTIVE ALARM
                </span>
              </h3>
              <p className="text-xs text-slate-400">Track & Never Miss Your Daily Dosage Timings</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alarm Banner if triggered */}
        {activeAlert && (
          <div className="p-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-between shadow-lg animate-bounce">
            <div className="flex items-center gap-2">
              <Volume2 className="w-6 h-6 animate-pulse" />
              <div>
                <h4 className="font-black text-xs uppercase">⏰ MEDICINE TIME REMINDER!</h4>
                <p className="text-xs font-extrabold">{activeAlert.name} ({activeAlert.dosage})</p>
              </div>
            </div>
            <button
              onClick={() => {
                handleToggleTaken(activeAlert.id);
                setActiveAlert(null);
              }}
              className="px-3.5 py-1.5 bg-white text-slate-950 font-black text-xs rounded-xl shadow hover:bg-pink-100"
            >
              Mark Taken ✅
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">

          {!showAddForm ? (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">Your scheduled daily medicine alarms:</p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-2 bg-pink-600 hover:bg-pink-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Medicine Alarm +
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddPill} className="p-4 bg-slate-800 border border-pink-500/40 rounded-2xl space-y-3 shadow-xl">
              <h4 className="text-xs font-black text-pink-300 uppercase tracking-wider">Schedule New Medicine Alarm</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={newPill.name}
                    onChange={e => setNewPill({ ...newPill, name: e.target.value })}
                    placeholder="e.g. Paracetamol 650mg"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Dosage *</label>
                  <input
                    type="text"
                    required
                    value={newPill.dosage}
                    onChange={e => setNewPill({ ...newPill, dosage: e.target.value })}
                    placeholder="e.g. 1 Tablet"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Alarm Time *</label>
                  <input
                    type="time"
                    required
                    value={newPill.time}
                    onChange={e => setNewPill({ ...newPill, time: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Time Slot *</label>
                  <select
                    value={newPill.slot}
                    onChange={e => setNewPill({ ...newPill, slot: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold"
                  >
                    <option>Morning 🌅</option>
                    <option>Afternoon ☀️</option>
                    <option>Night 🌙</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-700 text-slate-300 font-bold text-xs rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-pink-600 text-white font-black text-xs rounded-xl shadow-lg">Save Alarm ✅</button>
              </div>
            </form>
          )}

          {/* List of Alarms */}
          <div className="space-y-3">
            {reminders.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                  r.takenToday
                    ? 'bg-slate-800/40 border-slate-800 opacity-60'
                    : 'bg-slate-800/80 border-slate-700 hover:border-pink-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${r.takenToday ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-pink-950 text-pink-300 border border-pink-800'}`}>
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-white text-sm">{r.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-pink-300 rounded-full border border-slate-700">{r.slot}</span>
                    </div>
                    <p className="text-xs text-slate-400">Dosage: {r.dosage} • Alarm: <strong className="text-white font-mono">{r.time}</strong></p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleTaken(r.id)}
                    className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1 transition-all ${
                      r.takenToday ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-pink-600 hover:bg-pink-500 text-white shadow'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {r.takenToday ? 'Taken ✓' : 'Mark Taken'}
                  </button>
                  <button onClick={() => handleDeletePill(r.id)} className="w-8 h-8 rounded-xl bg-red-950/80 text-red-400 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
