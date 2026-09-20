import React from 'react';
import { Gift, Award, CheckCircle2, AlertCircle, Sparkles, TrendingUp } from 'lucide-react';

export function PatientRewardBanner({ completedCount = 0 }) {
  const target = 10;
  const progressPercent = Math.min(Math.round((completedCount / target) * 100), 100);
  const isUnlocked = completedCount >= target;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
      {/* Decorative background circle */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30">
            <Gift className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/30">
                Patient Cashback Offer
              </span>
              <span className="text-xs font-medium text-amber-100">One-Time Special</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">
              Complete 10 Appointments & Get <span className="underline decoration-white/40">₹200 Cashback</span>!
            </h3>
            <p className="text-xs text-amber-100 mt-0.5">
              Automatically track your confirmed visits. Cashback processed upon reaching 10 appointments.
            </p>
          </div>
        </div>

        {/* Progress Display */}
        <div className="bg-black/20 backdrop-blur-md rounded-xl p-3.5 border border-white/20 min-w-[240px]">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-amber-100">Visits Progress</span>
            <span className="text-white bg-white/20 px-2 py-0.5 rounded-md">
              {completedCount} / {target} Completed
            </span>
          </div>

          <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/20">
            <div
              className="bg-gradient-to-r from-yellow-200 to-white h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2 text-[11px] text-amber-100 flex items-center justify-between">
            <span>{isUnlocked ? '🎉 Reward Unlocked!' : `${target - completedCount} visits remaining`}</span>
            <span className="font-semibold text-white">₹200 Cashback</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoctorRewardBanner({ completedCount = 0 }) {
  const milestoneIndex = Math.min(Math.floor(completedCount / 100) + 1, 3);
  const currentTarget = milestoneIndex * 100;
  const progressPercent = Math.min(Math.round((completedCount / currentTarget) * 100), 100);

  return (
    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-5 text-white shadow-lg shadow-teal-600/20 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-white/30">
                Doctor Excellence Reward
              </span>
              <span className="text-xs font-semibold text-emerald-100">Milestone {milestoneIndex}/3</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1">
              Earn <span className="underline decoration-white/40">₹1000 Bonus</span> Every 100 Completed Consultations!
            </h3>
            <p className="text-xs text-emerald-100 mt-1 max-w-xl">
              Complete treatment for 100 confirmed patient appointments to unlock a ₹1000 doctor performance bonus (Up to 3 milestones / Max ₹3000).
            </p>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/20 min-w-[280px]">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="text-emerald-100">Milestone Progress</span>
            <span className="text-white bg-white/20 px-2 py-0.5 rounded-md">
              {completedCount} / {currentTarget} Consultations
            </span>
          </div>

          <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/20">
            <div
              className="bg-gradient-to-r from-emerald-200 to-white h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2.5 pt-2 border-t border-white/10 text-[11px] text-emerald-100">
            <p className="flex items-start gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-yellow-300 shrink-0 mt-0.5" />
              <span>
                <strong>Doctor Notice:</strong> The platform owner may request supporting records or documentation to verify completed appointments before issuing any reward.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
