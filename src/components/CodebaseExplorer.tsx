import React, { useState } from 'react';
import { Terminal, Folder, FileCode, Copy, Check, BookOpen, Layers, Server, Cpu, Box } from 'lucide-react';
import { PYTHON_CODEBASE } from '../data/pythonCodebase';
import { CodeFile } from '../types';

export const CodebaseExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PYTHON_CODEBASE[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  const categories = [
    { id: 'ALL', label: 'All Files' },
    { id: 'backend', label: 'FastAPI Backend' },
    { id: 'ml', label: 'Machine Learning' },
    { id: 'rl', label: 'Reinforcement Learning' },
    { id: 'deployment', label: 'Docker & Deployment' },
    { id: 'docs', label: 'Documentation' },
  ];

  const filteredFiles = PYTHON_CODEBASE.filter((f) => {
    if (activeCategory === 'ALL') return true;
    return f.category === activeCategory;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-2xl shadow-lg shadow-cyan-500/20">
            <Terminal className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Production Python Architecture & Code Explorer</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Inspect clean, modular Python codebase for FastAPI backend, Scapy sniffing, PyTorch IDS, Gym RL environment, and Docker setup.
            </p>
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Tree Sidebar (1 col) */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-md space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Project Structure</h3>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition ${
                  activeCategory === cat.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* File List */}
          <div className="space-y-1">
            {filteredFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2.5 rounded-xl font-mono text-xs flex items-center space-x-2.5 transition ${
                  selectedFile.path === file.path
                    ? 'bg-gradient-to-r from-cyan-900/60 to-indigo-900/60 text-cyan-300 font-bold border border-cyan-700/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code Viewer (3 cols) */}
        <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="bg-slate-800/80 p-4 border-b border-slate-700/80 flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-cyan-300">{selectedFile.path}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Content View */}
          <div className="p-5 bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto overflow-y-auto max-h-[600px] whitespace-pre">
            {selectedFile.content}
          </div>
        </div>
      </div>
    </div>
  );
};
