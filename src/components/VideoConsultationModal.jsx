import React, { useState, useEffect } from 'react';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, MessageSquare,
  FileText, ShieldCheck, User, Sparkles, Send, CheckCircle2, X
} from 'lucide-react';

export default function VideoConsultationModal({ isOpen, onClose, consultationData, onIssuePrescription }) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'System', text: '🔒 Encrypted WebRTC Consultation Room Ready. Both participants connected.', time: 'Just now' },
    { sender: 'Doctor', text: 'Hello! I am reviewing your medical history and recent vitals.', time: 'Just now' }
  ]);
  const [newMsg, setNewMsg] = useState('');
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    let timer;
    if (isOpen) {
      timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const handleSendMsg = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    setChatMessages(prev => [...prev, {
      sender: 'You',
      text: newMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-lg animate-fadeIn">
      <div className="bg-slate-900 border border-teal-500/40 rounded-3xl w-full max-w-5xl h-[88vh] overflow-hidden shadow-2xl flex flex-col relative">

        {/* Top Video Header Bar */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0 text-white z-20">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">
                  Teleconsultation Room #{consultationData?.id || 'ROOM-8821'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> HD WebRTC • 256-Bit Encrypted
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Patient: {consultationData?.patient_name || 'Patient'} • Doctor: {consultationData?.doctor_name || 'Dr. Specialist'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-teal-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {formatTime(callDuration)}
            </div>

            {onIssuePrescription && (
              <button
                type="button"
                onClick={onIssuePrescription}
                className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-purple-200" />
                Issue Prescription 📝
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-red-950 hover:bg-red-900 text-red-300 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Main Body (Grid + Chat Drawer) */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* Main Doctor & Self Video Feed */}
          <div className="flex-1 bg-slate-950 relative flex items-center justify-center p-4 overflow-hidden">

            {/* Doctor Primary Stream */}
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center shadow-inner">
              {videoOn ? (
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-24 h-24 rounded-3xl bg-teal-600/30 border-2 border-teal-400 flex items-center justify-center text-teal-200 mx-auto shadow-2xl animate-pulse">
                      <User className="w-12 h-12" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">{consultationData?.doctor_name || 'Dr. Specialist'}</h3>
                      <p className="text-xs text-teal-400 font-semibold">Live Video Consultation Connected</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 text-slate-500">
                  <VideoOff className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-xs font-bold">Doctor Camera Paused</p>
                </div>
              )}

              {/* Doctor Name Badge */}
              <div className="absolute bottom-4 left-4 px-3.5 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-xl text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {consultationData?.doctor_name || 'Dr. Specialist'}
              </div>
            </div>

            {/* Self Video Stream PIP (Picture-In-Picture Overlay) */}
            <div className="absolute top-8 right-8 w-44 h-32 rounded-2xl bg-slate-800 border-2 border-teal-500/60 shadow-2xl overflow-hidden flex items-center justify-center z-10">
              <div className="text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-slate-700 text-teal-300 flex items-center justify-center mx-auto text-xs font-black">
                  YOU
                </div>
                <span className="text-[10px] font-bold text-slate-300 block">Self Camera</span>
              </div>
              <div className="absolute bottom-2 left-2 text-[9px] font-extrabold px-2 py-0.5 bg-black/60 text-emerald-400 rounded-md">
                1080p HD
              </div>
            </div>

          </div>

          {/* In-Call Chat Drawer (Toggleable) */}
          {chatOpen && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 text-white animate-slideInRight">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <h4 className="font-extrabold text-xs text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-400" /> In-Call Consultation Chat
                </h4>
                <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl text-xs space-y-1 ${
                      msg.sender === 'You'
                        ? 'bg-teal-900/60 border border-teal-700/60 ml-4'
                        : msg.sender === 'System'
                        ? 'bg-slate-800/60 border border-slate-700 text-slate-400 text-[11px]'
                        : 'bg-purple-900/60 border border-purple-700/60 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-75 font-bold">
                      <span>{msg.sender}</span>
                      <span>{msg.time}</span>
                    </div>
                    <p className="font-medium leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMsg} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                />
                <button type="submit" className="p-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-4 shrink-0 z-20">
          <button
            type="button"
            onClick={() => setMicOn(!micOn)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-950 text-red-400 border border-red-800'
            }`}
          >
            {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => setVideoOn(!videoOn)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              videoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-950 text-red-400 border border-red-800'
            }`}
          >
            {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => setScreenSharing(!screenSharing)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              screenSharing ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setChatOpen(!chatOpen)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative ${
              chatOpen ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            {chatMessages.length > 2 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-white text-[10px] font-bold flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95 ml-4"
          >
            <PhoneOff className="w-4 h-4" /> End Call
          </button>
        </div>

      </div>
    </div>
  );
}
