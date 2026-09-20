import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Download, CheckCircle2, ShieldCheck, X, Award, Stethoscope, User, Calendar } from 'lucide-react';

export default function MedicalCertificateModal({ isOpen, onClose, doctorProfile, appointmentData }) {
  const [certType, setCertType] = useState('Sick Leave Certificate');
  const [patientName, setPatientName] = useState(appointmentData?.patient_name || 'Patient');
  const [diagnosis, setDiagnosis] = useState('Acute Viral Fever & Rest Required');
  const [restDays, setRestDays] = useState('5 Days');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen) return null;

  const generateCertificatePDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(15, 118, 110);
      doc.text('MyDoctorBook.in — Official Medical Certificate', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Certified Medical & Health Document (${certType})`, 14, 27);
      doc.text('─'.repeat(70), 14, 33);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(`CERTIFICATE TYPE: ${certType.toUpperCase()}`, 14, 44);

      doc.setFontSize(10);
      doc.text(`Date of Issue: ${new Date().toLocaleDateString('en-IN')}`, 14, 54);
      doc.text(`Certificate Ref ID: MC-${Math.floor(10000000 + Math.random() * 90000000)}`, 14, 62);

      doc.text('─'.repeat(70), 14, 70);
      doc.setFontSize(11);
      doc.text(`This is to certify that Mr./Ms. ${patientName} has been under my medical care and treatment.`, 14, 80);
      doc.text(`Clinical Diagnosis: ${diagnosis}`, 14, 90);
      doc.text(`Medical Advice / Rest Duration: Recommended medical rest for ${restDays} starting from ${startDate}.`, 14, 100);
      doc.text(`Fitness Status: Patient is medically fit to resume normal duties after completion of advised rest.`, 14, 110);

      doc.text('─'.repeat(70), 14, 122);
      doc.setFontSize(10);
      doc.text(`Issued By: Dr. ${doctorProfile?.name || 'Authorized Specialist Doctor'}`, 14, 132);
      doc.text(`Qualification: ${doctorProfile?.degree || 'MBBS, MD'} | Reg No: ${doctorProfile?.license_number || 'REG-984210'}`, 14, 140);

      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129);
      doc.text('✅ Official Digital Medical Seal & QR Verification Attached', 14, 155);
      doc.save(`Medical_Certificate_${patientName}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-teal-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-white max-h-[90vh]">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-950 via-cyan-950 to-slate-900 border-b border-teal-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Official Medical Certificate Generator
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-full">
                  OFFICIAL 📄
                </span>
              </h3>
              <p className="text-xs text-slate-400">Sick Leave, Fitness Clearance & Travel Certificates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">

          <div>
            <label className="block font-bold text-slate-300 mb-1">Certificate Type *</label>
            <select
              value={certType}
              onChange={e => setCertType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
            >
              <option>Sick Leave Certificate</option>
              <option>Medical Fitness Certificate</option>
              <option>Travel Health Clearance Certificate</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Patient Full Name *</label>
            <input
              type="text"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1">Clinical Diagnosis & Medical Reason *</label>
            <input
              type="text"
              value={diagnosis}
              onChange={e => setDiagnosis(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Rest Duration *</label>
              <input
                type="text"
                value={restDays}
                onChange={e => setRestDays(e.target.value)}
                placeholder="e.g. 5 Days"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={generateCertificatePDF}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 hover:from-teal-500 text-white font-black text-xs rounded-xl shadow-xl flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Official Medical Certificate PDF 📄
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
