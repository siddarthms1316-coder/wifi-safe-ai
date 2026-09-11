import React from 'react';
import { ActivityPrediction, FallDetectionState, RiskScore } from '../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle, Activity, ChevronRight, Zap } from 'lucide-react';

interface ExplainableRiskCardProps {
  prediction: ActivityPrediction;
  riskScore: RiskScore;
  fallState: FallDetectionState;
}

export const ExplainableRiskCard: React.FC<ExplainableRiskCardProps> = ({
  prediction,
  riskScore,
  fallState,
}) => {
  // Determine risk badge styling
  const getRiskBadge = (level: RiskScore['level']) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 border-rose-400 text-rose-800',
          indicator: 'bg-rose-500 animate-ping',
          icon: AlertOctagon,
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-50 border-orange-400 text-orange-800',
          indicator: 'bg-orange-500',
          icon: AlertTriangle,
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-50 border-amber-400 text-amber-800',
          indicator: 'bg-amber-500',
          icon: AlertTriangle,
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-400 text-emerald-800',
          indicator: 'bg-emerald-500',
          icon: ShieldCheck,
        };
    }
  };

  const riskBadge = getRiskBadge(riskScore.level);
  const RiskIcon = riskBadge.icon;

  return (
    <div className="flex flex-col rounded-xl border border-zinc-400 bg-[#e4e7ec] overflow-hidden shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-400 bg-[#cbd1d8]">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-300 border border-zinc-400 text-zinc-900">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-black uppercase tracking-wider font-['Playfair_Display',serif]">
              Explainable AI & Safety Risk Engine
            </h3>
            <p className="text-[10px] text-zinc-600 font-serif">
              Interpretable Multi-Stage Logic & Factor Attribution
            </p>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-bold font-mono ${riskBadge.bg}`}>
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${riskBadge.indicator}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${riskBadge.indicator.split(' ')[0]}`}></span>
          </span>
          <RiskIcon className="w-3.5 h-3.5" />
          <span>RISK: {riskScore.level} ({riskScore.score}/100)</span>
        </div>
      </div>

      <div className="p-4 space-y-4 font-serif">
        {/* Risk Gauge Bar */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-zinc-800">Safety Risk Score</span>
            <span className="font-bold text-zinc-950">
              {riskScore.score} / 100 ({riskScore.level})
            </span>
          </div>
          <div className="w-full h-2.5 bg-zinc-300 rounded-full overflow-hidden border border-zinc-400 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                riskScore.score > 80
                  ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                  : riskScore.score > 60
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : riskScore.score > 30
                  ? 'bg-gradient-to-r from-zinc-500 to-amber-500'
                  : 'bg-zinc-800'
              }`}
              style={{ width: `${Math.max(4, riskScore.score)}%` }}
            />
          </div>
        </div>

        {/* Explainable Prediction Box */}
        <div className="p-3 rounded-lg bg-zinc-300/80 border border-zinc-400 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-zinc-700 uppercase tracking-wider">
                Current Inference:
              </span>
              <span className="text-sm font-bold text-zinc-950 font-['Playfair_Display',serif]">
                {prediction.activityLabel}
              </span>
            </div>
            <span className="text-xs font-mono text-zinc-950 font-semibold">
              Confidence: {prediction.confidence.toFixed(1)}%
            </span>
          </div>

          <p className="text-xs text-zinc-900 leading-relaxed bg-[#cbd1d8] p-2.5 rounded border border-zinc-400 font-serif">
            <strong className="text-zinc-950 font-mono text-[11px]">XAI EXPLANATION: </strong>
            {prediction.explanation}
          </p>

          {/* Feature attribution chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {prediction.keyFactors.map((f, i) => (
              <div
                key={i}
                className="p-2 rounded bg-[#cbd1d8] border border-zinc-400 text-[11px] font-mono shadow-2xs"
              >
                <div className="text-zinc-700 text-[10px] truncate">{f.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`font-bold ${
                      f.impact === 'positive'
                        ? 'text-zinc-950'
                        : f.impact === 'negative'
                        ? 'text-rose-700'
                        : 'text-zinc-800'
                    }`}
                  >
                    {f.weight}%
                  </span>
                  <span className="text-[9px] text-zinc-600">
                    {f.impact === 'positive' ? 'MATCH' : f.impact === 'negative' ? 'EXCURSION' : 'STABLE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fall Multi-Stage Logic Pipeline Status */}
        <div className="p-3 rounded-lg bg-zinc-300/80 border border-zinc-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-zinc-700 uppercase tracking-wider">
              Multi-Stage Fall Safety Pipeline
            </span>
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                fallState.stage === 'confirmed_fall'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : fallState.stage === 'monitoring_inactivity'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-zinc-200 text-zinc-900 border border-zinc-400'
              }`}
            >
              STAGE: {fallState.stage.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Stepper visualization */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] font-mono">
            {[
              { id: 'disturbance_detected', label: '1. RF Disturbance' },
              { id: 'monitoring_inactivity', label: '2. Inactivity Monitor' },
              { id: 'evaluating_recovery', label: '3. Recovery Check' },
              { id: 'confirmed_fall', label: '4. Fall Confirmed' },
            ].map((step, idx) => {
              const isPassed =
                fallState.stage === 'confirmed_fall' ||
                (step.id === 'disturbance_detected' &&
                  ['disturbance_detected', 'monitoring_inactivity', 'evaluating_recovery'].includes(
                    fallState.stage
                  )) ||
                (step.id === 'monitoring_inactivity' &&
                  ['monitoring_inactivity', 'evaluating_recovery'].includes(fallState.stage));
              const isCurrent = fallState.stage === step.id;

              return (
                <div
                  key={idx}
                  className={`p-1.5 rounded border text-center transition ${
                    isCurrent
                      ? 'bg-zinc-950 text-white font-bold border-zinc-950'
                      : isPassed
                      ? 'bg-zinc-900 text-white font-semibold border-zinc-800'
                      : 'bg-zinc-200 border-zinc-400 text-zinc-600'
                  }`}
                >
                  {step.label}
                </div>
              );
            })}
          </div>

          {/* Transparent factor points summation */}
          <div className="pt-2 border-t border-zinc-400">
            <div className="text-[10px] font-mono text-zinc-700 mb-1">
              Transparent Risk Formula Breakdown:
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              {riskScore.factors.map((fact, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-[#cbd1d8] border border-zinc-400 text-zinc-900"
                >
                  {fact.name}: <strong className="text-zinc-950">+{fact.points}</strong>
                </span>
              ))}
              <span className="px-2 py-0.5 rounded bg-[#cbd1d8] border border-zinc-500 text-zinc-950 font-bold">
                Total: <strong className="text-zinc-950">{riskScore.score} pts</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-zinc-600 leading-tight font-serif italic">
          * Attributions and risk scores are computed from synthetic RF signal characteristics for
          software simulation demonstration and are not medically validated.
        </p>
      </div>
    </div>
  );
};
