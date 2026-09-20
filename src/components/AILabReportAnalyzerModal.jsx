import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FlaskConical, Download, RefreshCw, AlertTriangle, CheckCircle2, X, Sparkles, AlertCircle } from 'lucide-react';

const LAB_PANELS = [
  {
    id: 'cbc',
    name: 'CBC — Complete Blood Count',
    icon: '🩸',
    fields: [
      { key: 'hb',       label: 'Hemoglobin (Hb)',     unit: 'g/dL',  normalMin: 12.0, normalMax: 17.5 },
      { key: 'wbc',      label: 'WBC Count',            unit: 'K/µL',  normalMin: 4.0,  normalMax: 11.0 },
      { key: 'platelets',label: 'Platelets',             unit: 'K/µL',  normalMin: 150,  normalMax: 400  },
      { key: 'rbc',      label: 'RBC Count',             unit: 'M/µL',  normalMin: 4.2,  normalMax: 5.8  },
    ]
  },
  {
    id: 'lft',
    name: 'LFT — Liver Function Test',
    icon: '🫀',
    fields: [
      { key: 'sgpt',  label: 'SGPT / ALT',      unit: 'U/L',   normalMin: 7,   normalMax: 56  },
      { key: 'sgot',  label: 'SGOT / AST',      unit: 'U/L',   normalMin: 10,  normalMax: 40  },
      { key: 'tbil',  label: 'Total Bilirubin', unit: 'mg/dL', normalMin: 0.1, normalMax: 1.2 },
      { key: 'alb',   label: 'Albumin',          unit: 'g/dL',  normalMin: 3.5, normalMax: 5.0 },
    ]
  },
  {
    id: 'kft',
    name: 'KFT — Kidney Function Test',
    icon: '🫘',
    fields: [
      { key: 'creat',  label: 'Creatinine',       unit: 'mg/dL', normalMin: 0.6,  normalMax: 1.2  },
      { key: 'urea',   label: 'Blood Urea',        unit: 'mg/dL', normalMin: 7,    normalMax: 20   },
      { key: 'uric',   label: 'Uric Acid',         unit: 'mg/dL', normalMin: 3.5,  normalMax: 7.2  },
      { key: 'egfr',   label: 'eGFR',              unit: 'mL/min',normalMin: 60,   normalMax: 120  },
    ]
  },
  {
    id: 'thyroid',
    name: 'Thyroid — T3 / T4 / TSH',
    icon: '🦋',
    fields: [
      { key: 'tsh',  label: 'TSH',   unit: 'µIU/mL', normalMin: 0.4, normalMax: 4.0  },
      { key: 't3',   label: 'T3',    unit: 'ng/dL',  normalMin: 80,  normalMax: 200  },
      { key: 't4',   label: 'T4',    unit: 'µg/dL',  normalMin: 5.1, normalMax: 14.1 },
    ]
  }
];

function getFlag(value, min, max) {
  if (value === '' || value === null || isNaN(parseFloat(value))) return null;
  const v = parseFloat(value);
  if (v < min) return 'LOW';
  if (v > max) return 'HIGH';
  return 'NORMAL';
}

function getFlagStyle(flag) {
  if (flag === 'NORMAL') return 'text-emerald-400 bg-emerald-950 border-emerald-800';
  if (flag === 'HIGH')   return 'text-red-400 bg-red-950 border-red-800 animate-pulse';
  if (flag === 'LOW')    return 'text-amber-400 bg-amber-950 border-amber-800 animate-pulse';
  return 'text-slate-400';
}

