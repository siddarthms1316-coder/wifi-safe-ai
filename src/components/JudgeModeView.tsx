import React from 'react';
import { ActivityPrediction, CSIDataFrame, FallDetectionState, RiskScore } from '../types';
import { LiveCSIChart } from './LiveCSIChart';
import { VirtualRoom } from './VirtualRoom';
import {
  Sparkles,
  ShieldCheck,
  EyeOff,
  Radio,
  Zap,
  Cpu,
  Server,
  AlertOctagon,
  ArrowRight,
  Play,
  CheckCircle2,
} from 'lucide-react';

interface JudgeModeViewProps {
  prediction: ActivityPrediction;
  riskScore: RiskScore;
  fallState: FallDetectionState;
  frames: CSIDataFrame[];
  onStartMasterDemo: () => void;
  isDemoRunning: boolean;
  onExitJudgeMode: () => void;
}

export const JudgeModeView: React.FC<JudgeModeViewProps> = ({
  prediction,
  riskScore,
  fallState,
  frames,
  onStartMasterDemo,
  isDemoRunning,
  onExitJudgeMode,
}) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-serif">
      {/* Top Judge Pitch Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-300 border border-zinc-400 text-zinc-950 font-bold font-mono text-xs">
              <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
              JUDGE MODE ACTIVE
            </span>
            <span className="text-xs font-serif text-zinc-700">
              30-Second Executive Pitch & Live Pipeline
            </span>
          </div>
          <h1 className="text-2xl font-bold text-black font-['Playfair_Display',serif] tracking-tight">
            Wi-Safe AI: Invisible Signals. Intelligent Safety.
          </h1>
          <p className="text-xs text-zinc-700 max-w-2xl mt-1 font-serif">
            Replaces invasive cameras with ambient Wi-Fi Channel State Information (CSI) to detect
            falls, recognize activities, and protect vulnerable humans with 100% optical privacy.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onStartMasterDemo}
            disabled={isDemoRunning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs transition shadow-xs disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isDemoRunning ? 'SCRIPT PLAYING...' : 'RUN HACKATHON DEMO (70s)'}</span>
          </button>

          <button
            onClick={onExitJudgeMode}
            className="px-3.5 py-2.5 rounded-xl border border-zinc-400 bg-zinc-300 hover:bg-zinc-400 text-zinc-950 text-xs font-mono transition"
          >
            Exit Pitch Mode
          </button>
        </div>
      </div>

      {/* 3 Core Pillars in 1 Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-serif text-xs">
        {/* Pillar 1: The Problem */}
        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold font-['Playfair_Display',serif] uppercase text-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            1. The Problem
          </div>
          <p className="text-xs text-zinc-700 font-serif leading-relaxed">
            Eldercare falls kill 38,000+ seniors annually. However, seniors refuse invasive cameras
            in bedrooms/bathrooms, and 80%+ forget to wear panic pendants.
          </p>
        </div>

        {/* Pillar 2: The Innovation */}
        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-zinc-950 font-bold font-['Playfair_Display',serif] uppercase text-sm">
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            2. Our RF Innovation
          </div>
          <p className="text-xs text-zinc-700 font-serif leading-relaxed">
            Wi-Safe AI turns existing Wi-Fi routers into radar. As humans move, they disturb OFDM
            subcarrier phase & amplitude. We classify motion directly from invisible RF reflections.
          </p>
        </div>

        {/* Pillar 3: Privacy & Scalability */}
        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] space-y-2 shadow-xs">
          <div className="flex items-center gap-2 text-zinc-950 font-bold font-['Playfair_Display',serif] uppercase text-sm">
            <span className="w-2 h-2 rounded-full bg-zinc-700" />
            3. 100% Privacy & Zero Gear
          </div>
          <p className="text-xs text-zinc-700 font-serif leading-relaxed">
            Zero optics, zero microphones, zero wearables. Fully hardware-independent architecture
            deployable on commodity ESP32 or Wi-Fi 6 access points.
          </p>
        </div>
      </div>

      {/* Live Simulation & Live CSI Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <VirtualRoom
            activity={prediction.activity}
            peopleCount={1}
            variance={frames[frames.length - 1]?.variance || 0.2}
            isFallAlert={fallState.stage === 'confirmed_fall'}
            roomSize="medium"
          />
        </div>

        <div>
          <LiveCSIChart
            frames={frames}
            isPaused={false}
            onTogglePause={() => {}}
            subcarrierCount={30}
          />
        </div>
      </div>

      {/* Inference & Multi-Stage Fall Logic Spotlight */}
      <div className="p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xs font-serif">
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-700 uppercase font-mono">Live AI Classification</span>
          <div className="text-xl font-bold text-zinc-950 font-['Playfair_Display',serif]">
            {prediction.activityLabel}
          </div>
          <div className="text-xs text-emerald-800 font-mono font-semibold">Confidence: {prediction.confidence}%</div>
          <p className="text-[11px] text-zinc-700 font-serif pt-1 leading-relaxed">
            {prediction.explanation}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-zinc-700 uppercase font-mono">Multi-Stage Safety Engine</span>
          <div className="text-xl font-bold text-zinc-950 font-['Playfair_Display',serif]">
            {fallState.stage.replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-xs text-zinc-700 font-mono">
            Disturbance: {fallState.disturbanceMagnitude}x | Immobility: {Math.round(fallState.inactivityTimer / 1000)}s
          </div>
          <p className="text-[11px] text-zinc-700 font-serif pt-1 leading-relaxed">
            Prevents false alarms by enforcing post-impact immobility verification.
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-zinc-700 uppercase font-mono">Hardware Ingestion Pipeline</span>
          <div className="text-base font-bold text-zinc-950 font-['Playfair_Display',serif]">
            CSI Stream API (v1.2)
          </div>
          <div className="text-xs text-zinc-700 font-mono">WebSocket / gRPC frame ingestion</div>
          <div className="flex items-center gap-1.5 pt-2 text-[10px] text-zinc-800 font-serif">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-800 shrink-0" />
            <span>Works with ESP32-S3 & Intel 5300</span>
          </div>
        </div>
      </div>
    </div>
  );
};
