import React, { useState } from 'react';
import { Cpu, Play, BarChart2, CheckCircle2, ShieldAlert, Layers, Sliders, Zap } from 'lucide-react';
import { MlModelMetrics, ThreatType } from '../types';

export const MlPipelineStudio: React.FC = () => {
  const [modelType, setModelType] = useState<'Random Forest Classifier' | 'PyTorch Deep Neural Network'>('Random Forest Classifier');
  const [nEstimators, NEstimators] = useState<number>(100);
  const [isTraining, setIsTraining] = useState<boolean>(false);

  const [metrics, setMetrics] = useState<MlModelMetrics>({
    model_name: 'Random Forest Classifier',
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
  });

  // Test Inference Form State
  const [testPacketSize, setTestPacketSize] = useState<number>(64);
  const [testConnFreq, setTestConnFreq] = useState<number>(180);
  const [testDstPort, setTestDstPort] = useState<number>(80);
  const [testEntropy, setTestEntropy] = useState<number>(3.2);
  const [testSynFlag, setTestSynFlag] = useState<boolean>(true);
  const [testAckFlag, setTestAckFlag] = useState<boolean>(false);

  const [inferenceResult, setInferenceResult] = useState<any>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);

  const handleTrainModel = async () => {
    setIsTraining(true);
    try {
      const res = await fetch('/api/ml/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_type: modelType, n_estimators: nEstimators }),
      });
      const data = await res.json();
      if (data.model_metrics) {
        setMetrics(data.model_metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTraining(false);
    }
  };

  const handleRunInference = async () => {
    setIsInferring(true);
    try {
      const res = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packet_size: testPacketSize,
          connection_frequency: testConnFreq,
          destination_port: testDstPort,
          payload_entropy: testEntropy,
          syn_flag: testSynFlag,
          ack_flag: testAckFlag,
        }),
      });
      const data = await res.json();
      setInferenceResult(data.prediction);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInferring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Cpu className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Machine Learning Intrusion Detection Pipeline</h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Data Preprocessing, Feature Engineering, Model Training (Random Forest & PyTorch DNN), and Real-Time Inference Engine
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model Trainer Controls (1 col) */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-5">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Model Training Studio</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Model Architecture</label>
            <select
              value={modelType}
              onChange={(e: any) => setModelType(e.target.value)}
              className="w-full bg-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-500"
            >
              <option value="Random Forest Classifier">Random Forest Classifier (Scikit-Learn)</option>
              <option value="PyTorch Deep Neural Network">PyTorch Deep Neural Network (DNN)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Hyperparameters (Trees / Epochs): {nEstimators}</label>
            <input
              type="range"
              min="20"
              max="300"
              step="10"
              value={nEstimators}
              onChange={(e) => NEstimators(Number(e.target.value))}
              className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 text-xs space-y-2">
            <span className="font-semibold text-cyan-300">Extracted Feature Vector:</span>
            <ul className="list-disc list-inside text-slate-400 space-y-1 text-[11px]">
              <li>Packet Size (bytes)</li>
              <li>Connection Frequency (req/sec)</li>
              <li>Destination Port & Source Port</li>
              <li>SYN / ACK Flag Binary Masks</li>
              <li>Payload Shannon Entropy (0.0 - 8.0)</li>
            </ul>
          </div>

          <button
            onClick={handleTrainModel}
            disabled={isTraining}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-900/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isTraining ? (
              <span>Training Model on 12,000 Samples...</span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Model Training</span>
              </>
            )}
          </button>
        </div>

        {/* Model Evaluation Metrics & Confusion Matrix (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-white">Model Performance & Validation Metrics</h3>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-800">
                {metrics.model_name}
              </span>
            </div>
            <p className="text-xs text-slate-400">Validated on 2,400 test packet vectors (NSL-KDD / CICIDS2017 distribution)</p>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400">Accuracy</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{(metrics.accuracy * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400">Precision</span>
              <p className="text-xl font-bold font-mono text-cyan-400 mt-1">{(metrics.precision * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400">Recall</span>
              <p className="text-xl font-bold font-mono text-indigo-400 mt-1">{(metrics.recall * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
              <span className="text-[10px] uppercase font-bold text-slate-400">ROC-AUC</span>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1">{metrics.roc_auc.toFixed(3)}</p>
            </div>
          </div>

          {/* Feature Importance Rankings */}
          <div>
            <h4 className="text-xs font-bold uppercase text-slate-300 mb-3">Feature Importance Weights</h4>
            <div className="space-y-2 text-xs">
              {metrics.feature_importance.map((f) => (
                <div key={f.feature} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-mono text-slate-300">{f.feature}</span>
                    <span className="font-bold text-cyan-400">{(f.importance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-1.5 rounded-full"
                      style={{ width: `${f.importance * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time ML Inference Playground */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-6">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Real-Time ML Inference Playground</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Input custom packet feature parameters to test live ML threat prediction</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Packet Size (B)</label>
            <input
              type="number"
              value={testPacketSize}
              onChange={(e) => setTestPacketSize(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 px-3 py-2 rounded-lg border border-slate-700"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Connection Rate (req/s)</label>
            <input
              type="number"
              value={testConnFreq}
              onChange={(e) => setTestConnFreq(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 px-3 py-2 rounded-lg border border-slate-700"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Dest Port</label>
            <input
              type="number"
              value={testDstPort}
              onChange={(e) => setTestDstPort(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 px-3 py-2 rounded-lg border border-slate-700"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Payload Entropy (0-8)</label>
            <input
              type="number"
              step="0.1"
              value={testEntropy}
              onChange={(e) => setTestEntropy(Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 px-3 py-2 rounded-lg border border-slate-700"
            />
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="synFlag"
              checked={testSynFlag}
              onChange={(e) => setTestSynFlag(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <label htmlFor="synFlag" className="text-slate-300">SYN Flag</label>
          </div>
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="ackFlag"
              checked={testAckFlag}
              onChange={(e) => setTestAckFlag(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <label htmlFor="ackFlag" className="text-slate-300">ACK Flag</label>
          </div>
        </div>

        <button
          onClick={handleRunInference}
          disabled={isInferring}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          {isInferring ? 'Running ML Inference...' : 'Predict Threat Score'}
        </button>

        {/* Inference Output Box */}
        {inferenceResult && (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">ML Prediction Result:</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded ${
                  inferenceResult.is_malicious
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                }`}
              >
                {inferenceResult.is_malicious ? `MALICIOUS: ${inferenceResult.predicted_threat}` : 'CLEAN TRAFFIC'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-slate-300">
              <div>
                <span className="text-slate-500 text-[10px]">Anomaly Score:</span>
                <p className="text-lg font-bold text-cyan-400">{(inferenceResult.anomaly_score * 100).toFixed(1)}%</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Confidence:</span>
                <p className="text-lg font-bold text-indigo-400">{inferenceResult.confidence_percentage}%</p>
              </div>
              <div>
                <span className="text-slate-500 text-[10px]">Active Model:</span>
                <p className="text-xs font-semibold text-slate-200 mt-1">{inferenceResult.model_used}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
