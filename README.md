# 🛡️ AegisSec AI-NIDS: AI-Powered Network Intrusion Detection & Response Platform

![AegisSec Architecture Banner](https://img.shields.io/badge/AegisSec-AI--NIDS-0A0C10?style=for-the-badge&logo=shield&logoColor=3B82F6)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Gemini 3.6 Flash](https://img.shields.io/badge/Gemini_3.6_Flash-8E75FF?style=for-the-badge&logo=google&logoColor=white)

An enterprise-grade, real-time **Network Intrusion Detection System (NIDS)** and automated incident response platform. AegisSec combines deep packet feature inspection, supervised machine learning (Random Forest & PyTorch DNN), reinforcement learning autonomous mitigation (Q-Learning / OpenAI Gym), and server-side **Gemini AI Security Intelligence** into a cohesive Security Operations Center (SOC) dashboard.

---

## 📋 Table of Contents

- [Key Architecture Features](#-key-architecture-features)
- [System Architecture Diagram](#-system-architecture-diagram)
- [Detailed Module Capabilities](#-detailed-module-capabilities)
  - [1. Real-Time Packet Sniffer & Feature Extractor](#1-real-time-packet-sniffer--feature-extractor)
  - [2. Supervised ML Detection Pipeline](#2-supervised-ml-detection-pipeline)
  - [3. Reinforcement Learning Autonomous Defense Agent](#3-reinforcement-learning-autonomous-defense-agent)
  - [4. Gemini AI Security Specialist](#4-gemini-ai-security-specialist)
  - [5. Incident Triage & Automated Threat Intelligence Reports](#5-incident-triage--automated-threat-intelligence-reports)
  - [6. Full Python Backend Reference Architecture](#6-full-python-backend-reference-architecture)
  - [7. Role-Based Access Control (RBAC) & JWT Security](#7-role-based-access-control-rbac--jwt-security)
- [Tech Stack](#-tech-stack)
- [REST API Reference](#-rest-api-reference)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Environment Variables](#-environment-variables)
- [License & Security Disclaimer](#-license--security-disclaimer)

---

## 🔑 Key Architecture Features

- **7-Vector Deep Feature Extraction**: Measures Network IP pairs, Transport Ports, Protocol headers, Frame size, Connection frequency rate (req/s), TCP SYN/ACK flags, and Payload Shannon Entropy ($0.0 \rightarrow 8.0$).
- **Multi-Model Machine Learning Engine**: Trains and evaluates Scikit-learn Random Forests and PyTorch Deep Neural Networks (DNN) on NSL-KDD and CICIDS2017 dataset feature spaces with full ROC-AUC, confusion matrix, and feature importance weighting.
- **Gym RL Autonomous Mitigation Engine**: Uses discretized state representations and reward matrix optimization to automatically issue `ALLOW`, `BLOCK`, or `MONITOR` actions on live packet streams.
- **Gemini 3.6 Flash SOC Specialist**: Integrates Google Generative AI server-side (`@google/genai`) to provide deep forensic analysis, attack vector explanations, and copyable `iptables` or cloud security group firewall rules.
- **Live Security Operations Dashboard**: Interactive throughput bandwidth gauges, malicious traffic percentage counters, attack vector distribution charts, and synthetic attack simulation injection.
- **Production Python Architecture Explorer**: Embedded code inspector showcasing clean, modular Python source code for FastAPI, Scapy packet sniffing, PyTorch model definitions, Gym environments, and Docker container configurations.

---

## 📐 System Architecture Diagram

```
                             +-----------------------------------+
                             |     Live Network Packet Source    |
                             +-----------------+-----------------+
                                               |
                                               v
                             +-----------------+-----------------+
                             | Scapy Packet Capture & Feature   |
                             | Engine (IP, Port, Flags, Entropy) |
                             +-----------------+-----------------+
                                               |
                                               v
                          +--------------------+--------------------+
                          |                                         |
                          v                                         v
            +-------------+-------------+             +-------------+-------------+
            |  Supervised ML Engine     |             |  Gym RL Mitigation Agent   |
            | (Random Forest / PyTorch) |             | (State Discretization)    |
            +-------------+-------------+             +-------------+-------------+
                          |                                         |
                          +--------------------+--------------------+
                                               |
                                               v
                             +-----------------+-----------------+
                             | Express / Node.js Proxy Server    |
                             | (JWT Auth, WebSocket / Polling)   |
                             +-----------------+-----------------+
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
      +--------------+--------------+                     +--------------+--------------+
      | Gemini 3.6 Flash API        |                     | React 19 Clean Minimalism   |
      | (Server-Side LLM Specialist)|                     | SOC Control Center UI       |
      +-----------------------------+                     +-----------------------------+
```

---

## 🔍 Detailed Module Capabilities

### 1. Real-Time Packet Sniffer & Feature Extractor
Inspects network traffic at the packet level. Every captured network frame records a 7-element feature vector:
1. **Source IP & Source Port**: Identity and port origin.
2. **Destination IP & Destination Port**: Targeted service endpoint (e.g., HTTP:80, HTTPS:443, SSH:22, RDP:3389).
3. **Protocol**: Protocol framing (TCP, UDP, ICMP, HTTP, HTTPS).
4. **Packet Size**: Total frame byte payload length.
5. **Connection Frequency**: Consecutive requests per second from the source IP address.
6. **TCP Flags**: Binary masks for `SYN` (Connection Request) and `ACK` (Acknowledgement).
7. **Payload Shannon Entropy**: Calculates mathematical entropy:
   $$H(X) = -\sum_{i=1}^{n} P(x_i) \log_2 P(x_i)$$
   High entropy values ($\ge 6.5$) signal encrypted data exfiltration, packed malware executables, or obfuscated shellcode.

### 2. Supervised ML Detection Pipeline
- **Model Training Studio**: Hyperparameter selection (tree estimators, epochs) for Random Forest Classifiers and PyTorch Deep Neural Networks.
- **Metrics Evaluator**: Displays Accuracy, Precision, Recall, F1-Score, and ROC-AUC metrics along with confusion matrices ($2 \times 2$) and feature importance percentages.
- **Interactive Inference Playground**: Test custom feature vectors directly in the UI to evaluate predicted anomaly probability scores and confidence intervals.

### 3. Reinforcement Learning Autonomous Defense Agent
- **Gym Environment Design**: State space discretized by anomaly level, request frequency, and entropy bounds.
- **Reward Function Engineering**:
  - `Correctly Block Threat`: **+15.0**
  - `Correctly Allow Clean Traffic`: **+5.0**
  - `Monitor Suspicious Traffic`: **+3.0**
  - `False Positive Block`: **-25.0**
  - `Missed Attack (False Negative)`: **-50.0**
- **Q-Table Matrix Visualizer**: Inspect learned Q-values $Q(s, a)$ mapping state keys (`HIGH_ANOMALY_HIGH_FREQ`, `PORT_SCAN_PATTERN`, etc.) to optimal mitigation actions.
- **Autonomous Mode**: Toggle hands-free automated blocking of flagged attack packets in real time.

### 4. Gemini AI Security Specialist
- **Integration**: Leverages the official `@google/genai` TypeScript SDK using `gemini-3.6-flash`.
- **Server-Side Key Protection**: Requests pass securely through the Express server endpoint (`/api/gemini/explain`), ensuring secret API keys are never exposed to client browsers.
- **Features**:
  - One-click packet context injection.
  - Generates clear threat explanations and root cause analysis.
  - Outputs copyable Linux `iptables` rules and SOC playbooks.

### 5. Incident Triage & Automated Threat Intelligence Reports
- **Alert Queue**: Real-time listing of flagged security alerts with severity classifications (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- **Triage Actions**: Mark alerts as `RESOLVED` (enforces IP block), `FALSE_POSITIVE`, or `IN_PROGRESS`.
- **Markdown Report Generator**: Compiles executive summaries, threat taxonomy tables, and mitigation recommendations into downloadable `.md` reports.

### 6. Full Python Backend Reference Architecture
Includes full production Python source files accessible directly via the Codebase Explorer tab:
- `backend/main.py`: FastAPI server with asynchronous endpoints, CORS, and Pydantic validation schemas.
- `backend/sniffer.py`: Scapy packet capturer thread extracting packet features.
- `backend/ml_engine.py`: PyTorch PyTorch Neural Network architecture and Scikit-learn pipeline definitions.
- `backend/rl_agent.py`: OpenAI Gymnasium custom NIDS environment with Q-Learning agent logic.
- `Dockerfile` & `requirements.txt`: Container deployment configuration for Cloud Run or Kubernetes.

### 7. Role-Based Access Control (RBAC) & JWT Security
- **Authentication**: JWT token verification signed with server-side secrets.
- **Password Security**: Password hashing using `bcryptjs` (salt rounds = 8).
- **Roles**:
  - `ADMIN`: Full operational access, including triggering manual attack simulations and configuring RL autonomous defense modes.
  - `SECURITY_ANALYST`: Incident triage, log inspection, AI assistant queries, and report generation.

---

## 💻 Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Tailwind CSS, Lucide React, Recharts, Motion |
| **Server Engine** | Node.js, Express, ESBuild, TSX, JWT, Bcrypt.js |
| **AI Integration** | Google `@google/genai` SDK (`gemini-3.6-flash`) |
| **Python Architecture** | FastAPI, Scapy, PyTorch, Scikit-learn, Gymnasium, Pandas, NumPy |
| **Styling & Design** | Clean Minimalism Dark Theme (`#0A0C10` background, `#0F172A` cards, `#1E293B` borders) |

---

## 📡 REST API Reference

### Traffic & Packet Stream Endpoints
- `GET /api/network/traffic`: Fetches live packet buffer, aggregate traffic metrics, and suspicious IP lists.
- `POST /api/network/simulate-attack`: Injects synthetic threat vector packets (`DDOS`, `PORT_SCAN`, `BRUTE_FORCE`, `DATA_EXFILTRATION`, `ANOMALOUS_PAYLOAD`).
- `POST /api/network/control`: Pause or resume live stream capture; adjust packet capture rate per second ($1 \rightarrow 10$).

### Machine Learning & RL Endpoints
- `POST /api/ml/train`: Triggers training pipeline for Random Forest or PyTorch DNN models.
- `POST /api/ml/predict`: Evaluates feature vector payload and returns threat classification, anomaly score, and confidence.
- `POST /api/rl/step`: Manually steps the OpenAI Gym RL environment with a specific action.
- `POST /api/rl/toggle-auto`: Toggles autonomous defense mode on or off.

### Gemini AI & Alert Endpoints
- `POST /api/gemini/explain`: Proxies AI forensic analysis queries securely to `gemini-3.6-flash`.
- `GET /api/alerts`: Retrieves active security incident alerts.
- `PATCH /api/alerts/:id`: Updates incident triage status (`RESOLVED`, `FALSE_POSITIVE`, `IN_PROGRESS`).

### Auth & User Endpoints
- `POST /api/auth/register`: Registers a new user account with assigned role privileges.
- `POST /api/auth/login`: Authenticates username/password and issues signed JWT bearer tokens.
- `GET /api/auth/me`: Verifies active JWT token and returns user profile metadata.


## 🛡️ License & Security Disclaimer

This software is designed for educational, research, and legitimate Security Operations Center (SOC) monitoring purposes. When deploying live network packet sniffing capabilities in production environments, ensure appropriate network authorization and regulatory compliance.
