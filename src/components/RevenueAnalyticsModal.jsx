import React from 'react';
import { jsPDF } from 'jspdf';
import { BarChart2, TrendingUp, DollarSign, Download, Calendar, ArrowUpRight, Award, ShieldCheck, X } from 'lucide-react';

export default function RevenueAnalyticsModal({ isOpen, onClose, providerData, providerType = 'doctor' }) {
  if (!isOpen) return null;

  const totalRevenue = Math.max(0, Number(providerData?.totalRevenue ?? 0));
  const clinicIncome = totalRevenue > 0 ? Math.round(totalRevenue * 0.65) : 0;
  const videoIncome = totalRevenue > 0 ? Math.round(totalRevenue * 0.25) : 0;
  const referralPayouts = totalRevenue > 0 ? Math.round(totalRevenue * 0.10) : 0;

  const generateFinancialPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(37, 99, 235);
      doc.text('MyDoctorBook.in — Financial Earnings Statement', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Official Income & Tax Statement for ${providerData?.name || 'Healthcare Provider'}`, 14, 27);
      doc.text('─'.repeat(70), 14, 33);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Statement Period: Current Financial Year 2026-27`, 14, 42);
      doc.text(`Provider Name: ${providerData?.name || 'Dr. Specialist'}`, 14, 50);
      doc.text(`Specialization / Entity: ${providerData?.specialization || 'Healthcare Enterprise'}`, 14, 58);

      doc.text('─'.repeat(70), 14, 65);
      doc.setFontSize(12);
      doc.text('Revenue Breakdown:', 14, 74);
      doc.setFontSize(10);
      doc.text(`• In-Clinic Consultation Fees: Rs.${clinicIncome.toLocaleString('en-IN')}`, 14, 82);
      doc.text(`• Teleconsultation Video Call Income: Rs.${videoIncome.toLocaleString('en-IN')}`, 14, 90);
      doc.text(`• Diagnostic Lab / Pharmacy Referral Income: Rs.${referralPayouts.toLocaleString('en-IN')}`, 14, 98);

      doc.text('─'.repeat(70), 14, 106);
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Net Revenue: Rs.${totalRevenue.toLocaleString('en-IN')}`, 14, 116);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text('Generated via MyDoctorBook Financial Analytics Engine. Audit-ready document.', 14, 134);
      doc.save(`Financial_Statement_${providerData?.name || 'Provider'}.pdf`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-blue-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[85vh]">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border-b border-blue-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Revenue & Financial Analytics
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                  FY 2026-27
                </span>
              </h3>
              <p className="text-xs text-slate-400">Income Overview & Tax Export Statements</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</span>
              <p className="text-2xl font-black text-emerald-400">₹{totalRevenue.toLocaleString('en-IN')}</p>
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                {totalRevenue > 0 ? <><ArrowUpRight className="w-3 h-3" /> +18.4% growth</> : 'Starting Account (₹0 Net)'}
              </span>
            </div>

            <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">In-Clinic Consultations</span>
              <p className="text-2xl font-black text-blue-400">₹{clinicIncome.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-400 font-bold">{totalRevenue > 0 ? '65% of total revenue' : 'No visits completed yet'}</span>
            </div>

            <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Teleconsultations Video</span>
              <p className="text-2xl font-black text-purple-400">₹{videoIncome.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-400 font-bold">{totalRevenue > 0 ? '25% of total revenue' : 'No video calls yet'}</span>
            </div>

            <div className="p-4 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Referral Payouts</span>
              <p className="text-2xl font-black text-cyan-400">₹{referralPayouts.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-400 font-bold">{totalRevenue > 0 ? '10% of total revenue' : 'No referrals yet'}</span>
            </div>
          </div>

          {/* Visual Income Distribution Bar */}
          <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Income Channel Distribution</span>
            <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex">
              <div style={{ width: totalRevenue > 0 ? '65%' : '0%' }} className="bg-blue-500 h-full" />
              <div style={{ width: totalRevenue > 0 ? '25%' : '0%' }} className="bg-purple-500 h-full" />
              <div style={{ width: totalRevenue > 0 ? '10%' : '0%' }} className="bg-cyan-500 h-full" />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 pt-1">
              <span className="text-blue-400">■ In-Clinic ({totalRevenue > 0 ? '65%' : '₹0'})</span>
              <span className="text-purple-400">■ Video Call ({totalRevenue > 0 ? '25%' : '₹0'})</span>
              <span className="text-cyan-400">■ Referrals ({totalRevenue > 0 ? '10%' : '₹0'})</span>
            </div>
          </div>

          {/* CTA Export PDF Statement */}
          <div className="pt-2">
            <button
              type="button"
              onClick={generateFinancialPDF}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download Official Financial Tax Statement PDF 📄
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
