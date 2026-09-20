import React from 'react';
import { Calendar, Stethoscope, FileText, Activity, ShieldCheck, Pill, Syringe, AlertTriangle, Eye } from 'lucide-react';

export default function HealthTimeline({ events = [], onViewItem }) {
  // Sort events newest to oldest
  const sortedEvents = [...events].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

  const getEventStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'prescription':
      case 'digital prescription':
        return { icon: FileText, color: 'bg-teal-500 text-white', badge: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'lab report':
      case 'lab test':
        return { icon: Activity, color: 'bg-purple-500 text-white', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'consultation':
      case 'doctor visit':
        return { icon: Stethoscope, color: 'bg-blue-500 text-white', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'vaccination':
        return { icon: Syringe, color: 'bg-emerald-500 text-white', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'allergy':
        return { icon: AlertTriangle, color: 'bg-amber-500 text-white', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'medication':
        return { icon: Pill, color: 'bg-pink-500 text-white', badge: 'bg-pink-50 text-pink-700 border-pink-200' };
      default:
        return { icon: ShieldCheck, color: 'bg-slate-600 text-white', badge: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  if (sortedEvents.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto space-y-3">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">No Health Records Timeline Yet</h3>
        <p className="text-xs text-slate-500">Your doctor consultations, prescriptions, lab reports, and uploaded documents will automatically build your lifetime health timeline here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900">Health Journey Timeline</h3>
          <p className="text-xs text-slate-500">Chronological history of all your consultations, prescriptions & lab reports</p>
        </div>
        <span className="text-xs font-bold bg-teal-100 text-teal-800 px-3 py-1 rounded-full">
          {sortedEvents.length} Medical Events
        </span>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {sortedEvents.map((evt, idx) => {
          const style = getEventStyle(evt.type || evt.record_type);
          const Icon = style.icon;
          const evtDate = evt.date || evt.record_date || evt.created_at?.split('T')[0] || 'N/A';

          return (
            <div key={evt.id || idx} className="relative group">
              {/* Timeline Dot Icon */}
              <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full ${style.color} flex items-center justify-center shadow-md ring-4 ring-white`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>

              {/* Card Content */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${style.badge}`}>
                      {evt.type || evt.record_type || 'Health Event'}
                    </span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {evtDate}
                    </span>
                  </div>
                  {evt.rx_id && (
                    <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {evt.rx_id}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-extrabold text-slate-900">{evt.title || evt.record_name || evt.diagnosis || 'Medical Record'}</h4>
                {evt.subtitle || evt.doctor_name || evt.details?.doctor ? (
                  <p className="text-xs text-slate-600 font-semibold">
                    👨‍⚕️ Doctor: {evt.doctor_name || evt.details?.doctor}
                  </p>
                ) : null}

                {evt.description || evt.notes || evt.diagnosis ? (
                  <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {evt.description || evt.notes || `Diagnosis: ${evt.diagnosis}`}
                  </p>
                ) : null}

                {evt.medicines && Array.isArray(evt.medicines) && evt.medicines.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Prescribed Medicines ({evt.medicines.length})</p>
                    <div className="flex flex-wrap gap-1.5">
                      {evt.medicines.map((m, mIdx) => (
                        <span key={mIdx} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          💊 {m.name} ({m.dosage || m.frequency})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {onViewItem && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onViewItem(evt)}
                      className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
