import React, { useState } from 'react';
import { Activity, Calculator, Heart, Droplets, Scale, CheckCircle2, X, Sparkles, RefreshCw } from 'lucide-react';

export default function HealthCalculatorsModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('bmi'); // 'bmi', 'water', 'calories'

  // BMI State
  const [heightCm, setHeightCm] = useState('170');
  const [weightKg, setWeightKg] = useState('68');
  const [bmiResult, setBmiResult] = useState(null);

  // Water State
  const [waterWeight, setWaterWeight] = useState('68');
  const [waterResult, setWaterResult] = useState(null);

  const calculateBMI = (e) => {
    e.preventDefault();
    const hM = parseFloat(heightCm) / 100;
    const w = parseFloat(weightKg);
    if (!hM || !w) return;

    const bmi = (w / (hM * hM)).toFixed(1);
    let category = 'Normal Weight';
    let color = 'text-emerald-500';

    if (bmi < 18.5) {
      category = 'Underweight';
      color = 'text-amber-500';
    } else if (bmi >= 25 && bmi < 29.9) {
      category = 'Overweight';
      color = 'text-amber-500';
    } else if (bmi >= 30) {
      category = 'Obese';
      color = 'text-red-500';
    }

    setBmiResult({ bmi, category, color });
  };

  const calculateWater = (e) => {
    e.preventDefault();
    const w = parseFloat(waterWeight);
    if (!w) return;

    const liters = (w * 0.033).toFixed(1);
    const glasses = Math.round(liters * 4);
    setWaterResult({ liters, glasses });
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-emerald-500/30 shrink-0">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Interactive Health Suite
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Health & Fitness Calculators
            </h2>
          </div>
        </div>

        {/* Tabs Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-bold space-x-6">
          <button
            onClick={() => setActiveTab('bmi')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'bmi'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            📊 BMI Calculator
          </button>
          <button
            onClick={() => setActiveTab('water')}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === 'water'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            💧 Daily Water Target
          </button>
        </div>

        {/* Tab 1: BMI Calculator */}
        {activeTab === 'bmi' && (
          <form onSubmit={calculateBMI} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Height (in cm) *</label>
                <input
                  type="number"
                  required
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="e.g. 170"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Weight (in kg) *</label>
                <input
                  type="number"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g. 68"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2"
            >
              <Scale className="w-4 h-4" />
              <span>Calculate Body Mass Index (BMI)</span>
            </button>

            {bmiResult && (
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <span className="text-xs text-slate-500 block font-bold">Your BMI Score</span>
                <span className="text-3xl font-black text-slate-900 dark:text-white block">{bmiResult.bmi}</span>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-900 inline-block ${bmiResult.color}`}>
                  Category: {bmiResult.category}
                </span>
              </div>
            )}
          </form>
        )}

        {/* Tab 2: Daily Water Target */}
        {activeTab === 'water' && (
          <form onSubmit={calculateWater} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Body Weight (in kg) *</label>
              <input
                type="number"
                required
                value={waterWeight}
                onChange={(e) => setWaterWeight(e.target.value)}
                placeholder="e.g. 68"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2"
            >
              <Droplets className="w-4 h-4" />
              <span>Calculate Daily Water Target</span>
            </button>

            {waterResult && (
              <div className="p-5 bg-cyan-50 dark:bg-cyan-950/60 rounded-2xl border border-cyan-200 dark:border-cyan-800 text-center space-y-2">
                <span className="text-xs text-cyan-800 dark:text-cyan-300 block font-bold">Recommended Daily Water Intake</span>
                <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 block">{waterResult.liters} Liters</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                  💧 Equivalent to approximately <strong>{waterResult.glasses} glasses</strong> of water daily
                </span>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
