import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, Terminal, Copy, Check, Shield, AlertCircle } from 'lucide-react';
import { ChatMessage, ThreatType } from '../types';

interface AiAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, context?: any) => Promise<void>;
  isLoading: boolean;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ messages, onSendMessage, isLoading }) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const presetQueries = [
    'Why was this IP detected as malicious?',
    'What response action should I take for a SYN Flood DDoS attack?',
    'Explain how Shannon Payload Entropy detects obfuscated shellcode.',
    'Generate an iptables firewall rule to block aggressive Port Scanners.',
  ];

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;
    setInputText('');
    await onSendMessage(query);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl border border-slate-700 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">Gemini AI Security Specialist</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full">
                gemini-3.6-flash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Ask questions about detected security alerts, forensic packet analysis, and threat mitigation playbooks.
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl flex flex-col h-[600px] overflow-hidden">
        {/* Preset Query Chips */}
        <div className="bg-slate-800/60 p-3 border-b border-slate-800 overflow-x-auto flex space-x-2 no-scrollbar">
          <span className="text-xs font-semibold text-slate-400 self-center whitespace-nowrap mr-1 flex items-center">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 mr-1" /> Quick Queries:
          </span>
          {presetQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl whitespace-nowrap transition"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-3">
              <Bot className="w-12 h-12 mx-auto text-slate-600" />
              <p className="text-sm font-medium">No messages yet. Ask Gemini AI Security Specialist a question!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="p-2 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl h-fit">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-medium'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/80'
                  }`}
                >
                  {/* Context Badge if Attached */}
                  {msg.logs_context && (
                    <div className="mb-2 p-2 bg-slate-900/90 rounded-lg border border-slate-700 text-[11px] font-mono text-cyan-300">
                      <span>📌 Attached Context:</span>
                      {msg.logs_context.ip && <div>IP: {msg.logs_context.ip}</div>}
                      {msg.logs_context.threat_type && <div>Threat: {msg.logs_context.threat_type}</div>}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                  {msg.sender === 'ai' && (
                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Timestamp: {msg.timestamp}</span>
                      <button
                        onClick={() => copyToClipboard(msg.text, msg.id)}
                        className="hover:text-cyan-400 flex items-center space-x-1"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Explanation</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="p-2 bg-cyan-600 text-white rounded-xl h-fit">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center space-x-3 text-slate-400 text-xs py-2">
              <Bot className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Gemini AI is analyzing security logs and generating response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-800 flex items-center space-x-3">
          <input
            type="text"
            placeholder="Ask AI Assistant about suspicious IPs, attack signatures, or mitigation steps..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className="flex-1 bg-slate-900 text-slate-200 text-xs px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputText.trim()}
            className="px-5 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-cyan-900/30 flex items-center space-x-2 disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
