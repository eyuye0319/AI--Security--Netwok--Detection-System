import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { LivePacketStream } from './components/LivePacketStream';
import { AiAssistant } from './components/AiAssistant';
import { MlPipelineStudio } from './components/MlPipelineStudio';
import { RlAgentStudio } from './components/RlAgentStudio';
import { AlertsAndReports } from './components/AlertsAndReports';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { AuthModal } from './components/AuthModal';

import { NetworkPacket, SuspiciousIP, ThreatType, User, ChatMessage } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'u-1',
    username: 'admin',
    email: 'admin@secops.org',
    role: 'ADMIN',
    created_at: new Date().toISOString(),
  });
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Live Traffic Data
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [metrics, setMetrics] = useState({
    total_packets_captured: 12450,
    total_bandwidth_mb: '48.20',
    active_threat_count: 5,
    clean_traffic_pct: '76.5',
    malicious_traffic_pct: '23.5',
    average_payload_entropy: '3.45',
    attack_distribution: [
      { name: 'DDOS', count: 18 },
      { name: 'PORT_SCAN', count: 12 },
      { name: 'BRUTE_FORCE', count: 8 },
      { name: 'DATA_EXFILTRATION', count: 5 },
      { name: 'ANOMALOUS_PAYLOAD', count: 4 },
    ],
  });
  const [suspiciousIps, setSuspiciousIps] = useState<SuspiciousIP[]>([]);
  const [streamStatus, setStreamStatus] = useState({ paused: false, rate: 3 });

  // AI Assistant Messages State
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString(),
      text: "Hello! I'm your Gemini AI Security Specialist. I can explain malicious alert triggers, analyze packet Shannon entropy, and generate firewall remediation playbooks. How can I assist your SOC team today?",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Poll live traffic endpoint
  const fetchTrafficData = async () => {
    try {
      const res = await fetch('/api/network/traffic');
      const data = await res.json();
      if (data.packets) setPackets(data.packets);
      if (data.metrics) setMetrics(data.metrics);
      if (data.suspicious_ips) setSuspiciousIps(data.suspicious_ips);
      if (data.stream_status) setStreamStatus(data.stream_status);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTrafficData();
    const interval = setInterval(fetchTrafficData, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePause = async () => {
    const newPaused = !streamStatus.paused;
    try {
      await fetch('/api/network/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: newPaused, rate: streamStatus.rate }),
      });
      setStreamStatus((prev) => ({ ...prev, paused: newPaused }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeRate = async (rate: number) => {
    try {
      await fetch('/api/network/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: streamStatus.paused, rate }),
      });
      setStreamStatus((prev) => ({ ...prev, rate }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateAttack = async (attackType: ThreatType) => {
    try {
      await fetch('/api/network/simulate-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attack_type: attackType }),
      });
      fetchTrafficData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAskAi = async (ip: string, threatType: ThreatType, packetSample?: NetworkPacket) => {
    setActiveTab('ai-assistant');
    const prompt = `Can you provide a detailed forensic analysis of malicious IP ${ip} triggering ${threatType} attack alerts, and recommend an incident response playbook?`;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      text: prompt,
      logs_context: {
        ip,
        threat_type: threatType,
        packet_id: packetSample?.id,
      },
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, logs_context: { ip, threatType, packetSample } }),
      });

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `msg-res-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
        text: data.explanation || 'Analysis complete.',
      };
      setAiMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendAiMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      text,
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text }),
      });

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `msg-res-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString(),
        text: data.explanation || 'Analysis complete.',
      };
      setAiMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      <Header
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        streamPaused={streamStatus.paused}
        onTogglePause={handleTogglePause}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => setCurrentUser(null)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            packets={packets}
            metrics={metrics}
            suspiciousIps={suspiciousIps}
            streamStatus={streamStatus}
            onTogglePause={handleTogglePause}
            onChangeRate={handleChangeRate}
            onSimulateAttack={handleSimulateAttack}
            onAskAi={handleAskAi}
          />
        )}

        {activeTab === 'packets' && (
          <LivePacketStream packets={packets} onAskAi={handleAskAi} />
        )}

        {activeTab === 'ai-assistant' && (
          <AiAssistant
            messages={aiMessages}
            onSendMessage={handleSendAiMessage}
            isLoading={isAiLoading}
          />
        )}

        {activeTab === 'ml-studio' && <MlPipelineStudio />}

        {activeTab === 'rl-agent' && <RlAgentStudio />}

        {activeTab === 'alerts' && <AlertsAndReports onAskAi={handleAskAi} />}

        {activeTab === 'codebase' && <CodebaseExplorer />}
      </main>

      <footer className="bg-slate-900 border-t border-slate-800/80 text-xs text-slate-400 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">AegisSec AI-NIDS Platform</span>
            <span>•</span>
            <span>Powered by Gemini 3.6 Flash & PyTorch</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>FastAPI Backend</span>
            <span>Scapy Packet Sniffer</span>
            <span>Gym RL Mitigation</span>
            <span>JWT Auth</span>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}
