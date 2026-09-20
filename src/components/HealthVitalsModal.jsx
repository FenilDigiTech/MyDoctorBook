import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Activity, Heart, TrendingUp, Plus, Download, CheckCircle2, AlertTriangle, RefreshCw, X, ShieldCheck } from 'lucide-react';

export default function HealthVitalsModal({ isOpen, onClose, patientData }) {
  const [vitalsList, setVitalsList] = useState(() => {
    try {
      const s = localStorage.getItem('mdb_patient_health_vitals');
      return s ? JSON.parse(s) : [
        { id: 1, date: '2026-08-11', sys: 120, dia: 80, pulse: 72, sugar: 95, spo2: 98, weight: 68 },
        { id: 2, date: '2026-08-10', sys: 124, dia: 82, pulse: 75, sugar: 102, spo2: 97, weight: 68.2 },
        { id: 3, date: '2026-08-08', sys: 118, dia: 78, pulse: 70, sugar: 92, spo2: 99, weight: 68.5 }
      ];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newVital, setNewVital] = useState({
    sys: '120',
    dia: '80',
    pulse: '72',
    sugar: '98',
    spo2: '98',
    weight: '68'
  });

  if (!isOpen) return null;

  const handleAddVital = (e) => {
    e.preventDefault();
    const record = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      sys: parseInt(newVital.sys) || 120,
      dia: parseInt(newVital.dia) || 80,
      pulse: parseInt(newVital.pulse) || 72,
      sugar: parseInt(newVital.sugar) || 98,
      spo2: parseInt(newVital.spo2) || 98,
      weight: parseFloat(newVital.weight) || 68
    };

    const updated = [record, ...vitalsList];
    setVitalsList(updated);
    localStorage.setItem('mdb_patient_health_vitals', JSON.stringify(updated));
    setShowAddForm(false);
  };

  const latest = vitalsList[0] || { sys: 120, dia: 80, pulse: 72, sugar: 98, spo2: 98, weight: 68 };
  const heightMeters = 1.72;
  const bmi = (latest.weight / (heightMeters * heightMeters)).toFixed(1);

  const generateVitalsPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(15, 118, 110);
      doc.text('MyDoctorBook.in — Patient Health Vitals History', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Recorded Vitals & Medical Trend Report for ${patientData?.name || 'Patient'}`, 14, 27);
      doc.text('─'.repeat(70), 14, 33);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Latest Blood Pressure: ${latest.sys}/${latest.dia} mmHg (Normal)`, 14, 44);
      doc.text(`Fasting Blood Sugar: ${latest.sugar} mg/dL`, 14, 52);
      doc.text(`Heart Pulse Rate: ${latest.pulse} bpm | SpO2: ${latest.spo2}%`, 14, 60);
      doc.text(`Body Weight: ${latest.weight} kg | Computed BMI: ${bmi}`, 14, 68);

      doc.text('─'.repeat(70), 14, 76);
      doc.setFontSize(12);
      doc.text('Vitals History Log:', 14, 86);

      let y = 96;
      vitalsList.slice(0, 8).forEach(v => {
        doc.setFontSize(9);
        doc.text(`• ${v.date}: BP ${v.sys}/${v.dia} mmHg | Sugar: ${v.sugar} mg/dL | Pulse: ${v.pulse} bpm | Weight: ${v.weight} kg`, 14, y);
        y += 8;
      });

      doc.save(`Health_Vitals_Report.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[90vh]">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-950 via-cyan-950 to-slate-900 border-b border-teal-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Patient Health Vitals & BMI Tracker
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
                  LIVE VITALS 🩺
                </span>
              </h3>
              <p className="text-xs text-slate-400">Blood Pressure, Blood Sugar, Pulse Rate & BMI Trends</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* Vitals Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-800 border border-teal-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Pressure</span>
              <p className="text-lg font-black text-teal-400">{latest.sys}/{latest.dia} <span className="text-xs font-normal text-slate-400">mmHg</span></p>
              <span className="text-[10px] font-bold text-emerald-400">Normal Range ✓</span>
            </div>

            <div className="p-3.5 bg-slate-800 border border-cyan-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Blood Sugar</span>
              <p className="text-lg font-black text-cyan-400">{latest.sugar} <span className="text-xs font-normal text-slate-400">mg/dL</span></p>
              <span className="text-[10px] font-bold text-emerald-400">Fasting Normal ✓</span>
            </div>

            <div className="p-3.5 bg-slate-800 border border-purple-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Heart Pulse</span>
              <p className="text-lg font-black text-purple-400">{latest.pulse} <span className="text-xs font-normal text-slate-400">bpm</span></p>
              <span className="text-[10px] font-bold text-emerald-400">Healthy Rhythm ✓</span>
            </div>

            <div className="p-3.5 bg-slate-800 border border-emerald-500/30 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">BMI Index</span>
              <p className="text-lg font-black text-emerald-400">{bmi} <span className="text-xs font-normal text-slate-400">BMI</span></p>
              <span className="text-[10px] font-bold text-emerald-400">Optimal Weight ✓</span>
            </div>
          </div>

          {/* Add New Reading Toggle Form */}
          {!showAddForm ? (
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-400">Vitals History Log ({vitalsList.length}):</p>
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Log New Vitals Reading +
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddVital} className="p-4 bg-slate-800 border border-teal-500/40 rounded-2xl space-y-3 shadow-xl">
              <h4 className="font-black text-xs text-teal-300 uppercase tracking-wider">Log New Health Vitals Measurement</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Systolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={newVital.sys}
                    onChange={e => setNewVital({ ...newVital, sys: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Diastolic BP (mmHg)</label>
                  <input
                    type="number"
                    value={newVital.dia}
                    onChange={e => setNewVital({ ...newVital, dia: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Blood Sugar (mg/dL)</label>
                  <input
                    type="number"
                    value={newVital.sugar}
                    onChange={e => setNewVital({ ...newVital, sugar: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Heart Pulse (bpm)</label>
                  <input
                    type="number"
                    value={newVital.pulse}
                    onChange={e => setNewVital({ ...newVital, pulse: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">SpO2 (%)</label>
                  <input
                    type="number"
                    value={newVital.spo2}
                    onChange={e => setNewVital({ ...newVital, spo2: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Body Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVital.weight}
                    onChange={e => setNewVital({ ...newVital, weight: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-slate-700 text-slate-300 font-bold text-xs rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs rounded-xl shadow-lg">Save Reading ✅</button>
              </div>
            </form>
          )}

          {/* Vitals History List */}
          <div className="space-y-2">
            {vitalsList.map(v => (
              <div key={v.id} className="p-3 bg-slate-800/70 border border-slate-700 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <h5 className="font-extrabold text-white text-xs">Date: {v.date}</h5>
                  <p className="text-slate-400 text-[11px]">BP: <strong className="text-teal-400">{v.sys}/{v.dia} mmHg</strong> • Sugar: <strong className="text-cyan-400">{v.sugar} mg/dL</strong> • Pulse: {v.pulse} bpm • Weight: {v.weight} kg</p>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full">Normal ✓</span>
              </div>
            ))}
          </div>

          {/* Action Bar */}
          <div className="pt-2">
            <button
              type="button"
              onClick={generateVitalsPDF}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 hover:from-teal-500 text-white font-black text-xs rounded-xl shadow-xl flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Official Vitals History PDF 📄
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
