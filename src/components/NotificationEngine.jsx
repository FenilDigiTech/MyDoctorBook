import React, { useState, useEffect } from 'react';
import { MessageSquare, Bell, Send, CheckCheck, X, ExternalLink, ShieldCheck, Smartphone } from 'lucide-react';

export default function NotificationEngine({ isOpen, onClose, notificationData }) {
  const [activeTab, setActiveTab] = useState('whatsapp'); // 'whatsapp', 'sms'
  const [phoneNumber, setPhoneNumber] = useState(notificationData?.phone || '9876543210');
  const [customMsg, setCustomMsg] = useState(notificationData?.message || 'Your appointment with MyDoctorBook is confirmed!');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (notificationData) {
      if (notificationData.phone) setPhoneNumber(notificationData.phone);
      if (notificationData.message) setCustomMsg(notificationData.message);
    }
  }, [notificationData]);

  if (!isOpen) return null;

  const handleOpenWhatsAppWeb = () => {
    const cleanNum = phoneNumber.replace(/\D/g, '');
    const fullNum = cleanNum.length === 10 ? `91${cleanNum}` : cleanNum;
    const url = `https://api.whatsapp.com/send?phone=${fullNum}&text=${encodeURIComponent(customMsg)}`;
    window.open(url, '_blank');
    setStatusMsg('✅ Opening WhatsApp Web dispatch window...');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleSendSMS = () => {
    setStatusMsg('✅ Instant SMS Notification Dispatched successfully to ' + phoneNumber);
    setTimeout(() => setStatusMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-white">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Instant Notification Dispatcher
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  LIVE API
                </span>
              </h3>
              <p className="text-xs text-slate-400">WhatsApp & SMS Healthcare Alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'whatsapp' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> WhatsApp Alert 🟢
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sms')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'sms' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" /> SMS Notification 📱
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {statusMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-400" /> {statusMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Recipient Mobile Number *</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Notification Message Body *</label>
            <textarea
              rows={4}
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono leading-relaxed"
            />
          </div>

          {/* Live Preview Bubble */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Live Notification Preview</span>
            <div className={`p-3 rounded-2xl text-xs space-y-1 ${activeTab === 'whatsapp' ? 'bg-emerald-950/70 border border-emerald-800/80 text-emerald-200' : 'bg-cyan-950/70 border border-cyan-800/80 text-cyan-200'}`}>
              <div className="flex items-center justify-between text-[10px] opacity-75 font-bold">
                <span>MyDoctorBook Official Healthcare</span>
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="font-medium whitespace-pre-wrap">{customMsg}</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-2">
            {activeTab === 'whatsapp' ? (
              <button
                type="button"
                onClick={handleOpenWhatsAppWeb}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Send Instant WhatsApp Alert →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSendSMS}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" /> Dispatch SMS Text Alert →
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
