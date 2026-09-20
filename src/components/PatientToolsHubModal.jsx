import React from 'react';
import { Sparkles, Bot, Activity, FlaskConical, Apple, Camera, Dna, Wind, Heart, Users, CreditCard, Bell, Lock, X, ChevronRight } from 'lucide-react';

export default function PatientToolsHubModal({ isOpen, onClose, onOpenTool }) {
  if (!isOpen) return null;

  const toolCategories = [
    {
      category: '🤖 AI Diagnostic & Health Intelligence',
      tools: [
        {
          id: 'aiSymptom',
          name: 'AI Health Bot & Symptom Checker',
          desc: 'Instant AI symptom analysis & triage guide',
          icon: Bot,
          gradient: 'from-purple-600 to-indigo-600',
          badge: 'AI BOT'
        },
        {
          id: 'secondOpinion',
          name: 'AI Second Opinion Assistant',
          desc: 'Multi-specialty diagnosis evaluation & insights',
          icon: Sparkles,
          gradient: 'from-violet-600 to-purple-700',
          badge: '2ND OPINION'
        },
        {
          id: 'geneticRisk',
          name: 'Genetic Disease Risk Predictor',
          desc: 'Multi-generational family history risk calculator',
          icon: Dna,
          gradient: 'from-purple-600 to-cyan-600',
          badge: 'GENETICS'
        },
        {
          id: 'dietPlanner',
          name: 'AI Smart Diet Planner',
          desc: 'Personalized clinical meal & nutrition plan',
          icon: Apple,
          gradient: 'from-orange-600 via-amber-600 to-yellow-600',
          badge: 'NUTRITION'
        }
      ]
    },
    {
      category: '🩺 Clinical Vitals & Lab Tools',
      tools: [
        {
          id: 'vitals',
          name: 'Live Vitals & BMI Tracker',
          desc: 'Log Blood Pressure, Sugar, Pulse, SpO2 & Weight',
          icon: Activity,
          gradient: 'from-emerald-600 to-teal-600',
          badge: 'VITALS'
        },
        {
          id: 'labAnalyzer',
          name: 'AI Lab Report Auto-Analyzer',
          desc: 'Auto-flag abnormal CBC, LFT, KFT & Thyroid values',
          icon: FlaskConical,
          gradient: 'from-emerald-600 to-green-600',
          badge: 'LAB AI'
        },
        {
          id: 'scanner',
          name: 'OCR Prescription Scanner',
          desc: 'Extract dosage & medicines from prescription photo',
          icon: Camera,
          gradient: 'from-violet-600 to-purple-600',
          badge: 'OCR SCAN'
        },
        {
          id: 'abhaLocker',
          name: 'ABHA Health Vault Locker',
          desc: 'Store & encrypt official medical records',
          icon: Lock,
          gradient: 'from-blue-600 to-indigo-600',
          badge: 'ABHA'
        }
      ]
    },
    {
      category: '🧘 Wellness, Family & Emergency Care',
      tools: [
        {
          id: 'mentalWellness',
          name: 'AI Mental Wellness Companion',
          desc: '4-7-8 breathing exercises & anxiety test',
          icon: Wind,
          gradient: 'from-teal-600 to-cyan-600',
          badge: 'WELLNESS'
        },
        {
          id: 'organDonation',
          name: 'Organ Donation Portal',
          desc: 'Pledge organ donation & download donor card',
          icon: Heart,
          gradient: 'from-rose-600 to-red-600',
          badge: 'DONOR CARD'
        },

        {
          id: 'healthCard',
          name: 'Digital Health Card',
          desc: 'QR Code verified digital patient identity card',
          icon: CreditCard,
          gradient: 'from-cyan-600 to-blue-600',
          badge: 'QR CARD'
        },
        {
          id: 'pillReminder',
          name: 'Pill Reminders & Alarms',
          desc: 'Timely dosage alerts & refill notifications',
          icon: Bell,
          gradient: 'from-amber-600 to-orange-600',
          badge: 'REMINDER'
        }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[90vh]">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg text-white flex items-center gap-2">
                All AI & Healthcare Suite
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  13+ HEALTH TOOLS ✨
                </span>
              </h3>
              <p className="text-xs text-slate-400">Select any futuristic tool to launch instantly</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {toolCategories.map((cat, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {cat.category}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cat.tools.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTool(t.id);
                      }}
                      className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/50 rounded-2xl text-left transition-all group flex items-start justify-between gap-3 shadow-sm hover:shadow-md"
                    >
                      <div className="flex gap-3 items-start">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-r ${t.gradient} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs group-hover:text-purple-300 transition-colors">{t.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{t.desc}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-slate-400 text-xs shrink-0">
          <span>🔒 All tools are secured with end-to-end encryption.</span>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl">
            Close Hub
          </button>
        </div>
      </div>
    </div>
  );
}
