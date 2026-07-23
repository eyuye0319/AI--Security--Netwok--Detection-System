import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { ShieldAlert, Zap, Activity, HardDrive, AlertTriangle, Play, Pause, Flame, Search, Bot } from 'lucide-react';
import { NetworkPacket, SuspiciousIP, ThreatType } from '../types';

interface DashboardOverviewProps {
  packets: NetworkPacket[];
  metrics: {
    total_packets_captured: number;
    total_bandwidth_mb: string;
    active_threat_count: number;
    clean_traffic_pct: string;
    malicious_traffic_pct: string;
    average_payload_entropy: string;
    attack_distribution: { name: string; count: number }[];
  };
  suspiciousIps: SuspiciousIP[];
  streamStatus: { paused: boolean; rate: number };
  onTogglePause: () => void;
  onChangeRate: (rate: number) => void;
  onSimulateAttack: (attackType: ThreatType) => void;
  onAskAi: (ip: string, threatType: ThreatType) => void;
}

const ATTACK_COLORS: Record<string, string> = {
  DDOS: '#ef4444',
  PORT_SCAN: '#f97316',
  BRUTE_FORCE: '#eab308',
  DATA_EXFILTRATION: '#a855f7',
  ANOMALOUS_PAYLOAD: '#ec4899',
  CLEAN: '#10b981',
};

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  packets,
  metrics,
  suspiciousIps,
  streamStatus,
  onTogglePause,
  onChangeRate,
  onSimulateAttack,
  onAskAi,
}) => {
  const [selectedAttack, setSelectedAttack] = useState<ThreatType>('DDOS');

  // Prepare chart timeline data (last 20 packets)
  const chartData = [...packets].reverse().map((p, index) => ({
    time: p.timestamp,
    size: p.packet_size,
    anomaly: Math.floor(p.anomaly_score * 100),
    threat: p.threat_type,
    freq: p.connection_frequency,
  }));

  return (
    <div className="space-[#1e293b] space-y-6">
      {/* Top Banner & Quick Attack Generator */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-md">
              SOC Threat Operations
            </span>
            <span className="text-xs text-slate-400 font-mono">Engine: Random Forest + PyTorch DNN</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">AI Network Intrusion Detection Engine</h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Real-time packet inspection, anomaly scoring, automated reinforcement learning firewall responses, and Gemini AI forensic analysis.
          </p>
        </div>

        {/* Interactive Attack Simulator Panel */}
        <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 w-full lg:w-auto shadow-inner">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Simulate Real-Time Attack Bursts</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'SYN DDoS', type: 'DDOS' },
              { label: 'Port Scan', type: 'PORT_SCAN' },
              { label: 'SSH Brute Force', type: 'BRUTE_FORCE' },
              { label: 'Exfiltration', type: 'DATA_EXFILTRATION' },
            ].map((att) => (
              <button
                key={att.type}
                onClick={() => onSimulateAttack(att.type as ThreatType)}
                className="px-3 py-1.5 text-xs font-medium bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/40 rounded-lg transition-all shadow"
              >
                + {att.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Captured Packets</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{metrics.total_packets_captured.toLocaleString()}</div>
            <p className="text-xs text-slate-400 mt-1">Total stream throughput</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Threats</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 font-mono">{metrics.active_threat_count}</div>
            <p className="text-xs text-rose-300/80 mt-1">{metrics.malicious_traffic_pct}% malicious traffic ratio</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Processed Bandwidth</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono">{metrics.total_bandwidth_mb} MB</div>
            <p className="text-xs text-slate-400 mt-1">Live PCAP network volume</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Payload Entropy</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-300 font-mono">{metrics.average_payload_entropy} / 8.0</div>
            <p className="text-xs text-slate-400 mt-1">High entropy indicates encrypted payload</p>
          </div>
        </div>
      </div>

      {/* Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Throughput & Anomaly Timeline (2 columns) */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Live Traffic & Anomaly Score Stream</h3>
              <p className="text-xs text-slate-400">Real-time packet size (bytes) vs AI Anomaly Probability (%)</p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="flex items-center"><span className="w-3 h-3 bg-cyan-500 rounded-full mr-1" /> Packet Size</span>
              <span className="flex items-center"><span className="w-3 h-3 bg-rose-500 rounded-full mr-1" /> Anomaly Score %</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                  itemStyle={{ color: '#38bdf8' }}
                />
                <Area type="monotone" dataKey="size" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSize)" name="Size (Bytes)" />
                <Area type="monotone" dataKey="anomaly" stroke="#f43f5e" fillOpacity={1} fill="url(#colorAnomaly)" name="Anomaly Score %" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attack Taxonomy Distribution Bar Chart (1 column) */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
          <h3 className="text-base font-bold text-white mb-1">Attack Vector Distribution</h3>
          <p className="text-xs text-slate-400 mb-4">Detected threats classified by ML model</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.attack_distribution} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {metrics.attack_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ATTACK_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Suspicious IPs Table Preview */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Top High-Risk Suspicious IPs</h3>
            <p className="text-xs text-slate-400">Flagged source hosts evaluated for malicious threat activity</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Source IP</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Total Packets</th>
                <th className="px-4 py-3">Primary Attack</th>
                <th className="px-4 py-3">Threat Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {suspiciousIps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No suspicious malicious IPs recorded yet.
                  </td>
                </tr>
              ) : (
                suspiciousIps.map((ip) => (
                  <tr key={ip.ip} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-400">{ip.ip}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {ip.country} ({ip.country_code})
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{ip.total_packets}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 text-[10px] font-bold rounded-md"
                        style={{
                          backgroundColor: `${ATTACK_COLORS[ip.primary_attack] || '#6366f1'}20`,
                          color: ATTACK_COLORS[ip.primary_attack] || '#6366f1',
                          border: `1px solid ${ATTACK_COLORS[ip.primary_attack] || '#6366f1'}40`,
                        }}
                      >
                        {ip.primary_attack.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-rose-500 h-1.5 rounded-full"
                            style={{ width: `${ip.threat_score}%` }}
                          />
                        </div>
                        <span className="text-slate-200 font-bold">{ip.threat_score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          ip.status === 'BLOCKED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {ip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onAskAi(ip.ip, ip.primary_attack)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg border border-indigo-500/30 transition shadow-sm"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Ask AI Assistant</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
