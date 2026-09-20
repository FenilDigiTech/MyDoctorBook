import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const KioskContext = createContext();

export const KioskProvider = ({ children }) => {
  const [deviceId] = useState(() => {
    try {
      let id = localStorage.getItem('mdb_device_id');
      if (!id) {
        id = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now();
        localStorage.setItem('mdb_device_id', id);
      }
      return id;
    } catch {
      return 'DEV-DEFAULT-DEVICE';
    }
  });

  const [isDeactivated, setIsDeactivated] = useState(false);
  const [kioskInfo, setKioskInfo] = useState(null);

  useEffect(() => {
    const checkKioskStatus = async () => {
      try {
        const res = await API.get(`/kiosks/status?device_id=${deviceId}`).catch(() => null);
        if (res && res.data) {
          if (res.data.status === 'deactivated') {
            setIsDeactivated(true);
            setKioskInfo(res.data.kiosk || null);
          } else {
            setIsDeactivated(false);
          }
        }
      } catch (err) {
        // Silent fail — maintain current state
      }
    };

    checkKioskStatus();
    const interval = setInterval(checkKioskStatus, 10000); // Poll every 10s for global realtime deactivation

    return () => clearInterval(interval);
  }, [deviceId]);

  return (
    <KioskContext.Provider value={{ deviceId, isDeactivated, kioskInfo }}>
      {isDeactivated ? (
        <div className="fixed inset-0 z-[99999] bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 text-4xl animate-pulse">
            🔒
          </div>
          <div className="max-w-md space-y-2">
            <h1 className="text-2xl font-black text-white">Kiosk Session Deactivated</h1>
            <p className="text-sm text-slate-400">
              This device/kiosk ({kioskInfo?.kiosk_name || 'Kiosk Device'}) has been deactivated globally by the Super Admin.
            </p>
            <p className="text-xs text-red-400 font-mono pt-2">
              Device ID: {deviceId}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
          >
            Check Status Again 🔄
          </button>
        </div>
      ) : (
        children
      )}
    </KioskContext.Provider>
  );
};

export const useKiosk = () => useContext(KioskContext);
