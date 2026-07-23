import React, { useState } from 'react';
import { Lock, User as UserIcon, Shield, CheckCircle2 } from 'lucide-react';
import { User, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('SECURITY_ANALYST');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { username, email, password, role } : { username, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoRole: UserRole) => {
    if (demoRole === 'ADMIN') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('analyst');
      setPassword('analyst123');
    }
    setIsRegister(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isRegister ? 'Create SOC User Account' : 'JWT Authentication Login'}
              </h3>
              <p className="text-xs text-slate-400">Role-Based Access Control System</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">
            ✕
          </button>
        </div>

        {/* Demo Quick Fills */}
        {!isRegister && (
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs space-y-2">
            <span className="font-semibold text-cyan-300">Quick Fill Demo Accounts:</span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="px-3 py-1 bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white rounded border border-indigo-500/40 text-[11px] font-bold"
              >
                Admin (admin123)
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('SECURITY_ANALYST')}
                className="px-3 py-1 bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600 hover:text-white rounded border border-cyan-500/40 text-[11px] font-bold"
              >
                Analyst (analyst123)
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Username / Email</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="text-slate-400 block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-slate-400 block mb-1">Assigned Role Privilege</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-800 text-slate-200 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
              >
                <option value="SECURITY_ANALYST">Security Analyst (Read & Triage)</option>
                <option value="ADMIN">Admin (Full Control)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Login'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-cyan-400 font-bold hover:underline"
          >
            {isRegister ? 'Login' : 'Register now'}
          </button>
        </div>
      </div>
    </div>
  );
};
