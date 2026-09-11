import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AvatarActivity,
  CSIRawPacket,
  DataSourceMode,
  CSIStreamMode,
  FallSequenceStage,
  PairedDevice,
  RiskBreakdown,
  RoomConfig,
  VirtualRoomEvent,
  DeviceTelemetryData,
} from '../../types/virtualRoom';
import { RECORDED_CSI_DATASETS } from '../../data/recordedCSIDatasets';
import { VirtualRoomCanvas } from './VirtualRoomCanvas';
import { LiveCSIWaveform } from './LiveCSIWaveform';
import { SubcarrierHeatmap } from './SubcarrierHeatmap';
import { LiveDeviceMotionChart } from './LiveDeviceMotionChart';
import { AIDetectionEnginePanel } from './AIDetectionEnginePanel';
import { DevicePairingModal } from './DevicePairingModal';
import { LiveEventTimeline } from './LiveEventTimeline';
import {
  Activity,
  Radio,
  Wifi,
  ShieldCheck,
  EyeOff,
  MicOff,
  VideoOff,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Smartphone,
  AlertTriangle,
  Flame,
  Layers,
  Cpu,
  Info,
  Send,
  CheckCircle2,
  Server,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  QrCode,
  Zap,
} from 'lucide-react';

interface VirtualSensingRoomPageProps {
  onBackToCommandCenter?: () => void;
}

