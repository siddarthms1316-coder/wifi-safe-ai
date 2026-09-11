import React, { useState } from 'react';
import {
  Server,
  Cpu,
  Radio,
  ArrowRight,
  CheckCircle2,
  Code2,
  Layers,
  ShieldCheck,
  Zap,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const samplePayload = {
    header: {
      version: '1.2.0',
      source_device_id: 'esp32-csi-node-04a',
      hardware_platform: 'ESP32-S3 / 802.11n',
      frequency_band_ghz: 2.412,
      channel_number: 1,
      bandwidth_mhz: 20,
      timestamp_epoch_ms: 1773229204128,
      frame_sequence_no: 84920,
    },
    rf_telemetry: {
      rssi_dbm: -58,
      noise_floor_dbm: -92,
      snr_db: 34,
      tx_mac: '74:4d:bd:1a:2e:90',
      rx_mac: 'ec:da:3b:55:01:c2',
    },
    csi_matrix: {
      subcarrier_count: 52,
      subcarrier_indices: [-26, -25, -24, '...', 24, 25, 26],
      raw_amplitudes: [22.4, 23.1, 24.0, 25.8, 23.9, 21.2],
      unwrapped_phases_rad: [-1.42, -1.35, -1.28, -1.19, -1.05],
    },
  };

  const copySchema = () => {
    navigator.clipboard.writeText(JSON.stringify(samplePayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-serif">
      {/* Header */}
      <div className="p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-300 border border-zinc-400 text-zinc-950">
            <Server className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-black font-['Playfair_Display',serif]">
            Hardware-Ready Software Architecture
          </h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-300 border border-zinc-400 text-zinc-950 font-bold">
            HARDWARE-INDEPENDENT DESIGN
          </span>
        </div>
        <p className="text-xs text-zinc-700 max-w-3xl mt-1 font-serif">
          Wi-Safe AI decouples RF signal ingestion from spatial inference. The exact same feature
          extraction and AI classifiers running on this simulator can consume live hardware streams
          over WebSocket or gRPC without rewriting a single line of inference code.
        </p>
      </div>

      {/* Dual Pipeline Comparison: Current vs Future */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Prototype */}
        <div className="p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-400 pb-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-800 uppercase tracking-wider block">
                PHASE 1 (HACKATHON)
              </span>
              <h3 className="text-base font-bold text-zinc-950 font-['Playfair_Display',serif]">
                Current Software Prototype
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-300 border border-zinc-400 text-zinc-950 font-bold">
              BROWSER SIMULATION
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#cbd1d8] border border-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-zinc-800" />
                <div>
                  <div className="font-bold text-zinc-950 font-serif">CSI/RF Physics Simulator</div>
                  <div className="text-[10px] text-zinc-600 font-serif">
                    Synthetic 30/52 subcarrier OFDM frames (20–100 Hz)
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-zinc-900 font-bold">ACTIVE</span>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-zinc-500 rotate-90" />
            </div>

            <div className="p-3 rounded-xl bg-[#cbd1d8] border border-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-zinc-800" />
                <div>
                  <div className="font-bold text-zinc-950 font-serif">Feature Extraction Engine</div>
                  <div className="text-[10px] text-zinc-600 font-serif">
                    Sliding window: Doppler, variance, stationary index, entropy
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-zinc-900 font-bold">ACTIVE</span>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-zinc-500 rotate-90" />
            </div>

            <div className="p-3 rounded-xl bg-[#cbd1d8] border border-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-zinc-800" />
                <div>
                  <div className="font-bold text-zinc-950 font-serif">AI Classifier & Risk Engine</div>
                  <div className="text-[10px] text-zinc-600 font-serif">
                    Random Forest ensemble + Multi-stage fall state machine
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-zinc-900 font-bold">ACTIVE</span>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-zinc-500 rotate-90" />
            </div>

            <div className="p-3 rounded-xl bg-[#cbd1d8] border border-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-zinc-800" />
                <div>
                  <div className="font-bold text-zinc-950 font-serif">Wi-Safe Command Center</div>
                  <div className="text-[10px] text-zinc-600 font-serif">
                    Live oscilloscope, virtual room, audit events & alerts
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-zinc-900 font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Future Hardware Deployment */}
        <div className="p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-400 pb-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-800 uppercase tracking-wider block">
                PHASE 2 (PRODUCTION)
              </span>
              <h3 className="text-base font-bold text-zinc-950 font-['Playfair_Display',serif]">
                Future Hardware Deployment
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-300 border border-zinc-400 text-zinc-950 font-bold">
              API-STREAM READY
            </span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="p-3 rounded-xl bg-[#cbd1d8] border border-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-zinc-800" />
                <div>
                  <div className="font-bold text-zinc-950 font-serif">Physical Wi-Fi Hardware Node</div>
                  <div className="text-[10px] text-zinc-600 font-serif">
                    ESP32-S3 / Intel 5300 NIC / Nexmon Raspberry Pi / SDR
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-zinc-900 font-bold">PLUG & PLAY</span>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-zinc-500 rotate-90" />
            </div>

            <div className="p-3 rounded-xl bg-[#cbd1d8] border border-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-zinc-800" />
                <div>
                  <div className="font-bold text-zinc-950 font-serif">CSI Streaming Gateway (API)</div>
                  <div className="text-[10px] text-zinc-600 font-serif">
                    WebSocket / gRPC frame streaming (ws://host/v1/csi/stream)
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-zinc-900 font-bold">STANDARD SPEC</span>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-zinc-500 rotate-90" />
            </div>

            <div className="p-3 rounded-xl bg-[#cbd1d8] border border-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-zinc-800" />
                <div>
                  <div className="font-bold text-zinc-950 font-serif">Identical AI Pipeline (Zero Change)</div>
                  <div className="text-[10px] text-zinc-600 font-serif">
                    Feature extraction, RF anomaly engine, multi-stage fall state
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-zinc-900 font-bold">REUSED 100%</span>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-zinc-500 rotate-90" />
            </div>

            <div className="p-3 rounded-xl bg-[#cbd1d8] border border-zinc-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-zinc-800" />
                <div>
                  <div className="font-bold text-zinc-950 font-serif">Wi-Safe Enterprise Cloud / Edge</div>
                  <div className="text-[10px] text-zinc-600 font-serif">
                    Multi-room hospital, eldercare, and home safety dashboard
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-zinc-900 font-bold">PRODUCTION</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSI Streaming API Specification & JSON Payload Schema */}
      <div className="p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-400 pb-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-zinc-950" />
            <h3 className="text-sm font-bold text-black font-['Playfair_Display',serif] uppercase tracking-wider">
              CSI Ingestion Stream API Specification (v1.2)
            </h3>
          </div>

          <button
            onClick={copySchema}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-300 border border-zinc-400 hover:bg-zinc-400 text-xs font-mono text-zinc-950 transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-800" /> : <Copy className="w-3 h-3 text-zinc-800" />}
            <span>{copied ? 'Copied Payload!' : 'Copy JSON'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3 text-xs font-serif text-zinc-800">
            <p>
              To connect real Wi-Fi nodes, physical hardware firmware streams binary or JSON CSI
              packets over WebSocket to the endpoint:
            </p>
            <div className="p-2.5 rounded-lg bg-zinc-300 border border-zinc-400 font-mono text-[11px] text-zinc-950 break-all">
              wss://api.wisafe.ai/v1/stream/ingest
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed font-serif">
              Compatible hardware firmware examples:
            </p>
            <ul className="space-y-1 text-[11px] font-mono text-zinc-700 list-disc list-inside">
              <li>ESP32 / ESP32-S3 CSI Toolkit</li>
              <li>Linux 802.11n CSI Tool (Intel 5300)</li>
              <li>Atheros CSI Tool (AR9380 / QCA9558)</li>
              <li>Nexmon CSI Extractor (BCM43455c0)</li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-72 leading-relaxed shadow-inner">
              {JSON.stringify(samplePayload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
