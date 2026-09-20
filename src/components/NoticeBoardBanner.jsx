import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { AlertTriangle, Bell, Info, Sparkles } from 'lucide-react';

export default function NoticeBoardBanner({ doctorId }) {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    if (doctorId) {
      fetchNotices();
    }
  }, [doctorId]);

  const fetchNotices = async () => {
    try {
      const res = await API.get(`/doctors/${doctorId}/notices`);
      setNotices(res.data.notices || []);
    } catch (err) {
      console.error('Error loading notices:', err);
    }
  };

  if (notices.length === 0) return null;

  return (
    <div className="space-y-3 my-4">
      {notices.map((n) => (
        <div
          key={n.id}
          className={`p-4 rounded-2xl border flex items-start space-x-3 shadow-sm ${
            n.badge_type === 'Emergency'
              ? 'bg-red-50 border-red-200 text-red-900'
              : n.badge_type === 'Offer'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="p-2 rounded-xl bg-white/80 shrink-0">
            {n.badge_type === 'Emergency' ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : n.badge_type === 'Offer' ? (
              <Sparkles className="w-5 h-5 text-emerald-600" />
            ) : (
              <Bell className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                n.badge_type === 'Emergency' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'
              }`}>
                {n.badge_type || 'Clinic Notice'}
              </span>
              <h4 className="text-xs font-extrabold">{n.title}</h4>
            </div>
            <p className="text-xs mt-1 font-medium">{n.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