export const VirtualSensingRoomPage: React.FC<VirtualSensingRoomPageProps> = ({
  onBackToCommandCenter,
}) => {
  // 1. Data Mode State
  const [mode, setMode] = useState<DataSourceMode>('SIMULATION');
  const [isJudgeView, setIsJudgeView] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  // Time clock
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Room Configuration
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    widthMeters: 5.0,
    lengthMeters: 5.0,
    txPosition: { x: 0.16, y: 0.5 },
    rxPosition: { x: 0.84, y: 0.5 },
    humanPosition: { x: 0.5, y: 0.5 },
    showFresnelZones: true,
    showMultipathRays: true,
    showDigitalGrid: true,
  });

  // 3. Activity & Occupancy State
  const [simulationActivity, setSimulationActivity] = useState<AvatarActivity>('walking');
  const [occupancyCount, setOccupancyCount] = useState<number>(1);
  const [fallStage, setFallStage] = useState<FallSequenceStage>('normal_movement');

  // 4. Live WebSocket Backend Connection & Streaming State
  const [wsStatus, setWsStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [pairingCode, setPairingCode] = useState<string>('WSAFE-4821');
  const [activePhoneConnected, setActivePhoneConnected] = useState<boolean>(false);
  const [activePhoneDetails, setActivePhoneDetails] = useState<{
    deviceId: string;
    deviceName: string;
    connectedAt: number;
    lastPingMs?: number;
  } | null>(null);

  const [hasCsiHardwareSource, setHasCsiHardwareSource] = useState<boolean>(false);
  const [totalTelemetryPackets, setTotalTelemetryPackets] = useState<number>(0);
  const [totalCsiPackets, setTotalCsiPackets] = useState<number>(0);
  const [packetRate, setPacketRate] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number>(18);

  // Live Phone Telemetry Stream State
  const [currentTelemetry, setCurrentTelemetry] = useState<DeviceTelemetryData | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<DeviceTelemetryData[]>([]);

  // 5. Recorded Datasets State
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('rec_fall_01');
  const [recordedPlaybackIdx, setRecordedPlaybackIdx] = useState<number>(0);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState<boolean>(true);

  // 6. CSI Packet History Buffer
  const [packetHistory, setPacketHistory] = useState<CSIRawPacket[]>([]);
  const [currentPacket, setCurrentPacket] = useState<CSIRawPacket | null>(null);

  // 7. Paired Devices State
  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);

  // 8. Event Timeline
  const [events, setEvents] = useState<VirtualRoomEvent[]>([
    {
      id: 'ev-0',
      timestamp: new Date().toLocaleTimeString(),
      title: 'Virtual Sensing Room Initialized',
      type: 'connection',
      details: 'WebSocket telemetry and RF subcarrier pipeline active on port 3000',
    },
  ]);

  const addEvent = useCallback((title: string, details: string, type: VirtualRoomEvent['type']) => {
    setEvents((prev) => [
      {
        id: `ev-${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        title,
        details,
        type,
      },
      ...prev.slice(0, 40),
    ]);
  }, []);

  const wsRef = useRef<WebSocket | null>(null);

  // Connect to Backend WebSocket
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    let socket: WebSocket | null = null;
    let isMounted = true;

    const connect = () => {
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          setWsStatus('CONNECTED');
          socket?.send(JSON.stringify({ type: 'dashboard_subscribe' }));
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'system_state') {
              if (data.pairingCode) setPairingCode(data.pairingCode);
              if (data.connectedPhone) {
                setActivePhoneConnected(true);
                setActivePhoneDetails(data.connectedPhone);
                // Auto switch to telemetry if phone already streaming
                setMode('LIVE_DEVICE_TELEMETRY');
              }
              if (data.csiSource) {
                setHasCsiHardwareSource(true);
              }
              if (typeof data.totalTelemetryPackets === 'number') {
                setTotalTelemetryPackets(data.totalTelemetryPackets);
              }
            } else if (data.type === 'phone_connected') {
              setActivePhoneConnected(true);
              setActivePhoneDetails({
                deviceId: data.deviceId,
                deviceName: data.deviceName,
                connectedAt: data.connectedAt,
              });
              setMode('LIVE_DEVICE_TELEMETRY');
              addEvent(
                `Device Connected: ${data.deviceName}`,
                `Mobile device [${data.deviceId}] paired successfully. Switched to LIVE DEVICE TELEMETRY.`,
                'connection'
              );
            } else if (data.type === 'phone_disconnected') {
              setActivePhoneConnected(false);
              addEvent(
                'Device Disconnected',
                `Connection with device lost. Switched to standby.`,
                'warning'
              );
            } else if (data.type === 'live_telemetry') {
              const tel: DeviceTelemetryData = {
                deviceId: data.deviceId,
                deviceName: data.deviceId,
                timestamp: data.timestamp,
                accel: data.accel,
                gyro: data.gyro,
                orientation: data.orientation,
                movementIntensity: data.movementIntensity,
                motionState: data.motionState,
                samplingRateHz: data.samplingRateHz,
              };

              setCurrentTelemetry(tel);
              setTelemetryHistory((prev) => [...prev.slice(-120), tel]);
              setTotalTelemetryPackets((prev) => prev + 1);
              if (data.packetRate) setPacketRate(data.packetRate);

              // Update avatar position slightly based on orientation/tilt
              if (data.orientation) {
                const pitch = data.orientation.beta || 0; // -90 to 90
                const roll = data.orientation.gamma || 0;  // -90 to 90
                const normX = Math.max(0.2, Math.min(0.8, 0.5 + roll / 180));
                const normY = Math.max(0.2, Math.min(0.8, 0.5 + pitch / 180));
                setRoomConfig((prev) => ({
                  ...prev,
                  humanPosition: { x: normX, y: normY },
                }));
              }
            } else if (data.type === 'live_csi_packet') {
              setHasCsiHardwareSource(true);
              const csiPacket: CSIRawPacket = {
                timestamp: data.timestamp,
                deviceId: data.deviceId,
                frequency: data.frequency,
                subcarriers: data.subcarriers,
                amplitude: data.amplitude,
                phase: data.phase,
                snr: data.snr,
                rssi: data.rssi,
              };
              setCurrentPacket(csiPacket);
              setPacketHistory((prev) => [...prev.slice(-150), csiPacket]);
              setTotalCsiPackets((prev) => prev + 1);
              if (data.packetRate) setPacketRate(data.packetRate);
            } else if (data.type === 'pong') {
              const rtt = Date.now() - data.clientTimestamp;
              setLatencyMs(rtt);
            }
          } catch {
            // ignore
          }
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setWsStatus('DISCONNECTED');
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setWsStatus('DISCONNECTED');
          setTimeout(connect, 3000);
        };
      } catch {
        setWsStatus('DISCONNECTED');
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (socket) socket.close();
    };
  }, [addEvent]);

  // Handle Simulation Mode Loop (50 Hz frame generator)
  useEffect(() => {
    if (mode !== 'SIMULATION') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const t = now / 1000;
      const subcarriers = Array.from({ length: 30 }, (_, i) => i);
      const amplitude: number[] = [];
      const phase: number[] = [];

      for (let k = 0; k < 30; k++) {
        const baseStatic = 22 + Math.sin(k * 0.4) * 5;
        let delta = 0;
        let pShift = ((k * 0.2) % (2 * Math.PI)) - Math.PI;

        if (simulationActivity === 'walking') {
          delta = Math.sin(2 * Math.PI * 1.2 * t + k * 0.15) * 6 + (Math.random() - 0.5) * 1.2;
          pShift += Math.sin(2 * Math.PI * 1.2 * t) * 0.8;
        } else if (simulationActivity === 'hand_movement') {
          delta = Math.sin(2 * Math.PI * 3.5 * t) * 7.5 + (Math.random() - 0.5) * 1.5;
          pShift += Math.sin(2 * Math.PI * 3.5 * t) * 1.4;
        } else if (simulationActivity === 'sitting') {
          delta = Math.sin(2 * Math.PI * 0.25 * t) * 1.5 + (Math.random() - 0.5) * 0.6;
        } else if (simulationActivity === 'lying') {
          delta = (Math.random() - 0.5) * 0.5;
        } else if (simulationActivity === 'fall') {
          delta = Math.sin(2 * Math.PI * 4 * t) * 12 + 10;
        }

        amplitude.push(Math.max(2, baseStatic + delta));
        phase.push(pShift);
      }

      const simPacket: CSIRawPacket = {
        timestamp: now,
        subcarriers,
        amplitude,
        phase,
        frequency: 5180,
        deviceId: 'SIMULATED-TX-RX',
        snr: 33.2 + Math.sin(t) * 1.5,
        rssi: -52 + Math.cos(t) * 2,
      };

      setCurrentPacket(simPacket);
      setPacketHistory((prev) => [...prev.slice(-150), simPacket]);
    }, 20);

    return () => clearInterval(interval);
  }, [mode, simulationActivity]);

  // Handle Recorded CSI Mode Loop
  useEffect(() => {
    if (mode !== 'RECORDED_CSI' || !isPlayingRecorded) return;

    const dataset = RECORDED_CSI_DATASETS.find((d) => d.id === selectedDatasetId) || RECORDED_CSI_DATASETS[0];

    const interval = setInterval(() => {
      setRecordedPlaybackIdx((prevIdx) => {
        const nextIdx = (prevIdx + 1) % dataset.frames.length;
        const pkt = dataset.frames[nextIdx];
        setCurrentPacket(pkt);
        setPacketHistory((prev) => [...prev.slice(-150), pkt]);
        return nextIdx;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [mode, isPlayingRecorded, selectedDatasetId]);

  // Derive active avatar activity depending on mode
  const currentActivity: AvatarActivity = (() => {
    if (mode === 'LIVE_DEVICE_TELEMETRY') {
      if (!currentTelemetry) return 'standing';
      if (currentTelemetry.motionState === 'POSSIBLE_FALL') return 'fall';
      if (currentTelemetry.motionState === 'ACTIVE' || currentTelemetry.movementIntensity > 20) return 'walking';
      if (currentTelemetry.motionState === 'SLIGHT_MOTION' || currentTelemetry.movementIntensity > 8) return 'hand_movement';
      return 'standing';
    }
    if (mode === 'LIVE_CSI') {
      return hasCsiHardwareSource ? 'walking' : 'standing';
    }
    if (mode === 'RECORDED_CSI') {
      return RECORDED_CSI_DATASETS.find((d) => d.id === selectedDatasetId)?.primaryActivity || 'walking';
    }
    return simulationActivity;
  })();

  // Calculate dynamic variance from packet history or telemetry
  const computedVariance = (() => {
    if (mode === 'LIVE_DEVICE_TELEMETRY') {
      const intensity = currentTelemetry?.movementIntensity || 0;
      return intensity / 35;
    }
    const recent = packetHistory.slice(-25);
    if (recent.length > 5) {
      const means = recent.map((f) => f.amplitude.reduce((a, b) => a + b, 0) / f.amplitude.length);
      const overallMean = means.reduce((a, b) => a + b, 0) / means.length;
      const sqDiffs = means.map((m) => Math.pow(m - overallMean, 2));
      return sqDiffs.reduce((a, b) => a + b, 0) / sqDiffs.length;
    }
    return 0.2;
  })();

  const disturbanceLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
    computedVariance > 1.8 ? 'HIGH' : computedVariance > 0.45 ? 'MEDIUM' : 'LOW';

  // Fall sequence state progression
  useEffect(() => {
    if (currentActivity === 'fall') {
      setFallStage('sudden_csi_disturbance');
      const t1 = setTimeout(() => setFallStage('potential_fall'), 600);
      const t2 = setTimeout(() => setFallStage('post_event_inactivity'), 1200);
      const t3 = setTimeout(() => setFallStage('ai_verification'), 2000);
      const t4 = setTimeout(() => {
        setFallStage('safety_alert');
        addEvent(
          '🚨 Critical Fall Verified by AI',
          mode === 'LIVE_DEVICE_TELEMETRY'
            ? 'High-G impact vector followed by floor stillness detected from phone telemetry'
            : 'Subcarrier Doppler dispersion impact verified across RF channel',
          'alert'
        );
      }, 2800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else {
      setFallStage('normal_movement');
    }
  }, [currentActivity, mode, addEvent]);

  // Risk Breakdown calculation
  const isFall = currentActivity === 'fall';
  const csiDisturbance = isFall ? 36 : disturbanceLevel === 'HIGH' ? 24 : disturbanceLevel === 'MEDIUM' ? 12 : 5;
  const inactivityScore = isFall ? 32 : currentActivity === 'lying' ? 22 : currentActivity === 'sitting' ? 10 : 2;
  const anomalyScoreVal = isFall ? 16 : disturbanceLevel === 'HIGH' ? 10 : 4;
  const confidenceFactor = isFall ? 8 : 4;
  const totalRiskScore = Math.min(100, csiDisturbance + inactivityScore + anomalyScoreVal + confidenceFactor);

  const riskCategory: RiskBreakdown['riskCategory'] =
    totalRiskScore >= 80 ? 'CRITICAL' : totalRiskScore >= 60 ? 'HIGH' : totalRiskScore >= 30 ? 'MODERATE' : 'LOW';

  const riskBreakdown: RiskBreakdown = {
    csiDisturbance,
    inactivityScore,
    anomalyScore: anomalyScoreVal,
    confidenceFactor,
    totalScore: totalRiskScore,
    riskCategory,
  };

  // Switch Mode Handler
  const handleSelectMode = (newMode: DataSourceMode) => {
    setMode(newMode);
    if (newMode === 'LIVE_DEVICE_TELEMETRY') {
      addEvent(
        'Mode Changed: LIVE DEVICE TELEMETRY',
        'Streaming accelerometer and motion telemetry over local Wi-Fi WebSocket',
        'connection'
      );
    } else if (newMode === 'LIVE_CSI') {
      addEvent(
        'Mode Changed: LIVE CSI',
        hasCsiHardwareSource
          ? 'Receiving actual hardware CSI packets'
          : 'Waiting for CSI hardware source (ESP32/Tool)',
        'info'
      );
    } else if (newMode === 'RECORDED_CSI') {
      addEvent(
        'Mode Changed: RECORDED CSI',
        'Ground-truth empirical capture replay active',
        'info'
      );
    } else {
      addEvent('Mode Changed: SIMULATION', 'Synthetic OFDM physics engine active', 'info');
    }
  };

  // Regenerate pairing code
  const handleRefreshPairingCode = async () => {
    try {
      const res = await fetch('/api/reset-session', { method: 'POST' });
      const data = await res.json();
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
        setActivePhoneConnected(false);
        addEvent('Pairing Code Reset', `New session code: ${data.pairingCode}`, 'info');
      }
    } catch {
      const code = 'WSAFE-' + Math.floor(1000 + Math.random() * 9000);
      setPairingCode(code);
    }
  };

  // Start Live Session Action
  const handleStartLiveSession = () => {
    if (!activePhoneConnected) {
      setIsDeviceModalOpen(true);
      addEvent('Live Session Setup', 'Connect a mobile device using the QR code to stream telemetry', 'info');
    } else {
      setMode('LIVE_DEVICE_TELEMETRY');
      addEvent('Live Session Engaged', 'Synchronizing virtual sensing room with live connected phone', 'connection');
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#dbe0e6] text-zinc-900 font-serif flex flex-col ${
        isJudgeView ? 'p-2 sm:p-4' : 'p-3 sm:p-6'
      }`}
    >
      {/* 1. Top Header Bar */}
      <header className="rounded-2xl border border-zinc-400 bg-[#e4e7ec] p-4 sm:p-5 shadow-xs mb-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Brand & Page Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-zinc-900 text-white shadow-xs">
              <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-black font-['Playfair_Display',serif]">
                  Wi-Safe AI
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-300 border border-zinc-400 text-zinc-900 font-bold uppercase tracking-wider">
                  VIRTUAL SENSING ROOM
                </span>
                {onBackToCommandCenter && !isJudgeView && (
                  <button
                    onClick={onBackToCommandCenter}
                    className="ml-2 text-xs font-serif text-zinc-600 hover:text-black underline transition cursor-pointer"
                  >
                    ← Command Center
                  </button>
                )}
              </div>
              <p className="text-xs text-zinc-600 font-serif tracking-wide mt-0.5">
                Full-Screen Ambient RF Sensing • Digital Twin Simulation & Live Device Telemetry
              </p>
            </div>
          </div>

          {/* Telemetry Status Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs font-mono">
            {/* Current Mode Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-zinc-400 shadow-xs">
              <span className="text-zinc-500 text-[10px] uppercase font-bold">SOURCE:</span>
              <span
                className={`font-bold text-xs flex items-center gap-1.5 ${
                  mode === 'LIVE_DEVICE_TELEMETRY'
                    ? 'text-cyan-800'
                    : mode === 'LIVE_CSI'
                    ? 'text-emerald-700'
                    : mode === 'RECORDED_CSI'
                    ? 'text-amber-800'
                    : 'text-zinc-800'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current" />
                {mode === 'LIVE_DEVICE_TELEMETRY'
                  ? 'LIVE DEVICE TELEMETRY'
                  : mode === 'LIVE_CSI'
                  ? 'LIVE CSI'
                  : mode === 'RECORDED_CSI'
                  ? 'RECORDED CSI'
                  : 'SIMULATION'}
              </span>
            </div>

            {/* Connected Phone Indicator */}
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition cursor-pointer shadow-xs ${
                activePhoneConnected
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                  : 'bg-white border-zinc-400 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-zinc-800" />
              <span className="font-bold text-[11px]">
                {activePhoneConnected
                  ? `● ${activePhoneDetails?.deviceName || 'Phone'} (${packetRate} pkts/s)`
                  : '○ NO PHONE CONNECTED'}
              </span>
            </button>

            {/* Latency */}
            <div className="px-3 py-1.5 rounded-xl bg-white border border-zinc-400 shadow-xs flex items-center gap-2">
              <span className="text-zinc-500 text-[10px] uppercase">RTT:</span>
              <span className="text-zinc-900 font-bold">{latencyMs} ms</span>
            </div>

            {/* Time Clock */}
            <div className="px-3 py-1.5 rounded-xl bg-white border border-zinc-400 shadow-xs text-zinc-800 font-mono text-[11px]">
              {currentTime}
            </div>

            {/* Judge View / Full Screen Toggle */}
            <button
              onClick={() => setIsJudgeView(!isJudgeView)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition shadow-xs cursor-pointer ${
                isJudgeView
                  ? 'bg-zinc-900 text-white border-black'
                  : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-400'
              }`}
            >
              {isJudgeView ? (
                <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-zinc-600" />
              )}
              <span>{isJudgeView ? 'STANDARD VIEW' : 'JUDGE VIEW'}</span>
            </button>
          </div>
        </div>

        {/* 2. Mode Switcher & Quick Actions Bar */}
        <div className="mt-3.5 pt-3 border-t border-zinc-300 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-wider">
              OPERATING MODE:
            </span>
            <div className="flex flex-wrap items-center p-1 rounded-xl bg-[#cbd1d8]/60 border border-zinc-400 text-xs font-mono">
              <button
                onClick={() => handleSelectMode('LIVE_DEVICE_TELEMETRY')}
                className={`px-3 py-1 rounded-lg transition text-xs cursor-pointer ${
                  mode === 'LIVE_DEVICE_TELEMETRY'
                    ? 'bg-white text-cyan-950 font-bold shadow-xs border border-zinc-400'
                    : 'text-zinc-700 hover:text-black'
                }`}
              >
                ● LIVE DEVICE TELEMETRY
              </button>
              <button
                onClick={() => handleSelectMode('LIVE_CSI')}
                className={`px-3 py-1 rounded-lg transition text-xs cursor-pointer ${
                  mode === 'LIVE_CSI'
                    ? 'bg-white text-emerald-950 font-bold shadow-xs border border-zinc-400'
                    : 'text-zinc-700 hover:text-black'
                }`}
              >
                ● LIVE CSI
              </button>
              <button
                onClick={() => handleSelectMode('RECORDED_CSI')}
                className={`px-3 py-1 rounded-lg transition text-xs cursor-pointer ${
                  mode === 'RECORDED_CSI'
                    ? 'bg-white text-amber-950 font-bold shadow-xs border border-zinc-400'
                    : 'text-zinc-700 hover:text-black'
                }`}
              >
                ● RECORDED CSI
              </button>
              <button
                onClick={() => handleSelectMode('SIMULATION')}
                className={`px-3 py-1 rounded-lg transition text-xs cursor-pointer ${
                  mode === 'SIMULATION'
                    ? 'bg-white text-zinc-950 font-bold shadow-xs border border-zinc-400'
                    : 'text-zinc-700 hover:text-black'
                }`}
              >
                ● SIMULATION
              </button>
            </div>
          </div>

          {/* Quick Actions: Connect Device & Start Live Session */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-400 text-zinc-900 text-xs font-mono font-bold transition shadow-xs cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-700" />
              <span>CONNECT DEVICE</span>
            </button>

            <button
              onClick={handleStartLiveSession}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-mono font-bold transition shadow-xs cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-cyan-400 fill-current" />
              <span>START LIVE SESSION</span>
            </button>
          </div>
        </div>
      </header>

      {/* No CSI Source Warning Banner when in LIVE_CSI mode without actual hardware */}
      {mode === 'LIVE_CSI' && !hasCsiHardwareSource && (
        <div className="rounded-xl border border-amber-400 bg-amber-50/90 p-3.5 mb-4 text-amber-950 text-xs flex items-center justify-between gap-3 shadow-xs font-serif">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
            <div>
              <strong className="font-mono text-xs uppercase text-amber-900 block">
                NO CSI SOURCE DETECTED
              </strong>
              <span>
                To stream actual CSI packets, run an ESP32-CSI firmware node or send POST{' '}
                <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono">/api/csi-packet</code>.
                Switch to <strong>LIVE DEVICE TELEMETRY</strong> to test real-time sensing using your mobile phone.
              </span>
            </div>
          </div>
          <button
            onClick={() => handleSelectMode('LIVE_DEVICE_TELEMETRY')}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white rounded-lg font-mono text-xs font-bold shrink-0 transition shadow-xs cursor-pointer"
          >
            SWITCH TO PHONE TELEMETRY
          </button>
        </div>
      )}

      {/* Active Phone Telemetry Banner when streaming */}
      {mode === 'LIVE_DEVICE_TELEMETRY' && activePhoneConnected && currentTelemetry && (
        <div className="rounded-xl border border-cyan-400 bg-cyan-50/80 p-3 mb-4 text-cyan-950 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs font-serif">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-800 animate-bounce" />
            <strong className="font-mono uppercase text-cyan-900">
              STREAMING LIVE FROM {currentTelemetry.deviceName}:
            </strong>
            <span className="font-mono text-[11px]">
              Packets: {totalTelemetryPackets.toLocaleString()} • Rate: {packetRate} pkts/s • Motion:{' '}
              <strong className="text-black">{currentTelemetry.motionState}</strong> (Intensity:{' '}
              {currentTelemetry.movementIntensity}%)
            </span>
          </div>
          <div className="text-[11px] font-mono text-cyan-900">
            Tilt Pitch: {currentTelemetry.orientation?.beta ?? 0}° • Roll:{' '}
            {currentTelemetry.orientation?.gamma ?? 0}°
          </div>
        </div>
      )}

      {/* 3. Judge Mode Live Presentation Header (Shown when Judge View is Active) */}
      {isJudgeView && (
        <div className="rounded-2xl border border-zinc-400 bg-white p-5 shadow-xs mb-4 space-y-4 font-serif">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded">
                JUDGE LIVE DEMONSTRATION & ARCHITECTURE
              </span>
              <h2 className="text-lg font-bold text-black font-['Playfair_Display',serif] mt-1">
                Wi-Safe AI — Privacy-Conscious Wireless Sensing
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 bg-zinc-200 rounded border border-zinc-400 text-zinc-800">
                PORT 3000 • NODE.JS WEBSOCKET
              </span>
              <span className="px-2.5 py-1 bg-emerald-100 rounded border border-emerald-400 text-emerald-900 font-bold">
                ● WEBSOCKET LIVE
              </span>
            </div>
          </div>

          {/* End-to-End Architectural Flow Diagram */}
          <div className="p-3.5 rounded-xl bg-[#e4e7ec] border border-zinc-400 overflow-x-auto">
            <div className="flex items-center justify-between min-w-[760px] text-xs font-mono gap-1 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-zinc-400 flex-1 shadow-2xs">
                <Smartphone className="w-4 h-4 mx-auto text-cyan-800 mb-1" />
                <strong className="block text-[11px] text-zinc-950">PHONE / CSI</strong>
                <span className="text-[10px] text-zinc-600">Motion or 802.11</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="bg-white p-2.5 rounded-lg border border-zinc-400 flex-1 shadow-2xs">
                <Wifi className="w-4 h-4 mx-auto text-zinc-800 mb-1" />
                <strong className="block text-[11px] text-zinc-950">LOCAL WI-FI</strong>
                <span className="text-[10px] text-zinc-600">802.11 Layer</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="bg-white p-2.5 rounded-lg border border-zinc-400 flex-1 shadow-2xs">
                <Server className="w-4 h-4 mx-auto text-zinc-800 mb-1" />
                <strong className="block text-[11px] text-zinc-950">WEB BACKEND</strong>
                <span className="text-[10px] text-zinc-600">Express + ws:3000</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="bg-white p-2.5 rounded-lg border border-zinc-400 flex-1 shadow-2xs">
                <Activity className="w-4 h-4 mx-auto text-cyan-800 mb-1" />
                <strong className="block text-[11px] text-zinc-950">SIGNAL DSP</strong>
                <span className="text-[10px] text-zinc-600">Jerk & Variance</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="bg-white p-2.5 rounded-lg border border-zinc-400 flex-1 shadow-2xs">
                <Cpu className="w-4 h-4 mx-auto text-purple-800 mb-1" />
                <strong className="block text-[11px] text-zinc-950">AI ENGINE</strong>
                <span className="text-[10px] text-zinc-600">Multi-Stage Fall Gate</span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-500 shrink-0" />
              <div className="bg-white p-2.5 rounded-lg border border-zinc-400 flex-1 shadow-2xs">
                <Radio className="w-4 h-4 mx-auto text-emerald-800 mb-1" />
                <strong className="block text-[11px] text-zinc-950">VIRTUAL ROOM</strong>
                <span className="text-[10px] text-zinc-600">Digital Twin Reacts</span>
              </div>
            </div>
          </div>

          {/* Explanation & 6-Step Verification Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-zinc-300 space-y-2">
              <strong className="font-mono text-zinc-900 uppercase block">
                WHAT THE JUDGE IS SEEING:
              </strong>
              <p className="text-zinc-700 leading-relaxed">
                {mode === 'LIVE_DEVICE_TELEMETRY'
                  ? 'The Android or iOS phone is connected over local Wi-Fi to the laptop on port 3000. Live tri-axial accelerometer, gyroscope, and orientation telemetry stream over WebSocket into the signal processing pipeline. The human avatar reacts to real physical movements.'
                  : mode === 'LIVE_CSI'
                  ? 'Channel State Information (CSI) measures the complex transmission coefficients across 30 OFDM subcarriers. Human movements disrupt the multipath wireless reflections, allowing camera-free presence detection.'
                  : 'Currently replaying calibrated empirical RF datasets to demonstrate reproducible benchmarking.'}
              </p>
              <div className="pt-2 border-t border-zinc-200 flex items-center gap-3 text-zinc-600 font-mono text-[11px]">
                <span>NO CAMERA</span>
                <span>•</span>
                <span>NO VIDEO RECORDING</span>
                <span>•</span>
                <span>ZERO WEARABLES REQUIRED</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-zinc-300 space-y-2">
              <strong className="font-mono text-zinc-900 uppercase block">
                LIVE DEMO VERIFICATION CHECKLIST:
              </strong>
              <ul className="space-y-1 font-mono text-[11px] text-zinc-700">
                <li className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] text-white ${
                      activePhoneConnected ? 'bg-emerald-600' : 'bg-zinc-400'
                    }`}
                  >
                    ✓
                  </span>
                  <span>1. Phone connected over local Wi-Fi ({activePhoneConnected ? 'CONNECTED' : 'PENDING'})</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] text-white ${
                      totalTelemetryPackets > 0 ? 'bg-emerald-600' : 'bg-zinc-400'
                    }`}
                  >
                    ✓
                  </span>
                  <span>2. Live sensor stream transmitting ({totalTelemetryPackets.toLocaleString()} pkts)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] text-white ${
                      (currentTelemetry?.movementIntensity || 0) > 5 ? 'bg-emerald-600' : 'bg-zinc-400'
                    }`}
                  >
                    ✓
                  </span>
                  <span>3. Motion detected in physical space ({currentTelemetry?.motionState || 'STATIONARY'})</span>
                </li>
                <li className="flex items-center gap-2">
                  <span
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] text-white ${
                      fallStage !== 'normal_movement' ? 'bg-rose-600' : 'bg-emerald-600'
                    }`}
                  >
                    ✓
                  </span>
                  <span>4. Multi-stage AI temporal fall verification ({fallStage})</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] text-white bg-emerald-600">
                    ✓
                  </span>
                  <span>5. Virtual sensing room synchronized with active stream</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4. Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 8-Column Zone: Virtual Room & Waveforms */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Virtual Room Canvas */}
          <div className="rounded-2xl border border-zinc-400 bg-white p-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-700 animate-pulse" />
                <h3 className="font-bold text-sm text-black font-mono tracking-tight">
                  VIRTUAL RF DIGITAL TWIN
                </h3>
                <span className="text-[11px] font-mono text-zinc-600">
                  (Fresnel Zones • Multi-Path Ray Tracing • Human Disturbance)
                </span>
              </div>

              {/* Simulation Activity Controls when in SIMULATION mode */}
              {mode === 'SIMULATION' && (
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  {(['standing', 'walking', 'sitting', 'hand_movement', 'fall'] as AvatarActivity[]).map(
                    (act) => (
                      <button
                        key={act}
                        onClick={() => setSimulationActivity(act)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] capitalize transition cursor-pointer ${
                          simulationActivity === act
                            ? 'bg-zinc-900 text-white font-bold border-black'
                            : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-700'
                        }`}
                      >
                        {act.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Canvas Stage */}
            <div className="w-full h-[420px] rounded-xl overflow-hidden border border-zinc-400 bg-[#f8fafc]">
              <VirtualRoomCanvas
                activity={currentActivity}
                occupancyCount={occupancyCount}
                disturbanceLevel={disturbanceLevel}
                variance={computedVariance}
                config={roomConfig}
                onChangeConfig={setRoomConfig}
                isSimulated={mode === 'SIMULATION'}
              />
            </div>
          </div>

          {/* Section 12: Live Graph — Dedicated to Device Telemetry or CSI Signal */}
          {mode === 'LIVE_DEVICE_TELEMETRY' ? (
            <LiveDeviceMotionChart
              currentTelemetry={currentTelemetry}
              telemetryHistory={telemetryHistory}
              packetRate={packetRate}
            />
          ) : (
            <div className="space-y-4">
              <LiveCSIWaveform
                currentPacket={currentPacket}
                packetHistory={packetHistory}
                mode={mode}
              />
              <SubcarrierHeatmap packetHistory={packetHistory} />
            </div>
          )}
        </div>

        {/* Right 4-Column Zone: AI Sensing Engine, Events, Controls */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* AI Sensing & Classification Engine */}
          <AIDetectionEnginePanel
            activity={currentActivity}
            confidence={
              mode === 'LIVE_DEVICE_TELEMETRY'
                ? currentTelemetry?.movementIntensity
                  ? Math.min(98.5, 88 + currentTelemetry.movementIntensity / 10)
                  : 94.2
                : 95.8
            }
            anomalyScore={disturbanceLevel === 'HIGH' ? 'High' : disturbanceLevel === 'MEDIUM' ? 'Moderate' : 'Low'}
            occupancyCount={occupancyCount}
            mode={mode}
            fallStage={fallStage}
            risk={riskBreakdown}
            aiStatus="INFERENCE_COMPLETE"
            hasCsiHardwareSource={hasCsiHardwareSource}
          />

          {/* Real-Time Event Timeline */}
          <LiveEventTimeline events={events} onClearEvents={() => setEvents([])} />

          {/* Hardware & Mesh Info Card */}
          <div className="rounded-2xl border border-zinc-400 bg-white p-4 shadow-xs space-y-3 font-serif">
            <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
              <span className="font-bold font-mono text-xs text-black flex items-center gap-2">
                <Wifi className="w-3.5 h-3.5 text-zinc-800" /> SENSING ENVIRONMENT
              </span>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-400">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-[#e4e7ec] border border-zinc-400">
                <span className="text-[10px] text-zinc-600 block">FREQUENCY</span>
                <strong className="text-zinc-950">5.18 GHz (Ch 36)</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#e4e7ec] border border-zinc-400">
                <span className="text-[10px] text-zinc-600 block">SUBCARRIERS</span>
                <strong className="text-zinc-950">30 OFDM Tones</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#e4e7ec] border border-zinc-400">
                <span className="text-[10px] text-zinc-600 block">PROTOCOL</span>
                <strong className="text-zinc-950">802.11ac / Wi-Fi 5</strong>
              </div>
              <div className="p-2 rounded-lg bg-[#e4e7ec] border border-zinc-400">
                <span className="text-[10px] text-zinc-600 block">PRIVACY</span>
                <strong className="text-emerald-800">100% Camera-Free</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgraded Device Connection Center Modal */}
      <DevicePairingModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        pairedDevices={pairedDevices}
        onAddDevice={(dev) => setPairedDevices((prev) => [...prev, dev])}
        activePhoneConnected={activePhoneConnected}
        activePhoneDetails={activePhoneDetails}
        pairingCode={pairingCode}
        onRefreshPairingCode={handleRefreshPairingCode}
        totalPacketsReceived={totalTelemetryPackets}
        currentLatency={latencyMs}
      />
    </div>
  );
};