function aiSuggest(results) {
  const suggestions = [];
  results.forEach(panel => {
    panel.fields.forEach(f => {
      if (f.flag === 'HIGH') {
        if (f.key === 'sgpt' || f.key === 'sgot') suggestions.push('Elevated liver enzymes — consider avoiding alcohol, fatty foods; consult Hepatologist.');
        if (f.key === 'creat') suggestions.push('High Creatinine — possible kidney stress; increase water intake, consult Nephrologist.');
        if (f.key === 'wbc')   suggestions.push('Elevated WBC — possible infection or inflammation; consult General Physician.');
        if (f.key === 'tsh')   suggestions.push('High TSH — may indicate Hypothyroidism; consult Endocrinologist for Levothyroxine evaluation.');
        if (f.key === 'uric')  suggestions.push('High Uric Acid — gout risk; reduce red meat, seafood; consult Rheumatologist.');
        if (f.key === 'tbil')  suggestions.push('High Bilirubin — jaundice risk; consult Gastroenterologist urgently.');
      }
      if (f.flag === 'LOW') {
        if (f.key === 'hb')    suggestions.push('Low Hemoglobin — Anemia likely; increase iron-rich foods; consult Hematologist.');
        if (f.key === 'platelets') suggestions.push('Low Platelets — thrombocytopenia risk; avoid blood thinners; consult Hematologist urgently.');
        if (f.key === 'alb')   suggestions.push('Low Albumin — possible malnutrition or liver disease; increase protein intake.');
        if (f.key === 'egfr')  suggestions.push('Low eGFR — reduced kidney filtration; consult Nephrologist immediately.');
        if (f.key === 'tsh')   suggestions.push('Low TSH — may indicate Hyperthyroidism; consult Endocrinologist.');
      }
    });
  });
  if (suggestions.length === 0) suggestions.push('All entered values are within normal reference range. Keep up the healthy lifestyle!');
  return [...new Set(suggestions)];
}

