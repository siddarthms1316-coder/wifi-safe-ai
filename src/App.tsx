import React, { useState, useEffect, useRef } from 'react';
import { CSISimulator, ACTIVITY_METADATA } from './lib/csiSimulator';
import { FeatureExtractor } from './lib/featureExtractor';
import { AIClassifier } from './lib/aiClassifier';
import { FallDetector } from './lib/fallDetector';
import { AnomalyEngine } from './lib/anomalyEngine';
import { OccupancyEstimator } from './lib/occupancyEstimator';
import { HACKATHON_MASTER_DEMO } from './lib/scenarios';
import { audioAlerts } from './lib/audioAlert';
import {
  ActivityPrediction,
  ActivityType,
  CSIDataFrame,
  CSIFeatures,
  FallDetectionState,
  OccupancyEstimate,
  RiskScore,
  SafetyEvent,
} from './types';

// Components
import { Navbar, NavTab } from './components/Navbar';
import { CommandCenter } from './components/CommandCenter';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { AnalyticsView } from './components/AnalyticsView';
import { EventTimeline } from './components/EventTimeline';
import { ArchitectureView } from './components/ArchitectureView';
import { JudgeModeView } from './components/JudgeModeView';
import { LandingPageView } from './components/LandingPageView';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';
import { VirtualSensingRoomPage } from './components/virtualRoom/VirtualSensingRoomPage';
import { MobileDevicePage } from './components/device/MobileDevicePage';

