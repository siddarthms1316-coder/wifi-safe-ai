import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Smartphone,
  Radio,
  Wifi,
  Play,
  Square,
  Activity,
  Compass,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

interface MobileDevicePageProps {
  initialPairingCode?: string;
}

export const MobileDevicePage: React.FC<MobileDevicePageProps> = ({
  initialPairingCode = '',
}) => {
  // Query param pairing code or default
  const [pairingCode, setPairingCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('code') || initialPairingCode || '';
    }
    return initialPairingCode || '';
  });

  const [deviceName, setDeviceName] = useState<string>(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent;
      if (/Android/i.test(ua)) return 'Android Phone';
      if (/iPhone|iPad/i.test(ua)) return 'Apple iPhone';
      return 'Mobile Browser Client';
    }
    return 'Android Phone';
  });

  const [deviceId] = useState<string>(
    () => 'PHONE-' + Math.floor(1000 + Math.random() * 9000)
  );

  // Connection State
  const [wsStatus, setWsStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('CONNECTING');
  const [isPaired, setIsPaired] = useState<boolean>(false);
  const [pairError, setPairError] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number>(0);

  // Sensing State
  const [isSensing, setIsSensing] = useState<boolean>(false);
  const [packetsSent, setPacketsSent] = useState<number>(0);
  const [sensorPermissionGranted, setSensorPermissionGranted] = useState<boolean | null>(null);
  const [samplingRateHz, setSamplingRateHz] = useState<number>(25);

  // Live Telemetry Values
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [gyro, setGyro] = useState({ x: 0, y: 0, z: 0 });
  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [movementIntensity, setMovementIntensity] = useState<number>(0);
  const [motionState, setMotionState] = useState<'STATIONARY' | 'SLIGHT_MOTION' | 'ACTIVE' | 'SUDDEN_MOTION' | 'POSSIBLE_FALL'>('STATIONARY');

  const wsRef = useRef<WebSocket | null>(null);
  const lastAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const lastPacketTimeRef = useRef<number>(0);
  const packetCounterRef = useRef<number>(0);

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    setWsStatus('CONNECTING');
    setPairError('');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsStatus('CONNECTED');
        // Auto attempt pairing if code is available
        const codeToUse = pairingCode.trim() || 'WSAFE-AUTO';
        socket.send(
          JSON.stringify({
            type: 'pair_phone',
            deviceId,
            deviceName,
            pairingCode: codeToUse,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pair_ack') {
            if (data.success) {
              setIsPaired(true);
              setPairError('');
            } else {
              setIsPaired(false);
              setPairError(data.error || 'Pairing rejected by server');
            }
          } else if (data.type === 'pong') {
            const rtt = Date.now() - data.clientTimestamp;
            setLatencyMs(rtt);
          }
        } catch {
          // ignore
        }
      };

      socket.onerror = () => {
        setWsStatus('ERROR');
        setPairError('WebSocket connection error. Check Wi-Fi connection.');
      };

      socket.onclose = () => {
        setWsStatus('DISCONNECTED');
        setIsPaired(false);
      };
    } catch {
      setWsStatus('ERROR');
      setPairError('Could not initialize WebSocket');
    }
  }, [pairingCode, deviceId, deviceName]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Ping timer for latency
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ping',
            clientTimestamp: Date.now(),
          })
        );
      }
    }, 2000);
    return () => clearInterval(pingInterval);
  }, []);

  // Request Motion & Orientation Permissions (especially for iOS Safari 13+)
  const requestSensorPermission = async () => {
    try {
      // iOS specific permission request
      const DeviceMotionEventTyped = window.DeviceMotionEvent as unknown as {
        requestPermission?: () => Promise<'granted' | 'denied'>;
      };

      if (typeof DeviceMotionEventTyped?.requestPermission === 'function') {
        const response = await DeviceMotionEventTyped.requestPermission();
        if (response === 'granted') {
          setSensorPermissionGranted(true);
          return true;
        } else {
          setSensorPermissionGranted(false);
          setPairError('Motion sensor permission was denied in browser settings.');
          return false;
        }
      } else {
        // Standard Android / Chrome
        setSensorPermissionGranted(true);
        return true;
      }
    } catch (e) {
      console.warn('Sensor permission error or desktop:', e);
      setSensorPermissionGranted(true);
      return true;
    }
  };

  // Start / Stop Sensing Handler
  const handleToggleSensing = async () => {
    if (isSensing) {
      setIsSensing(false);
    } else {
      const ok = await requestSensorPermission();
      if (ok) {
        setIsSensing(true);
      }
    }
  };

  // Attach DeviceMotion and DeviceOrientation listeners
  useEffect(() => {
    if (!isSensing) return;

    let localSampleCount = 0;
    const rateTimer = setInterval(() => {
      setSamplingRateHz(localSampleCount);
      localSampleCount = 0;
    }, 1000);

    const handleMotion = (event: DeviceMotionEvent) => {
      localSampleCount++;

      // Raw or without gravity
      const acc = event.acceleration || event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
      const currentX = acc.x || 0;
      const currentY = acc.y || 0;
      const currentZ = acc.z || 0;

      // Gyro rotation rate
      const rot = event.rotationRate || { alpha: 0, beta: 0, gamma: 0 };
      const gyroX = rot.alpha || 0;
      const gyroY = rot.beta || 0;
      const gyroZ = rot.gamma || 0;

      // Calculate Jerk / Magnitude change
      const dx = currentX - lastAccelRef.current.x;
      const dy = currentY - lastAccelRef.current.y;
      const dz = currentZ - lastAccelRef.current.z;
      const deltaMag = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const totalMag = Math.sqrt(currentX * currentX + currentY * currentY + currentZ * currentZ);

      lastAccelRef.current = { x: currentX, y: currentY, z: currentZ };

      // Movement intensity (0 to 100%)
      const intensity = Math.min(100, Math.round((deltaMag / 8) * 100));

      // Motion state classifier
      let state: 'STATIONARY' | 'SLIGHT_MOTION' | 'ACTIVE' | 'SUDDEN_MOTION' | 'POSSIBLE_FALL' = 'STATIONARY';
      if (totalMag > 22 || deltaMag > 16) {
        state = 'POSSIBLE_FALL';
      } else if (deltaMag > 6) {
        state = 'SUDDEN_MOTION';
      } else if (deltaMag > 1.8) {
        state = 'ACTIVE';
      } else if (deltaMag > 0.4) {
        state = 'SLIGHT_MOTION';
      }

      setAccel({ x: currentX, y: currentY, z: currentZ });
      setGyro({ x: gyroX, y: gyroY, z: gyroZ });
      setMovementIntensity(intensity);
      setMotionState(state);

      // Transmit to backend via WebSocket (throttle to ~25Hz to save mobile battery)
      const now = Date.now();
      if (now - lastPacketTimeRef.current >= 40) {
        lastPacketTimeRef.current = now;
        packetCounterRef.current += 1;
        setPacketsSent(packetCounterRef.current);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'telemetry',
              deviceId,
              deviceName,
              timestamp: now,
              accel: {
                x: parseFloat(currentX.toFixed(2)),
                y: parseFloat(currentY.toFixed(2)),
                z: parseFloat(currentZ.toFixed(2)),
              },
              gyro: {
                x: parseFloat(gyroX.toFixed(2)),
                y: parseFloat(gyroY.toFixed(2)),
                z: parseFloat(gyroZ.toFixed(2)),
              },
              orientation: {
                alpha: Math.round(orientation.alpha),
                beta: Math.round(orientation.beta),
                gamma: Math.round(orientation.gamma),
              },
              movementIntensity: intensity,
              motionState: state,
              samplingRateHz,
            })
          );
        }
      }
    };

    const handleOrientation = (event: DeviceOrientationEvent) => {
      setOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      });
    };

    window.addEventListener('devicemotion', handleMotion);
    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      clearInterval(rateTimer);
      window.removeEventListener('devicemotion', handleMotion);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isSensing, deviceId, deviceName, orientation, samplingRateHz]);

  // Simulate Fall / Sudden Shock for testing without dropping the physical phone
  const triggerSimulatedFall = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Send sudden impact spike
    const spikePacket = {
      type: 'telemetry',
      deviceId,
      deviceName,
      timestamp: Date.now(),
      accel: { x: 4.8, y: -26.4, z: 12.2 },
      gyro: { x: 180, y: -140, z: 95 },
      orientation: { alpha: 45, beta: 88, gamma: -12 },
      movementIntensity: 98,
      motionState: 'POSSIBLE_FALL',
      samplingRateHz,
    };
    wsRef.current.send(JSON.stringify(spikePacket));
    setMotionState('POSSIBLE_FALL');
    setMovementIntensity(100);

    // Follow up with post-event inactivity
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'telemetry',
            deviceId,
            deviceName,
            timestamp: Date.now(),
            accel: { x: 0.1, y: 0.1, z: 9.8 },
            gyro: { x: 0, y: 0, z: 0 },
            orientation: { alpha: 45, beta: 89, gamma: -12 },
            movementIntensity: 2,
            motionState: 'STATIONARY',
            samplingRateHz,
          })
        );
      }
      setMotionState('STATIONARY');
      setMovementIntensity(4);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#e4e7ec] text-zinc-900 font-serif flex flex-col p-4 sm:p-6 select-none max-w-md mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-4 border-b border-zinc-400">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
            <Radio className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-black tracking-tight font-['Playfair_Display',serif]">
              Wi-Safe AI
            </h1>
            <p className="text-[11px] text-zinc-600 font-mono">Mobile Sensing Client</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border border-zinc-400 bg-zinc-200">
          <span
            className={`w-2 h-2 rounded-full ${
              wsStatus === 'CONNECTED' && isPaired
                ? 'bg-emerald-600 animate-pulse'
                : wsStatus === 'CONNECTING'
                ? 'bg-amber-500'
                : 'bg-rose-600'
            }`}
          />
          <span className="font-semibold text-zinc-800">
            {wsStatus === 'CONNECTED' && isPaired
              ? 'CONNECTED'
              : wsStatus === 'CONNECTING'
              ? 'CONNECTING'
              : 'OFFLINE'}
          </span>
        </div>
      </header>

      {/* Main Sensing Content */}
      <main className="flex-1 flex flex-col gap-4 py-4">
        {/* Device & Wi-Fi Status Card */}
        <div className="rounded-xl border border-zinc-400 bg-[#cbd1d8]/50 p-3.5 flex flex-col gap-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-600">DEVICE:</span>
            <strong className="text-zinc-950">{deviceName}</strong>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-600">DEVICE ID:</span>
            <strong className="text-zinc-950 font-bold">{deviceId}</strong>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-600">NETWORK:</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5" /> SAME WI-FI
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-600">LATENCY:</span>
            <strong className="text-zinc-950">{latencyMs} ms</strong>
          </div>
        </div>

        {/* Pairing Form if not paired */}
        {!isPaired && (
          <div className="rounded-xl border border-amber-400 bg-amber-50/80 p-4 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              PAIR WITH WI-SAFE DASHBOARD
            </div>
            <p className="text-xs text-amber-800 font-serif leading-relaxed">
              Enter the 6-character Pairing Code displayed in the "Device Connection Center" on your laptop:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={pairingCode}
                onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                placeholder="e.g. WSAFE-4821"
                className="flex-1 px-3 py-2 rounded-lg border border-amber-400 bg-white font-mono text-sm font-bold tracking-wider uppercase text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={connectWebSocket}
                className="px-4 py-2 bg-zinc-900 hover:bg-black text-white font-mono text-xs font-bold rounded-lg shadow-xs active:scale-95 transition"
              >
                CONNECT
              </button>
            </div>
            {pairError && (
              <p className="text-[11px] text-rose-700 font-mono flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" /> {pairError}
              </p>
            )}
          </div>
        )}

        {/* Big Start / Stop Sensing Action Button */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleToggleSensing}
            disabled={!isPaired}
            className={`w-full py-5 rounded-2xl font-mono text-base font-bold tracking-wider uppercase flex items-center justify-center gap-3 shadow-md transition active:scale-98 cursor-pointer ${
              !isPaired
                ? 'bg-zinc-400 text-zinc-600 cursor-not-allowed border border-zinc-500'
                : isSensing
                ? 'bg-rose-700 hover:bg-rose-800 text-white border border-rose-900 ring-4 ring-rose-300/60'
                : 'bg-zinc-900 hover:bg-black text-white border border-zinc-950 ring-4 ring-cyan-500/30'
            }`}
          >
            {isSensing ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                STOP SENSING
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current text-cyan-400" />
                START SENSING
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-zinc-600 font-serif">
            {isSensing
              ? 'Streaming real-time motion telemetry to laptop dashboard'
              : 'Press Start to begin real-time accelerometer and gyroscope transmission'}
          </p>
        </div>

        {/* Live Telemetry Display */}
        <div className="rounded-xl border border-zinc-400 bg-[#cbd1d8]/40 p-4 flex flex-col gap-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-zinc-300 pb-2">
            <span className="font-bold text-xs font-mono tracking-wider text-black flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-800" /> LIVE DEVICE TELEMETRY
            </span>
            <span className="text-[10px] font-mono text-zinc-700 bg-zinc-300 px-2 py-0.5 rounded border border-zinc-400">
              {samplingRateHz} Hz
            </span>
          </div>

          {/* Motion State & Movement Intensity */}
          <div className="flex items-center justify-between bg-[#e4e7ec] p-2.5 rounded-lg border border-zinc-400">
            <div>
              <span className="text-[10px] text-zinc-600 font-mono uppercase block">Motion State</span>
              <span
                className={`font-bold font-mono text-xs ${
                  motionState === 'POSSIBLE_FALL'
                    ? 'text-rose-700 font-extrabold'
                    : motionState === 'ACTIVE'
                    ? 'text-cyan-800'
                    : 'text-zinc-900'
                }`}
              >
                {motionState}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-600 font-mono uppercase block">Intensity</span>
              <span className="font-bold font-mono text-xs text-zinc-950">{movementIntensity}%</span>
            </div>
          </div>

          {/* Accelerometer 3-Axis */}
          <div className="flex flex-col gap-1 text-xs font-mono">
            <span className="text-[11px] font-bold text-zinc-700">Accelerometer (m/s²):</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#e4e7ec] p-2 rounded border border-zinc-400 text-center">
                <span className="text-[10px] text-zinc-500 block">X</span>
                <strong className="text-emerald-700">{accel.x.toFixed(2)}</strong>
              </div>
              <div className="bg-[#e4e7ec] p-2 rounded border border-zinc-400 text-center">
                <span className="text-[10px] text-zinc-500 block">Y</span>
                <strong className="text-cyan-800">{accel.y.toFixed(2)}</strong>
              </div>
              <div className="bg-[#e4e7ec] p-2 rounded border border-zinc-400 text-center">
                <span className="text-[10px] text-zinc-500 block">Z</span>
                <strong className="text-purple-800">{accel.z.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Gyroscope 3-Axis */}
          <div className="flex flex-col gap-1 text-xs font-mono">
            <span className="text-[11px] font-bold text-zinc-700">Gyroscope (°/s):</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#e4e7ec] p-2 rounded border border-zinc-400 text-center">
                <span className="text-[10px] text-zinc-500 block">X (Pitch)</span>
                <strong className="text-zinc-900">{gyro.x.toFixed(1)}</strong>
              </div>
              <div className="bg-[#e4e7ec] p-2 rounded border border-zinc-400 text-center">
                <span className="text-[10px] text-zinc-500 block">Y (Roll)</span>
                <strong className="text-zinc-900">{gyro.y.toFixed(1)}</strong>
              </div>
              <div className="bg-[#e4e7ec] p-2 rounded border border-zinc-400 text-center">
                <span className="text-[10px] text-zinc-500 block">Z (Yaw)</span>
                <strong className="text-zinc-900">{gyro.z.toFixed(1)}</strong>
              </div>
            </div>
          </div>

          {/* Packets Counter */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-700 border-t border-zinc-300 pt-2">
            <span>PACKETS TRANSMITTED:</span>
            <strong className="text-zinc-950 font-bold">{packetsSent.toLocaleString()}</strong>
          </div>
        </div>

        {/* Demo Fall Event Trigger */}
        <div className="rounded-xl border border-zinc-400 bg-[#cbd1d8]/30 p-3 flex flex-col gap-2">
          <span className="text-[10px] font-mono text-zinc-600 uppercase font-bold">
            Demo Fall Event Simulator
          </span>
          <button
            onClick={triggerSimulatedFall}
            disabled={!isSensing}
            className={`py-2 px-3 rounded-lg font-mono text-xs font-semibold flex items-center justify-center gap-2 border transition ${
              isSensing
                ? 'bg-rose-100 hover:bg-rose-200 border-rose-400 text-rose-900 cursor-pointer shadow-2xs'
                : 'bg-zinc-200 border-zinc-300 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
            SIMULATE SUDDEN FALL IMPACT
          </button>
          <p className="text-[10px] text-zinc-500 font-serif text-center">
            Sends an immediate high-impact deceleration vector followed by inactivity to test the judge fall detection pipeline safely.
          </p>
        </div>
      </main>

      {/* Mobile Footer */}
      <footer className="border-t border-zinc-400 pt-3 text-center text-[10px] text-zinc-600 font-serif flex flex-col gap-1">
        <span className="font-semibold text-zinc-800">
          Wi-Safe AI • Privacy-Conscious Wireless Sensing
        </span>
        <span>Camera-free sensing architecture • Transmitting motion telemetry</span>
      </footer>
    </div>
  );
};
