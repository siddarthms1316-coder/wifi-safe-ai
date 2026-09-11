import React from 'react';
import {
  ActivityPrediction,
  ActivityType,
  CSIDataFrame,
  FallDetectionState,
  OccupancyEstimate,
  RiskScore,
  SafetyEvent,
} from '../types';
import { ACTIVITY_METADATA } from '../lib/csiSimulator';
import { VirtualRoom } from './VirtualRoom';
import { LiveCSIChart } from './LiveCSIChart';
import { ExplainableRiskCard } from './ExplainableRiskCard';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Users,
  Radio,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  Flame,
  Zap,
} from 'lucide-react';
import { audioAlerts } from '../lib/audioAlert';

interface CommandCenterProps {
  prediction: ActivityPrediction;
  riskScore: RiskScore;
  fallState: FallDetectionState;
  occupancy: OccupancyEstimate;
  frames: CSIDataFrame[];
  recentEvents: SafetyEvent[];
  isPaused: boolean;
  onTogglePause: () => void;
  onTriggerActivity: (act: ActivityType, count?: number) => void;
  onClearAlerts: () => void;
  onResetBaseline: () => void;
  sensitivity: 'low' | 'medium' | 'high';
  onChangeSensitivity: (s: 'low' | 'medium' | 'high') => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onSelectEvent: (ev: SafetyEvent) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  prediction,
  riskScore,
  fallState,
  occupancy,
  frames,
  recentEvents,
  isPaused,
  onTogglePause,
  onTriggerActivity,
  onClearAlerts,
  onResetBaseline,
  sensitivity,
  onChangeSensitivity,
  isAudioMuted,
  onToggleAudio,
  onSelectEvent,
}) => {
  const latestFrame = frames[frames.length - 1];
  const disturbanceLevel =
    (latestFrame?.variance || 0) > 0.8
      ? 'HIGH'
      : (latestFrame?.variance || 0) > 0.3
      ? 'MEDIUM'
      : 'LOW';

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 font-serif">
      {/* Top Quick Trigger Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-zinc-800" />
            Quick Scenarios:
          </span>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onTriggerActivity('no_movement', 0)}
              className="px-2.5 py-1 rounded bg-zinc-300 hover:bg-zinc-400 border border-zinc-400 text-zinc-950 text-xs font-mono transition"
            >
              Empty Room
            </button>
            <button
              onClick={() => onTriggerActivity('standing', 1)}
              className="px-2.5 py-1 rounded bg-zinc-300 hover:bg-zinc-400 border border-zinc-400 text-zinc-950 text-xs font-mono transition"
            >
              Standing
            </button>
            <button
              onClick={() => onTriggerActivity('walking', 1)}
              className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-900 text-white text-xs font-mono font-semibold transition shadow-2xs"
            >
              Walking
            </button>
            <button
              onClick={() => onTriggerActivity('sitting', 1)}
              className="px-2.5 py-1 rounded bg-zinc-300 hover:bg-zinc-400 border border-zinc-400 text-zinc-950 text-xs font-mono transition"
            >
              Sitting
            </button>
            <button
              onClick={() => onTriggerActivity('multiple_people', 2)}
              className="px-2.5 py-1 rounded bg-zinc-300 hover:bg-zinc-400 border border-zinc-400 text-zinc-950 text-xs font-mono transition"
            >
              2 People
            </button>
            <button
              onClick={() => onTriggerActivity('fall', 1)}
              className="px-3 py-1 rounded bg-rose-100 hover:bg-rose-200 border border-rose-400 text-rose-900 text-xs font-mono font-bold transition shadow-xs animate-pulse"
            >
              🚨 Simulate Fall
            </button>
          </div>
        </div>

        {/* Global Controls: Sensitivity & Audio & Reset */}
        <div className="flex items-center gap-3">
          {/* Sensitivity */}
          <div className="flex items-center gap-1.5 bg-zinc-300/80 px-2 py-1 rounded-lg border border-zinc-400 text-[11px] font-mono">
            <Sliders className="w-3 h-3 text-zinc-800" />
            <span className="text-zinc-800">Sens:</span>
            {(['low', 'medium', 'high'] as const).map((s) => (
              <button
                key={s}
                onClick={() => onChangeSensitivity(s)}
                className={`px-1.5 py-0.5 rounded capitalize transition ${
                  sensitivity === s
                    ? 'bg-zinc-900 text-white font-bold border border-zinc-900'
                    : 'text-zinc-700 hover:text-black'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Audio Alert Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-1.5 rounded-lg border transition ${
              isAudioMuted
                ? 'bg-zinc-300 border-zinc-400 text-zinc-600 hover:text-black'
                : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}
            title={isAudioMuted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Reset Baseline */}
          <button
            onClick={onResetBaseline}
            className="px-2.5 py-1 rounded-lg border border-zinc-400 bg-zinc-300 hover:bg-zinc-400 text-zinc-950 text-xs font-mono transition"
            title="Recalibrate empty room RF baseline"
          >
            Reset Baseline
          </button>
        </div>
      </div>

      {/* Top 4 Real-time Telemetry Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Activity Classification */}
        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-600 mb-1 font-mono">
            <span>CLASSIFIED ACTIVITY</span>
            <Activity className="w-3.5 h-3.5 text-zinc-800" />
          </div>
          <div
            style={{ fontFamily: 'Verdana, sans-serif', fontWeight: 'normal' }}
            className="text-xl text-black tracking-tight truncate"
          >
            {prediction.activityLabel}
          </div>
          <div className="text-[11px] text-zinc-900 font-mono mt-1 font-medium">
            Confidence: <strong className="font-bold">{prediction.confidence.toFixed(1)}%</strong>
          </div>
          {/* Activity color strip */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: ACTIVITY_METADATA[prediction.activity].color }}
          />
        </div>

        {/* Card 2: Risk Level */}
        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-600 mb-1 font-mono">
            <span>SAFETY RISK STATUS</span>
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-800" />
          </div>
          <div
            style={{ fontFamily: 'Verdana, sans-serif', fontWeight: 'normal' }}
            className={`text-xl tracking-tight ${
              riskScore.level === 'CRITICAL'
                ? 'text-rose-700'
                : riskScore.level === 'HIGH'
                ? 'text-orange-700'
                : riskScore.level === 'MODERATE'
                ? 'text-amber-800'
                : 'text-zinc-900'
            }`}
          >
            {riskScore.level} ({riskScore.score}/100)
          </div>
          <div className="text-[11px] text-zinc-700 font-mono mt-1">
            Fall Stage: <strong className="text-black font-semibold">{fallState.stage.replace('_', ' ')}</strong>
          </div>
        </div>

        {/* Card 3: Estimated Occupancy */}
        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-600 mb-1 font-mono">
            <span>ESTIMATED OCCUPANCY</span>
            <Users className="w-3.5 h-3.5 text-zinc-800" />
          </div>
          <div
            style={{ fontFamily: 'Verdana, sans-serif', fontWeight: 'normal' }}
            className="text-xl text-black tracking-tight"
          >
            {occupancy.count} {occupancy.count === 1 ? 'Person' : 'People'}
          </div>
          <div className="text-[11px] text-zinc-700 font-mono mt-1">
            Spatial State: <strong className="text-zinc-950 font-semibold">{occupancy.crowdLevel}</strong>
          </div>
        </div>

        {/* Card 4: CSI Disturbance & Stability */}
        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-zinc-600 mb-1 font-mono">
            <span>RF DISTURBANCE</span>
            <Radio className="w-3.5 h-3.5 text-zinc-800" />
          </div>
          <div
            style={{ fontFamily: 'Verdana, sans-serif', fontWeight: 'normal' }}
            className={`text-xl tracking-tight ${
              disturbanceLevel === 'HIGH'
                ? 'text-rose-700'
                : disturbanceLevel === 'MEDIUM'
                ? 'text-amber-800'
                : 'text-zinc-900'
            }`}
          >
            {disturbanceLevel} ({((latestFrame?.variance || 0) * 10).toFixed(1)} Var)
          </div>
          <div className="text-[11px] text-zinc-700 font-mono mt-1">
            Stability: <strong className="text-zinc-900 font-semibold">99.2% (50Hz)</strong>
          </div>
        </div>
      </div>

      {/* Main Middle Row: Virtual Room (Left) & Live CSI Chart (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Virtual Room Multipath Visualizer (5 cols) */}
        <div className="lg:col-span-5">
          <VirtualRoom
            activity={prediction.activity}
            peopleCount={occupancy.count}
            variance={latestFrame?.variance || 0.15}
            isFallAlert={fallState.stage === 'confirmed_fall'}
            roomSize="medium"
          />
        </div>

        {/* Live CSI Oscilloscope & Spectrogram (7 cols) */}
        <div className="lg:col-span-7">
          <LiveCSIChart
            frames={frames}
            isPaused={isPaused}
            onTogglePause={onTogglePause}
            subcarrierCount={30}
          />
        </div>
      </div>

      {/* Lower Row: Explainable AI & Risk Attribution (Left) + Recent Events Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Explainable AI Risk Attribution (7 cols) */}
        <div className="lg:col-span-7">
          <ExplainableRiskCard
            prediction={prediction}
            riskScore={riskScore}
            fallState={fallState}
          />
        </div>

        {/* Recent Events Feed (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-zinc-400 bg-[#e4e7ec] overflow-hidden shadow-xs flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-400 bg-[#cbd1d8]">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider font-['Playfair_Display',serif]">
              Live Event Stream
            </h3>
            <span className="text-[10px] font-mono font-semibold text-zinc-950 bg-zinc-300 border border-zinc-400 px-2 py-0.5 rounded">
              {recentEvents.length} recorded
            </span>
          </div>

          <div className="p-3 divide-y divide-zinc-300 overflow-y-auto max-h-[300px] flex-1 font-serif text-xs">
            {recentEvents.slice(0, 6).map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent(ev)}
                className="py-2.5 px-2 hover:bg-zinc-300/60 rounded transition cursor-pointer flex items-center justify-between gap-2 group"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      ev.riskLevel === 'CRITICAL'
                        ? 'bg-rose-500 animate-ping'
                        : ev.riskLevel === 'HIGH'
                        ? 'bg-orange-500'
                        : ev.riskLevel === 'MODERATE'
                        ? 'bg-amber-400'
                        : 'bg-zinc-600'
                    }`}
                  />
                  <div className="truncate">
                    <div className="font-semibold text-zinc-950 group-hover:text-black truncate font-serif text-xs">
                      {ev.title}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono">
                      Conf: {ev.confidence.toFixed(0)}% • {ev.room}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 text-[10px] text-zinc-500 font-mono">
                  {new Date(ev.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            ))}

            {recentEvents.length === 0 && (
              <div className="py-8 text-center text-zinc-600 text-xs italic font-serif">
                No events recorded yet. Trigger an activity or fall above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
