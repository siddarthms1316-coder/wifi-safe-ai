import React from 'react';
import { SafetyEvent } from '../types';
import { AlertOctagon, CheckCircle2, XCircle, PhoneCall, ShieldAlert, Clock, MapPin, Radio } from 'lucide-react';
import { audioAlerts } from '../lib/audioAlert';

interface EmergencyAlertModalProps {
  event: SafetyEvent | null;
  onAcknowledge: (eventId: string) => void;
  onDismiss: (eventId: string) => void;
  onEscalate: (eventId: string) => void;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  event,
  onAcknowledge,
  onDismiss,
  onEscalate,
}) => {
  if (!event || event.status !== 'active') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-serif">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-400 bg-[#e4e7ec] p-6 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-300 border border-zinc-400 text-rose-600 animate-pulse">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-zinc-300 border border-zinc-400 text-[10px] font-bold text-rose-800 font-mono tracking-wider animate-pulse">
                CRITICAL SAFETY EVENT DETECTED
              </span>
              <span className="text-xs font-mono text-zinc-600">SIMULATION ONLY</span>
            </div>
            <h2 className="text-xl font-bold text-zinc-950 font-['Playfair_Display',serif] tracking-tight mt-0.5">
              Confirmed Simulated Fall Event
            </h2>
          </div>
        </div>

        {/* Main Details Card */}
        <div className="space-y-3 bg-zinc-300/90 rounded-xl p-4 border border-zinc-400 font-serif text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-zinc-700 flex items-center gap-1 text-[11px]">
                <MapPin className="w-3 h-3 text-zinc-800" /> Location:
              </span>
              <p className="text-sm font-bold text-zinc-950 font-serif">{event.room}</p>
            </div>
            <div>
              <span className="text-zinc-700 flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-zinc-800" /> Detection Time:
              </span>
              <p className="text-sm font-bold text-zinc-950 font-mono">
                {new Date(event.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-400">
            <div>
              <span className="text-zinc-700 text-[11px] font-mono">AI Confidence:</span>
              <p className="text-base font-bold text-rose-700 font-mono">{event.confidence.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-zinc-700 text-[11px] font-mono">Risk Score:</span>
              <p className="text-base font-bold text-rose-700 font-mono">{event.riskScore} / 100 (CRITICAL)</p>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-400">
            <span className="text-zinc-700 text-[11px] block mb-1">CSI Inference Analysis:</span>
            <p className="text-xs text-zinc-900 font-serif leading-relaxed bg-[#cbd1d8] p-2.5 rounded border border-zinc-400">
              {event.explanation}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-zinc-400 text-[11px]">
            <span className="text-zinc-800">Current Dispatch Status:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-200 border border-zinc-400 text-rose-900 font-bold font-mono animate-pulse">
              AWAITING RESPONSE
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-5">
          <button
            onClick={() => {
              audioAlerts.playPingTone();
              onAcknowledge(event.id);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-zinc-300 hover:bg-zinc-400 text-zinc-950 font-semibold text-xs transition border border-zinc-400 font-serif"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-800" />
            <span>ACKNOWLEDGE</span>
          </button>

          <button
            onClick={() => {
              audioAlerts.playPingTone();
              onDismiss(event.id);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-zinc-300 hover:bg-zinc-400 text-zinc-950 font-semibold text-xs transition border border-zinc-400 font-serif"
          >
            <XCircle className="w-3.5 h-3.5 text-zinc-700" />
            <span>DISMISS</span>
          </button>

          <button
            onClick={() => {
              audioAlerts.playAlertTone();
              onEscalate(event.id);
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs transition shadow-xs font-serif"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>ESCALATE (SIM)</span>
          </button>
        </div>

        {/* Legal Disclaimer */}
        <p className="text-[10px] text-center text-zinc-600 mt-4 leading-tight font-serif">
          ⚠️ SIMULATION PROTOCOL: This prompt is for software evaluation only. No actual 911/emergency
          first responders have been contacted.
        </p>
      </div>
    </div>
  );
};
