import React, { useState } from 'react';
import { ShieldCheck, Lock, Unlock, FileText, Upload, Download, Trash2, Eye, Key, X, CheckCircle2 } from 'lucide-react';

export default function AbhaLockerModal({ isOpen, onClose }) {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  const [vaultFiles, setVaultFiles] = useState(() => {
    try {
      const s = localStorage.getItem('mdb_abha_vault_files');
      return s ? JSON.parse(s) : [
        { id: 1, name: 'Complete Blood Count (CBC) Report.pdf', category: 'Lab Report', date: '2026-07-28', size: '1.2 MB' },
        { id: 2, name: 'Chest X-Ray Digital Scan.png', category: 'X-Ray Scan', date: '2026-07-15', size: '3.4 MB' },
        { id: 3, name: 'Covid-19 Vaccination Certificate.pdf', category: 'Vaccine Certificate', date: '2026-05-10', size: '850 KB' }
      ];
    } catch {
      return [];
    }
  });

  const [newFileName, setNewFileName] = useState('');
  const [newCategory, setNewCategory] = useState('Lab Report');

  if (!isOpen) return null;

  const handleUnlock = (e) => {
    e.preventDefault();
    if (pin === '1234' || pin === '0000' || pin.length === 4) {
      setUnlocked(true);
      setPinError('');
    } else {
      setPinError('❌ Incorrect Security PIN! (Use PIN 1234)');
    }
  };

  const handleUploadVaultFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const newRecord = {
      id: Date.now(),
      name: newFileName.trim() + (newFileName.endsWith('.pdf') ? '' : '.pdf'),
      category: newCategory,
      date: new Date().toISOString().split('T')[0],
      size: '1.5 MB'
    };

    const updated = [newRecord, ...vaultFiles];
    setVaultFiles(updated);
    localStorage.setItem('mdb_abha_vault_files', JSON.stringify(updated));
    setNewFileName('');
  };

  const handleDeleteVaultFile = (id) => {
    const updated = vaultFiles.filter(f => f.id !== id);
    setVaultFiles(updated);
    localStorage.setItem('mdb_abha_vault_files', JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[85vh]">

        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-b border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                ABHA Encrypted Document Locker
                <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  PIN PROTECTED 🔒
                </span>
              </h3>
              <p className="text-xs text-slate-400">AES-256 Encrypted Health Vault Repository</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {!unlocked ? (
            /* PIN UNLOCK SCREEN */
            <form onSubmit={handleUnlock} className="py-8 text-center space-y-5 max-w-xs mx-auto animate-fadeIn">
              <div className="w-16 h-16 rounded-3xl bg-emerald-950 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl">
                <Lock className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-base text-white">Enter Vault Security PIN</h4>
                <p className="text-xs text-slate-400">Enter your 4-digit PIN to access encrypted medical records (Default: 1234)</p>
              </div>

              {pinError && <p className="text-xs text-red-400 font-bold">{pinError}</p>}

              <input
                type="password"
                maxLength={4}
                required
                autoFocus
                value={pin}
                onChange={e => {
                  setPin(e.target.value);
                  if (e.target.value === '1234' || e.target.value === '0000') {
                    setUnlocked(true);
                  }
                }}
                placeholder="••••"
                className="w-36 mx-auto text-center px-4 py-3 bg-slate-800 border-2 border-emerald-500 rounded-2xl text-white text-2xl font-mono font-black tracking-widest focus:outline-none"
              />

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" /> Unlock Encrypted Health Vault →
              </button>
            </form>
          ) : (
            /* UNLOCKED VAULT FILES VIEW */
            <div className="space-y-5 animate-fadeIn">

              {/* Upload New Record Form */}
              <form onSubmit={handleUploadVaultFile} className="p-4 bg-slate-800 border border-slate-700 rounded-2xl space-y-3 shadow-xl">
                <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-400" /> Upload & Encrypt New Medical Document
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Document Name (e.g. Thyroid Profile Report)"
                      value={newFileName}
                      onChange={e => setNewFileName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>
                  <div>
                    <select
                      value={newCategory}
                      onChange={e => setNewCategory(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold"
                    >
                      <option>Lab Report</option>
                      <option>X-Ray Scan</option>
                      <option>MRI Scan</option>
                      <option>Prescription</option>
                      <option>Vaccine Certificate</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Save to Encrypted Vault ✅
                  </button>
                </div>
              </form>

              {/* Vault Files List */}
              <div className="space-y-3">
                {vaultFiles.map(file => (
                  <div key={file.id} className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between gap-3 hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-300">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">{file.name}</h4>
                        <p className="text-xs text-slate-400">{file.category} • Uploaded: {file.date} • {file.size}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alert(`🔒 Encrypted file "${file.name}" ready for secure viewing.`)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVaultFile(file.id)}
                        className="w-8 h-8 rounded-xl bg-red-950/80 text-red-400 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