export default function App() {
  // Mobile device sensing client route check
  const [isDeviceRoute, setIsDeviceRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.pathname === '/device' ||
        window.location.hash === '#device' ||
        window.location.search.includes('view=device')
      );
    }
    return false;
  });

  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#virtual-room' || window.location.pathname === '/virtual-room') {
        return 'virtual_room';
      }
    }
    return 'command_center';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#device' || window.location.pathname === '/device') {
        setIsDeviceRoute(true);
      } else if (window.location.hash === '#virtual-room') {
        setIsDeviceRoute(false);
        setActiveTab('virtual_room');
      } else {
        setIsDeviceRoute(false);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
    };
  }, []);

  if (isDeviceRoute) {
    return <MobileDevicePage />;
  }

  // Engines instances
  const simulatorRef = useRef<CSISimulator>(new CSISimulator({ subcarrierCount: 30, samplingRateHz: 20 }));
  const extractorRef = useRef<FeatureExtractor>(new FeatureExtractor({ windowSize: 30, samplingRateHz: 20 }));
  const classifierRef = useRef<AIClassifier>(new AIClassifier());
  const fallDetectorRef = useRef<FallDetector>(new FallDetector());
  const anomalyEngineRef = useRef<AnomalyEngine>(new AnomalyEngine());
  const occupancyEstimatorRef = useRef<OccupancyEstimator>(new OccupancyEstimator());

  // Simulation loop state
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [framesBuffer, setFramesBuffer] = useState<CSIDataFrame[]>([]);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  // Real-time Intelligence State
  const [currentPrediction, setCurrentPrediction] = useState<ActivityPrediction>({
    activity: 'walking',
    activityLabel: 'Walking',
    confidence: 94.2,
    explanation: 'Periodic amplitude variations and bilateral Doppler shifts across 30 OFDM subcarriers align with rhythmic walking gait.',
    keyFactors: [
      { name: 'Periodic Doppler', weight: 42, impact: 'positive' },
      { name: 'Carrier Dispersion', weight: 28, impact: 'positive' },
      { name: 'Stationary Index', weight: 18, impact: 'neutral' },
      { name: 'Spectral Flatness', weight: 12, impact: 'positive' },
    ],
  });

  const [currentRiskScore, setCurrentRiskScore] = useState<RiskScore>({
    score: 14,
    level: 'LOW',
    factors: [
      { name: 'Baseline Ambient', points: 4 },
      { name: 'Dynamic Variance', points: 10 },
    ],
  });

  const [currentFallState, setCurrentFallState] = useState<FallDetectionState>({
    stage: 'normal',
    disturbanceMagnitude: 0.2,
    inactivityTimer: 0,
    isConfirmedFall: false,
  });

  const [currentOccupancy, setCurrentOccupancy] = useState<OccupancyEstimate>({
    estimatedPeople: 1,
    count: 1,
    confidence: 92.5,
    crowdLevel: 'single',
    varianceSum: 0.45,
    entropy: 0.35,
    varianceProfile: 'Stable',
    statusText: '1 occupant active in Fresnel zone',
  });

  // Events Log
  const [events, setEvents] = useState<SafetyEvent[]>([
    {
      id: 'init-01',
      timestamp: Date.now() - 1000 * 60 * 14,
      title: 'RF Baseline Calibrated',
      room: 'Virtual Room A',
      confidence: 99.4,
      riskLevel: 'LOW',
      riskScore: 6,
      status: 'resolved',
      explanation: 'Established 30-subcarrier Gaussian noise floor and stationary multi-path reflections.',
    },
    {
      id: 'init-02',
      timestamp: Date.now() - 1000 * 60 * 8,
      title: 'Walking Movement Detected',
      room: 'Virtual Room A',
      confidence: 94.8,
      riskLevel: 'LOW',
      riskScore: 16,
      status: 'resolved',
      explanation: 'Sustained periodic subcarrier modulation corresponding to bipedal movement velocity (1.1 m/s).',
    },
    {
      id: 'init-03',
      timestamp: Date.now() - 1000 * 60 * 3,
      title: 'Transition to Seated Rest',
      room: 'Virtual Room A',
      confidence: 91.2,
      riskLevel: 'LOW',
      riskScore: 10,
      status: 'resolved',
      explanation: 'Transient disturbance followed by stationary multi-carrier phase stabilization.',
    },
  ]);

  // Active Emergency Alert Modal
  const [activeAlertEvent, setActiveAlertEvent] = useState<SafetyEvent | null>(null);

  // Master Hackathon Demo Controller
  const [isMasterDemoRunning, setIsMasterDemoRunning] = useState<boolean>(false);
  const [demoStepIdx, setDemoStepIdx] = useState<number>(0);
  const [demoSecondsRemaining, setDemoSecondsRemaining] = useState<number>(0);

  // Track previous activity to record state change events
  const lastRecordedActivityRef = useRef<ActivityType>('walking');
  const hasTriggeredFallAlertRef = useRef<boolean>(false);

  // 20Hz Simulation Tick Loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPaused) return;

      const sim = simulatorRef.current;
      const extractor = extractorRef.current;
      const classifier = classifierRef.current;
      const fallDetector = fallDetectorRef.current;
      const anomalyEngine = anomalyEngineRef.current;
      const occupancyEstimator = occupancyEstimatorRef.current;

      // 1. Generate frame
      const frame = sim.generateFrame();

      // 2. Extract features
      const features = extractor.pushFrame(frame);

      // 3. Update Anomaly & Occupancy
      const anomaly = anomalyEngine.processFrame(frame, features);
      const occ = occupancyEstimator.estimateOccupancy(frame, features);
      setCurrentOccupancy(occ);

      // 4. Update Multi-stage Fall Detection
      const fall = fallDetector.processFrame(frame, features);
      setCurrentFallState(fall);

      // 5. Update AI Inference
      const pred = classifier.predict(features);
      setCurrentPrediction(pred);

      // 6. Calculate Risk Score
      const risk = fallDetector.calculateRiskScore(pred, fall, anomaly.score);
      setCurrentRiskScore(risk);

      // 7. Update sliding buffer for live chart
      setFramesBuffer((prev) => {
        const next = [...prev, frame];
        return next.length > 140 ? next.slice(-140) : next;
      });

      // 8. Safety Event Triggers
      if (fall.stage === 'confirmed_fall' && !hasTriggeredFallAlertRef.current) {
        hasTriggeredFallAlertRef.current = true;

        const newAlertEvent: SafetyEvent = {
          id: `fall-${Date.now()}`,
          timestamp: Date.now(),
          title: '🚨 Confirmed Simulated Fall Event',
          room: 'Virtual Room A',
          confidence: pred.confidence,
          riskLevel: 'CRITICAL',
          riskScore: risk.score,
          status: 'active',
          explanation: pred.explanation,
        };

        setEvents((prev) => [newAlertEvent, ...prev]);
        setActiveAlertEvent(newAlertEvent);
        audioAlerts.playAlertTone();
      } else if (fall.stage === 'normal') {
        hasTriggeredFallAlertRef.current = false;
      }

      // Log significant activity changes
      if (pred.activity !== lastRecordedActivityRef.current && pred.confidence > 75) {
        lastRecordedActivityRef.current = pred.activity;
        const infoEvent: SafetyEvent = {
          id: `act-${Date.now()}`,
          timestamp: Date.now(),
          title: `${pred.activityLabel} Activity Detected`,
          room: 'Virtual Room A',
          confidence: pred.confidence,
          riskLevel: risk.level,
          riskScore: risk.score,
          status: 'resolved',
          explanation: pred.explanation,
        };
        setEvents((prev) => [infoEvent, ...prev.slice(0, 40)]);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Master Hackathon Demo Runner
  const handleStartMasterDemo = () => {
    setIsMasterDemoRunning(true);
    setDemoStepIdx(0);
    setActiveTab('command_center');

    const steps = HACKATHON_MASTER_DEMO.steps;
    let stepIndex = 0;

    const runStep = () => {
      if (stepIndex >= steps.length) {
        setIsMasterDemoRunning(false);
        return;
      }

      const current = steps[stepIndex];
      setDemoStepIdx(stepIndex);
      setDemoSecondsRemaining(current.durationSeconds);

      // Apply to simulator
      simulatorRef.current.setActivity(current.activity, current.peopleCount);

      if (current.activity === 'fall') {
        audioAlerts.playAlertTone();
      } else {
        audioAlerts.playPingTone();
      }

      let stepSeconds = current.durationSeconds;
      const secondTimer = setInterval(() => {
        stepSeconds -= 1;
        setDemoSecondsRemaining(stepSeconds);
        if (stepSeconds <= 0) {
          clearInterval(secondTimer);
          stepIndex++;
          runStep();
        }
      }, 1000);
    };

    runStep();
  };

  // Activity Trigger Handler
  const handleTriggerActivity = (activity: ActivityType, peopleCount: number = 1) => {
    simulatorRef.current.setActivity(activity, peopleCount);
    if (activity === 'fall') {
      audioAlerts.playAlertTone();
    } else {
      audioAlerts.playPingTone();
    }
  };

  // Clear Alerts
  const handleClearAlerts = () => {
    setActiveAlertEvent(null);
    fallDetectorRef.current.reset();
    hasTriggeredFallAlertRef.current = false;
    simulatorRef.current.setActivity('standing', 1);
  };

  // Reset Baseline
  const handleResetBaseline = () => {
    anomalyEngineRef.current.calibrateBaseline();
    audioAlerts.playPingTone();
    const event: SafetyEvent = {
      id: `baseline-${Date.now()}`,
      timestamp: Date.now(),
      title: 'RF Baseline Recalibrated',
      room: 'Virtual Room A',
      confidence: 99.8,
      riskLevel: 'LOW',
      riskScore: 4,
      status: 'resolved',
      explanation: 'Recalibrated Gaussian noise floor and multipath amplitude reference vectors for empty space.',
    };
    setEvents((prev) => [event, ...prev]);
  };

  // Audio Toggle
  const handleToggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    audioAlerts.setMuted(nextMuted);
    if (!nextMuted) {
      audioAlerts.playPingTone();
    }
  };

  // Modal actions
  const handleAcknowledgeAlert = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'acknowledged' } : e))
    );
    setActiveAlertEvent(null);
  };

  const handleDismissAlert = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'dismissed' } : e))
    );
    setActiveAlertEvent(null);
    fallDetectorRef.current.reset();
    simulatorRef.current.setActivity('standing', 1);
  };

  const handleEscalateAlert = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'escalated' } : e))
    );
    setActiveAlertEvent(null);
  };

  return (
    <div className="min-h-screen bg-[#dbe0e6] text-zinc-900 flex flex-col font-serif selection:bg-zinc-300 selection:text-zinc-950">
      {/* Top Universal Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        systemStatus="simulated_stream"
        safetyRiskLevel={currentRiskScore.level}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        onStartMasterDemo={handleStartMasterDemo}
        isMasterDemoRunning={isMasterDemoRunning}
        activeAlertCount={events.filter((e) => e.status === 'active').length}
      />

      {/* Scripted Master Demo HUD Overlay */}
      {isMasterDemoRunning && (
        <div className="sticky top-16 z-30 bg-[#e4e7ec] border-b border-zinc-400 px-4 py-2.5 text-xs font-mono flex items-center justify-between shadow-xs text-zinc-900 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-zinc-800"></span>
            </span>
            <span className="font-bold text-zinc-950 tracking-wide uppercase text-[11px]">
              Master Demo In Progress
            </span>
            <span className="text-zinc-700 hidden sm:inline font-serif">
              Step {demoStepIdx + 1} of {HACKATHON_MASTER_DEMO.steps.length}:{' '}
              <strong className="text-black font-semibold">
                {HACKATHON_MASTER_DEMO.steps[demoStepIdx]?.title}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-zinc-700">
              Next transition: <strong className="font-bold text-zinc-950">{demoSecondsRemaining}s</strong>
            </span>
            <button
              onClick={() => setIsMasterDemoRunning(false)}
              className="px-2.5 py-1 rounded bg-zinc-300 hover:bg-zinc-400 border border-zinc-400 text-zinc-900 text-[11px] font-sans font-medium transition"
            >
              Cancel Demo
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
        {activeTab === 'landing' && (
          <LandingPageView
            onNavigate={setActiveTab}
            onStartMasterDemo={handleStartMasterDemo}
          />
        )}

        {activeTab === 'command_center' && (
          <CommandCenter
            prediction={currentPrediction}
            riskScore={currentRiskScore}
            fallState={currentFallState}
            occupancy={currentOccupancy}
            frames={framesBuffer}
            recentEvents={events}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
            onTriggerActivity={handleTriggerActivity}
            onClearAlerts={handleClearAlerts}
            onResetBaseline={handleResetBaseline}
            sensitivity={sensitivity}
            onChangeSensitivity={(s) => {
              setSensitivity(s);
              fallDetectorRef.current.setSensitivity(s);
            }}
            isAudioMuted={isAudioMuted}
            onToggleAudio={handleToggleAudio}
            onSelectEvent={(ev) => setActiveTab('events')}
          />
        )}

        {activeTab === 'simulation' && (
          <ScenarioSimulator
            onApplyActivity={handleTriggerActivity}
            isMasterDemoRunning={isMasterDemoRunning}
            onStartMasterDemo={handleStartMasterDemo}
          />
        )}

        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'events' && (
          <EventTimeline
            events={events}
            onClearEvents={() => setEvents([])}
            onSelectEvent={(ev) => {
              if (ev.riskLevel === 'CRITICAL' && ev.status === 'active') {
                setActiveAlertEvent(ev);
              }
            }}
          />
        )}

        {activeTab === 'virtual_room' && (
          <div className="w-full -mt-4 -mx-4 sm:-mt-6 sm:-mx-6 lg:-mt-8 lg:-mx-8">
            <VirtualSensingRoomPage
              onBackToCommandCenter={() => setActiveTab('command_center')}
            />
          </div>
        )}

        {(activeTab === 'architecture' || activeTab === 'innovation_stack') && <ArchitectureView />}

        {activeTab === 'judge_mode' && (
          <JudgeModeView
            prediction={currentPrediction}
            riskScore={currentRiskScore}
            fallState={currentFallState}
            frames={framesBuffer}
            onStartMasterDemo={handleStartMasterDemo}
            isDemoRunning={isMasterDemoRunning}
            onExitJudgeMode={() => setActiveTab('command_center')}
          />
        )}
      </main>

      {/* Simulated Emergency Alert Modal */}
      <EmergencyAlertModal
        event={activeAlertEvent}
        onAcknowledge={handleAcknowledgeAlert}
        onDismiss={handleDismissAlert}
        onEscalate={handleEscalateAlert}
      />

      {/* Global Footer in Architectural Grey */}
      <footer className="border-t border-zinc-400 bg-[#e4e7ec] px-6 py-4 text-xs font-serif text-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="text-zinc-950 font-bold tracking-tight text-sm font-['Playfair_Display',serif]">Wi-Safe AI</span>
          <span className="text-zinc-400">•</span>
          <span className="text-zinc-800">Camera-Free Ambient RF Safety Platform</span>
          <span className="text-zinc-400">•</span>
          <span className="text-zinc-900 bg-zinc-300 px-2 py-0.5 rounded border border-zinc-400 text-[11px] font-mono">Software Simulation Prototype</span>
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-zinc-600 font-mono">
          <span>NO CAMERA / NO MICROPHONE / ZERO WEARABLES</span>
          <span className="text-zinc-400">•</span>
          <span>OFDM 30-Subcarrier Channel State Information</span>
        </div>
      </footer>
    </div>
  );
}
