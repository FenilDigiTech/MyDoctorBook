import React, { useState, useEffect, useRef } from 'react';
import { Heart, Wind, Sparkles, Activity, ShieldCheck, X, Play, Pause, RotateCcw, AlertTriangle } from 'lucide-react';
import { SIGNATURE_B64 } from './sigBase64';

export default function AIMentalWellnessModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('breathing'); // 'breathing' | 'anxietyTest' | 'chat'
  
  // 4-7-8 Breathing State
  const [isBreathingRunning, setIsBreathingRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState('Inhale'); // 'Inhale' (4s) | 'Hold' (7s) | 'Exhale' (8s)
  const [phaseTimer, setPhaseTimer] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Anxiety Test State
  const [answers, setAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);

  // Breathing Loop Effect
  useEffect(() => {
    let interval = null;
    if (isBreathingRunning) {
      interval = setInterval(() => {
        setPhaseTimer((prev) => {
          if (prev > 1) return prev - 1;
          
          // Phase transitions
          if (breathPhase === 'Inhale') {
            setBreathPhase('Hold');
            return 7;
          } else if (breathPhase === 'Hold') {
            setBreathPhase('Exhale');
            return 8;
          } else {
            setBreathPhase('Inhale');
            setCompletedCycles((c) => c + 1);
            return 4;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathingRunning, breathPhase]);

  if (!isOpen) return null;

  const handleResetBreathing = () => {
    setIsBreathingRunning(false);
    setBreathPhase('Inhale');
    setPhaseTimer(4);
    setCompletedCycles(0);
  };

  const questions = [
    { id: 1, text: 'Feeling nervous, anxious, or on edge?' },
    { id: 2, text: 'Not being able to stop or control worrying?' },
    { id: 3, text: 'Trouble relaxing or feeling restless?' },
    { id: 4, text: 'Feeling afraid, as if something awful might happen?' },
    { id: 5, text: 'Feeling tired or having low energy due to mental stress?' }
  ];

  const calculateAnxietyScore = () => {
    let score = 0;
    Object.values(answers).forEach(val => { score += parseInt(val || 0); });
    let level = 'Minimal / Normal Stress';
    let color = 'text-emerald-400';
    let tip = 'Your mental stress levels appear well-balanced. Keep practicing daily mindfulness!';

    if (score >= 10) {
      level = 'High Stress & Anxiety Alert';
      color = 'text-red-400';
      tip = 'High anxiety detected. We recommend 4-7-8 breathing exercises & consulting a specialist.';
    } else if (score >= 5) {
      level = 'Moderate Stress';
      color = 'text-amber-400';
      tip = 'Moderate stress noted. Daily 4-7-8 breathing and relaxation routines are beneficial.';
    }

    setTestResult({ score, level, color, tip });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-cyan-950 via-teal-950 to-slate-900 border-b border-cyan-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Wind className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                AI Mental Wellness Companion
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  4-7-8 BREATHING & ANXIETY TEST
                </span>
              </h3>
              <p className="text-xs text-slate-400">Mindfulness Exercises, Stress Self-Assessment & Relaxation Guide</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="p-3 bg-slate-950 border-b border-slate-800 grid grid-cols-2 gap-2 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('breathing')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'breathing' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wind className="w-4 h-4" /> 4-7-8 Breathing Exercise
          </button>
          <button
            onClick={() => setActiveTab('anxietyTest')}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'anxietyTest' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Anxiety & Stress Test
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {activeTab === 'breathing' && (
            <div className="space-y-6 text-center">
              <div className="p-4 bg-slate-800/60 border border-cyan-500/20 rounded-2xl">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">How 4-7-8 Breathing Works:</span>
                <p className="text-xs text-slate-300 mt-1">
                  Inhale through nose for <strong>4s</strong> → Hold breath for <strong>7s</strong> → Exhale slowly through mouth for <strong>8s</strong>.
                </p>
              </div>

              {/* Animated Circle */}
              <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border-4 transition-all duration-1000 ${
                    breathPhase === 'Inhale'
                      ? 'border-cyan-400 bg-cyan-500/20 scale-110'
                      : breathPhase === 'Hold'
                      ? 'border-amber-400 bg-amber-500/20 scale-105 animate-pulse'
                      : 'border-emerald-400 bg-emerald-500/10 scale-95'
                  }`}
                />
                <div className="relative z-10 space-y-1">
                  <span className="text-xs font-extrabold uppercase text-slate-400 tracking-widest block">{breathPhase}</span>
                  <span className="text-5xl font-black text-white">{phaseTimer}s</span>
                  <span className="text-[10px] font-bold text-cyan-300 block">Cycles Completed: {completedCycles}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsBreathingRunning(!isBreathingRunning)}
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                  {isBreathingRunning ? <><Pause className="w-4 h-4" /> Pause Exercise</> : <><Play className="w-4 h-4 fill-white" /> Start 4-7-8 Breathing</>}
                </button>
                <button
                  onClick={handleResetBreathing}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                  title="Reset Exercise"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'anxietyTest' && (
            <div className="space-y-5">
              {!testResult ? (
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-cyan-300 uppercase tracking-wider">Quick Stress & Anxiety Assessment:</h4>
                  {questions.map((q) => (
                    <div key={q.id} className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2 text-xs">
                      <p className="font-bold text-white">{q.id}. {q.text}</p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['Not at all (0)', 'Several days (1)', 'More than half (2)', 'Nearly every day (3)'].map((opt, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all ${
                              answers[q.id] === idx
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={calculateAnxietyScore}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-black text-xs rounded-xl shadow-lg"
                  >
                    Calculate Anxiety & Stress Score →
                  </button>
                </div>
              ) : (
                <div className="space-y-4 p-5 bg-slate-800 border border-cyan-500/40 rounded-2xl text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase block">Assessment Result</span>
                  <h3 className={`text-xl font-black ${testResult.color}`}>{testResult.level}</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">{testResult.tip}</p>
                  <button
                    onClick={() => setTestResult(null)}
                    className="px-4 py-2 bg-slate-900 text-xs font-bold text-slate-300 rounded-xl hover:bg-slate-950"
                  >
                    Re-Take Test
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Signature & AI Disclaimer */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 shrink-0 mt-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">AI System Signature</span>
                <img src={SIGNATURE_B64} alt="F. B. Patel Signature" className="h-9 object-contain mt-1 filter invert drop-shadow" />
                <span className="text-xs font-black text-white block mt-0.5">F. B. Patel.</span>
              </div>
              <span className="text-[10px] px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-full font-bold inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> VERIFIED AI HEALTH ASSISTANT
              </span>
            </div>

            <div className="p-2.5 bg-amber-950/40 border border-amber-800/40 rounded-xl text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">⚠️ DISCLAIMER:</strong> This Mental Wellness Companion & 4-7-8 Breathing Guide is provided by AI Health Intelligence for wellness support only. It is <strong>NOT a substitute for professional clinical medical advice or doctor treatment</strong>.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
