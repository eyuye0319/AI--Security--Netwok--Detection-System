export type UserRole = 'ADMIN' | 'SECURITY_ANALYST';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export type ProtocolType = 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS' | 'DNS';

export type ThreatType = 'NONE' | 'PORT_SCAN' | 'BRUTE_FORCE' | 'DDOS' | 'DATA_EXFILTRATION' | 'ANOMALOUS_PAYLOAD';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface NetworkPacket {
  id: string;
  timestamp: string;
  source_ip: string;
  source_port: number;
  destination_ip: string;
  destination_port: number;
  protocol: ProtocolType;
  packet_size: number; // bytes
  connection_frequency: number; // requests/sec
  syn_flag: boolean;
  ack_flag: boolean;
  payload_entropy: number; // 0.0 - 8.0
  anomaly_score: number; // 0.0 - 1.0
  threat_type: ThreatType;
  country_code: string;
  country_name: string;
  action_taken: 'ALLOWED' | 'BLOCKED' | 'MONITORED';
}

export interface SuspiciousIP {
  ip: string;
  country: string;
  country_code: string;
  total_packets: number;
  threat_score: number; // 0 - 100
  primary_attack: ThreatType;
  status: 'ACTIVE' | 'BLOCKED' | 'WHITELISTED';
  first_seen: string;
  last_seen: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  ip_address: string;
  threat_type: ThreatType;
  severity: SeverityLevel;
  confidence: number; // percentage 0 - 100
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'FALSE_POSITIVE';
  assigned_to?: string;
  ai_summary?: string;
  packet_sample?: NetworkPacket;
}

export interface ThreatReport {
  id: string;
  generated_at: string;
  title: string;
  time_range: string;
  total_packets_analyzed: number;
  threats_detected: number;
  top_target_ports: number[];
  top_attack_vectors: { name: string; count: number }[];
  summary: string;
  mitigation_steps: string[];
}

export interface MlModelMetrics {
  model_name: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  trained_at: string;
  samples_count: number;
  confusion_matrix: number[][]; // 2x2 or 5x5
  feature_importance: { feature: string; importance: number }[];
}

export interface RlState {
  episode: number;
  step: number;
  current_reward: number;
  cumulative_reward: number;
  accuracy: number;
  q_table: Record<string, Record<string, number>>; // state_key -> { ALLOW: number, BLOCK: number, MONITOR: number }
  recent_actions: {
    packet_id: string;
    threat_type: ThreatType;
    action: 'ALLOW' | 'BLOCK' | 'MONITOR';
    reward: number;
    explanation: string;
  }[];
  autonomous_mode: boolean;
}

export interface CodeFile {
  path: string;
  name: string;
  category: 'backend' | 'ml' | 'rl' | 'deployment' | 'docs';
  language: 'python' | 'dockerfile' | 'yaml' | 'markdown';
  content: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: string;
  text: string;
  logs_context?: {
    ip?: string;
    alert_id?: string;
    threat_type?: ThreatType;
    packet_id?: string;
  };
}
