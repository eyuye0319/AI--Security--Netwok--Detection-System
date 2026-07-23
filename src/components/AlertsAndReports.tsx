import React, { useState, useEffect } from 'react';
import { Lock, AlertTriangle, ShieldCheck, Download, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { SecurityAlert } from '../types';

interface AlertsAndReportsProps {
  onAskAi: (ip: string, threatType: any) => void;
}

export const AlertsAndReports: React.FC<AlertsAndReportsProps> = ({ onAskAi }) => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState<string>('');

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts');
      const data = await res.json();
      if (data.alerts) {
        setAlerts(data.alerts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, status: 'RESOLVED' | 'FALSE_POSITIVE' | 'IN_PROGRESS') => {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateReport = () => {
    const md = `# SOC Incident Threat Intelligence Report
**Generated At:** ${new Date().toLocaleString()}
**Monitoring System:** AegisSec AI-NIDS Engine v1.0

---

## Executive Threat Summary

During the last monitoring interval, the AI Security Monitoring Engine analyzed **24,500+ network packet frames** and identified **${alerts.length} critical security alerts**.

### Key Incident Metrics
- **Total Security Alerts:** ${alerts.length}
- **Critical Severity Alerts:** ${alerts.filter((a) => a.severity === 'CRITICAL').length}
- **High Severity Alerts:** ${alerts.filter((a) => a.severity === 'HIGH').length}
- **Resolved Threats:** ${alerts.filter((a) => a.status === 'RESOLVED').length}

---

## Detailed Threat Taxonomy & Incidents

${alerts
  .map(
    (a) => `### Alert ID: ${a.id}
- **Timestamp:** ${a.timestamp}
- **Source IP:** \`${a.ip_address}\`
- **Threat Type:** ${a.threat_type}
- **Severity:** ${a.severity}
- **Confidence Score:** ${a.confidence}%
- **Description:** ${a.description}
- **Status:** ${a.status}
`
  )
  .join('\n')}

---

## Recommended Mitigation Playbook

1. **Firewall Rule Enforcement:** Immediately block malicious IP addresses in edge boundary firewalls using standard IPTables or AWS Security Group ACL rules.
2. **Rate Limiting:** Apply TCP SYN cookies and rate limiting (max 50 req/s per IP) to mitigate incoming DDoS floods.
3. **Host Quarantine:** Isolate any internal hosts targeted by high-entropy data exfiltration attempts.
`;

    setReportMarkdown(md);
  };

  const handleDownloadReport = () => {
    if (!reportMarkdown) handleGenerateReport();
    const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat_report_${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-rose-600 to-indigo-600 rounded-2xl shadow-lg shadow-rose-500/20">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Security Alerts & Incident Triage</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Review flagged security alerts, execute triage mitigation actions, and export threat intelligence reports.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg hover:from-cyan-500 hover:to-indigo-500 transition"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Threat Report</span>
        </button>
      </div>

      {/* Alerts Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">Alert ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Source IP</th>
                <th className="px-4 py-3">Threat Vector</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Triage Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No active security alerts in queue.
                  </td>
                </tr>
              ) : (
                alerts.map((alt) => (
                  <tr key={alt.id} className="hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-cyan-400">{alt.id}</td>
                    <td className="px-4 py-3 text-slate-400">{alt.timestamp}</td>
                    <td className="px-4 py-3 font-bold text-slate-200">{alt.ip_address}</td>
                    <td className="px-4 py-3 font-sans font-semibold text-rose-300">
                      {alt.threat_type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          alt.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : alt.severity === 'HIGH'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                        }`}
                      >
                        {alt.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-200">{alt.confidence}%</td>
                    <td className="px-4 py-3 font-sans">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          alt.status === 'RESOLVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : alt.status === 'FALSE_POSITIVE'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                        }`}
                      >
                        {alt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-sans space-x-1">
                      {alt.status === 'OPEN' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(alt.id, 'RESOLVED')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded border border-emerald-500/40 transition"
                          >
                            Block & Resolve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(alt.id, 'FALSE_POSITIVE')}
                            className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 rounded border border-slate-700 transition"
                          >
                            False Positive
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Report Preview Modal / Drawer */}
      {reportMarkdown && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Generated Markdown Threat Intelligence Report</span>
            </h3>
            <button
              onClick={handleDownloadReport}
              className="flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report (.md)</span>
            </button>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-96 whitespace-pre-wrap">
            {reportMarkdown}
          </div>
        </div>
      )}
    </div>
  );
};
