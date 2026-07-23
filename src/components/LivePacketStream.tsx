import React, { useState } from 'react';
import { Shield, Filter, Search, Eye, AlertTriangle, CheckCircle, Ban, Terminal, Code, Cpu } from 'lucide-react';
import { NetworkPacket, ProtocolType, ThreatType } from '../types';

interface LivePacketStreamProps {
  packets: NetworkPacket[];
  onAskAi: (ip: string, threatType: ThreatType, packetSample?: NetworkPacket) => void;
}

export const LivePacketStream: React.FC<LivePacketStreamProps> = ({ packets, onAskAi }) => {
  const [selectedPacket, setSelectedPacket] = useState<NetworkPacket | null>(null);
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL');
  const [threatOnlyFilter, setThreatOnlyFilter] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredPackets = packets.filter((pkt) => {
    if (protocolFilter !== 'ALL' && pkt.protocol !== protocolFilter) return false;
    if (threatOnlyFilter && pkt.threat_type === 'NONE') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        pkt.source_ip.toLowerCase().includes(q) ||
        pkt.destination_ip.toLowerCase().includes(q) ||
        pkt.threat_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span>Real-Time Network Packet Inspection</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Scapy network packet capturer extracting 7 key ML features (IPs, Ports, Protocol, Size, Frequency, SYN/ACK, Entropy)
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search IP or Threat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Protocol Filter */}
          <select
            value={protocolFilter}
            onChange={(e) => setProtocolFilter(e.target.value)}
            className="bg-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Protocols</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="HTTP">HTTP</option>
            <option value="HTTPS">HTTPS</option>
            <option value="ICMP">ICMP</option>
          </select>

          {/* Threat Toggle */}
          <button
            onClick={() => setThreatOnlyFilter(!threatOnlyFilter)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
              threatOnlyFilter
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {threatOnlyFilter ? '⚠️ Threat Packets Only' : 'Filter Threat Packets'}
          </button>
        </div>
      </div>

      {/* Main Packets Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700/80">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Source IP : Port</th>
                <th className="px-4 py-3">Dest IP : Port</th>
                <th className="px-4 py-3">Proto</th>
                <th className="px-4 py-3">Size (B)</th>
                <th className="px-4 py-3">Req/s</th>
                <th className="px-4 py-3">Entropy</th>
                <th className="px-4 py-3">AI Score</th>
                <th className="px-4 py-3">Threat Vector</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500">
                    No network packets matching current filters.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt) => {
                  const isHighThreat = pkt.threat_type !== 'NONE';
                  return (
                    <tr
                      key={pkt.id}
                      className={`hover:bg-slate-800/60 transition ${
                        isHighThreat ? 'bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-400 text-[11px]">{pkt.timestamp}</td>
                      <td className="px-4 py-3 font-semibold text-cyan-300">
                        {pkt.source_ip}:{pkt.source_port}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {pkt.destination_ip}:{pkt.destination_port}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-bold border border-slate-700">
                          {pkt.protocol}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{pkt.packet_size}</td>
                      <td className="px-4 py-3 text-slate-300">{pkt.connection_frequency}</td>
                      <td className="px-4 py-3 font-bold text-amber-300">{pkt.payload_entropy}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-bold ${
                            pkt.anomaly_score > 0.7
                              ? 'text-rose-400'
                              : pkt.anomaly_score > 0.3
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {(pkt.anomaly_score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        {pkt.threat_type === 'NONE' ? (
                          <span className="text-emerald-400 text-[10px] font-semibold">Clean</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 rounded">
                            {pkt.threat_type.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            pkt.action_taken === 'BLOCKED'
                              ? 'bg-rose-900/60 text-rose-300'
                              : pkt.action_taken === 'MONITORED'
                              ? 'bg-amber-900/60 text-amber-300'
                              : 'bg-emerald-900/60 text-emerald-300'
                          }`}
                        >
                          {pkt.action_taken}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedPacket(pkt)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition"
                          title="Inspect Packet Payload & Headers"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packet Inspection Modal */}
      {selectedPacket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Packet Forensic Inspection</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedPacket.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPacket(null)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Feature Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-[10px]">Source</span>
                <p className="font-mono font-bold text-cyan-300 mt-0.5">
                  {selectedPacket.source_ip}:{selectedPacket.source_port}
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-[10px]">Destination</span>
                <p className="font-mono font-bold text-slate-200 mt-0.5">
                  {selectedPacket.destination_ip}:{selectedPacket.destination_port}
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-[10px]">Protocol & Flags</span>
                <p className="font-mono font-bold text-slate-200 mt-0.5">
                  {selectedPacket.protocol} {selectedPacket.syn_flag ? '[SYN]' : ''} {selectedPacket.ack_flag ? '[ACK]' : ''}
                </p>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                <span className="text-slate-400 text-[10px]">Shannon Entropy</span>
                <p className="font-mono font-bold text-amber-300 mt-0.5">
                  {selectedPacket.payload_entropy} / 8.0
                </p>
              </div>
            </div>

            {/* Simulated Raw Hex View */}
            <div>
              <span className="text-xs font-semibold text-slate-300 mb-2 block">Raw Packet Hex Dump:</span>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-400/90 leading-relaxed overflow-x-auto">
                <p>0000   45 00 00 3c 1c 46 40 00 40 06 b1 e6 c0 a8 01 69  E..&lt;.F@.@......i</p>
                <p>0010   0a 00 00 0f 00 50 00 16 00 00 00 00 00 00 00 00  .....P..........</p>
                <p>0020   a0 02 72 10 91 1e 00 00 02 04 05 b4 04 02 08 0a  ..r.............</p>
                <p>0030   3a db 0e d0 00 00 00 00 01 03 03 07 72 e1 90 c3  :...........r...</p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <button
                onClick={() => {
                  onAskAi(selectedPacket.source_ip, selectedPacket.threat_type, selectedPacket);
                  setSelectedPacket(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-cyan-500 hover:to-indigo-500 transition"
              >
                🤖 Analyze this packet with AI Assistant
              </button>
              <button
                onClick={() => setSelectedPacket(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
