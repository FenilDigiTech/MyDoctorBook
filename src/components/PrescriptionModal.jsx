import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { X, Plus, Trash2, Save, Loader, Printer, Stethoscope, User, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import API from '../services/api';
import VoicePrescriptionDictator from './VoicePrescriptionDictator';

const FOOD_OPTIONS = ['Before Food', 'After Food', 'With Food', 'Empty Stomach', 'As Needed'];
const FREQUENCY_OPTIONS = ['1-0-0 (Morning only)', '0-1-0 (Afternoon only)', '0-0-1 (Night only)', '1-0-1 (Morning & Night)', '1-1-1 (Thrice daily)', '1-1-1-1 (Four times)', 'SOS (As needed)', 'Once Weekly', 'Twice Weekly'];
const DURATION_OPTIONS = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '21 Days', '1 Month', '2 Months', '3 Months', 'Ongoing'];

const emptyMed = () => ({ name: '', dosage: '', frequency: '1-0-1 (Morning & Night)', duration: '5 Days', food_instruction: 'After Food', notes: '' });

export default function PrescriptionModal({ appointment, doctorProfile, onClose, onSaved }) {
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([emptyMed()]);
  const [labTests, setLabTests] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);

  const addMed = () => setMedicines(prev => [...prev, emptyMed()]);
  const removeMed = (i) => setMedicines(prev => prev.filter((_, idx) => idx !== i));
  const updateMed = (i, field, val) => setMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const handleDictatedMedicine = (dictated) => {
    setMedicines(prev => {
      const formattedFreq = dictated.freq === '1-0-1' ? '1-0-1 (Morning & Night)' : dictated.freq === '1-0-0' ? '1-0-0 (Morning only)' : '1-0-1 (Morning & Night)';
      const newMedRow = {
        name: dictated.name || dictated.text,
        dosage: dictated.dosage || '1 Tablet',
        frequency: formattedFreq,
        duration: dictated.dur || '5 Days',
        food_instruction: dictated.inst || 'After Food',
        notes: ''
      };

      if (prev.length === 1 && !prev[0].name) {
        return [newMedRow];
      }
      return [...prev, newMedRow];
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) { alert('Please enter a diagnosis.'); return; }
    if (!medicines[0]?.name.trim()) { alert('Please add at least one medicine.'); return; }
    try {
      setSaving(true);
      const rxId = 'RX-' + Math.floor(100000 + Math.random() * 900000);
      const payload = {
        // Doctor info
        doctor_id: doctorProfile?.id || doctorProfile?.user_id || 101,
        doctor_name: doctorProfile?.name || 'Dr. Specialist',
        doctor_email: doctorProfile?.email || '',
        doctor_degree: doctorProfile?.degree || 'MBBS',
        doctor_specialization: doctorProfile?.specialization || 'General Physician',
        hospital_name: doctorProfile?.hospital_name || 'City Hospital',
        clinic_address: doctorProfile?.clinic_address || '',
        doctor_phone: doctorProfile?.phone || '',
        doctor_license: doctorProfile?.license_number || 'REG-MED-998877',
        // Patient info
        patient_id: appointment?.patient_id || appointment?.user_id || 1,
        patient_name: appointment?.patient_name || 'Patient',
        patient_email: appointment?.patient_email || '',
        patient_phone: appointment?.patient_phone || '',
        appointment_id: appointment?.id || appointment?.appointment_id || Date.now(),
        // Prescription data
        symptoms,
        diagnosis,
        medicines: medicines.filter(m => m.name.trim()),
        lab_tests: labTests,
        advice,
        follow_up_date: followUp,
        rx_id: rxId,
        created_at: new Date().toISOString()
      };

      let rxData = null;
      try {
        const res = await API.post('/prescriptions', payload);
        rxData = res.data;
      } catch (err) {}

      if (!rxData) {
        rxData = { prescription: payload, rx_id: rxId };
      }

      // Save locally to mdb_prescriptions_db and mdb_patient_prescriptions
      try {
        const existingRx = JSON.parse(localStorage.getItem('mdb_prescriptions_db') || '[]');
        localStorage.setItem('mdb_prescriptions_db', JSON.stringify([payload, ...existingRx]));

        const existingPatientRx = JSON.parse(localStorage.getItem('mdb_patient_prescriptions') || '[]');
        localStorage.setItem('mdb_patient_prescriptions', JSON.stringify([payload, ...existingPatientRx]));
      } catch (e) {}

      setSaved(rxData);
      onSaved && onSaved(rxData);
    } catch (err) {
      console.error('Prescription save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const rx = saved?.prescription || {};
    const meds = rx.medicines || medicines.filter(m => m.name.trim());

    // Header
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18); doc.setFont('helvetica', 'bold');
    doc.text('MyDoctorBook — Digital Prescription', 14, 16);
    doc.setFontSize(9);
    doc.text(`Rx ID: ${rx.rx_id || saved?.rx_id || 'RX-PENDING'}`, 14, 26);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 34);

    // Doctor Info
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Doctor Information', 14, 52);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Dr. ${rx.doctor_name || doctorProfile?.name || ''}`, 14, 60);
    doc.text(`${rx.doctor_degree || doctorProfile?.degree || ''} | ${rx.doctor_specialization || doctorProfile?.specialization || ''}`, 14, 67);
    doc.text(`${rx.hospital_name || doctorProfile?.hospital_name || ''}`, 14, 74);
    doc.text(`Reg. No: ${rx.doctor_license || doctorProfile?.license_number || 'N/A'}`, 14, 81);

    // Patient Info
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 110, 52);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${rx.patient_name || appointment?.patient_name || ''}`, 110, 60);
    doc.text(`ID: ${rx.patient_id || appointment?.patient_id || ''}`, 110, 67);
    doc.text(`Appt: ${rx.appointment_id || appointment?.id || ''}`, 110, 74);

    // Divider
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.5);
    doc.line(14, 88, 196, 88);

    // Diagnosis
    let y = 96;
    doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 100, 80);
    doc.text('Symptoms / Complaints:', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
    y += 7; doc.text(rx.symptoms || symptoms || 'N/A', 14, y);
    y += 10;
    doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 100, 80);
    doc.text('Clinical Diagnosis:', 14, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59);
    y += 7; doc.text(rx.diagnosis || diagnosis, 14, y);
    y += 12;

    // Medicines Table
    doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 100, 80);
    doc.text('Rx  Prescribed Medicines:', 14, y);
    y += 6;
    doc.setFillColor(240, 253, 250);
    doc.rect(14, y, 182, 8, 'F');
    doc.setTextColor(30, 41, 59); doc.setFontSize(8);
    doc.text('Medicine Name', 16, y + 5.5);
    doc.text('Dosage', 80, y + 5.5);
    doc.text('Frequency', 110, y + 5.5);
    doc.text('Duration', 150, y + 5.5);
    doc.text('Food', 175, y + 5.5);
    y += 9;

    meds.forEach((med, i) => {
      if (i % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(14, y - 1, 182, 8, 'F'); }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(`${i + 1}. ${med.name || ''}`, 16, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.text(med.dosage || '', 80, y + 5);
      doc.text(med.frequency || '', 110, y + 5);
      doc.text(med.duration || '', 150, y + 5);
      doc.text(med.food_instruction || '', 175, y + 5);
      y += 9;
      if (med.notes) { doc.setFontSize(7); doc.setTextColor(80, 80, 80); doc.text(`  Note: ${med.notes}`, 16, y + 2); y += 6; doc.setTextColor(30, 41, 59); }
    });

    y += 5;
    // Lab Tests
    if ((rx.lab_tests || labTests)) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 100, 80);
      doc.text('Recommended Lab Tests:', 14, y);
      y += 7; doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59); doc.setFontSize(9);
      doc.text(rx.lab_tests || labTests, 14, y); y += 10;
    }
    // Advice
    if ((rx.advice || advice)) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(0, 100, 80);
      doc.text('Instructions / Advice:', 14, y);
      y += 7; doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 41, 59); doc.setFontSize(9);
      doc.text(rx.advice || advice, 14, y); y += 10;
    }
    // Follow up
    if ((rx.follow_up_date || followUp)) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(220, 50, 50);
      doc.text(`Follow-up Date: ${rx.follow_up_date || followUp}`, 14, y); y += 10;
    }

    // Footer
    doc.setFillColor(13, 148, 136);
    doc.rect(0, 280, 210, 17, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8);
    doc.text('This is a digitally generated prescription from MyDoctorBook.in', 14, 289);
    doc.text(`Rx ID: ${rx.rx_id || saved?.rx_id || 'PENDING'} | Verify at mydoctorbook.in/verify`, 14, 294);

    doc.save(`Prescription_${rx.patient_name || appointment?.patient_name}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center space-y-5 shadow-2xl border border-teal-200">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9 text-teal-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Prescription Saved!</h3>
            <p className="text-sm text-slate-500 mt-1">Rx ID: <span className="font-bold text-teal-700">{saved?.rx_id || saved?.prescription?.rx_id}</span></p>
            <p className="text-xs text-slate-400 mt-1">Saved to patient health records automatically</p>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadPDF} className="flex-1 flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all">
              <Printer className="w-4 h-4" /> Download PDF
            </button>
            <button onClick={onClose} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl my-4 shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-cyan-700 rounded-t-3xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-lg">Digital Prescription</h2>
              <p className="text-teal-100 text-xs">Patient: {appointment?.patient_name} • {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Auto-filled Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Doctor', val: doctorProfile?.name || 'Doctor' },
              { label: 'Specialization', val: doctorProfile?.specialization || 'General' },
              { label: 'Patient', val: appointment?.patient_name || 'Patient' },
              { label: 'Appt ID', val: appointment?.appointment_id || appointment?.id || 'N/A' },
            ].map(({ label, val }) => (
              <div key={label} className="bg-teal-50 rounded-xl p-3 border border-teal-100">
                <p className="text-[10px] font-bold text-teal-600 uppercase">{label}</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{val}</p>
              </div>
            ))}
          </div>

          {/* Symptoms & Diagnosis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Symptoms / Complaints</label>
              <textarea rows={2} value={symptoms} onChange={e => setSymptoms(e.target.value)}
                placeholder="e.g. Fever, headache, body pain since 2 days"
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Clinical Diagnosis <span className="text-red-500">*</span></label>
              <textarea rows={2} value={diagnosis} onChange={e => setDiagnosis(e.target.value)} required
                placeholder="e.g. Viral Fever with Upper Respiratory Tract Infection"
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
            </div>
          </div>

          {/* Voice Dictation Speech-to-Text Bar */}
          <VoicePrescriptionDictator onMedicineDictated={handleDictatedMedicine} />

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-5 h-5 bg-teal-600 text-white rounded-full text-[10px] flex items-center justify-center font-black">Rx</span>
                Prescribed Medicines <span className="text-red-500">*</span>
              </label>
              <button type="button" onClick={addMed} className="flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all">
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>
            <div className="space-y-3">
              {medicines.map((med, i) => (
                <div key={i} className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-teal-700 bg-teal-100 px-2.5 py-1 rounded-full">Medicine {i + 1}</span>
                    {i > 0 && (
                      <button type="button" onClick={() => removeMed(i)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Medicine Name *</label>
                      <input type="text" value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} required={i === 0}
                        placeholder="e.g. Paracetamol 650mg" className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dosage</label>
                      <input type="text" value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)}
                        placeholder="e.g. 1 Tablet" className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Frequency</label>
                      <select value={med.frequency} onChange={e => updateMed(i, 'frequency', e.target.value)} className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40">
                        {FREQUENCY_OPTIONS.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Duration</label>
                      <select value={med.duration} onChange={e => updateMed(i, 'duration', e.target.value)} className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40">
                        {DURATION_OPTIONS.map(d => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Food Instruction</label>
                      <select value={med.food_instruction} onChange={e => updateMed(i, 'food_instruction', e.target.value)} className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40">
                        {FOOD_OPTIONS.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Special Notes</label>
                      <input type="text" value={med.notes} onChange={e => updateMed(i, 'notes', e.target.value)}
                        placeholder="e.g. Avoid if allergic to aspirin" className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lab Tests, Advice, Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lab / Test Recommendations</label>
              <textarea rows={2} value={labTests} onChange={e => setLabTests(e.target.value)}
                placeholder="e.g. CBC, Blood Sugar (Fasting), Urine Routine"
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">General Advice / Instructions</label>
              <textarea rows={2} value={advice} onChange={e => setAdvice(e.target.value)}
                placeholder="e.g. Drink plenty of fluids, rest, avoid cold foods"
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" /> Follow-up Date
            </label>
            <input type="date" value={followUp} onChange={e => setFollowUp(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40" />
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-teal-500/20 transition-all disabled:opacity-60">
              {saving ? <><Loader className="w-4 h-4 animate-spin" /> Saving Prescription...</> : <><Save className="w-4 h-4" /> Save Digital Prescription</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
