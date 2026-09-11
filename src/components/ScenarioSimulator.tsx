import React, { useState, useEffect } from 'react';
import { PREBUILT_SCENARIOS, HACKATHON_MASTER_DEMO } from '../lib/scenarios';
import { ActivityType, SimulationScenario } from '../types';
import { ACTIVITY_METADATA } from '../lib/csiSimulator';
import { Play, Pause, RotateCcw, FastForward, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface ScenarioSimulatorProps {
  onApplyActivity: (activity: ActivityType, peopleCount: number) => void;
  isMasterDemoRunning: boolean;
  onStartMasterDemo: () => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  onApplyActivity,
  isMasterDemoRunning,
  onStartMasterDemo,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>(PREBUILT_SCENARIOS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Calculate current active step based on elapsed seconds
  const getCurrentStepIndex = () => {
    let acc = 0;
    for (let i = 0; i < selectedScenario.steps.length; i++) {
      acc += selectedScenario.steps[i].durationSeconds;
      if (elapsedSeconds < acc) return i;
    }
    return selectedScenario.steps.length - 1;
  };

  const currentStepIdx = getCurrentStepIndex();
  const currentStep = selectedScenario.steps[currentStepIdx];

  // Playback timer ticker
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= selectedScenario.totalDurationSeconds) {
          setIsPlaying(false);
          return selectedScenario.totalDurationSeconds;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, selectedScenario]);

  // Synchronize scenario step activity to simulator
  useEffect(() => {
    if (isPlaying && currentStep) {
      onApplyActivity(currentStep.activity, currentStep.peopleCount);
    }
  }, [currentStepIdx, isPlaying]);

  const handleSelectScenario = (scenario: SimulationScenario) => {
    setSelectedScenario(scenario);
    setIsPlaying(false);
    setElapsedSeconds(0);
    const firstStep = scenario.steps[0];
    if (firstStep) {
      onApplyActivity(firstStep.activity, firstStep.peopleCount);
    }
  };

  const handlePlayPause = () => {
    if (elapsedSeconds >= selectedScenario.totalDurationSeconds) {
      setElapsedSeconds(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    const firstStep = selectedScenario.steps[0];
    if (firstStep) {
      onApplyActivity(firstStep.activity, firstStep.peopleCount);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-serif">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-black font-['Playfair_Display',serif]">
            Autonomous Scenario Simulator
          </h1>
          <p className="text-xs text-zinc-700 mt-1 max-w-2xl font-serif">
            Execute scripted real-world RF environments to observe multi-stage fall detection,
            resumed motion false alarm clearance, and occupancy crowd scaling.
          </p>
        </div>

        <button
          onClick={onStartMasterDemo}
          disabled={isMasterDemoRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs transition shadow-xs shrink-0 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>{isMasterDemoRunning ? 'MASTER DEMO ACTIVE...' : 'PLAY MASTER HACKATHON DEMO (70s)'}</span>
        </button>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {PREBUILT_SCENARIOS.map((sc) => {
          const isSelected = selectedScenario.id === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-zinc-300 border-zinc-900 shadow-2xs ring-1 ring-zinc-900'
                  : 'bg-[#e4e7ec] border-zinc-400 hover:border-zinc-500 hover:bg-[#cbd1d8]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-900 border border-zinc-400">
                  {sc.totalDurationSeconds}s
                </span>
                {isSelected && <span className="text-[10px] text-zinc-950 font-bold font-mono">ACTIVE</span>}
              </div>
              <h3 className="text-xs font-bold text-zinc-950 font-['Playfair_Display',serif]">{sc.name}</h3>
              <p className="text-[11px] text-zinc-700 mt-1 line-clamp-2 leading-relaxed font-serif">
                {sc.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Player & Timeline */}
      <div className="p-6 rounded-2xl border border-zinc-400 bg-[#e4e7ec] space-y-6 shadow-xs">
        {/* Controller Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-400 pb-4">
          <div>
            <div className="text-[11px] font-mono text-zinc-800 uppercase tracking-wider">
              Executing Scenario:
            </div>
            <h2 className="text-lg font-bold text-black font-['Playfair_Display',serif]">
              {selectedScenario.name}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-zinc-800">
              <strong className="text-zinc-950">{elapsedSeconds}s</strong> / {selectedScenario.totalDurationSeconds}s
            </span>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs transition shadow-2xs"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY SCENARIO'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-2 rounded-lg border border-zinc-400 bg-zinc-300 hover:bg-zinc-400 text-zinc-900 transition"
              title="Reset timeline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-zinc-300 rounded-full overflow-hidden border border-zinc-400">
            <div
              className="h-full bg-zinc-900 transition-all duration-300"
              style={{
                width: `${(elapsedSeconds / selectedScenario.totalDurationSeconds) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Multi-step Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {selectedScenario.steps.map((step, idx) => {
            const isCurrent = currentStepIdx === idx;
            const isPassed = currentStepIdx > idx;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs font-mono transition-all ${
                  isCurrent
                    ? 'bg-zinc-300 border-zinc-900 shadow-2xs ring-1 ring-zinc-900'
                    : isPassed
                    ? 'bg-[#cbd1d8] border-zinc-400 text-zinc-600'
                    : 'bg-[#e4e7ec] border-zinc-400 text-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className="text-zinc-700">Step {idx + 1} ({step.durationSeconds}s)</span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-800" />
                  ) : isCurrent ? (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-white font-bold">
                      LIVE
                    </span>
                  ) : null}
                </div>

                <div
                  className="font-bold text-zinc-950 font-serif truncate mb-1"
                >
                  {step.title}
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-zinc-700 mb-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ACTIVITY_METADATA[step.activity].color }}
                  />
                  <span>{ACTIVITY_METADATA[step.activity].label}</span>
                </div>

                <p className="text-[10px] text-zinc-700 leading-relaxed line-clamp-2 font-serif">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Currently Active Step Highlight Box */}
        {currentStep && (
          <div className="p-4 rounded-xl bg-[#cbd1d8] border border-zinc-400 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full animate-ping shrink-0"
                style={{ backgroundColor: ACTIVITY_METADATA[currentStep.activity].color }}
              />
              <div>
                <span className="text-[10px] text-zinc-700 block font-mono">CURRENT BROADCASTING ACTION:</span>
                <span className="font-bold text-zinc-950 text-sm font-serif">{currentStep.title}</span>
                <p className="text-xs text-zinc-700 font-serif mt-0.5">{currentStep.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs shrink-0">
              <span className="text-zinc-800">
                Subjects: <strong className="text-zinc-950">{currentStep.peopleCount}</strong>
              </span>
              <span className="text-zinc-800">
                RF Activity: <strong className="text-zinc-950">{ACTIVITY_METADATA[currentStep.activity].label}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
