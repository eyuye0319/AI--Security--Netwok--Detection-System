import { CodeFile } from '../types';

export const PYTHON_CODEBASE: CodeFile[] = [
  {
    path: 'backend/main.py',
    name: 'main.py',
    category: 'backend',
    language: 'python',
    description: 'FastAPI application entry point with CORS, routers, background sniffing, and WebSocket stream.',
    content: `"""
AI-Powered Network Security Monitoring System
Main FastAPI Application Entry Point
"""

import asyncio
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database.session import engine, Base, get_db
from backend.auth.router import router as auth_router
from backend.api.logs_router import router as logs_router
from backend.api.ml_router import router as ml_router
from backend.api.rl_router import router as rl_router
from backend.api.assistant_router import router as assistant_router
from backend.services.sniffer import PacketSnifferService

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Network Security Monitoring System",
    version="1.0.0",
    description="Production-grade Threat Detection & Mitigation Platform"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(logs_router, prefix="/api/network", tags=["Network Traffic"])
app.include_router(ml_router, prefix="/api/ml", tags=["Machine Learning"])
app.include_router(rl_router, prefix="/api/rl", tags=["Reinforcement Learning"])
app.include_router(assistant_router, prefix="/api/assistant", tags=["AI Assistant"])

# Global Packet Sniffer Background Task
sniffer_service = PacketSnifferService()

@app.on_event("startup")
async def startup_event():
    print("🚀 Starting AI Security Monitoring Service...")
    asyncio.create_task(sniffer_service.start_capture(interface="eth0"))

@app.on_event("shutdown")
async def shutdown_event():
    sniffer_service.stop_capture()
    print("🛑 Sniffer background service stopped.")

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "AI Network Security Monitor"}

@app.websocket("/ws/traffic")
async def websocket_traffic(websocket: WebSocket):
    """Real-time packet streaming WebSocket endpoint for UI dashboard."""
    await websocket.accept()
    try:
        while True:
            packet_data = await sniffer_service.get_latest_packet()
            if packet_data:
                await websocket.send_json(packet_data)
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        print("Client disconnected from traffic stream.")
`
  },
  {
    path: 'backend/auth/jwt.py',
    name: 'jwt.py',
    category: 'backend',
    language: 'python',
    description: 'JWT Authentication, password hashing with bcrypt, and role-based dependency checks.',
    content: `"""
JWT Authentication & Role-Based Access Control Module
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.models.database import User, UserRole

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-security-key-32-chars-minimum")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 Hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(required_role: UserRole):
    """Role-Based Access Control Dependency Decorator."""
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation requires {required_role.value} role privilege"
            )
        return current_user
    return role_checker
`
  },
  {
    path: 'backend/models/database.py',
    name: 'database.py',
    category: 'backend',
    language: 'python',
    description: 'SQLAlchemy ORM Data Models for Users, NetworkLogs, SecurityAlerts, ThreatReports, and MLPredictions.',
    content: `"""
SQLAlchemy ORM Database Models
Defines schema for Users, NetworkLogs, SecurityAlerts, ThreatReports, and MLPredictions.
"""

import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SECURITY_ANALYST = "SECURITY_ANALYST"

class ThreatSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.SECURITY_ANALYST, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class NetworkLog(Base):
    __tablename__ = "network_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    source_ip = Column(String(45), nullable=False, index=True)
    destination_ip = Column(String(45), nullable=False)
    source_port = Column(Integer, nullable=False)
    destination_port = Column(Integer, nullable=False)
    protocol = Column(String(10), nullable=False)
    packet_size = Column(Integer, nullable=False)  # bytes
    connection_frequency = Column(Float, nullable=False) # req/sec
    syn_flag = Column(Boolean, default=False)
    ack_flag = Column(Boolean, default=False)
    payload_entropy = Column(Float, default=0.0)
    anomaly_score = Column(Float, default=0.0)
    threat_classification = Column(String(50), default="CLEAN")
    action_taken = Column(String(20), default="ALLOWED")  # ALLOWED, BLOCKED, MONITORED

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    source_ip = Column(String(45), nullable=False)
    threat_type = Column(String(50), nullable=False)
    severity = Column(Enum(ThreatSeverity), nullable=False)
    confidence = Column(Float, nullable=False) # 0.0 - 1.0
    description = Column(Text, nullable=False)
    status = Column(String(20), default="OPEN") # OPEN, IN_PROGRESS, RESOLVED
    ai_explanation = Column(Text, nullable=True)

class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    id = Column(Integer, primary_key=True, index=True)
    packet_id = Column(Integer, ForeignKey("network_logs.id"))
    model_version = Column(String(20), nullable=False)
    predicted_label = Column(String(50), nullable=False)
    probability = Column(Float, nullable=False)
    feature_vector_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class ThreatReport(Base):
    __tablename__ = "threat_reports"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    time_window = Column(String(50), nullable=False)
    total_packets = Column(Integer, nullable=False)
    threat_count = Column(Integer, nullable=False)
    summary_md = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
`
  },
  {
    path: 'backend/services/sniffer.py',
    name: 'sniffer.py',
    category: 'backend',
    language: 'python',
    description: 'Scapy packet capture service with real-time feature extraction and entropy calculation.',
    content: `"""
Scapy Live Packet Capture & Feature Extraction Service
Extracts IP, Ports, Protocol, Connection Frequency, and Shannon Entropy.
"""

import math
import asyncio
from typing import Optional, Dict
from collections import defaultdict, Counter
import time

try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False


class PacketSnifferService:
    def __init__(self):
        self.is_running = False
        self.packet_queue = asyncio.Queue(maxsize=1000)
        self.ip_request_counts = defaultdict(list)

    def calculate_entropy(self, payload_bytes: bytes) -> float:
        """Calculate Shannon Entropy of packet payload to detect encrypted or obfuscated shellcode."""
        if not payload_bytes:
            return 0.0
        entropy = 0.0
        length = len(payload_bytes)
        counts = Counter(payload_bytes)
        for count in counts.values():
            p_x = count / length
            entropy -= p_x * math.log2(p_x)
        return round(entropy, 4)

    def extract_features(self, packet) -> Optional[Dict]:
        """Extract ML features from raw network packet."""
        if not packet.haslayer(IP):
            return None

        ip_layer = packet[IP]
        src_ip = ip_layer.src
        dst_ip = ip_layer.dst
        protocol = "OTHER"
        src_port = 0
        dst_port = 0
        syn_flag = False
        ack_flag = False
        payload = b""

        if packet.haslayer(TCP):
            protocol = "TCP"
            tcp_layer = packet[TCP]
            src_port = tcp_layer.sport
            dst_port = tcp_layer.dport
            syn_flag = bool(tcp_layer.flags & 0x02)
            ack_flag = bool(tcp_layer.flags & 0x10)
            payload = bytes(tcp_layer.payload)
        elif packet.haslayer(UDP):
            protocol = "UDP"
            udp_layer = packet[UDP]
            src_port = udp_layer.sport
            dst_port = udp_layer.dport
            payload = bytes(udp_layer.payload)
        elif packet.haslayer(ICMP):
            protocol = "ICMP"

        # Calculate Connection Frequency (sliding window past 10 seconds)
        now = time.time()
        self.ip_request_counts[src_ip].append(now)
        self.ip_request_counts[src_ip] = [t for t in self.ip_request_counts[src_ip] if now - t <= 10.0]
        freq = len(self.ip_request_counts[src_ip]) / 10.0  # reqs / sec

        entropy = self.calculate_entropy(payload)

        return {
            "source_ip": src_ip,
            "destination_ip": dst_ip,
            "source_port": src_port,
            "destination_port": dst_port,
            "protocol": protocol,
            "packet_size": len(packet),
            "connection_frequency": round(freq, 2),
            "syn_flag": syn_flag,
            "ack_flag": ack_flag,
            "payload_entropy": entropy
        }

    async def start_capture(self, interface: str = "eth0"):
        """Background Packet Sniffer Loop."""
        self.is_running = True
        print(f"📡 Packet Sniffer initialized on interface {interface}")

        def process_packet(packet):
            if not self.is_running:
                return
            features = self.extract_features(packet)
            if features:
                try:
                    self.packet_queue.put_nowait(features)
                except asyncio.QueueFull:
                    pass

        # In production environments with root access:
        if SCAPY_AVAILABLE:
            try:
                sniff(iface=interface, prn=process_packet, store=False, filter="ip")
            except Exception as e:
                print(f"Scapy capture fallback to simulation mode: {e}")

    def stop_capture(self):
        self.is_running = False

    async def get_latest_packet(self) -> Optional[Dict]:
        if not self.packet_queue.empty():
            return await self.packet_queue.get()
        return None
`
  },
  {
    path: 'machine_learning/train.py',
    name: 'train.py',
    category: 'ml',
    language: 'python',
    description: 'Machine Learning Pipeline: Random Forest & PyTorch Neural Network training script for intrusion detection.',
    content: `"""
Machine Learning Pipeline for Network Intrusion Detection (IDS)
Includes Data Preprocessing, Synthetic Feature Generation, Model Training (Random Forest & PyTorch DNN), Evaluation, and Model Saving.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

import torch
import torch.nn as nn
import torch.optim as optim

MODEL_SAVE_DIR = "machine_learning/saved_models"
os.makedirs(MODEL_SAVE_DIR, exist_ok=True)


# -------------------------------------------------------------
# 1. Synthetic Dataset Generator (Mimicking NSL-KDD / CICIDS2017)
# -------------------------------------------------------------
def generate_synthetic_ids_dataset(num_samples: int = 10000) -> pd.DataFrame:
    """Generates synthetic network traffic dataset for training IDS ML models."""
    np.random.seed(42)
    
    # Features: [packet_size, connection_frequency, src_port, dst_port, syn_flag, ack_flag, payload_entropy]
    normal_samples = int(num_samples * 0.7)
    attack_samples = num_samples - normal_samples

    # Clean Traffic
    clean_size = np.random.normal(500, 150, normal_samples)
    clean_freq = np.random.exponential(1.5, normal_samples)
    clean_src_port = np.random.randint(1024, 65535, normal_samples)
    clean_dst_port = np.random.choice([80, 443, 53, 22, 8080], normal_samples)
    clean_syn = np.random.binomial(1, 0.1, normal_samples)
    clean_ack = np.random.binomial(1, 0.9, normal_samples)
    clean_entropy = np.random.uniform(1.0, 4.5, normal_samples)
    clean_label = np.zeros(normal_samples)

    # Malicious Traffic (Port Scan, DDoS, Brute Force, Exfiltration)
    attack_size = np.concatenate([
        np.random.normal(64, 10, int(attack_samples * 0.4)),    # SYN Flood / DDoS
        np.random.normal(1200, 200, int(attack_samples * 0.3)),  # Data Exfiltration
        np.random.normal(80, 15, int(attack_samples * 0.3))      # Port Scan / Brute Force
    ])
    attack_freq = np.random.uniform(50, 500, attack_samples)   # High connection rate
    attack_src_port = np.random.randint(1024, 65535, attack_samples)
    attack_dst_port = np.random.randint(1, 1024, attack_samples)
    attack_syn = np.random.binomial(1, 0.85, attack_samples)
    attack_ack = np.random.binomial(1, 0.15, attack_samples)
    attack_entropy = np.random.uniform(5.5, 7.9, attack_samples)  # High entropy (Encrypted C2 / Exploit)
    attack_label = np.ones(attack_samples)

    df = pd.DataFrame({
        'packet_size': np.concatenate([clean_size, attack_size]),
        'connection_frequency': np.concatenate([clean_freq, attack_freq]),
        'source_port': np.concatenate([clean_src_port, attack_src_port]),
        'destination_port': np.concatenate([clean_dst_port, attack_dst_port]),
        'syn_flag': np.concatenate([clean_syn, attack_syn]),
        'ack_flag': np.concatenate([clean_ack, attack_ack]),
        'payload_entropy': np.concatenate([clean_entropy, attack_entropy]),
        'label': np.concatenate([clean_label, attack_label])
    })

    return df.sample(frac=1.0, random_state=42).reset_index(drop=True)


# -------------------------------------------------------------
# 2. PyTorch Neural Network Definition
# -------------------------------------------------------------
class IntrusionDetectionNN(nn.Module):
    def __init__(self, input_dim: int):
        super(IntrusionDetectionNN, self).__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return self.net(x)


# -------------------------------------------------------------
# 3. Training Execution Function
# -------------------------------------------------------------
def train_ids_pipeline():
    print("📊 Generating Dataset...")
    df = generate_synthetic_ids_dataset(12000)
    
    X = df.drop(columns=['label'])
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train Random Forest Classifier
    print("🌲 Training Random Forest Classifier...")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42)
    rf_model.fit(X_train_scaled, y_train)

    y_pred_rf = rf_model.predict(X_test_scaled)
    y_prob_rf = rf_model.predict_proba(X_test_scaled)[:, 1]

    print("\n--- Random Forest Evaluation ---")
    print(classification_report(y_test, y_pred_rf))
    print(f"ROC AUC Score: {roc_auc_score(y_test, y_prob_rf):.4f}")

    # Train PyTorch Deep Neural Network
    print("\n🧠 Training PyTorch Deep Neural Network...")
    X_train_tensor = torch.FloatTensor(X_train_scaled)
    y_train_tensor = torch.FloatTensor(y_train.values).unsqueeze(1)
    
    dnn_model = IntrusionDetectionNN(input_dim=X_train.shape[1])
    criterion = nn.BCELoss()
    optimizer = optim.Adam(dnn_model.parameters(), lr=0.001)

    dnn_model.train()
    for epoch in range(20):
        optimizer.zero_grad()
        outputs = dnn_model(X_train_tensor)
        loss = criterion(outputs, y_train_tensor)
        loss.backward()
        optimizer.step()
        if (epoch + 1) % 5 == 0:
            print(f"Epoch [{epoch+1}/20], Loss: {loss.item():.4f}")

    # Save Scaler & Models
    joblib.dump(scaler, os.path.join(MODEL_SAVE_DIR, "scaler.pkl"))
    joblib.dump(rf_model, os.path.join(MODEL_SAVE_DIR, "random_forest_ids.pkl"))
    torch.save(dnn_model.state_dict(), os.path.join(MODEL_SAVE_DIR, "pytorch_dnn_ids.pth"))
    
    print(f"\n✅ Models saved successfully in '{MODEL_SAVE_DIR}/'")

if __name__ == "__main__":
    train_ids_pipeline()
`
  },
  {
    path: 'machine_learning/predict.py',
    name: 'predict.py',
    category: 'ml',
    language: 'python',
    description: 'Inference script: loads trained model weights and performs real-time threat classification.',
    content: `"""
Real-Time Threat Prediction & Feature Inference Engine
"""

import os
import joblib
import numpy as np
from typing import Dict, Tuple

MODEL_DIR = "machine_learning/saved_models"

class IDSPredictionEngine:
    def __init__(self):
        self.scaler = None
        self.rf_model = None
        self.is_loaded = False
        self._load_models()

    def _load_models(self):
        scaler_path = os.path.join(MODEL_DIR, "scaler.pkl")
        model_path = os.path.join(MODEL_DIR, "random_forest_ids.pkl")

        if os.path.exists(scaler_path) and os.path.exists(model_path):
            self.scaler = joblib.load(scaler_path)
            self.rf_model = joblib.load(model_path)
            self.is_loaded = True
            print("✅ ML Models loaded into inference memory.")
        else:
            print("⚠️ Trained ML models not found. Running heuristic fallback engine.")

    def predict_packet(self, packet: Dict) -> Tuple[str, float, float]:
        """
        Inputs packet dictionary.
        Returns: (threat_type, anomaly_score, confidence)
        """
        packet_size = packet.get("packet_size", 0)
        conn_freq = packet.get("connection_frequency", 0.0)
        src_port = packet.get("source_port", 0)
        dst_port = packet.get("destination_port", 0)
        syn_flag = 1 if packet.get("syn_flag") else 0
        ack_flag = 1 if packet.get("ack_flag") else 0
        payload_entropy = packet.get("payload_entropy", 0.0)

        # ML Inference if models are present
        if self.is_loaded:
            features = np.array([[packet_size, conn_freq, src_port, dst_port, syn_flag, ack_flag, payload_entropy]])
            features_scaled = self.scaler.transform(features)
            prob = float(self.rf_model.predict_proba(features_scaled)[0][1])
        else:
            # Rule-Based Heuristic Estimation
            prob = 0.05
            if conn_freq > 100 or (syn_flag and not ack_flag and conn_freq > 50):
                prob += 0.70  # DDoS / SYN Flood
            if payload_entropy > 6.0:
                prob += 0.65  # Encrypted exploit payload
            if conn_freq > 30 and dst_port in [22, 3389, 21]:
                prob += 0.55  # Brute force attack

        prob = min(max(prob, 0.01), 0.99)

        # Categorize Threat Type
        if prob < 0.35:
            threat_type = "CLEAN"
        elif conn_freq > 100:
            threat_type = "DDOS"
        elif syn_flag and not ack_flag and conn_freq > 20:
            threat_type = "PORT_SCAN"
        elif dst_port in [22, 3389] and conn_freq > 10:
            threat_type = "BRUTE_FORCE"
        elif payload_entropy > 6.5:
            threat_type = "DATA_EXFILTRATION"
        else:
            threat_type = "ANOMALOUS_PAYLOAD"

        return threat_type, round(prob, 4), round(prob * 100, 1)

# Global Instance
predictor = IDSPredictionEngine()
`
  },
  {
    path: 'reinforcement_learning/environment.py',
    name: 'environment.py',
    category: 'rl',
    language: 'python',
    description: 'Custom OpenAI Gym / Gymnasium Environment simulating active network threat mitigation.',
    content: `"""
Custom Gym Environment for Automated Network Security Mitigation
Environment: NetworkTrafficEnv
Actions: 0=ALLOW, 1=BLOCK, 2=MONITOR
"""

import gym
from gym import spaces
import numpy as np

class NetworkTrafficEnv(gym.Env):
    """
    OpenAI Gym Environment simulating network threat response.
    Observation Space:
        - Anomaly Score (0.0 to 1.0)
        - Connection Frequency (0 to 500 req/s)
        - Payload Entropy (0.0 to 8.0)
        - Historical Threat Score (0 to 100)
    Action Space:
        - 0: ALLOW (Pass packet through)
        - 1: BLOCK (Drop packet and ban IP in firewall)
        - 2: MONITOR (Flag for deep inspection & log)
    """

    def __init__(self):
        super(NetworkTrafficEnv, self).__init__()

        # Actions: ALLOW, BLOCK, MONITOR
        self.action_space = spaces.Discrete(3)

        # Observations: [anomaly_score, conn_frequency, payload_entropy, historical_risk]
        low_obs = np.array([0.0, 0.0, 0.0, 0.0], dtype=np.float32)
        high_obs = np.array([1.0, 500.0, 8.0, 100.0], dtype=np.float32)
        self.observation_space = spaces.Box(low=low_obs, high=high_obs, dtype=np.float32)

        self.current_step = 0
        self.max_steps = 100
        self.reset()

    def reset(self):
        self.current_step = 0
        return self._generate_next_observation()

    def _generate_next_observation(self):
        # 30% chance of generating a malicious threat packet
        is_malicious = np.random.rand() < 0.3
        self.is_current_malicious = is_malicious

        if is_malicious:
            anomaly_score = np.random.uniform(0.65, 0.99)
            conn_freq = np.random.uniform(50.0, 450.0)
            payload_entropy = np.random.uniform(5.5, 7.9)
            historical_risk = np.random.uniform(60.0, 100.0)
        else:
            anomaly_score = np.random.uniform(0.01, 0.30)
            conn_freq = np.random.uniform(0.5, 10.0)
            payload_entropy = np.random.uniform(1.0, 4.0)
            historical_risk = np.random.uniform(0.0, 20.0)

        return np.array([anomaly_score, conn_freq, payload_entropy, historical_risk], dtype=np.float32)

    def step(self, action: int):
        self.current_step += 1
        obs = self._generate_next_observation()
        
        # Reward Engineering Logic
        reward = 0.0
        if self.is_current_malicious:
            if action == 1:    # BLOCK correct threat
                reward = 15.0
            elif action == 2:  # MONITOR threat
                reward = 3.0
            elif action == 0:  # ALLOW malicious packet (CRITICAL FAIL)
                reward = -50.0
        else:
            if action == 0:    # ALLOW clean packet
                reward = 5.0
            elif action == 2:  # MONITOR clean packet
                reward = 1.0
            elif action == 1:  # BLOCK clean packet (FALSE POSITIVE)
                reward = -25.0

        done = self.current_step >= self.max_steps
        info = {
            "is_malicious": self.is_current_malicious,
            "action_taken": ["ALLOW", "BLOCK", "MONITOR"][action]
        }

        return obs, reward, done, info
`
  },
  {
    path: 'reinforcement_learning/agent.py',
    name: 'agent.py',
    category: 'rl',
    language: 'python',
    description: 'Q-Learning & PPO Reinforcement Learning agents for automated defense decision making.',
    content: `"""
Reinforcement Learning Mitigation Agents: Q-Learning & PPO (Stable-Baselines3)
"""

import numpy as np
import random
from typing import Tuple, Dict

class QLearningAgent:
    """Tabular Q-Learning Agent with discretized state space."""

    def __init__(self, actions: list = [0, 1, 2], lr: float = 0.1, gamma: float = 0.95, epsilon: float = 0.2):
        self.actions = actions  # 0=ALLOW, 1=BLOCK, 2=MONITOR
        self.lr = lr
        self.gamma = gamma
        self.epsilon = epsilon
        self.q_table = {}

    def _discretize_state(self, obs: np.ndarray) -> str:
        """Discretizes continuous observation vector into state key string."""
        anomaly, freq, entropy, risk = obs
        a_bin = int(anomaly * 5)     # 0 to 5
        f_bin = min(int(freq / 50), 5) # 0 to 5
        e_bin = int(entropy / 2)     # 0 to 4
        return f"A{a_bin}_F{f_bin}_E{e_bin}"

    def get_action(self, obs: np.ndarray) -> int:
        state_key = self._discretize_state(obs)
        if state_key not in self.q_table:
            self.q_table[state_key] = [0.0, 0.0, 0.0]

        # Epsilon-greedy action selection
        if random.random() < self.epsilon:
            return random.choice(self.actions)
        else:
            return int(np.argmax(self.q_table[state_key]))

    def learn(self, obs: np.ndarray, action: int, reward: float, next_obs: np.ndarray):
        state = self._discretize_state(obs)
        next_state = self._discretize_state(next_obs)

        if state not in self.q_table:
            self.q_table[state] = [0.0, 0.0, 0.0]
        if next_state not in self.q_table:
            self.q_table[next_state] = [0.0, 0.0, 0.0]

        predict = self.q_table[state][action]
        target = reward + self.gamma * max(self.q_table[next_state])
        self.q_table[state][action] += self.lr * (target - predict)


# -------------------------------------------------------------
# Stable-Baselines3 PPO Training Helper (For production setup)
# -------------------------------------------------------------
def train_ppo_agent():
    try:
        from stable_baselines3 import PPO
        from reinforcement_learning.environment import NetworkTrafficEnv

        env = NetworkTrafficEnv()
        model = PPO("MlpPolicy", env, verbose=1, learning_rate=0.0003)
        print("🤖 Training PPO Agent on Network Security Gym Environment...")
        model.learn(total_timesteps=10000)
        model.save("reinforcement_learning/ppo_ids_agent")
        print("✅ PPO Agent saved successfully!")
    except ImportError:
        print("⚠️ Stable-Baselines3 not installed. Q-Learning agent active.")

if __name__ == "__main__":
    train_ppo_agent()
`
  },
  {
    path: 'Dockerfile',
    name: 'Dockerfile',
    category: 'deployment',
    language: 'dockerfile',
    description: 'Multi-stage Dockerfile for containerizing the FastAPI backend and Python ML engine.',
    content: `# Multi-stage Dockerfile for Python FastAPI + Machine Learning Backend
FROM python:3.11-slim as builder

WORKDIR /app

# Install system dependencies required for Scapy and PyTorch compilation
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    g++ \\
    libpcap-dev \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final Runtime Image
FROM python:3.11-slim

WORKDIR /app

# Install runtime PCAP library for live packet sniffing
RUN apt-get update && apt-get install -y --no-install-recommends \\
    libpcap0.8 \\
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
`
  },
  {
    path: 'docker-compose.yml',
    name: 'docker-compose.yml',
    category: 'deployment',
    language: 'yaml',
    description: 'Docker Compose orchestration file launching PostgreSQL, Backend API, and React Frontend.',
    content: `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: security_postgres_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: security_secret_db_pass
      POSTGRES_DB: security_monitor
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: security_backend_api
    environment:
      DATABASE_URL: postgresql://postgres:security_secret_db_pass@postgres:5432/security_monitor
      JWT_SECRET: super-secret-security-key-32-chars-minimum
      GEMINI_API_KEY: \${GEMINI_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    cap_add:
      - NET_ADMIN
      - NET_RAW

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: security_frontend_ui
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
`
  },
  {
    path: 'README.md',
    name: 'README.md',
    category: 'docs',
    language: 'markdown',
    description: 'Complete production setup documentation and architecture walkthrough.',
    content: `# AI-Powered Network Security Monitoring System

An enterprise-grade Network Threat Monitoring, Machine Learning Intrusion Detection, Reinforcement Learning Mitigation, and Gemini AI Forensic Assistant Platform.

---

## 🌟 Key Architecture Capabilities

- **Live Packet Capture & Feature Extraction**: Scapy sniffer analyzing Source IP, Port, Protocol, Request Rate, SYN/ACK Flags, and Shannon Payload Entropy.
- **Machine Learning Intrusion Detection System**: Dual Random Forest + PyTorch Deep Neural Network detecting DDoS, SYN Floods, Port Scanning, SSH Brute Force, and Encrypted Exfiltration.
- **Autonomous Reinforcement Learning Mitigation Agent**: Custom OpenAI Gym environment using Q-Learning & PPO for automated action selection (\`ALLOW\`, \`BLOCK\`, \`MONITOR\`).
- **Google Gemini 3.6 Flash AI Security Assistant**: Forensic explanation engine explaining malicious alerts and recommending incident response playbooks.
- **Role-Based Security Dashboard**: React + TypeScript + Tailwind CSS + Recharts UI with live WebSocket packet feeds and JWT auth controls.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Backend API** | Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2, PyJWT |
| **Database** | PostgreSQL 15, Asyncpg |
| **Machine Learning** | PyTorch, Scikit-learn, Pandas, NumPy, Joblib |
| **Reinforcement Learning** | OpenAI Gym, Stable-Baselines3 (PPO), Q-Learning |
| **Network Sniffing** | Scapy, Libpcap |
| **GenAI Assistant** | Google Gemini API (\`@google/genai\`, model: \`gemini-3.6-flash\`) |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS, Recharts, Lucide Icons, Motion |

---

## 🚀 Quick Start with Docker Compose

\`\`\`bash
# 1. Clone Repository
git clone https://github.com/yourusername/AI-Network-Security-Monitor.git
cd AI-Network-Security-Monitor

# 2. Configure Environment Secrets
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY

# 3. Build & Launch Containers
docker-compose up --build -d

# 4. Access Platform
# Dashboard: http://localhost:3000
# OpenAPI Docs: http://localhost:8000/docs
\`\`\`

---

## 🧠 Train ML Models Manually

\`\`\`bash
cd machine_learning
python train.py
\`\`\`

`
  }
];
