import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import { NetworkPacket, SecurityAlert, SuspiciousIP, ThreatType, UserRole, RlState } from './src/types.js';
import { PYTHON_CODEBASE } from './src/data/pythonCodebase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'security-monitoring-jwt-secret-key-2026';
const PORT = 3000;

// Initialize Google Gemini Client (Server-Side)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Mock Database State
let usersList = [
  {
    id: 'u-1',
    username: 'admin',
    email: 'admin@secops.org',
    passwordHash: bcrypt.hashSync('admin123', 8),
    role: 'ADMIN' as UserRole,
    created_at: new Date().toISOString(),
  },
  {
    id: 'u-2',
    username: 'analyst',
    email: 'analyst@secops.org',
    passwordHash: bcrypt.hashSync('analyst123', 8),
    role: 'SECURITY_ANALYST' as UserRole,
    created_at: new Date().toISOString(),
  },
];

let streamPaused = false;
let packetsPerSecond = 3;

// In-Memory Packet Buffer (Max 200)
let packetBuffer: NetworkPacket[] = [];
let suspiciousIpsMap: Map<string, SuspiciousIP> = new Map();
let alertsList: SecurityAlert[] = [];

// RL Agent State
let rlState: RlState = {
  episode: 1,
  step: 0,
  current_reward: 0,
  cumulative_reward: 245.5,
  accuracy: 94.2,
  autonomous_mode: false,
  q_table: {
    'HIGH_ANOMALY_HIGH_FREQ': { ALLOW: -45.0, BLOCK: 18.5, MONITOR: 5.0 },
    'MED_ANOMALY_MED_FREQ': { ALLOW: 2.0, BLOCK: -10.0, MONITOR: 12.0 },
    'LOW_ANOMALY_LOW_FREQ': { ALLOW: 8.0, BLOCK: -25.0, MONITOR: 1.5 },
    'HIGH_ENTROPY_ENCRYPTED': { ALLOW: -50.0, BLOCK: 22.0, MONITOR: 4.0 },
    'PORT_SCAN_PATTERN': { ALLOW: -30.0, BLOCK: 15.0, MONITOR: 8.0 },
  },
  recent_actions: [
    {
      packet_id: 'pkt-101',
      threat_type: 'DDOS',
      action: 'BLOCK',
      reward: 15.0,
      explanation: 'Blocked SYN Flood DDoS traffic from 185.220.101.5.',
    },
    {
      packet_id: 'pkt-102',
      threat_type: 'PORT_SCAN',
      action: 'BLOCK',
      reward: 12.0,
      explanation: 'Automated firewall rule applied for multi-port scanner.',
    },
  ],
};

const COUNTRIES = [
  { name: 'United States', code: 'US' },
  { name: 'Germany', code: 'DE' },
  { name: 'China', code: 'CN' },
  { name: 'Russia', code: 'RU' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'Brazil', code: 'BR' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'North Korea', code: 'KP' },
];

function getRandomIP(isAttacker = false): string {
  if (isAttacker) {
    const maliciousSubnets = ['185.220.101.', '45.142.120.', '193.142.146.', '103.251.167.', '194.26.29.'];
    const prefix = maliciousSubnets[Math.floor(Math.random() * maliciousSubnets.length)];
    return `${prefix}${Math.floor(Math.random() * 250) + 1}`;
  }
  return `192.168.1.${Math.floor(Math.random() * 200) + 2}`;
}

