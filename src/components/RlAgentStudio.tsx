import React, { useState } from 'react';
import { Zap, Play, ShieldCheck, Ban, Eye, RotateCcw, ToggleLeft, ToggleRight, Activity } from 'lucide-react';
import { RlState, ThreatType } from '../types';

export const RlAgentStudio: React.FC = () => {
  const [rlState, setRlState] = useState<RlState>({
    episode: 1,
    step: 42,
    current_reward: 15.0,
    cumulative_reward: 312.5,
    accuracy: 96.4,
    autonomous_mode: true,
    q_table: {
      'HIGH_ANOMALY_HIGH_FREQ': { ALLOW: -50.0, BLOCK: 22.5, MONITOR: 4.0 },
      'MED_ANOMALY_MED_FREQ': { ALLOW: 2.0, BLOCK: -12.0, MONITOR: 14.0 },
      'LOW_ANOMALY_LOW_FREQ': { ALLOW: 10.0, BLOCK: -30.0, MONITOR: 1.0 },
      'HIGH_ENTROPY_ENCRYPTED': { ALLOW: -45.0, BLOCK: 20.0, MONITOR: 5.0 },
      'PORT_SCAN_PATTERN': { ALLOW: -35.0, BLOCK: 18.0, MONITOR: 7.0 },
    },
    recent_actions: [
      {
        packet_id: 'pkt-8901',
        threat_type: 'DDOS',
        action: 'BLOCK',
        reward: 15.0,
        explanation: 'Correctly BLOCKED SYN Flood DDoS attack. Reward +15.0',
      },
      {
        packet_id: 'pkt-8902',
        threat_type: 'NONE',
        action: 'ALLOW',
        reward: 5.0,
        explanation: 'Correctly ALLOWED clean user HTTP request. Reward +5.0',
      },
      {
        packet_id: 'pkt-8903',
        threat_type: 'BRUTE_FORCE',
        action: 'BLOCK',
        reward: 15.0,
        explanation: 'Correctly BLOCKED SSH brute force attempt. Reward +15.0',
      },
    ],
  });

  const [simThreat, setSimThreat] = useState<ThreatType>('DDOS');

  const handleStepAction = async (action: 'ALLOW' | 'BLOCK' | 'MONITOR') => {
    try {
      const res = await fetch('/api/rl/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, threat_type: simThreat, packet_id: `pkt-step-${Date.now()}` }),
      });
      const data = await res.json();
      if (data.rl_state) {
        setRlState(data.rl_state);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleAutonomous = async () => {
    try {
      const res = await fetch('/api/rl/toggle-auto', { method: 'POST' });
      const data = await res.json();
      setRlState((prev) => ({ ...prev, autonomous_mode: data.autonomous_mode }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-amber-500 to-rose-600 rounded-2xl shadow-lg shadow-amber-500/20">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Reinforcement Learning Mitigation Agent</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              OpenAI Gym Environment, Q-Learning & PPO Agents for Autonomous Defense Actions (ALLOW, BLOCK, MONITOR)
            </p>
          </div>
        </div>

        {/* Autonomous Mode Toggle */}
        <button
          onClick={handleToggleAutonomous}
          className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition ${
            rlState.autonomous_mode
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          {rlState.autonomous_mode ? <ToggleRight className="w-5 h-5 text-emerald-300" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
          <span>{rlState.autonomous_mode ? 'Autonomous Defense: ACTIVE' : 'Autonomous Defense: OFF'}</span>
        </button>
      </div>

      {/* Reward Matrix & Gym Environment Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Step Tester (1 col) */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-5">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Gym Environment Step Controller</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Simulated Incoming Threat Packet</label>
            <select
              value={simThreat}
              onChange={(e: any) => setSimThreat(e.target.value)}
              className="w-full bg-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-amber-500"
            >
              <option value="NONE">NONE (Clean Traffic)</option>
              <option value="DDOS">SYN Flood DDoS</option>
              <option value="PORT_SCAN">Port Scan Sequence</option>
              <option value="BRUTE_FORCE">SSH Brute Force</option>
              <option value="DATA_EXFILTRATION">Encrypted Exfiltration</option>
            </select>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 block">Select Agent Action:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleStepAction('ALLOW')}
                className="py-2.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-xl font-bold text-xs transition"
              >
                ALLOW
              </button>
              <button
                onClick={() => handleStepAction('BLOCK')}
                className="py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl font-bold text-xs transition"
              >
                BLOCK
              </button>
              <button
                onClick={() => handleStepAction('MONITOR')}
                className="py-2.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 rounded-xl font-bold text-xs transition"
              >
                MONITOR
              </button>
            </div>
          </div>

          {/* Reward Design Explanation */}
          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs space-y-2">
            <span className="font-semibold text-amber-300">RL Reward Engineering Matrix:</span>
            <div className="text-[11px] text-slate-300 space-y-1 font-mono">
              <p>• Block Malicious Threat: <span className="text-emerald-400 font-bold">+15.0</span></p>
              <p>• Allow Clean Traffic: <span className="text-emerald-400 font-bold">+5.0</span></p>
              <p>• Monitor Threat Packet: <span className="text-amber-400 font-bold">+3.0</span></p>
              <p>• False Positive Block: <span className="text-rose-400 font-bold">-25.0</span></p>
              <p>• Missed Malicious Attack: <span className="text-rose-400 font-bold">-50.0</span></p>
            </div>
          </div>
        </div>

        {/* Q-Table Heatmap Visualizer (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Q-Table State-Action Values</h3>
              <p className="text-xs text-slate-400">Learned Q-value matrix mapping network state keys to mitigation actions</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-slate-400">Cumulative Reward:</span>
              <span className="text-emerald-400 font-bold text-sm">+{rlState.cumulative_reward.toFixed(1)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3">Discretized State Key</th>
                  <th className="px-4 py-3">Q(s, ALLOW)</th>
                  <th className="px-4 py-3">Q(s, BLOCK)</th>
                  <th className="px-4 py-3">Q(s, MONITOR)</th>
                  <th className="px-4 py-3 text-right">Optimal Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {Object.entries(rlState.q_table).map(([stateKey, actionsObj]) => {
                  const actions = actionsObj as Record<string, number>;
                  const bestAction = Object.entries(actions).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
                  return (
                    <tr key={stateKey} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-cyan-300">{stateKey}</td>
                      <td className={`px-4 py-3 ${actions.ALLOW < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {actions.ALLOW.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 ${actions.BLOCK < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {actions.BLOCK.toFixed(1)}
                      </td>
                      <td className={`px-4 py-3 ${actions.MONITOR < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {actions.MONITOR.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 rounded">
                          {bestAction}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Action Log History */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white">Recent RL Agent Action Trajectory</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {rlState.recent_actions.map((act, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between text-xs"
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    act.action === 'BLOCK'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : act.action === 'MONITOR'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  }`}
                >
                  {act.action}
                </span>
                <span className="text-slate-300 font-mono">{act.explanation}</span>
              </div>
              <span className={`font-mono font-bold ${act.reward >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {act.reward >= 0 ? `+${act.reward}` : act.reward}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
