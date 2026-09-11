import React from 'react';
import { NavTab } from './Navbar';
import {
  Radio,
  ShieldCheck,
  EyeOff,
  MicOff,
  Watch,
  HardDrive,
  Cpu,
  Waves,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  BrainCircuit,
  Lock,
} from 'lucide-react';

interface LandingPageViewProps {
  onNavigate: (tab: NavTab) => void;
  onStartMasterDemo: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onNavigate,
  onStartMasterDemo,
}) => {
  return (
    <div className="space-y-16 max-w-7xl mx-auto py-4 font-serif">
      {/* Hero Section */}
      <section className="relative rounded-3xl border border-zinc-400 bg-[#e4e7ec] p-8 lg:p-14 overflow-hidden shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            {/* Privacy Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-300 border border-zinc-400 text-zinc-900 font-mono text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
              <span>Privacy-First Wireless Sensing Platform</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black font-['Playfair_Display',serif] tracking-tight leading-tight">
                Turning Invisible Wireless Signals Into <span className="text-zinc-950 underline decoration-zinc-500 underline-offset-8">Intelligent Safety</span>
              </h1>
              <p className="text-base sm:text-lg text-zinc-700 max-w-2xl font-serif leading-relaxed">
                An AI-powered, privacy-first software platform for wireless human activity
                recognition, multi-stage fall detection, and abnormal-event intelligence using ambient Wi-Fi Channel State Information (CSI).
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('command_center')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-sm transition shadow-xs active:scale-95"
              >
                <Activity className="w-4 h-4 fill-current" />
                <span>Launch Command Center</span>
              </button>

              <button
                onClick={() => onNavigate('simulation')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-400 bg-zinc-300 hover:bg-zinc-400 text-zinc-950 font-semibold text-sm transition shadow-xs"
              >
                <span>Explore Simulation</span>
              </button>

              <button
                onClick={() => onNavigate('analytics')}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-400 bg-zinc-300 hover:bg-zinc-400 text-zinc-950 font-mono text-xs transition"
              >
                <Activity className="w-4 h-4 text-zinc-800" />
                <span>Safety Analytics</span>
              </button>
            </div>

            {/* Privacy Badges Pill Row */}
            <div className="pt-4 border-t border-zinc-400 flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-300 border border-zinc-400 text-zinc-950 font-semibold">
                <EyeOff className="w-3.5 h-3.5 text-rose-600" /> NO CAMERA
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-300 border border-zinc-400 text-zinc-950 font-semibold">
                <MicOff className="w-3.5 h-3.5 text-amber-600" /> NO MICROPHONE
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-300 border border-zinc-400 text-zinc-950 font-semibold">
                <Watch className="w-3.5 h-3.5 text-zinc-700" /> NO WEARABLE
              </span>
              <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-300 border border-zinc-400 text-zinc-950 font-semibold">
                <HardDrive className="w-3.5 h-3.5 text-emerald-700" /> NO VIDEO STORAGE
              </span>
            </div>
          </div>

          {/* Hero RF Visualization Card */}
          <div className="lg:col-span-5 relative">
            <div className="p-6 rounded-2xl border border-zinc-400 bg-[#cbd1d8] shadow-xs space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-800 border-b border-zinc-400 pb-3">
                <span className="flex items-center gap-1.5 text-zinc-950 font-bold">
                  <Radio className="w-4 h-4 text-zinc-800" />
                  RF FRESNEL REFLECTION DYNAMICS
                </span>
                <span className="text-zinc-700">5.2 GHz OFDM</span>
              </div>

              {/* Animated Wave Simulation SVG */}
              <div className="h-52 w-full flex items-center justify-center relative overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800">
                <svg className="w-full h-full" viewBox="0 0 320 180">
                  {/* Wave arcs Tx */}
                  {[30, 60, 90, 120, 150].map((r, i) => (
                    <circle
                      key={i}
                      cx="50"
                      cy="90"
                      r={r}
                      fill="none"
                      stroke="#a1a1aa"
                      strokeWidth="1.2"
                      opacity={0.6 - i * 0.1}
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Human vector */}
                  <circle cx="160" cy="70" r="10" fill="#e4e4e7" />
                  <line x1="160" y1="80" x2="160" y2="120" stroke="#e4e4e7" strokeWidth="3" />
                  <line x1="160" y1="95" x2="140" y2="110" stroke="#e4e4e7" strokeWidth="2.5" />
                  <line x1="160" y1="95" x2="180" y2="110" stroke="#e4e4e7" strokeWidth="2.5" />
                  <line x1="160" y1="120" x2="148" y2="150" stroke="#e4e4e7" strokeWidth="2.5" />
                  <line x1="160" y1="120" x2="172" y2="150" stroke="#e4e4e7" strokeWidth="2.5" />

                  {/* Reflected rays */}
                  <line x1="50" y1="90" x2="160" y2="90" stroke="#d4d4d8" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="160" y1="90" x2="270" y2="90" stroke="#71717a" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Nodes */}
                  <rect x="40" y="80" width="20" height="20" rx="4" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />
                  <rect x="260" y="80" width="20" height="20" rx="4" fill="#18181b" stroke="#71717a" strokeWidth="1.5" />
                  <text x="50" y="115" fill="#a1a1aa" fontSize="8" textAnchor="middle" fontFamily="monospace">Tx AP</text>
                  <text x="270" y="115" fill="#a1a1aa" fontSize="8" textAnchor="middle" fontFamily="monospace">Rx STA</text>
                  <text x="160" y="52" fill="#f4f4f5" fontSize="8" textAnchor="middle" fontFamily="monospace">REFLECTOR</text>
                </svg>
              </div>

              <div className="p-3 rounded-lg bg-zinc-300 border border-zinc-400 text-[11px] font-mono text-zinc-900 flex items-center justify-between">
                <span>SIGNAL PREPROCESSING:</span>
                <span className="text-zinc-950 font-bold">BUTTERWORTH 2nd ORDER</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem vs Our Approach Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-7 rounded-2xl border border-rose-400/80 bg-[#e4e7ec] space-y-3 shadow-xs">
          <div className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">
            The Problem With Traditional Safety
          </div>
          <h2 className="text-xl font-bold text-zinc-950 font-['Playfair_Display',serif]">
            Optical Privacy Intrusion & High Blind-Spot Rates
          </h2>
          <p className="text-sm text-zinc-700 leading-relaxed font-serif">
            Elderly individuals and patients systematically reject cameras in private areas like
            bedrooms and bathrooms where 80% of dangerous falls occur. Wearable pendants have low
            compliance rates because patients frequently take them off while sleeping or showering.
          </p>
          <ul className="space-y-2 pt-2 text-xs font-serif text-zinc-800">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Severe dignity & privacy violation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Non-operational in complete darkness or heavy steam
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Requires patient compliance & daily charging
            </li>
          </ul>
        </div>

        <div className="p-7 rounded-2xl border border-zinc-400 bg-[#e4e7ec] space-y-3 shadow-xs">
          <div className="text-xs font-mono font-bold text-zinc-950 uppercase tracking-wider">
            Our RF Channel State Innovation
          </div>
          <h2 className="text-xl font-bold text-zinc-950 font-['Playfair_Display',serif]">
            Invisible Wireless Signals as Spatial Radar
          </h2>
          <p className="text-sm text-zinc-700 leading-relaxed font-serif">
            Wi-Safe AI monitors fine-grained physical layer Channel State Information (CSI) from
            standard Wi-Fi transmissions. Moving limbs and torsos induce characteristic multi-subcarrier
            frequency shifts and Doppler perturbations that ML classifies with zero optical footage.
          </p>
          <ul className="space-y-2 pt-2 text-xs font-serif text-zinc-800">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-700" /> 100% optical privacy (bathroom & bedroom safe)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-700" /> Operates seamlessly in total darkness and through steam
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-zinc-700" /> Completely passive — no wearable tags or pendants required
            </li>
          </ul>
        </div>
      </section>

      {/* How It Works Pipeline Flow */}
      <section className="p-8 rounded-2xl border border-zinc-400 bg-[#e4e7ec] space-y-6 shadow-xs">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono text-zinc-900 uppercase tracking-wider font-bold">
            End-to-End Sensing Architecture
          </span>
          <h2 className="text-2xl font-bold text-black font-['Playfair_Display',serif]">
            How Wi-Safe AI Converts RF Noise into Safety Intelligence
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
          {[
            {
              step: '01',
              title: 'RF Propagation',
              desc: 'Wi-Fi AP transmits OFDM carrier waves reflecting off humans.',
            },
            {
              step: '02',
              title: 'CSI Ingestion',
              desc: 'Raw amplitude & phase collected across 30–52 subcarriers at 50Hz.',
            },
            {
              step: '03',
              title: 'Feature Extraction',
              desc: 'Extract Doppler velocity, stationary index, variance, and entropy.',
            },
            {
              step: '04',
              title: 'AI Classification',
              desc: 'Random Forest model & multi-stage fall state machine evaluation.',
            },
            {
              step: '05',
              title: 'Safety Intelligence',
              desc: 'XAI explanation, transparent risk scoring, and instant simulation dispatch.',
            },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#cbd1d8] border border-zinc-400 font-serif text-xs space-y-2">
              <span className="text-zinc-950 font-bold text-sm block font-mono">{s.step}</span>
              <div className="font-bold text-zinc-950 font-['Playfair_Display',serif] text-sm">{s.title}</div>
              <p className="text-[11px] text-zinc-700 font-serif leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Key Capabilities Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-2xl font-bold text-black font-['Playfair_Display',serif]">
            Core Intelligence Capabilities
          </h2>
          <p className="text-xs text-zinc-600 font-serif">
            Engineered for high accuracy and explainability in safety-critical environments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-zinc-400 bg-[#e4e7ec] space-y-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-zinc-300 border border-zinc-400 text-zinc-900 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-950 font-['Playfair_Display',serif]">
              Human Activity Recognition
            </h3>
            <p className="text-xs text-zinc-700 font-serif leading-relaxed">
              Differentiates walking, standing, sitting, lying down, hand gestures, and multiple
              moving occupants with detailed confidence scores.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-400 bg-[#e4e7ec] space-y-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-950 font-['Playfair_Display',serif]">
              Multi-Stage Fall Verification
            </h3>
            <p className="text-xs text-zinc-700 font-serif leading-relaxed">
              Enforces post-disturbance immobility checks to filter out false alarms from dropped
              items or rapid seated movements before dispatching alerts.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-zinc-400 bg-[#e4e7ec] space-y-2.5 shadow-xs">
            <div className="w-9 h-9 rounded-lg bg-zinc-300 border border-zinc-400 text-zinc-900 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-zinc-950 font-['Playfair_Display',serif]">
              Explainable AI Decisions
            </h3>
            <p className="text-xs text-zinc-700 font-serif leading-relaxed">
              Every inference delivers natural-language reasoning and feature attribution weights so
              caregivers and engineers understand why an alert triggered.
            </p>
          </div>
        </div>
      </section>

      {/* Ethical / Technical Disclaimers Footer Banner */}
      <div className="p-6 rounded-2xl border border-zinc-400 bg-[#cbd1d8] text-zinc-800 font-serif text-[11px] leading-relaxed text-center shadow-xs">
        <strong>TECHNICAL & ETHICAL DISCLAIMER:</strong> This is a software simulation demonstrating
        a CSI-based sensing architecture. Results are based on synthetic/demo data and are not a
        substitute for validated safety, medical, security, or emergency systems. The prototype does
        not perform medical diagnosis, guaranteed fall detection, personal biometric identification,
        or universal through-wall sensing.
      </div>
    </div>
  );
};
