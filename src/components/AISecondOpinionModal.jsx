import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Sparkles, Stethoscope, FileText, Download, RefreshCw, CheckCircle2, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { SIGNATURE_B64 } from './sigBase64';

export default function AISecondOpinionModal({ isOpen, onClose, patientData }) {
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('Type 2 Diabetes with Peripheral Neuropathy');
  const [currentMeds, setCurrentMeds] = useState('Metformin 500mg, Pregabalin 75mg');
  const [symptoms, setSymptoms] = useState('Numbness in toes, evening tiredness, mild dizziness');

  const [analyzing, setAnalyzing] = useState(false);
  const [opinionResult, setOpinionResult] = useState(null);

  if (!isOpen) return null;

  const handleAnalyzeSecondOpinion = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setOpinionResult({
        primaryEvaluation: 'Diagnosis aligns with diabetic sensory neuropathy. Recommended secondary evaluation for B12 deficiency.',
        specialistPerspectives: [
          { specialty: 'Endocrinology', advice: 'Consider adding HbA1c test every 3 months; review Metformin dosage if fasting > 130 mg/dL.' },
          { specialty: 'Neurology', advice: 'Evaluate Vitamin B12 levels & nerve conduction velocity (NCV) study for foot numbness.' },
          { specialty: 'Internal Medicine', advice: 'Ensure annual diabetic retinopathy eye screening & renal function test (KFT).' }
        ],
        recommendedLabTests: ['HbA1c Blood Glucose Test', 'Serum Vitamin B12 Level', 'Kidney Function Test (KFT)']
      });
    }, 2000);
  };

  const downloadSecondOpinionPDF = () => {
    if (!opinionResult) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(147, 51, 234);
      doc.text('MyDoctorBook.in — AI Second Opinion Analysis', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Multi-Specialty Medical Evaluation for ${patientData?.name || 'Patient'}`, 14, 27);
      doc.text('─'.repeat(70), 14, 33);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Primary Diagnosis Evaluated: ${primaryDiagnosis}`, 14, 42);
      doc.text(`Symptoms Noted: ${symptoms}`, 14, 50);

      doc.text('─'.repeat(70), 14, 58);
      doc.setFontSize(12);
      doc.text('Multi-Specialty Perspectives:', 14, 68);

      let y = 78;
      opinionResult.specialistPerspectives.forEach(sp => {
        doc.setFontSize(10);
        doc.setTextColor(147, 51, 234);
        doc.text(`• ${sp.specialty}:`, 14, y);
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(9);
        doc.text(sp.advice, 14, y + 6);
        y += 18;
      });

      doc.text('─'.repeat(70), 14, y);
      y += 10;
      doc.setFontSize(10);
      doc.text(`Recommended Confirmation Tests: ${opinionResult.recommendedLabTests.join(', ')}`, 14, y);

      y += 10;
      doc.setDrawColor(203, 213, 225);
      doc.line(14, y, 196, y);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'italic');
      doc.text('AI Health System Signature:', 14, y + 6);
      try {
        doc.addImage(SIGNATURE_B64, 'PNG', 14, y + 8, 45, 14);
      } catch (e) {}

      doc.setFontSize(8);
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text('⚠️ DISCLAIMER: AI Second Opinion for wellness guidance only. Not a substitute for doctor consultation.', 14, y + 26);

      doc.save(`AI_Second_Opinion_Report.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[90vh]">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border-b border-purple-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                AI Multi-Specialty Second Opinion
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  SECOND OPINION 💬
                </span>
              </h3>
              <p className="text-xs text-slate-400">Multi-Specialist Medical Perspective & Alternative Insights</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">

          {!opinionResult ? (
            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Primary Diagnosis from Doctor *</label>
                <input
                  type="text"
                  value={primaryDiagnosis}
                  onChange={e => setPrimaryDiagnosis(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Current Prescribed Medicines</label>
                <input
                  type="text"
                  value={currentMeds}
                  onChange={e => setCurrentMeds(e.target.value)}
                  placeholder="e.g. Metformin 500mg"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Symptoms Experienced</label>
                <textarea
                  rows={2}
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold resize-none"
                />
              </div>

              <button
                type="button"
                disabled={analyzing}
                onClick={handleAnalyzeSecondOpinion}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-white" /> Consulting Multi-Specialty AI Panel...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-purple-300" /> Generate AI Second Opinion Report →
                  </>
                )}
              </button>
            </div>
          ) : (
            /* RESULTS VIEW */
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-800 border border-purple-500/40 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest block">AI Evaluation Summary</span>
                <p className="text-xs text-white font-medium leading-relaxed">{opinionResult.primaryEvaluation}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-xs text-purple-300 uppercase tracking-wider">Multi-Specialty Perspectives:</h4>
                {opinionResult.specialistPerspectives.map((sp, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl space-y-0.5">
                    <span className="font-bold text-purple-400 block text-xs">{sp.specialty} Department:</span>
                    <p className="text-slate-300 text-[11px]">{sp.advice}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={downloadSecondOpinionPDF}
                  className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download AI Second Opinion PDF 📄
                </button>
                <button type="button" onClick={() => setOpinionResult(null)} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl">Re-Analyze</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
