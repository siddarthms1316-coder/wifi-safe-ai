import React, { useEffect, useState } from 'react';
import {
  Activity,
  Radio,
  Sliders,
  BrainCircuit,
  BarChart3,
  History,
  ShieldCheck,
  Server,
  Play,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { audioAlerts } from '../lib/audioAlert';

export type NavTab =
  | 'command_center'
  | 'virtual_room'
  | 'innovation_stack'
  | 'simulation'
  | 'analytics'
  | 'events'
  | 'architecture'
  | 'landing'
  | 'judge_mode';

interface NavbarProps {
  activeTab?: NavTab;
  currentTab?: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isJudgeMode?: boolean;
  onToggleJudgeMode?: () => void;
  onStartMasterDemo?: () => void;
  onStartHackathonDemo?: () => void;
  isMasterDemoRunning?: boolean;
  isDemoRunning?: boolean;
  activeAlertCount?: number;
  systemStatus?: string;
  safetyRiskLevel?: string;
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  currentTab,
  onSelectTab,
  isJudgeMode,
  onToggleJudgeMode,
  onStartMasterDemo,
  onStartHackathonDemo,
  isMasterDemoRunning,
  isDemoRunning,
  activeAlertCount = 0,
  isAudioMuted,
  onToggleAudio,
}) => {
  const effectiveTab = activeTab || currentTab || 'command_center';
  const effectiveDemoRunning = isMasterDemoRunning ?? isDemoRunning ?? false;
  const effectiveStartDemo = onStartMasterDemo || onStartHackathonDemo || (() => {});
  const judgeActive = isJudgeMode !== undefined ? isJudgeMode : effectiveTab === 'judge_mode';

  const [timeStr, setTimeStr] = useState('');
  const [internalMuted, setInternalMuted] = useState(false);
  const effectiveMuted = isAudioMuted !== undefined ? isAudioMuted : internalMuted;

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAudio = () => {
    if (onToggleAudio) {
      onToggleAudio();
    } else {
      const next = !internalMuted;
      setInternalMuted(next);
      audioAlerts.setMuted(next);
    }
  };

  const handleToggleJudge = () => {
    if (onToggleJudgeMode) {
      onToggleJudgeMode();
    } else {
      onSelectTab(judgeActive ? 'command_center' : 'judge_mode');
    }
  };

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string }[] = [
    { id: 'command_center', label: 'Command Center', icon: Activity },
    { id: 'virtual_room', label: 'Virtual Room', icon: Radio, badge: 'Live RF' },
    { id: 'innovation_stack', label: 'Innovation Stack', icon: Sparkles },
    { id: 'simulation', label: 'Simulation', icon: Sliders },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'events', label: 'Events', icon: History },
    { id: 'architecture', label: 'System & Arch', icon: Server },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      {/* Top micro-bar for system status & disclaimers */}
      <div className="flex items-center justify-between px-4 py-1 text-xs border-b border-slate-100 bg-[#F8FAFC] text-slate-600">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-800 font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-600"></span>
            </span>
            SYSTEM ONLINE (50Hz CSI STREAM)
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-slate-600 text-[11px]">
            <ShieldCheck className="w-3 h-3 text-cyan-600" />
            Zero-Camera RF Sensing Protocol
          </span>
        </div>

        <div className="flex items-center space-x-3 font-mono text-[11px]">
          <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider">
            SYNTHETIC / HARDWARE READY
          </span>
          <span className="text-slate-500 font-mono">{timeStr}</span>
          <button
            onClick={handleToggleAudio}
            title={effectiveMuted ? 'Unmute alerts' : 'Mute alerts'}
            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
          >
            {effectiveMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSelectTab('command_center')}
            className="flex items-center space-x-2.5 text-left group"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 text-white shadow-xs group-hover:bg-slate-800 transition">
              <Radio className="w-5 h-5 text-cyan-400 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-base tracking-tight text-slate-900 font-['Playfair_Display',serif]">
                  Wi-Safe<span className="text-cyan-700"> AI</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-700 rounded font-semibold">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-500 tracking-wide font-sans hidden sm:block italic">
                Invisible Signals. Intelligent Safety.
              </p>
            </div>
          </button>
        </div>

        {/* Center navigation tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = effectiveTab === item.id && !judgeActive;
            const isVirtualRoom = item.id === 'virtual_room';
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (judgeActive) handleToggleJudge();
                  onSelectTab(item.id);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-sans transition-all ${
                  isActive
                    ? isVirtualRoom
                      ? 'bg-[#EEF1F5] text-slate-900 border border-slate-300 shadow-xs font-semibold'
                      : 'bg-slate-100 text-slate-900 border border-slate-200 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[9px] font-mono font-bold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-300">
                    {item.badge}
                  </span>
                )}
                {item.id === 'events' && activeAlertCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-600 text-white animate-pulse">
                    {activeAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right action buttons: Judge Mode & Hackathon Demo */}
        <div className="flex items-center space-x-2">
          {/* Quick Landing Page link */}
          <button
            onClick={() => onSelectTab('landing')}
            className={`hidden xl:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs border transition font-sans ${
              effectiveTab === 'landing'
                ? 'border-slate-300 bg-slate-100 text-slate-900 font-semibold'
                : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
            title="Product Overview Landing Page"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Overview</span>
          </button>

          {/* Judge Mode Button */}
          <button
            id="judge-mode-btn"
            onClick={handleToggleJudge}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all font-sans ${
              judgeActive
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
            }`}
            title="Activate 30-second Hackathon Judge Overview"
          >
            <Sparkles className={`w-3.5 h-3.5 ${judgeActive ? 'text-amber-300' : 'text-slate-500'}`} />
            <span>{judgeActive ? 'EXIT JUDGE MODE' : 'JUDGE MODE'}</span>
          </button>

          {/* 1-Click Hackathon Master Demo Button */}
          <button
            id="start-demo-btn"
            onClick={effectiveStartDemo}
            disabled={effectiveDemoRunning}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs font-sans ${
              effectiveDemoRunning
                ? 'bg-rose-700 text-white border border-rose-600 animate-pulse cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700 text-white border border-cyan-600 active:scale-95 shadow-xs'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${effectiveDemoRunning ? 'animate-spin' : ''}`} />
            <span>{effectiveDemoRunning ? 'DEMO RUNNING...' : 'START HACKATHON DEMO'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab bar */}
      <div className="md:hidden flex items-center space-x-1 overflow-x-auto px-3 py-1.5 border-t border-slate-200 bg-[#F8FAFC] scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = effectiveTab === item.id && !judgeActive;
          const isVirtualRoom = item.id === 'virtual_room';
          return (
            <button
              key={item.id}
              onClick={() => {
                if (judgeActive) handleToggleJudge();
                onSelectTab(item.id);
              }}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs whitespace-nowrap font-sans ${
                isActive
                  ? isVirtualRoom
                    ? 'bg-[#EEF1F5] text-slate-900 font-semibold border border-slate-300'
                    : 'bg-slate-200 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
