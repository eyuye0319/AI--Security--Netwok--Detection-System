import React from 'react';
import { Shield, Activity, Lock, Cpu, Bot, Terminal, User as UserIcon, Play, Pause, Zap } from 'lucide-react';
import { User, UserRole } from '../types';

interface HeaderProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  streamPaused: boolean;
  onTogglePause: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  streamPaused,
  onTogglePause,
  onOpenAuth,
  onLogout,
}) => {
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'packets', label: 'Live Traffic', icon: Shield },
    { id: 'ai-assistant', label: 'AI Security Assistant', icon: Bot },
    { id: 'ml-studio', label: 'ML Pipeline', icon: Cpu },
    { id: 'rl-agent', label: 'RL Mitigation', icon: Zap },
    { id: 'alerts', label: 'Incidents & Alerts', icon: Lock },
    { id: 'codebase', label: 'Python Code & Docs', icon: Terminal },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
                  AegisSec
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800/80 rounded-full">
                  AI-NIDS v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">AI Security Monitoring & Threat Detection</p>
            </div>
          </div>

          {/* Quick Stream Control */}
          <div className="hidden md:flex items-center space-x-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${streamPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-xs font-mono text-slate-300">
                {streamPaused ? 'STREAM PAUSED' : 'LIVE MONITORING'}
              </span>
            </div>
            <button
              onClick={onTogglePause}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded transition"
              title={streamPaused ? 'Resume Packet Stream' : 'Pause Packet Stream'}
            >
              {streamPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {/* User Auth Profile */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-3 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-200">{currentUser.username}</span>
                  <span className="text-[10px] font-mono font-medium text-cyan-400">{currentUser.role}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-xs text-slate-400 hover:text-rose-400 transition underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-2 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-md shadow-indigo-600/20"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Login / Register</span>
              </button>
            )}
          </div>
        </div>

        {/* Nav Tabs Bar */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-slate-800/80">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-900/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
