import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import API from '../services/api';
import { KeyRound, Mail, CheckCircle2, AlertCircle, X, ArrowRight } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Email, 2: Reset Password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setLoading(true);
      setError('');
      await API.post('/auth/forgot-password', { email: email.trim() });
      setStep(2);
      setMessage('Password reset code dispatched to your email. Please enter your new password.');
    } catch (err) {
      setError(err.response?.data?.message || 'Email not found in registered accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await API.post('/auth/reset-password', { email: email.trim(), newPassword });
      setMessage('Password updated successfully! You can now log in with your new password.');
      setTimeout(() => {
        onClose();
        setStep(1);
        setEmail('');
        setNewPassword('');
        setMessage('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-blue-500/40 shadow-2xl space-y-5 relative animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md">
              <KeyRound className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Reset Account Password</h3>
              <p className="text-[11px] text-slate-400">Secure MyDoctorBook Account Recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {message && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-2xl text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Registered Account Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Verifying Account...' : 'Continue Password Recovery →'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Enter New Password *</label>
              <input
                type="password"
                required
                minLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new 4+ character password"
                className="w-full px-3.5 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl shadow-lg flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Updating Password...' : 'Save New Password & Log In'}</span>
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
