import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Play,
  CheckCircle2,
  AlertTriangle,
  Radio,
  BookOpen,
  RotateCcw,
  Sliders,
  ChevronRight,
  Shield,
  Layers,
  Activity,
  Zap,
  Info,
  ExternalLink,
  Eye,
  Check,
  X,
  Clock,
  Cpu,
} from 'lucide-react';
import { INNOVATION_TOPICS, InnovationTopic } from '../data/innovationTopics';
import { ActivityType } from '../types';

interface InnovationStackViewProps {
  onRunSimulation?: (activity: ActivityType, peopleCount?: number) => void;
  onNavigateTab?: (tab: string) => void;
}

export const InnovationStackView: React.FC<InnovationStackViewProps> = ({
  onRunSimulation,
  onNavigateTab,
}) => {
  // 3-button priority filter: 'all' | 1 | 2 | 3
  const [activeTier, setActiveTier] = useState<'all' | 1 | 2 | 3>('all');

  // Selected topic for deep explanation and simulation
  const [selectedTopic, setSelectedTopic] = useState<InnovationTopic | null>(INNOVATION_TOPICS[0]);

  // View mode for explanation: whether explanation is currently shown or cleared
  const [showExplanation, setShowExplanation] = useState<boolean>(true);

  // Simulation execution state
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [runProgress, setRunProgress] = useState<number>(0);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [completedTopicIds, setCompletedTopicIds] = useState<Set<string>>(new Set());

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter topics based on active tier
  const filteredTopics =
    activeTier === 'all'
      ? INNOVATION_TOPICS
      : INNOVATION_TOPICS.filter((t) => t.priority === activeTier);

  // Handle running a topic simulation
  const handleRunTopic = (topic: InnovationTopic) => {
    setSelectedTopic(topic);
    setShowExplanation(true);
    setIsRunning(true);
    setRunProgress(0);
    setLiveLogs(['Initializing 50Hz OFDM CSI stream...', topic.simulationConfig.liveLog[0]]);

    // Trigger global simulator
    if (onRunSimulation) {
      onRunSimulation(topic.simulationConfig.activity, topic.simulationConfig.peopleCount);
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += 10;
      setRunProgress(progress);

      // Add log lines as progress proceeds
      const logIdx = Math.min(
        Math.floor((progress / 100) * topic.simulationConfig.liveLog.length),
        topic.simulationConfig.liveLog.length - 1
      );
      setLiveLogs((prev) => {
        const nextLine = topic.simulationConfig.liveLog[logIdx];
        if (!prev.includes(nextLine)) {
          return [...prev, nextLine];
        }
        return prev;
      });

      if (progress >= 100) {
        clearInterval(progressIntervalRef.current!);
        setIsRunning(false);
        setCompletedTopicIds((prev) => new Set(prev).add(topic.id));
        setLiveLogs((prev) => [
          ...prev,
          `✓ ${topic.feature} verification completed successfully. Metrics archived.`,
        ]);
      }
    }, 400);
  };

  // Stop / Reset execution
  const handleResetSimulation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setIsRunning(false);
    setRunProgress(0);
    setLiveLogs([]);
  };

  // Clear explanation
  const handleClearExplanation = () => {
    setShowExplanation(false);
    handleResetSimulation();
  };

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-serif animate-in fade-in duration-200">
      {/* Top Hero Banner */}
      <div className="p-6 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-300 border border-zinc-400 text-zinc-950 font-bold">
              ⭐
            </span>
            <h1 className="text-2xl font-bold text-black font-['Playfair_Display',serif] tracking-tight">
              Recommended Innovation Stack
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-950 text-white font-bold uppercase tracking-wider">
              15 Hero Features
            </span>
          </div>
          <p className="text-xs text-zinc-800 font-serif leading-relaxed">
            The complete 15-pillar technical architecture optimized for hackathon judging. Click any topic below to run its live simulation and inspect its plain-English and mathematical CSI explanation.
          </p>
        </div>

        {/* Global Action Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-[#cbd1d8] border border-zinc-400 text-center font-mono">
            <div className="text-xl font-bold text-zinc-950">
              {completedTopicIds.size} / 15
            </div>
            <div className="text-[10px] text-zinc-700 uppercase font-semibold">Simulated</div>
          </div>

          <button
            onClick={() => handleRunTopic(selectedTopic || INNOVATION_TOPICS[0])}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-serif text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-zinc-100 fill-zinc-100" />
            <span>{isRunning ? 'Running Simulation...' : 'Run Active Innovation'}</span>
          </button>
        </div>
      </div>

      {/* 3-BUTTON DASHBOARD CONTROL BAR */}
      <div className="p-4 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-700 font-bold block mb-1">
              Priority Filter Dashboard:
            </span>
            <p className="text-xs text-zinc-800 font-serif">
              Select one of the three priority tiers to filter topics, or run interactive simulations:
            </p>
          </div>

          {/* The 3 Priority Buttons (+ All Filter) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTier('all')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition font-medium ${
                activeTier === 'all'
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs font-bold'
                  : 'bg-zinc-300 hover:bg-zinc-400 border-zinc-400 text-zinc-900'
              }`}
            >
              All (15)
            </button>

            {/* BUTTON 1: Priority 1 (Hero Core) */}
            <button
              onClick={() => setActiveTier(1)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-mono transition font-medium ${
                activeTier === 1
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs font-bold'
                  : 'bg-zinc-300 hover:bg-zinc-400 border-zinc-400 text-zinc-900'
              }`}
            >
              <span>🥇</span>
              <span>Priority 1: Hero Features (6)</span>
            </button>

            {/* BUTTON 2: Priority 2 (Tactical Intelligence) */}
            <button
              onClick={() => setActiveTier(2)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-mono transition font-medium ${
                activeTier === 2
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs font-bold'
                  : 'bg-zinc-300 hover:bg-zinc-400 border-zinc-400 text-zinc-900'
              }`}
            >
              <span>🥈</span>
              <span>Priority 2: Tactical Intelligence (6)</span>
            </button>

            {/* BUTTON 3: Priority 3 (Scale & Operational Trust) */}
            <button
              onClick={() => setActiveTier(3)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-xs font-mono transition font-medium ${
                activeTier === 3
                  ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs font-bold'
                  : 'bg-zinc-300 hover:bg-zinc-400 border-zinc-400 text-zinc-900'
              }`}
            >
              <span>🥉</span>
              <span>Priority 3: Scale & Trust (3)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN DASHBOARD: Topic List Table (Left) + Interactive Runner & Clear Explanation Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* TOPICS TABLE LIST (7 Columns) */}
        <div className="lg:col-span-6 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-400 bg-[#cbd1d8]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-800" />
              <h2 className="text-xs font-bold text-black uppercase tracking-wider font-['Playfair_Display',serif]">
                Innovation Topics Registry ({filteredTopics.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-700">
              Click any topic to inspect or run
            </span>
          </div>

          <div className="divide-y divide-zinc-300 max-h-[680px] overflow-y-auto">
            {filteredTopics.map((topic) => {
              const isSelected = selectedTopic?.id === topic.id;
              const isCompleted = completedTopicIds.has(topic.id);

              return (
                <div
                  key={topic.id}
                  onClick={() => {
                    setSelectedTopic(topic);
                    setShowExplanation(true);
                  }}
                  className={`p-3.5 transition cursor-pointer flex items-center justify-between gap-3 group ${
                    isSelected
                      ? 'bg-zinc-300/90 border-l-4 border-l-zinc-900'
                      : 'hover:bg-zinc-300/50'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-lg shrink-0 mt-0.5" title={topic.priorityLabel}>
                      {topic.medal}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-zinc-950 group-hover:text-black font-['Playfair_Display',serif] truncate">
                          {topic.feature}
                        </span>
                        {isCompleted && (
                          <span className="flex items-center gap-0.5 text-[9px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                            <Check className="w-2.5 h-2.5" /> Verified
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[9px] font-mono bg-zinc-950 text-white px-1.5 py-0.2 rounded font-semibold">
                            Active
                          </span>
                        )}
                      </div>

                      {/* The "Why" from screenshot */}
                      <p className="text-xs text-zinc-700 font-serif line-clamp-1 mt-0.5">
                        <strong className="text-zinc-900 font-medium">Why:</strong> {topic.why}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunTopic(topic);
                      }}
                      className="px-2 py-1 rounded bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-mono flex items-center gap-1 transition shadow-2xs"
                      title="Run this innovation live"
                    >
                      <Play className="w-2.5 h-2.5 fill-white" />
                      <span>Run</span>
                    </button>
                    <ChevronRight
                      className={`w-4 h-4 transition ${
                        isSelected ? 'text-zinc-950 translate-x-0.5' : 'text-zinc-400 group-hover:text-zinc-700'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* INTERACTIVE TOPIC INSPECTOR, RUNNER & CLEAR EXPLANATION PANEL (6 Columns) */}
        <div className="lg:col-span-6 space-y-4">
          {selectedTopic ? (
            <div className="rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs overflow-hidden">
              {/* Active Topic Header */}
              <div className="p-5 border-b border-zinc-400 bg-[#cbd1d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedTopic.medal}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-black font-['Playfair_Display',serif]">
                        {selectedTopic.feature}
                      </h3>
                      <span className="text-[10px] font-mono bg-zinc-300 border border-zinc-400 px-2 py-0.5 rounded text-zinc-900 font-bold">
                        {selectedTopic.priorityLabel}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 font-serif">
                      <strong>Hero Value:</strong> {selectedTopic.why}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 shrink-0">
                  {isRunning ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-400 text-amber-950 text-xs font-mono font-bold animate-pulse">
                      <Radio className="w-3 h-3 animate-spin" />
                      SIMULATING
                    </span>
                  ) : completedTopicIds.has(selectedTopic.id) ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-400 text-emerald-950 text-xs font-mono font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      READY / VERIFIED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-zinc-300 border border-zinc-400 text-zinc-800 text-xs font-mono">
                      STANDBY
                    </span>
                  )}
                </div>
              </div>

              {/* THREE-BUTTON ACTION DASHBOARD BAR */}
              <div className="px-5 py-3 bg-zinc-300/80 border-b border-zinc-400 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-zinc-800 font-bold uppercase tracking-wider">
                  Interactive Controls:
                </span>

                <div className="flex items-center gap-2">
                  {/* Action 1: Run Live Simulation */}
                  <button
                    onClick={() => handleRunTopic(selectedTopic)}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-mono font-bold shadow-xs transition disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>{isRunning ? 'Running...' : 'Run Simulation'}</span>
                  </button>

                  {/* Action 2: Toggle Clear Explanation */}
                  <button
                    onClick={() => setShowExplanation(!showExplanation)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition ${
                      showExplanation
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-zinc-200 hover:bg-zinc-300 border-zinc-400 text-zinc-900'
                    }`}
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>{showExplanation ? 'Explanation Open' : 'Show Explanation'}</span>
                  </button>

                  {/* Action 3: Clear Explanation / Reset Dashboard */}
                  <button
                    onClick={handleClearExplanation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 border border-zinc-400 text-zinc-800 text-xs font-mono transition"
                    title="Clear explanation and stop simulation"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear Explanation</span>
                  </button>
                </div>
              </div>

              {/* LIVE SIMULATION RUNNING CARD (Shows when running or just completed) */}
              {(isRunning || liveLogs.length > 0) && (
                <div className="p-5 border-b border-zinc-400 bg-zinc-900 text-zinc-100 font-mono space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      Live CSI Simulation Execution ({runProgress}%)
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      Target Activity: {selectedTopic.simulationConfig.activity.toUpperCase()}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${runProgress}%` }}
                    />
                  </div>

                  {/* Live Log Stream */}
                  <div className="bg-black/60 p-3 rounded-lg border border-zinc-800 text-[11px] text-zinc-300 font-mono space-y-1 max-h-32 overflow-y-auto">
                    {liveLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-zinc-600 select-none">&gt;</span>
                        <span className={idx === liveLogs.length - 1 ? 'text-emerald-300' : 'text-zinc-400'}>
                          {log}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Simulation Telemetry Ribbon */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-1">
                    <div className="p-1.5 rounded bg-zinc-800/80 border border-zinc-700">
                      <span className="text-zinc-400 block">SIMULATED RISK</span>
                      <span className="text-sm font-bold text-amber-300">
                        {selectedTopic.simulationConfig.simulatedRisk}/100
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-zinc-800/80 border border-zinc-700">
                      <span className="text-zinc-400 block">RF CONFIDENCE</span>
                      <span className="text-sm font-bold text-emerald-300">
                        {selectedTopic.simulationConfig.simulatedConfidence}%
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-zinc-800/80 border border-zinc-700">
                      <span className="text-zinc-400 block">OCCUPANCY</span>
                      <span className="text-sm font-bold text-zinc-100">
                        {selectedTopic.simulationConfig.peopleCount} Person
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* CLEAR EXPLANATION CONTENT BODY */}
              {showExplanation ? (
                <div className="p-5 space-y-5 font-serif text-zinc-900">
                  {/* 1. Clear Plain-English Summary */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wider font-['Playfair_Display',serif] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-zinc-800" />
                      1. Clear Concept Explanation
                    </h4>
                    <div className="p-3.5 rounded-xl bg-[#cbd1d8] border border-zinc-400 text-xs text-zinc-900 leading-relaxed font-serif">
                      {selectedTopic.summary}
                    </div>
                  </div>

                  {/* 2. CSI RF Signal Mechanics */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wider font-['Playfair_Display',serif] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-zinc-800" />
                      2. Wireless CSI Signal Mechanics
                    </h4>
                    <div className="p-3.5 rounded-xl bg-zinc-300/80 border border-zinc-400 text-xs text-zinc-900 leading-relaxed font-serif">
                      {selectedTopic.csiMechanics}
                    </div>
                  </div>

                  {/* 3. Why This Wins Hackathons */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-black uppercase tracking-wider font-['Playfair_Display',serif] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-zinc-800" />
                      3. Why It Wins Hackathons (Judge Pitch)
                    </h4>
                    <div className="p-3.5 rounded-xl bg-[#cbd1d8] border border-zinc-400 text-xs text-zinc-900 leading-relaxed font-serif font-medium">
                      "{selectedTopic.hackathonPitch}"
                    </div>
                  </div>

                  {/* 4. Architectural Benchmark Metrics */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-[11px] font-bold text-zinc-800 uppercase tracking-wider font-mono">
                      Architectural Benchmarks
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedTopic.keyMetrics.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-zinc-300 border border-zinc-400 text-center font-mono"
                        >
                          <span className="text-[10px] text-zinc-700 block truncate">{m.label}</span>
                          <span className="text-xs font-bold text-zinc-950 block mt-0.5">
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Navigation Jump Links */}
                  <div className="pt-2 flex items-center justify-between border-t border-zinc-300 text-xs font-serif">
                    <span className="text-zinc-600 text-[11px]">
                      Simulated directly via Wi-Safe AI ambient RF engine.
                    </span>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab('command_center')}
                        className="flex items-center gap-1 text-zinc-900 hover:text-black font-semibold underline underline-offset-2"
                      >
                        <span>View in Command Center</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Collapsed / Cleared Explanation Placeholder */
                <div className="p-8 text-center space-y-3 font-serif">
                  <div className="w-10 h-10 rounded-full bg-zinc-300 border border-zinc-400 mx-auto flex items-center justify-center text-zinc-700">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-zinc-700 max-w-sm mx-auto">
                    Explanation cleared. Click below or choose any topic to restore full detailed technical analysis.
                  </p>
                  <button
                    onClick={() => setShowExplanation(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-mono font-medium hover:bg-zinc-800 transition shadow-xs"
                  >
                    Restore Explanation
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs text-zinc-700 font-serif">
              Select any of the 15 innovation topics to inspect its explanation and run live simulations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
