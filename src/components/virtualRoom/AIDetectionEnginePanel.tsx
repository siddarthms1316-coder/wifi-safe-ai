import React from 'react';
import {
  AvatarActivity,
  DataSourceMode,
  CSIStreamMode,
  FallSequenceStage,
  RiskBreakdown,
} from '../../types/virtualRoom';
import {
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  Users,
  Activity,
  Cpu,
  Smartphone,
  Radio,
} from 'lucide-react';

interface AIDetectionEnginePanelProps {
  activity: AvatarActivity;
  confidence: number;
  anomalyScore: 'Low' | 'Moderate' | 'High';
  occupancyCount: number;
  mode: DataSourceMode | CSIStreamMode;
  fallStage: FallSequenceStage;
  risk: RiskBreakdown;
  aiStatus: 'ANALYZING' | 'INFERENCE_COMPLETE' | 'CALIBRATING';
  hasCsiHardwareSource?: boolean;
}

export const AIDetectionEnginePanel: React.FC<AIDetectionEnginePanelProps> = ({
  activity,
  confidence,
  anomalyScore,
  occupancyCount,
  mode,
  fallStage,
  risk,
  aiStatus,
  hasCsiHardwareSource = false,
}) => {
  const isCritical = risk.riskCategory === 'CRITICAL';
  const isHigh = risk.riskCategory === 'HIGH';
  const isModerate = risk.riskCategory === 'MODERATE';

  const riskTextColor = isCritical
    ? 'text-rose-600'
    : isHigh
    ? 'text-orange-600'
    : isModerate
    ? 'text-amber-700'
    : 'text-cyan-700';

  const riskMeterStroke = isCritical
    ? '#ef4444'
    : isHigh
    ? '#f97316'
    : isModerate
    ? '#d97706'
    : '#0284c7';

  const stages: { key: FallSequenceStage; label: string }[] = [
    { key: 'normal_movement', label: '1. Normal' },
    { key: 'sudden_csi_disturbance', label: '2. Sudden Motion' },
    { key: 'potential_fall', label: '3. Impact' },
    { key: 'post_event_inactivity', label: '4. Stillness' },
    { key: 'ai_verification', label: '5. AI Verify' },
    { key: 'safety_alert', label: '6. Safety Alert' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === fallStage);

  const getSourceBadge = () => {
    if (mode === 'LIVE_DEVICE_TELEMETRY') {
      return {
        label: 'LIVE DEVICE TELEMETRY',
        bg: 'bg-cyan-100 border-cyan-400 text-cyan-950',
        icon: Smartphone,
      };
    }
    if (mode === 'LIVE_CSI' || mode === 'LIVE') {
      return {
        label: hasCsiHardwareSource ? 'LIVE CSI STREAM' : 'NO CSI SOURCE DETECTED',
        bg: hasCsiHardwareSource
          ? 'bg-emerald-100 border-emerald-400 text-emerald-950'
          : 'bg-amber-100 border-amber-400 text-amber-950',
        icon: Radio,
      };
    }
    if (mode === 'RECORDED_CSI' || mode === 'RECORDED') {
      return {
        label: 'RECORDED CSI GROUND-TRUTH',
        bg: 'bg-amber-100 border-amber-400 text-amber-950',
        icon: Cpu,
      };
    }
    return {
      label: 'SIMULATION PREDICTION',
      bg: 'bg-zinc-200 border-zinc-400 text-zinc-800',
      icon: BrainCircuit,
    };
  };

  const badge = getSourceBadge();
  const BadgeIcon = badge.icon;

  return (
    <div className="w-full rounded-2xl border border-zinc-400 bg-white p-4 shadow-xs space-y-4 transition-all font-serif">
      {/* Title & Inference Mode Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300 pb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-cyan-800" />
          <span className="font-bold text-sm text-black font-mono tracking-tight">
            AI SENSING & CLASSIFICATION ENGINE
          </span>
        </div>

        <span
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${badge.bg}`}
        >
          <BadgeIcon className="w-3 h-3" />
          {badge.label}
        </span>
      </div>

      {/* Primary Activity & Confidence Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#e4e7ec] border border-zinc-400">
          <div className="text-[10px] font-mono font-bold text-zinc-600 uppercase flex items-center justify-between">
            <span>INFERRED ACTIVITY</span>
            <Activity className="w-3.5 h-3.5 text-cyan-800" />
          </div>
          <div className="text-base font-bold text-black font-['Playfair_Display',serif] capitalize mt-1 truncate">
            {activity.replace('_', ' ')}
          </div>
          <div className="text-[10px] font-mono text-cyan-800 font-semibold mt-0.5">
            ENGINE: {aiStatus}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#e4e7ec] border border-zinc-400">
          <div className="text-[10px] font-mono font-bold text-zinc-600 uppercase flex items-center justify-between">
            <span>CONFIDENCE</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-800" />
          </div>
          <div className="text-base font-bold text-black font-mono mt-1">
            {confidence.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-zinc-600 mt-0.5">
            ANOMALY: <span className="text-zinc-950 font-bold">{anomalyScore}</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics: Occupancy & Risk */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 rounded-xl bg-[#cbd1d8]/40 border border-zinc-400 text-xs">
          <div className="text-[10px] text-zinc-600 flex items-center gap-1 font-mono font-bold">
            <Users className="w-3 h-3 text-zinc-700" />
            <span>OCCUPANCY</span>
          </div>
          <div className="text-sm font-bold text-black mt-1 font-mono">
            {occupancyCount} {occupancyCount === 1 ? 'Person' : 'People'}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-[#cbd1d8]/40 border border-zinc-400 text-xs">
          <div className="text-[10px] text-zinc-600 flex items-center gap-1 font-mono font-bold">
            <ShieldCheck className="w-3 h-3 text-zinc-700" />
            <span>SAFETY RISK</span>
          </div>
          <div className={`text-sm font-bold ${riskTextColor} mt-1 font-mono`}>
            {risk.riskCategory} ({risk.totalScore}/100)
          </div>
        </div>
      </div>

      {/* Fall Detection Multi-stage Sequence Flow */}
      <div className="rounded-xl bg-[#cbd1d8]/30 border border-zinc-400 p-3">
        <div className="flex items-center justify-between text-xs text-zinc-800 mb-2">
          <span className="font-bold font-mono text-xs flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            SAFETY & FALL VERIFICATION PIPELINE
          </span>
          <span className="text-[10px] font-mono text-zinc-600">Temporal Inactivity Gate</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
          {stages.map((stage, idx) => {
            const isPassed = idx <= currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <div
                key={stage.key}
                className={`py-1.5 px-1 rounded-md text-center text-[9px] font-mono transition-all border ${
                  isCurrent && (isCritical || isHigh)
                    ? 'bg-rose-100 border-rose-400 text-rose-950 font-bold shadow-xs animate-pulse'
                    : isCurrent
                    ? 'bg-cyan-100 border-cyan-400 text-cyan-950 font-bold shadow-xs'
                    : isPassed
                    ? 'bg-white border-zinc-300 text-zinc-800'
                    : 'bg-zinc-200 border-zinc-300 text-zinc-500'
                }`}
              >
                {stage.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Radial Risk Meter & Factor Breakdown */}
      <div className="rounded-xl bg-[#cbd1d8]/30 border border-zinc-400 p-3">
        <div className="flex items-center justify-between text-xs text-zinc-800 mb-2">
          <span className="font-bold font-mono">EXPLAINABLE RISK METRICS</span>
          <span className={`font-bold font-mono ${riskTextColor}`}>{risk.riskCategory}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Circular radial meter */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-22 h-22 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  strokeWidth="7"
                  stroke="#d1d5db"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  strokeWidth="7"
                  strokeDasharray={238.76}
                  strokeDashoffset={238.76 - (238.76 * risk.totalScore) / 100}
                  strokeLinecap="round"
                  stroke={riskMeterStroke}
                  fill="transparent"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold font-mono text-zinc-950 leading-none">
                  {risk.totalScore}
                </span>
                <span className="text-[9px] font-mono text-zinc-600">/ 100</span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-zinc-600 mt-1">
              {risk.riskCategory} RISK
            </div>
          </div>

          {/* Factor breakdown */}
          <div className="sm:col-span-7 space-y-1.5 text-[11px] font-mono">
            <div className="flex items-center justify-between text-zinc-700">
              <span>{mode === 'LIVE_DEVICE_TELEMETRY' ? 'Motion Jerk:' : 'RF Disturbance:'}</span>
              <strong className="text-cyan-800">+{risk.csiDisturbance}</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-700">
              <span>Post-event Inactivity:</span>
              <strong className={risk.inactivityScore > 10 ? 'text-amber-800' : 'text-zinc-700'}>
                +{risk.inactivityScore}
              </strong>
            </div>
            <div className="flex items-center justify-between text-zinc-700">
              <span>Anomaly Divergence:</span>
              <strong className="text-zinc-900">+{risk.anomalyScore}</strong>
            </div>
            <div className="flex items-center justify-between text-zinc-700">
              <span>Confidence Weight:</span>
              <strong className="text-zinc-600">+{risk.confidenceFactor}</strong>
            </div>
            <div className="pt-1.5 border-t border-zinc-300 flex items-center justify-between font-bold text-zinc-950">
              <span>TOTAL RISK SCORE:</span>
              <span className={`font-mono ${riskTextColor}`}>{risk.totalScore}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
