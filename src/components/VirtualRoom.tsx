import React, { useEffect, useRef, useState } from 'react';
import { ActivityType } from '../types';
import { ACTIVITY_METADATA } from '../lib/csiSimulator';
import { EyeOff, Radio, Users, ShieldAlert, Sparkles, Maximize2 } from 'lucide-react';

interface VirtualRoomProps {
  activity: ActivityType;
  peopleCount: number;
  variance: number;
  isFallAlert: boolean;
  roomSize: 'small' | 'medium' | 'large';
  onActivitySelect?: (activity: ActivityType) => void;
}

export const VirtualRoom: React.FC<VirtualRoomProps> = ({
  activity,
  peopleCount,
  variance,
  isFallAlert,
  roomSize,
  onActivitySelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showFresnel, setShowFresnel] = useState(true);
  const [showMultipath, setShowMultipath] = useState(true);

  // Animation state
  const animRef = useRef<{
    time: number;
    personX: number;
    personY: number;
    personDir: number;
    fallProgress: number; // 0 = upright, 1 = on floor
    wavePhase: number;
  }>({
    time: 0,
    personX: 250,
    personY: 170,
    personDir: 1,
    fallProgress: 0,
    wavePhase: 0,
  });

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const state = animRef.current;
      state.time += dt;
      state.wavePhase = (state.wavePhase + dt * 2.5) % 1;

      // Handle fall transition
      if (activity === 'fall') {
        state.fallProgress = Math.min(1.0, state.fallProgress + dt * 2.2);
      } else {
        state.fallProgress = Math.max(0.0, state.fallProgress - dt * 1.5);
      }

      // Handle locomotion position
      if (activity === 'walking') {
        state.personX += state.personDir * 45 * dt;
        if (state.personX > canvas.width - 150) {
          state.personDir = -1;
        } else if (state.personX < 150) {
          state.personDir = 1;
        }
        state.personY = 170 + Math.sin(state.time * 6) * 4;
      } else if (activity === 'sitting') {
        state.personX = canvas.width / 2;
        state.personY = 185;
      } else if (activity === 'lying_down') {
        state.personX = canvas.width / 2;
        state.personY = 210;
        state.fallProgress = 1.0;
      } else {
        // stationary center
        state.personX = canvas.width / 2;
        state.personY = 170;
      }

      // 1. Clear background - architectural grey
      ctx.fillStyle = '#d8dce2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw room perspective grid (Isometric floor tiles)
      const w = canvas.width;
      const h = canvas.height;

      ctx.strokeStyle = 'rgba(165, 175, 190, 0.75)';
      ctx.lineWidth = 1;

      // Perspective floor
      const horizonY = 80;
      const floorBottom = h - 25;

      for (let x = 40; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, horizonY);
        ctx.lineTo(x, floorBottom);
        ctx.stroke();
      }

      for (let y = horizonY; y < floorBottom; y += 30) {
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(w - 40, y);
        ctx.stroke();
      }

      // Room boundaries
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(35, horizonY - 20, w - 70, floorBottom - horizonY + 20);

      // Transmitter (Tx) - Left AP
      const txX = Math.min(80, Math.max(20, w * 0.15));
      const txY = 140;

      // Receiver (Rx) - Right Station
      const rxX = Math.max(txX + 60, w - Math.min(80, Math.max(20, w * 0.15)));
      const rxY = 140;

      // 3. Fresnel Zone Ellipsoid (LOS Zone) - Light Blue
      if (showFresnel) {
        ctx.save();
        const midX = (txX + rxX) / 2;
        const midY = (txY + rxY) / 2;
        const radiusX = Math.max(10, Math.abs(rxX - txX) / 2);
        const radiusY = Math.max(5, 65);

        ctx.beginPath();
        ctx.ellipse(midX, midY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(midX, midY, Math.max(5, radiusX * 0.6), Math.max(3, radiusY * 0.5), 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.stroke();
        ctx.restore();
      }

      // 4. Animated Wi-Fi Waves from Tx - Light Blue
      ctx.save();
      const waveCount = 5;
      const maxWaveDist = Math.max(20, rxX - txX);
      for (let i = 0; i < waveCount; i++) {
        const rawPhase = (state.wavePhase + i / waveCount) % 1;
        const normPhase = ((rawPhase % 1) + 1) % 1;
        const r = Math.max(0.1, normPhase * maxWaveDist);
        ctx.beginPath();
        ctx.arc(txX, txY, r, -Math.PI / 3, Math.PI / 3);
        const alpha = Math.max(0, 1 - r / maxWaveDist) * 0.35;
        ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // 5. Multipath Reflections (Rays bouncing off person and walls)
      if (showMultipath) {
        ctx.save();
        const targetX = state.personX;
        const targetY = state.personY - (1 - state.fallProgress) * 30;

        // Direct Ray (LOS) - Light Blue
        ctx.beginPath();
        ctx.moveTo(txX, txY);
        ctx.lineTo(rxX, rxY);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Reflected Ray: Tx -> Person -> Rx
        const dynamicAlpha = Math.min(0.85, 0.3 + variance * 0.5);
        ctx.beginPath();
        ctx.moveTo(txX, txY);
        ctx.lineTo(targetX, targetY);
        ctx.lineTo(rxX, rxY);

        ctx.strokeStyle =
          activity === 'fall'
            ? `rgba(220, 38, 38, ${dynamicAlpha})`
            : activity === 'walking'
            ? `rgba(2, 132, 199, ${dynamicAlpha})`
            : `rgba(13, 148, 136, ${dynamicAlpha})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.stroke();

        // Wall bounce reflection
        ctx.beginPath();
        ctx.moveTo(txX, txY);
        ctx.lineTo(targetX + 30, horizonY - 10);
        ctx.lineTo(rxX, rxY);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.setLineDash([2, 4]);
        ctx.stroke();

        // Scattering ripples around human
        const scatterR = Math.max(1, 15 + Math.sin(state.time * 8) * 6);
        ctx.beginPath();
        ctx.arc(targetX, targetY, scatterR, 0, Math.PI * 2);
        ctx.strokeStyle =
          activity === 'fall'
            ? 'rgba(220, 38, 38, 0.5)'
            : 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      // 6. Draw Devices: Wi-Fi Transmitter (AP) and Receiver (STA)
      // Tx - Light Blue
      drawDevice(ctx, txX, txY, 'Tx (Wi-Fi AP)', '#0284c7', true);
      // Rx - Charcoal/Dark
      drawDevice(ctx, rxX, rxY, 'Rx (Receiver)', '#0f172a', false);

      // 7. Draw Stylized Virtual Human Vector (Not a camera feed!)
      if (peopleCount > 0) {
        drawVirtualHuman(
          ctx,
          state.personX,
          state.personY,
          state.fallProgress,
          activity,
          state.time,
          false
        );

        // If multiple people, draw secondary virtual avatars
        if (peopleCount >= 2 || activity === 'multiple_people') {
          const secondX = state.personX > w / 2 ? state.personX - 110 : state.personX + 110;
          drawVirtualHuman(
            ctx,
            secondX,
            165 + Math.cos(state.time * 4) * 3,
            0,
            'walking',
            state.time + 1.2,
            true
          );
        }

        if (peopleCount >= 3) {
          drawVirtualHuman(ctx, w / 2 - 80, 155, 0, 'standing', state.time + 2.5, true);
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [activity, peopleCount, variance, showFresnel, showMultipath, roomSize]);

  // Helper to draw Wi-Fi hardware icons on canvas
  const drawDevice = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string,
    color: string,
    isTx: boolean
  ) => {
    ctx.save();
    // Device body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - 14, y - 10, 28, 20, 4);
    ctx.fill();
    ctx.stroke();

    // Antenna
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - 6, y - 10);
    ctx.lineTo(x - 6, y - 22);
    ctx.moveTo(x + 6, y - 10);
    ctx.lineTo(x + 6, y - 22);
    ctx.stroke();

    // LED pulse
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Label
    ctx.fillStyle = '#334155';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 24);

    ctx.restore();
  };

  // Helper to draw stylized wireframe/vector human avatar
  const drawVirtualHuman = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    fallProgress: number,
    act: ActivityType,
    time: number,
    isSecondary: boolean
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Color based on role & fall - Classic Charcoal & Light Blue
    let strokeColor = isSecondary ? '#475569' : '#0f172a';
    if (act === 'fall') strokeColor = '#dc2626';

    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Interpolate upright vs fallen posture
    const angle = fallProgress * (Math.PI / 2); // 90 deg rotation
    ctx.rotate(angle);

    const bob = act === 'walking' ? Math.sin(time * 8) * 3 : 0;
    const stride = act === 'walking' ? Math.sin(time * 8) * 12 : 0;

    // Head
    ctx.beginPath();
    ctx.arc(0, -42 + bob, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();

    // Torso
    ctx.beginPath();
    ctx.moveTo(0, -35 + bob);
    ctx.lineTo(0, -10 + bob);
    ctx.stroke();

    // Arms
    ctx.beginPath();
    if (act === 'hand_movement') {
      const handWave = Math.sin(time * 12) * 15;
      ctx.moveTo(-12, -26 + bob);
      ctx.lineTo(0, -28 + bob);
      ctx.lineTo(14, -38 + handWave + bob);
    } else {
      ctx.moveTo(-10 - stride * 0.4, -18 + bob);
      ctx.lineTo(0, -28 + bob);
      ctx.lineTo(10 + stride * 0.4, -18 + bob);
    }
    ctx.stroke();

    // Legs
    ctx.beginPath();
    if (act === 'sitting') {
      ctx.moveTo(0, -10);
      ctx.lineTo(-8, 5);
      ctx.lineTo(8, 5);
      ctx.lineTo(8, 18);
    } else {
      ctx.moveTo(0, -10 + bob);
      ctx.lineTo(-6 - stride, 18);
      ctx.moveTo(0, -10 + bob);
      ctx.lineTo(6 + stride, 18);
    }
    ctx.stroke();

    // RF Cross Section Echo Tag
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = strokeColor;
    const tag = isSecondary ? 'SUBJ-02' : act === 'fall' ? 'IMPACT DETECTED' : 'RF REFLECTOR';
    ctx.fillText(tag, 0, -54 + bob);

    ctx.restore();
  };

  return (
    <div className="relative flex flex-col rounded-xl border border-zinc-400 bg-[#e4e7ec] overflow-hidden shadow-xs">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-zinc-400 bg-[#cbd1d8]">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-300 border border-zinc-400 text-zinc-900">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-black uppercase tracking-wider font-['Playfair_Display',serif]">
              Virtual Sensing Room
            </h3>
            <p className="text-[10px] text-zinc-600 font-serif">
              Ray-Tracing RF Multipath Propagation Simulator
            </p>
          </div>
        </div>

        {/* Privacy verification badge & display toggles */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-300 border border-zinc-400 text-zinc-900">
            <EyeOff className="w-3 h-3 text-zinc-700" />
            NO CAMERA / ZERO OPTICAL DATA
          </span>

          <button
            onClick={() => setShowFresnel(!showFresnel)}
            className={`px-2 py-1 rounded text-[10px] font-mono border transition ${
              showFresnel
                ? 'bg-zinc-900 border-zinc-900 text-white font-semibold'
                : 'bg-zinc-300 border-zinc-400 text-zinc-800 hover:text-black hover:bg-zinc-400'
            }`}
          >
            Fresnel Zone
          </button>

          <button
            onClick={() => setShowMultipath(!showMultipath)}
            className={`px-2 py-1 rounded text-[10px] font-mono border transition ${
              showMultipath
                ? 'bg-zinc-900 border-zinc-900 text-white font-semibold'
                : 'bg-zinc-300 border-zinc-400 text-zinc-800 hover:text-black hover:bg-zinc-400'
            }`}
          >
            Multipath Rays
          </button>
        </div>
      </div>

      {/* Canvas viewport */}
      <div className="relative w-full h-[260px] bg-[#d8dce2]">
        <canvas
          ref={canvasRef}
          width={640}
          height={260}
          className="w-full h-full object-cover"
        />

        {/* Floating status badges on top of canvas */}
        <div className="absolute top-2 left-3 flex flex-wrap gap-2 pointer-events-none">
          <div className="px-2 py-0.5 rounded bg-[#e4e7ec]/95 border border-zinc-400 font-mono text-[10px] text-zinc-900 shadow-2xs">
            ROOM: <span className="text-zinc-950 font-bold">VIRTUAL ZONE A (25m²)</span>
          </div>
          <div className="px-2 py-0.5 rounded bg-[#e4e7ec]/95 border border-zinc-400 font-mono text-[10px] text-zinc-900 shadow-2xs">
            ACTIVITY: <span className="text-zinc-950 font-bold">{ACTIVITY_METADATA[activity].label}</span>
          </div>
        </div>

        {/* Fall alert overlay */}
        {activity === 'fall' && (
          <div className="absolute top-2 right-3 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-100 border border-rose-400 text-rose-900 text-xs font-bold font-mono animate-bounce shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              RF DISTURBANCE SHOCKWAVE DETECTED
            </div>
          </div>
        )}

        {/* Bottom banner notice */}
        <div className="absolute bottom-1.5 right-3 pointer-events-none">
          <span className="text-[10px] font-mono text-zinc-700 bg-[#e4e7ec]/95 px-2 py-0.5 rounded border border-zinc-400">
            Virtual sensing visualization — not a camera feed
          </span>
        </div>
      </div>

      {/* Quick Activity Selector Chips */}
      {onActivitySelect && (
        <div className="flex items-center gap-1.5 p-2 bg-[#cbd1d8] border-t border-zinc-400 overflow-x-auto scrollbar-none text-[11px]">
          <span className="text-zinc-700 font-mono text-[10px] px-1 shrink-0">Simulate:</span>
          {(
            [
              'standing',
              'walking',
              'sitting',
              'hand_movement',
              'multiple_people',
              'sudden_movement',
              'fall',
              'no_movement',
            ] as ActivityType[]
          ).map((act) => {
            const isSelected = activity === act;
            return (
              <button
                key={act}
                onClick={() => onActivitySelect(act)}
                className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-all text-[11px] ${
                  isSelected
                    ? 'bg-zinc-900 text-white font-bold shadow-2xs border border-zinc-900'
                    : 'bg-zinc-300 text-zinc-900 hover:bg-zinc-400 hover:text-black border border-zinc-400'
                }`}
              >
                {ACTIVITY_METADATA[act].label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
