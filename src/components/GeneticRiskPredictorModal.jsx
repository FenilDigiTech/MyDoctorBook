import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Dna, ShieldCheck, Heart, AlertTriangle, Download, RefreshCw, X, CheckCircle2, Activity } from 'lucide-react';

export default function GeneticRiskPredictorModal({ isOpen, onClose, patientData }) {
  const [fatherHistory, setFatherHistory] = useState(['Diabetes Type 2']);
  const [motherHistory, setMotherHistory] = useState(['Hypertension']);
  const [grandparentsHistory, setGrandparentsHistory] = useState(['Cardiovascular Heart Disease']);
  const [lifestyle, setLifestyle] = useState({ smoker: false, active: true, age: '34', bmi: '24.2' });

  const [calculating, setCalculating] = useState(false);
  const [riskResult, setRiskResult] = useState(null);

  if (!isOpen) return null;

  const toggleCondition = (setter, list, item) => {
    if (list.includes(item)) {
      setter(list.filter(i => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleCalculateRisk = () => {
    setCalculating(true);
    setTimeout(() => {
      let diabetesScore = 15;
      let heartScore = 12;
      let bpScore = 18;

      if (fatherHistory.includes('Diabetes Type 2')) diabetesScore += 35;
      if (motherHistory.includes('Diabetes Type 2')) diabetesScore += 35;
      if (grandparentsHistory.includes('Diabetes Type 2')) diabetesScore += 15;

      if (fatherHistory.includes('Cardiovascular Heart Disease')) heartScore += 30;
      if (motherHistory.includes('Cardiovascular Heart Disease')) heartScore += 30;
      if (grandparentsHistory.includes('Cardiovascular Heart Disease')) heartScore += 20;

      if (fatherHistory.includes('Hypertension')) bpScore += 25;
      if (motherHistory.includes('Hypertension')) bpScore += 25;

      setRiskResult({
        diabetesScore: Math.min(diabetesScore, 92),
        heartScore: Math.min(heartScore, 88),
        bpScore: Math.min(bpScore, 90),
        recommendations: [
          'Schedule annual HbA1c blood glucose screening test',
          'Maintain 30 mins of daily cardio exercise',
          'Monitor Lipid Profile & Blood Pressure every 6 months'
        ]
      });

      setCalculating(false);
    }, 1500);
  };

  const downloadRiskPDF = () => {
    if (!riskResult) return;
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(147, 51, 234);
      doc.text('MyDoctorBook.in — AI Genetic Health Risk Assessment', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Multi-Generational Genetic Risk Report for ${patientData?.name || 'Patient'}`, 14, 27);
      doc.text('─'.repeat(70), 14, 33);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Diabetes Type 2 Genetic Likelihood: ${riskResult.diabetesScore}%`, 14, 42);
      doc.text(`Cardiovascular Heart Disease Risk: ${riskResult.heartScore}%`, 14, 50);
      doc.text(`Hypertension / High BP Risk: ${riskResult.bpScore}%`, 14, 58);

      doc.text('─'.repeat(70), 14, 65);
      doc.setFontSize(12);
      doc.text('Preventive Health Guidelines:', 14, 74);
      doc.setFontSize(10);
      riskResult.recommendations.forEach((r, idx) => {
        doc.text(`• ${r}`, 14, 84 + (idx * 8));
      });

      let y = 84 + (riskResult.recommendations.length * 8) + 6;
      doc.text('─'.repeat(70), 14, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(217, 119, 6);
      doc.text('⚠️ DISCLAIMER: This report is an AI-generated suggestion for informational purposes only.', 14, y);
      doc.text('It is NOT a real diagnostic laboratory DNA test. Please consult a qualified doctor for medical diagnosis.', 14, y + 6);

      doc.save(`Genetic_Risk_Report.pdf`);
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
              <Dna className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Genetic Disease Risk Predictor
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  AI GENETIC 🧬
                </span>
              </h3>
              <p className="text-xs text-slate-400">Multi-Generational Family History Disease Assessment</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">

          {/* AI Disclaimer Banner */}
          <div className="p-3.5 bg-amber-950/90 border border-amber-500/60 rounded-2xl text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-black text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>⚠️ Important Disclaimer: AI Suggestion Only (આ માત્ર AI સજેસ્ચન છે, સાચો મેડિકલ ટેસ્ટ નથી)</span>
            </div>
            <p className="text-[11px] text-amber-200/90 font-medium leading-relaxed">
              આ પરિણામ ફક્ત આપેલા ડેટાના આધારે AI દ્વારા અંદાજિત <strong>સજેસ્ચન (AI Suggestion)</strong> આપે છે. આ કોઈ રિયલ કે સાચો મેડિકલ ડીએનએ/લેબ રિપોર્ટ નથી. ચોક્કસ નિદાન અને સારવાર માટે હંમેશા અનુભવી સ્પેશિયાલિસ્ટ ડૉક્ટરની સલાહ લેવી.
            </p>
          </div>

          {!riskResult ? (
            <div className="space-y-4">
              {/* Father History */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Father Medical History:</label>
                <div className="flex flex-wrap gap-2">
                  {['Diabetes Type 2', 'Cardiovascular Heart Disease', 'Hypertension', 'Thyroid'].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCondition(setFatherHistory, fatherHistory, item)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        fatherHistory.includes(item)
                          ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {fatherHistory.includes(item) ? '✓ ' : '+ '}{item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mother History */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Mother Medical History:</label>
                <div className="flex flex-wrap gap-2">
                  {['Diabetes Type 2', 'Cardiovascular Heart Disease', 'Hypertension', 'Thyroid'].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCondition(setMotherHistory, motherHistory, item)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        motherHistory.includes(item)
                          ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {motherHistory.includes(item) ? '✓ ' : '+ '}{item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grandparents History */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">Grandparents History:</label>
                <div className="flex flex-wrap gap-2">
                  {['Diabetes Type 2', 'Cardiovascular Heart Disease', 'Hypertension'].map(item => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleCondition(setGrandparentsHistory, grandparentsHistory, item)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                        grandparentsHistory.includes(item)
                          ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {grandparentsHistory.includes(item) ? '✓ ' : '+ '}{item}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={calculating}
                onClick={handleCalculateRisk}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {calculating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-white" /> Computing AI Genetic Risk Scores...
                  </>
                ) : (
                  <>
                    <Dna className="w-5 h-5 text-purple-300" /> Calculate AI Genetic Risk Profile →
                  </>
                )}
              </button>
            </div>
          ) : (
            /* RESULTS VIEW */
            <div className="space-y-5 animate-fadeIn">

              <div className="space-y-3">
                <div className="p-4 bg-slate-800 border border-purple-500/40 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-white text-sm">Diabetes Type 2 Genetic Risk:</span>
                    <span className={`font-black text-sm px-2.5 py-0.5 rounded-full ${riskResult.diabetesScore > 50 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                      {riskResult.diabetesScore}% Risk
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                    <div style={{ width: `${riskResult.diabetesScore}%` }} className={`h-full ${riskResult.diabetesScore > 50 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  </div>
                </div>

                <div className="p-4 bg-slate-800 border border-purple-500/40 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-white text-sm">Cardiovascular Heart Disease Risk:</span>
                    <span className={`font-black text-sm px-2.5 py-0.5 rounded-full ${riskResult.heartScore > 50 ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                      {riskResult.heartScore}% Risk
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden">
                    <div style={{ width: `${riskResult.heartScore}%` }} className={`h-full ${riskResult.heartScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={downloadRiskPDF}
                  className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download AI Genetic Risk PDF 📄
                </button>
                <button
                  type="button"
                  onClick={() => setRiskResult(null)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Re-Calculate
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