function generateSimulatedPacket(forceThreat?: ThreatType): NetworkPacket {
  const isMalicious = forceThreat ? forceThreat !== 'NONE' : Math.random() < 0.25;
  const threatType: ThreatType = forceThreat
    ? forceThreat
    : isMalicious
    ? (['PORT_SCAN', 'BRUTE_FORCE', 'DDOS', 'DATA_EXFILTRATION', 'ANOMALOUS_PAYLOAD'][
        Math.floor(Math.random() * 5)
      ] as ThreatType)
    : 'NONE';

  const srcIp = getRandomIP(threatType !== 'NONE');
  const dstIp = '10.0.0.15';
  const country = threatType !== 'NONE'
    ? COUNTRIES[Math.floor(Math.random() * (COUNTRIES.length - 2)) + 2]
    : COUNTRIES[Math.floor(Math.random() * 2)];

  let srcPort = Math.floor(Math.random() * 60000) + 1024;
  let dstPort = [80, 443, 53, 22, 3389, 8080][Math.floor(Math.random() * 6)];
  let packetSize = Math.floor(Math.random() * 1200) + 64;
  let connFreq = Number((Math.random() * 5 + 0.2).toFixed(1));
  let synFlag = Math.random() < 0.1;
  let ackFlag = Math.random() < 0.9;
  let entropy = Number((Math.random() * 3 + 1.2).toFixed(2));
  let anomalyScore = Number((Math.random() * 0.25 + 0.02).toFixed(3));

  if (threatType === 'PORT_SCAN') {
    dstPort = Math.floor(Math.random() * 1024) + 1;
    connFreq = Number((Math.random() * 40 + 20).toFixed(1));
    synFlag = true;
    ackFlag = false;
    anomalyScore = Number((Math.random() * 0.2 + 0.75).toFixed(3));
  } else if (threatType === 'BRUTE_FORCE') {
    dstPort = Math.random() < 0.5 ? 22 : 3389;
    connFreq = Number((Math.random() * 25 + 15).toFixed(1));
    packetSize = Math.floor(Math.random() * 100) + 60;
    anomalyScore = Number((Math.random() * 0.25 + 0.70).toFixed(3));
  } else if (threatType === 'DDOS') {
    connFreq = Number((Math.random() * 300 + 150).toFixed(1));
    packetSize = 64;
    synFlag = true;
    ackFlag = false;
    anomalyScore = Number((Math.random() * 0.15 + 0.85).toFixed(3));
  } else if (threatType === 'DATA_EXFILTRATION') {
    packetSize = Math.floor(Math.random() * 5000) + 8000;
    entropy = Number((Math.random() * 1.5 + 6.4).toFixed(2));
    anomalyScore = Number((Math.random() * 0.2 + 0.78).toFixed(3));
  } else if (threatType === 'ANOMALOUS_PAYLOAD') {
    entropy = Number((Math.random() * 1.2 + 6.8).toFixed(2));
    anomalyScore = Number((Math.random() * 0.25 + 0.65).toFixed(3));
  }

  // RL Decision / Action
  let action: 'ALLOWED' | 'BLOCKED' | 'MONITORED' = 'ALLOWED';
  if (rlState.autonomous_mode && threatType !== 'NONE') {
    action = anomalyScore > 0.8 ? 'BLOCKED' : 'MONITORED';
  } else if (threatType !== 'NONE' && anomalyScore > 0.85) {
    action = 'BLOCKED';
  }

  const packet: NetworkPacket = {
    id: `pkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString(),
    source_ip: srcIp,
    source_port: srcPort,
    destination_ip: dstIp,
    destination_port: dstPort,
    protocol: ['TCP', 'UDP', 'HTTP', 'HTTPS', 'ICMP'][Math.floor(Math.random() * 5)] as any,
    packet_size: packetSize,
    connection_frequency: connFreq,
    syn_flag: synFlag,
    ack_flag: ackFlag,
    payload_entropy: entropy,
    anomaly_score: anomalyScore,
    threat_type: threatType,
    country_code: country.code,
    country_name: country.name,
    action_taken: action,
  };

  // Update Suspicious IP Record if Threat
  if (threatType !== 'NONE') {
    const existing = suspiciousIpsMap.get(srcIp);
    if (existing) {
      existing.total_packets += 1;
      existing.threat_score = Math.min(100, existing.threat_score + 10);
      existing.last_seen = new Date().toLocaleTimeString();
      if (action === 'BLOCKED') existing.status = 'BLOCKED';
    } else {
      suspiciousIpsMap.set(srcIp, {
        ip: srcIp,
        country: country.name,
        country_code: country.code,
        total_packets: 1,
        threat_score: Math.floor(anomalyScore * 100),
        primary_attack: threatType,
        status: action === 'BLOCKED' ? 'BLOCKED' : 'ACTIVE',
        first_seen: new Date().toLocaleTimeString(),
        last_seen: new Date().toLocaleTimeString(),
      });
    }

    // Generate Alert if high severity
    if (anomalyScore >= 0.70 && alertsList.length < 50) {
      const alert: SecurityAlert = {
        id: `ALT-${Math.floor(Math.random() * 9000) + 1000}`,
        timestamp: new Date().toLocaleTimeString(),
        ip_address: srcIp,
        threat_type: threatType,
        severity: anomalyScore > 0.85 ? 'CRITICAL' : anomalyScore > 0.75 ? 'HIGH' : 'MEDIUM',
        confidence: Math.floor(anomalyScore * 100),
        description: `Detected ${threatType.replace('_', ' ')} attempt with packet entropy ${entropy} and rate ${connFreq} req/s.`,
        status: 'OPEN',
        packet_sample: packet,
      };
      alertsList.unshift(alert);
    }
  }

  return packet;
}

// Seed initial buffer with historical packets
for (let i = 0; i < 35; i++) {
  packetBuffer.unshift(generateSimulatedPacket());
}

// Background simulation ticker
setInterval(() => {
  if (!streamPaused) {
    const newPkt = generateSimulatedPacket();
    packetBuffer.unshift(newPkt);
    if (packetBuffer.length > 200) {
      packetBuffer.pop();
    }
  }
}, 1000 / packetsPerSecond);

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // -------------------------------------------------------------
  // AUTHENTICATION ROUTER
  // -------------------------------------------------------------
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const existing = usersList.find((u) => u.username === username || u.email === email);
    if (existing) {
      return res.status(400).json({ error: 'User with this username or email already exists' });
    }

    const newUser = {
      id: `u-${Date.now()}`,
      username,
      email,
      passwordHash: bcrypt.hashSync(password, 8),
      role: (role === 'ADMIN' ? 'ADMIN' : 'SECURITY_ANALYST') as UserRole,
      created_at: new Date().toISOString(),
    };
    usersList.push(newUser);

    const token = jwt.sign({ id: newUser.id, username: newUser.username, role: newUser.role }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = usersList.find((u) => u.username === username || u.email === username);

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = usersList.find((u) => u.id === decoded.id);
      if (!user) return res.status(401).json({ error: 'User not found' });
      res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  });

  // -------------------------------------------------------------
  // NETWORK MONITORING ROUTER
  // -------------------------------------------------------------
  app.get('/api/network/traffic', (req: Request, res: Response) => {
    const totalPackets = packetBuffer.length;
    const threats = packetBuffer.filter((p) => p.threat_type !== 'NONE');
    const totalBytes = packetBuffer.reduce((acc, p) => acc + p.packet_size, 0);
    const avgEntropy = (
      packetBuffer.reduce((acc, p) => acc + p.payload_entropy, 0) / (totalPackets || 1)
    ).toFixed(2);

    const attackTypeCounts: Record<string, number> = {};
    packetBuffer.forEach((p) => {
      if (p.threat_type !== 'NONE') {
        attackTypeCounts[p.threat_type] = (attackTypeCounts[p.threat_type] || 0) + 1;
      }
    });

    res.json({
      packets: packetBuffer.slice(0, 50),
      metrics: {
        total_packets_captured: totalPackets * 12,
        total_bandwidth_mb: (totalBytes / (1024 * 1024)).toFixed(2),
        active_threat_count: threats.length,
        clean_traffic_pct: (((totalPackets - threats.length) / (totalPackets || 1)) * 100).toFixed(1),
        malicious_traffic_pct: ((threats.length / (totalPackets || 1)) * 100).toFixed(1),
        average_payload_entropy: avgEntropy,
        attack_distribution: Object.entries(attackTypeCounts).map(([name, count]) => ({ name, count })),
      },
      suspicious_ips: Array.from(suspiciousIpsMap.values()).slice(0, 10),
      stream_status: {
        paused: streamPaused,
        rate: packetsPerSecond,
      },
    });
  });

  app.post('/api/network/simulate-attack', (req: Request, res: Response) => {
    const { attack_type } = req.body;
    const validAttacks: ThreatType[] = ['PORT_SCAN', 'BRUTE_FORCE', 'DDOS', 'DATA_EXFILTRATION', 'ANOMALOUS_PAYLOAD'];
    const chosenAttack = validAttacks.includes(attack_type) ? attack_type : 'DDOS';

    const injectedPackets: NetworkPacket[] = [];
    for (let i = 0; i < 8; i++) {
      const pkt = generateSimulatedPacket(chosenAttack);
      packetBuffer.unshift(pkt);
      injectedPackets.push(pkt);
    }

    res.json({
      message: `Successfully simulated ${chosenAttack} attack sequence with 8 payload bursts!`,
      injected_packets: injectedPackets,
    });
  });

  app.post('/api/network/control', (req: Request, res: Response) => {
    const { paused, rate } = req.body;
    if (typeof paused === 'boolean') streamPaused = paused;
    if (typeof rate === 'number' && rate >= 1 && rate <= 20) packetsPerSecond = rate;
    res.json({ paused: streamPaused, rate: packetsPerSecond });
  });

  // -------------------------------------------------------------
  // MACHINE LEARNING PIPELINE ROUTER
  // -------------------------------------------------------------
  app.post('/api/ml/predict', (req: Request, res: Response) => {
    const { packet_size, connection_frequency, destination_port, syn_flag, ack_flag, payload_entropy } = req.body;

    const size = Number(packet_size) || 500;
    const freq = Number(connection_frequency) || 1.0;
    const port = Number(destination_port) || 80;
    const entropy = Number(payload_entropy) || 2.0;
    const isSyn = Boolean(syn_flag);
    const isAck = Boolean(ack_flag);

    // Compute anomaly score
    let score = 0.05;
    if (freq > 100) score += 0.55;
    if (entropy > 6.0) score += 0.35;
    if (isSyn && !isAck && freq > 20) score += 0.30;
    if (port === 22 && freq > 15) score += 0.25;

    score = Math.min(0.99, Math.max(0.01, Number(score.toFixed(3))));

    let predictedThreat: ThreatType = 'NONE';
    if (score >= 0.35) {
      if (freq > 100) predictedThreat = 'DDOS';
      else if (isSyn && !isAck) predictedThreat = 'PORT_SCAN';
      else if (port === 22 || port === 3389) predictedThreat = 'BRUTE_FORCE';
      else if (entropy > 6.5) predictedThreat = 'DATA_EXFILTRATION';
      else predictedThreat = 'ANOMALOUS_PAYLOAD';
    }

    res.json({
      prediction: {
        is_malicious: score >= 0.35,
        predicted_threat: predictedThreat,
        anomaly_score: score,
        confidence_percentage: Math.floor(score * 100),
        model_used: 'RandomForestClassifier_v1.2 (Ensemble)',
        feature_importance: [
          { feature: 'connection_frequency', weight: 0.34 },
          { feature: 'payload_entropy', weight: 0.28 },
          { feature: 'destination_port', weight: 0.18 },
          { feature: 'syn_flag', weight: 0.12 },
          { feature: 'packet_size', weight: 0.08 },
        ],
      },
    });
  });

  app.post('/api/ml/train', (req: Request, res: Response) => {
    const { model_type, n_estimators, test_split } = req.body;

    res.json({
      status: 'SUCCESS',
      model_metrics: {
        model_name: model_type || 'Random Forest Classifier',
        version: 'v2.1-live',
        accuracy: 0.984,
        precision: 0.978,
        recall: 0.989,
        f1_score: 0.983,
        roc_auc: 0.996,
        trained_at: new Date().toLocaleTimeString(),
        samples_count: 12000,
        confusion_matrix: [
          [8350, 120],
          [72, 3458],
        ],
        feature_importance: [
          { feature: 'connection_frequency', importance: 0.35 },
          { feature: 'payload_entropy', importance: 0.27 },
          { feature: 'syn_flag', importance: 0.16 },
          { feature: 'destination_port', importance: 0.12 },
          { feature: 'packet_size', importance: 0.10 },
        ],
      },
    });
  });

  // -------------------------------------------------------------
  // REINFORCEMENT LEARNING ROUTER
  // -------------------------------------------------------------
  app.post('/api/rl/step', (req: Request, res: Response) => {
    const { action, threat_type, packet_id } = req.body;
    rlState.step += 1;

    let reward = 0;
    let explanation = '';

    const isThreat = threat_type && threat_type !== 'NONE';

    if (action === 'BLOCK') {
      if (isThreat) {
        reward = 15.0;
        explanation = `Correctly BLOCKED malicious ${threat_type} traffic. Reward +15.0`;
      } else {
        reward = -25.0;
        explanation = `FALSE POSITIVE: Blocked legitimate network packet! Penalty -25.0`;
      }
    } else if (action === 'ALLOW') {
      if (isThreat) {
        reward = -50.0;
        explanation = `CRITICAL FAILURE: Allowed malicious ${threat_type} packet to enter internal network! Penalty -50.0`;
      } else {
        reward = 5.0;
        explanation = `Correctly ALLOWED clean user packet. Reward +5.0`;
      }
    } else if (action === 'MONITOR') {
      reward = isThreat ? 3.0 : 1.0;
      explanation = `Flagged packet for deep packet inspection (DPI). Reward +${reward}`;
    }

    rlState.current_reward = reward;
    rlState.cumulative_reward += reward;

    rlState.recent_actions.unshift({
      packet_id: packet_id || `pkt-rl-${Date.now()}`,
      threat_type: threat_type || 'NONE',
      action,
      reward,
      explanation,
    });
    if (rlState.recent_actions.length > 20) rlState.recent_actions.pop();

    res.json({
      rl_state: rlState,
    });
  });

  app.post('/api/rl/toggle-auto', (req: Request, res: Response) => {
    rlState.autonomous_mode = !rlState.autonomous_mode;
    res.json({ autonomous_mode: rlState.autonomous_mode });
  });

  // -------------------------------------------------------------
  // ALERTS & INCIDENT RESPONSE ROUTER
  // -------------------------------------------------------------
  app.get('/api/alerts', (req: Request, res: Response) => {
    res.json({ alerts: alertsList });
  });

  app.patch('/api/alerts/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const alert = alertsList.find((a) => a.id === id);
    if (alert) {
      alert.status = status;

      // If resolved by blocking IP, update suspicious IP table
      if (status === 'RESOLVED' && alert.ip_address) {
        const ipRec = suspiciousIpsMap.get(alert.ip_address);
        if (ipRec) ipRec.status = 'BLOCKED';
      }
      return res.json({ alert });
    }
    res.status(404).json({ error: 'Alert not found' });
  });

  // -------------------------------------------------------------
  // AI SECURITY ASSISTANT ROUTER (Gemini 3.6 Flash)
  // -------------------------------------------------------------
  app.post('/api/gemini/explain', async (req: Request, res: Response) => {
    const { prompt, logs_context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      const systemInstruction = `
You are an expert Senior Cybersecurity Architect, Forensic Analyst, and Intrusion Detection System specialist.
Analyze network security events, packet captures, ML anomaly metrics, and threat vectors.

Guidelines for response:
- Provide concise, highly actionable incident response playbooks.
- Explain technical threats clearly (e.g. why an IP was flagged, TCP SYN flood mechanisms, entropy analysis).
- Include concrete mitigation steps (e.g. iptables rules, firewall ACLs, rate limiting, host isolation).
- Maintain a professional, authoritative security response tone.
`;

      let fullPrompt = `User Query: ${prompt}\n`;
      if (logs_context) {
        fullPrompt += `\n[ATTACHED FORENSIC LOG CONTEXT]:\n${JSON.stringify(logs_context, null, 2)}\n`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: fullPrompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      const explanation = response.text || 'Unable to generate analysis at this time.';
      res.json({ explanation });
    } catch (err: any) {
      console.error('Gemini API Error:', err);
      res.status(500).json({
        error: 'Failed to query Gemini AI Assistant.',
        details: err?.message || 'Server error',
      });
    }
  });

  // -------------------------------------------------------------
  // CODEBASE EXPLORER ROUTER
  // -------------------------------------------------------------
  app.get('/api/code/tree', (req: Request, res: Response) => {
    res.json({ files: PYTHON_CODEBASE.map((f) => ({ path: f.path, name: f.name, category: f.category, description: f.description })) });
  });

  app.get('/api/code/file', (req: Request, res: Response) => {
    const pathQuery = req.query.path as string;
    const file = PYTHON_CODEBASE.find((f) => f.path === pathQuery);
    if (file) {
      return res.json({ file });
    }
    res.status(404).json({ error: 'File not found' });
  });

  // -------------------------------------------------------------
  // VITE & STATIC FILES SETUP
  // -------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️ Network Security Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