export default function AILabReportAnalyzerModal({ isOpen, onClose, patientData }) {
  const [activePanel, setActivePanel] = useState('cbc');
  const [values, setValues] = useState({});
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  if (!isOpen) return null;

  const currentPanel = LAB_PANELS.find(p => p.id === activePanel);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const results = LAB_PANELS.map(panel => ({
        ...panel,
        fields: panel.fields.map(f => ({
          ...f,
          value: values[f.key] ?? '',
          flag: getFlag(values[f.key], f.normalMin, f.normalMax)
        }))
      }));
      const suggestions = aiSuggest(results);
      setAnalysisResult({ results, suggestions });
      setAnalyzing(false);
    }, 1800);
  };

  const downloadPDF = () => {
    if (!analysisResult) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text('MyDoctorBook.in — AI Lab Report Analysis', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`⚠️ AI Suggestion Only — Not a real medical diagnosis`, 14, 27);
    doc.text(`Patient: ${patientData?.name || 'Patient'} | Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 33);
    doc.text('─'.repeat(70), 14, 39);

    let y = 48;
    analysisResult.results.forEach(panel => {
      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text(`${panel.icon} ${panel.name}`, 14, y);
      y += 8;
      panel.fields.forEach(f => {
        if (f.value === '' || f.value === null) return;
        const flagText = f.flag === 'NORMAL' ? '✓ Normal' : f.flag === 'HIGH' ? '↑ HIGH' : '↓ LOW';
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text(`  • ${f.label}: ${f.value} ${f.unit}  [${flagText}]`, 14, y);
        y += 7;
      });
      y += 4;
    });

    doc.setFontSize(12);
    doc.setTextColor(147, 51, 234);
    doc.text('AI Health Suggestions:', 14, y);
    y += 8;
    analysisResult.suggestions.forEach(s => {
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      const lines = doc.splitTextToSize(`• ${s}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 6 + 3;
    });

    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(217, 119, 6);
    doc.text('⚠️ DISCLAIMER: This is an AI-generated suggestion only. Consult a qualified doctor for medical diagnosis.', 14, y);

    doc.save('AI_Lab_Report_Analysis.pdf');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[92vh]">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-emerald-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                AI Lab Report Auto-Analyzer
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  AI ANALYSIS 🧪
                </span>
              </h3>
              <p className="text-xs text-slate-400">Enter CBC / LFT / KFT / Thyroid values → AI flags abnormal results</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">

          {/* AI Suggestion Disclaimer */}
          <div className="p-3 bg-amber-950/80 border border-amber-500/50 rounded-xl flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200 text-[11px] leading-relaxed">
              <strong>⚠️ AI Suggestion Only (આ માત્ર AI સજેસ્ચન છે):</strong> આ ટૂલ ફક્ત Reference Range ના આધારે AI Flag ઊઠાવે છે. આ Real Medical Lab Diagnosis નથી. ચોક્કસ નિદાન માટે ડૉક્ટરની સલાહ અચૂક લેવી.
            </p>
          </div>

          {!analysisResult ? (
            <>
              {/* Panel Tabs */}
              <div className="flex gap-2 flex-wrap">
                {LAB_PANELS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePanel(p.id)}
                    className={`px-3.5 py-2 rounded-xl font-bold text-xs border transition-all ${
                      activePanel === p.id
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-emerald-600'
                    }`}
                  >
                    {p.icon} {p.name.split('—')[0].trim()}
                  </button>
                ))}
              </div>

              {/* Active Panel Fields */}
              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
                <h4 className="font-black text-emerald-300 text-xs">{currentPanel.icon} {currentPanel.name}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {currentPanel.fields.map(f => {
                    const flag = getFlag(values[f.key], f.normalMin, f.normalMax);
                    return (
                      <div key={f.key} className="space-y-1">
                        <label className="font-bold text-slate-300 block">{f.label}</label>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="number"
                            step="0.01"
                            value={values[f.key] ?? ''}
                            onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}
                            placeholder={`${f.normalMin}–${f.normalMax}`}
                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold focus:border-emerald-500 outline-none"
                          />
                          <span className="text-slate-500 font-bold text-[10px] w-12 shrink-0">{f.unit}</span>
                        </div>
                        {flag && (
                          <span className={`inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getFlagStyle(flag)}`}>
                            {flag === 'NORMAL' ? '✓ Normal' : flag === 'HIGH' ? '↑ HIGH' : '↓ LOW'}
                          </span>
                        )}
                        <p className="text-slate-600 text-[10px]">Ref: {f.normalMin}–{f.normalMax} {f.unit}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={analyzing}
                onClick={handleAnalyze}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {analyzing ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> AI Analyzing All Values...</>
                ) : (
                  <><Sparkles className="w-5 h-5 text-white" /> Analyze My Lab Report with AI →</>
                )}
              </button>
            </>
          ) : (
            /* RESULTS */
            <div className="space-y-4 animate-fadeIn">
              {analysisResult.results.map(panel => {
                const flaggedFields = panel.fields.filter(f => f.value !== '' && f.flag !== null);
                if (flaggedFields.length === 0) return null;
                return (
                  <div key={panel.id} className="p-3.5 bg-slate-800 border border-slate-700 rounded-2xl space-y-2">
                    <h4 className="font-black text-emerald-300 text-xs">{panel.icon} {panel.name}</h4>
                    <div className="space-y-1.5">
                      {flaggedFields.map(f => (
                        <div key={f.key} className="flex items-center justify-between gap-2">
                          <span className="text-slate-300 font-medium">{f.label}: <strong className="text-white">{f.value} {f.unit}</strong></span>
                          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${getFlagStyle(f.flag)}`}>
                            {f.flag === 'NORMAL' ? '✓ Normal' : f.flag === 'HIGH' ? '↑ HIGH !' : '↓ LOW !'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* AI Suggestions */}
              <div className="p-4 bg-purple-950/60 border border-purple-500/40 rounded-2xl space-y-2">
                <h4 className="font-black text-purple-300 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> AI Health Suggestions:
                </h4>
                <ul className="space-y-1.5">
                  {analysisResult.suggestions.map((s, i) => (
                    <li key={i} className="flex gap-1.5 items-start text-[11px] text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadPDF}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download AI Lab Report PDF 📄
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisResult(null)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Re-Enter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
