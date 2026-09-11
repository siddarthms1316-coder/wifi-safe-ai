import React, { useRef, useEffect, useState } from 'react';
import {
  AvatarActivity,
  RoomConfig,
  RoomCoordinates,
} from '../../types/virtualRoom';
import { Radio, Eye, Move, Maximize2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface VirtualRoomCanvasProps {
  activity: AvatarActivity;
  occupancyCount: number;
  disturbanceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  variance: number;
  config: RoomConfig;
  onChangeConfig: (newConfig: RoomConfig) => void;
  isSimulated: boolean;
  onAvatarClick?: () => void;
}

export const VirtualRoomCanvas: React.FC<VirtualRoomCanvasProps> = ({
  activity,
  occupancyCount,
  disturbanceLevel,
  variance,
  config,
  onChangeConfig,
  isSimulated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [draggingTarget, setDraggingTarget] = useState<'tx' | 'rx' | 'human' | null>(null);
  const [isDisturbanceInFresnel, setIsDisturbanceInFresnel] = useState(false);

  // Animation cycle counter
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Human trajectory / avatar position (normalized 0 to 1)
  const humanPosRef = useRef<RoomCoordinates>({ x: config.humanPosition.x, y: config.humanPosition.y });
  const txPosRef = useRef<RoomCoordinates>({ x: config.txPosition.x, y: config.txPosition.y });
  const rxPosRef = useRef<RoomCoordinates>({ x: config.rxPosition.x, y: config.rxPosition.y });

  // Sync ref with props if changed externally
  useEffect(() => {
    humanPosRef.current = { x: config.humanPosition.x, y: config.humanPosition.y };
  }, [config.humanPosition.x, config.humanPosition.y]);

  useEffect(() => {
    txPosRef.current = { x: config.txPosition.x, y: config.txPosition.y };
  }, [config.txPosition.x, config.txPosition.y]);

  useEffect(() => {
    rxPosRef.current = { x: config.rxPosition.x, y: config.rxPosition.y };
  }, [config.rxPosition.x, config.rxPosition.y]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      timeRef.current += dt;
      const t = timeRef.current;

      const width = canvas.width;
      const height = canvas.height;

      // Clean, bright scientific off-white background (#F8FAFC)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Margins for room boundary
      const mx = 48;
      const my = 46;
      const rw = width - mx * 2;
      const rh = height - my * 2;

      // Coordinate converter (0..1 normalized to canvas room coordinates)
      const toCanvasX = (normX: number) => mx + normX * rw;
      const toCanvasY = (normY: number) => my + normY * rh;

      // Auto-move human avatar slightly in walking mode if not dragging
      if (activity === 'walking' && draggingTarget !== 'human') {
        const walkCycleX = 0.5 + Math.sin(t * 0.8) * 0.22;
        const walkCycleY = 0.5 + Math.cos(t * 0.8 * 0.5) * 0.12;
        humanPosRef.current = { x: walkCycleX, y: walkCycleY };
      } else if (activity === 'fall' && draggingTarget !== 'human') {
        // Fall position: slight floor offset
        humanPosRef.current = { x: 0.52, y: 0.56 };
      }

      const txCanvas = { x: toCanvasX(txPosRef.current.x), y: toCanvasY(txPosRef.current.y) };
      const rxCanvas = { x: toCanvasX(rxPosRef.current.x), y: toCanvasY(rxPosRef.current.y) };
      const humanCanvas = { x: toCanvasX(humanPosRef.current.x), y: toCanvasY(humanPosRef.current.y) };

      // Check Fresnel zone disturbance
      const dTxRx = Math.hypot(rxCanvas.x - txCanvas.x, rxCanvas.y - txCanvas.y);
      const dTxH = Math.hypot(humanCanvas.x - txCanvas.x, humanCanvas.y - txCanvas.y);
      const dHRx = Math.hypot(rxCanvas.x - humanCanvas.x, rxCanvas.y - humanCanvas.y);
      const pathDiff = dTxH + dHRx - dTxRx;
      const inFresnelZone = pathDiff < 45; // within 1st Fresnel zone
      setIsDisturbanceInFresnel(inFresnelZone && activity !== 'standing');

      // 1. Room Floor Surface (Crisp pure white with subtle shadow)
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(15, 23, 42, 0.04)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillRect(mx, my, rw, rh);
      ctx.restore();

      // 2. Subtle Precision Grid Lines
      if (config.showDigitalGrid) {
        ctx.strokeStyle = '#eef2f6';
        ctx.lineWidth = 1;
        const gridSize = 32;
        for (let x = mx; x <= mx + rw; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, my);
          ctx.lineTo(x, my + rh);
          ctx.stroke();
        }
        for (let y = my; y <= my + rh; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(mx, y);
          ctx.lineTo(mx + rw, y);
          ctx.stroke();
        }
      }

      // Room Walls (Light architectural perimeter)
      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(mx, my, rw, rh);

      // Corner coordinate accents
      const cornerLen = 10;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(mx, my + cornerLen);
      ctx.lineTo(mx, my);
      ctx.lineTo(mx + cornerLen, my);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(mx + rw - cornerLen, my);
      ctx.lineTo(mx + rw, my);
      ctx.lineTo(mx + rw, my + cornerLen);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(mx, my + rh - cornerLen);
      ctx.lineTo(mx, my + rh);
      ctx.lineTo(mx + cornerLen, my + rh);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(mx + rw - cornerLen, my + rh);
      ctx.lineTo(mx + rw, my + rh);
      ctx.lineTo(mx + rw, my + rh - cornerLen);
      ctx.stroke();

      // Room labels in dark charcoal & medium grey
      ctx.fillStyle = '#64748b';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('ROOM A: 5.0m × 5.0m (RF ANECHOIC SENSING BOUNDARY)', mx + 10, my - 12);
      ctx.fillText('DOORWAY (NORTH-EAST)', mx + rw - 150, my - 12);
      ctx.fillText('FLOOR BOUNDARY', mx + 10, my + rh + 18);
      ctx.fillText('ABSORPTIVE WALL (WEST)', mx - 32, my + rh / 2);

      // Doorway aperture on top wall
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(mx + rw - 140, my - 3, 38, 6);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(mx + rw - 140, my - 3, 38, 6);

      ctx.restore();

      // 3. Fresnel Zones (Ellipses between TX and RX)
      if (config.showFresnelZones) {
        ctx.save();
        const midX = (txCanvas.x + rxCanvas.x) / 2;
        const midY = (txCanvas.y + rxCanvas.y) / 2;
        const angle = Math.atan2(rxCanvas.y - txCanvas.y, rxCanvas.x - txCanvas.x);
        const dist = dTxRx;

        ctx.translate(midX, midY);
        ctx.rotate(angle);

        // 1st Fresnel Zone Ellipse
        ctx.beginPath();
        const a1 = Math.max(10, dist / 2 + 16);
        const b1 = 56;
        ctx.ellipse(0, 0, a1, b1, 0, 0, Math.PI * 2);
        ctx.strokeStyle = inFresnelZone ? 'rgba(239, 68, 68, 0.7)' : 'rgba(2, 132, 199, 0.45)';
        ctx.lineWidth = inFresnelZone ? 2 : 1.2;
        ctx.stroke();

        ctx.fillStyle = inFresnelZone ? 'rgba(239, 68, 68, 0.05)' : 'rgba(2, 132, 199, 0.04)';
        ctx.fill();

        // 2nd Fresnel Zone Ellipse
        ctx.beginPath();
        const a2 = Math.max(15, dist / 2 + 36);
        const b2 = 96;
        ctx.ellipse(0, 0, a2, b2, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.2)';
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      }

      // 4. Multipath Propagation Rays
      if (config.showMultipathRays) {
        ctx.save();

        // Direct Path (LoS)
        const pulse = (t * 2) % 1;
        const gradLoS = ctx.createLinearGradient(txCanvas.x, txCanvas.y, rxCanvas.x, rxCanvas.y);
        gradLoS.addColorStop(0, 'rgba(2, 132, 199, 0.7)');
        gradLoS.addColorStop(pulse, inFresnelZone ? 'rgba(239, 68, 68, 0.85)' : 'rgba(6, 182, 212, 0.9)');
        gradLoS.addColorStop(1, 'rgba(2, 132, 199, 0.7)');

        ctx.beginPath();
        ctx.moveTo(txCanvas.x, txCanvas.y);
        ctx.lineTo(rxCanvas.x, rxCanvas.y);
        ctx.strokeStyle = gradLoS;
        ctx.lineWidth = inFresnelZone ? 2.5 : 1.8;
        ctx.stroke();

        // Reflection 1: Top Wall reflection
        ctx.beginPath();
        ctx.moveTo(txCanvas.x, txCanvas.y);
        ctx.lineTo((txCanvas.x + rxCanvas.x) / 2, my);
        ctx.lineTo(rxCanvas.x, rxCanvas.y);
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Reflection 2: Bottom Wall reflection
        ctx.beginPath();
        ctx.moveTo(txCanvas.x, txCanvas.y);
        ctx.lineTo((txCanvas.x + rxCanvas.x) / 2, my + rh);
        ctx.lineTo(rxCanvas.x, rxCanvas.y);
        ctx.strokeStyle = 'rgba(2, 132, 199, 0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Reflection 3: Human Dynamic Scattering Ray
        ctx.beginPath();
        ctx.moveTo(txCanvas.x, txCanvas.y);
        ctx.lineTo(humanCanvas.x, humanCanvas.y - 18);
        ctx.lineTo(rxCanvas.x, rxCanvas.y);
        ctx.strokeStyle = inFresnelZone ? 'rgba(239, 68, 68, 0.65)' : 'rgba(217, 119, 6, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      }

      // 5. Radiating RF Wavefronts from Transmitter (Subtle Cyan Waves)
      ctx.save();
      const waveCount = 5;
      const maxRadius = Math.max(10, dTxRx * 1.05);
      for (let w = 0; w < waveCount; w++) {
        const rawOffset = (t * 36 + w * (maxRadius / waveCount)) % maxRadius;
        const phaseOffset = Math.max(0.1, ((rawOffset % maxRadius) + maxRadius) % maxRadius);
        ctx.beginPath();
        ctx.arc(txCanvas.x, txCanvas.y, phaseOffset, -Math.PI * 0.44, Math.PI * 0.44);
        const alpha = Math.max(0, 1 - phaseOffset / maxRadius) * 0.4;
        ctx.strokeStyle = inFresnelZone
          ? `rgba(239, 68, 68, ${alpha})`
          : `rgba(2, 132, 199, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // 6. Minimal Digital Human Silhouette (Dark Charcoal / Navy)
      const renderAvatar = (pos: { x: number; y: number }, id: string, isPrimary: boolean) => {
        ctx.save();
        ctx.translate(pos.x, pos.y);

        // Ground presence halo
        ctx.beginPath();
        ctx.ellipse(0, 32, 22, 7, 0, 0, Math.PI * 2);
        ctx.fillStyle =
          isPrimary && activity === 'fall'
            ? 'rgba(239, 68, 68, 0.2)'
            : isPrimary && inFresnelZone
            ? 'rgba(217, 119, 6, 0.18)'
            : 'rgba(2, 132, 199, 0.14)';
        ctx.fill();

        // RF Doppler perturbation rings around subject
        if (activity !== 'standing') {
          const ringRadius = Math.max(1, 24 + (Math.sin(t * 4) + 1) * 7);
          ctx.beginPath();
          ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = activity === 'fall' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(2, 132, 199, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Clean dark charcoal silhouette for light UI
        const silhouetteColor = activity === 'fall' ? '#ef4444' : '#0f172a';

        if (activity === 'fall') {
          // Lying collapsed silhouette on floor
          ctx.fillStyle = silhouetteColor;
          ctx.strokeStyle = silhouetteColor;
          // Head on floor
          ctx.beginPath();
          ctx.arc(-22, 26, 6, 0, Math.PI * 2);
          ctx.fill();
          // Torso
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(-16, 28);
          ctx.lineTo(16, 28);
          ctx.stroke();
          // Legs & arms
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(16, 28);
          ctx.lineTo(26, 32);
          ctx.moveTo(-6, 28);
          ctx.lineTo(-4, 34);
          ctx.stroke();
        } else if (activity === 'sitting') {
          ctx.fillStyle = silhouetteColor;
          ctx.strokeStyle = silhouetteColor;
          // Head
          ctx.beginPath();
          ctx.arc(0, -6, 7, 0, Math.PI * 2);
          ctx.fill();
          // Torso
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(0, 1);
          ctx.lineTo(0, 18);
          ctx.stroke();
          // Bent knees
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 18);
          ctx.lineTo(12, 18);
          ctx.lineTo(12, 32);
          ctx.stroke();
          // Arms
          ctx.beginPath();
          ctx.moveTo(0, 6);
          ctx.lineTo(8, 14);
          ctx.stroke();
        } else if (activity === 'hand_movement') {
          const armWave = Math.sin(t * 8) * 16;
          ctx.fillStyle = silhouetteColor;
          ctx.strokeStyle = silhouetteColor;
          // Head
          ctx.beginPath();
          ctx.arc(0, -22, 7, 0, Math.PI * 2);
          ctx.fill();
          // Torso
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(0, 10);
          ctx.stroke();
          // Legs
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 10);
          ctx.lineTo(-7, 30);
          ctx.moveTo(0, 10);
          ctx.lineTo(7, 30);
          ctx.stroke();
          // Waving arm
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(-14, -22 + armWave);
          // Static arm
          ctx.moveTo(0, -10);
          ctx.lineTo(10, 5);
          ctx.stroke();
        } else if (activity === 'walking') {
          const legSwing = Math.sin(t * 6) * 12;
          ctx.fillStyle = silhouetteColor;
          ctx.strokeStyle = silhouetteColor;
          // Head
          ctx.beginPath();
          ctx.arc(0, -22, 7, 0, Math.PI * 2);
          ctx.fill();
          // Torso
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(0, 10);
          ctx.stroke();
          // Walking legs
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 10);
          ctx.lineTo(-legSwing, 30);
          ctx.moveTo(0, 10);
          ctx.lineTo(legSwing, 30);
          ctx.stroke();
          // Swinging arms
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(legSwing * 0.8, 5);
          ctx.moveTo(0, -10);
          ctx.lineTo(-legSwing * 0.8, 5);
          ctx.stroke();
        } else {
          // Standing default
          ctx.fillStyle = silhouetteColor;
          ctx.strokeStyle = silhouetteColor;
          // Head
          ctx.beginPath();
          ctx.arc(0, -22, 7, 0, Math.PI * 2);
          ctx.fill();
          // Torso
          ctx.lineWidth = 4.5;
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(0, 10);
          ctx.stroke();
          // Legs
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 10);
          ctx.lineTo(-6, 30);
          ctx.moveTo(0, 10);
          ctx.lineTo(6, 30);
          ctx.stroke();
          // Arms
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(-8, 5);
          ctx.moveTo(0, -10);
          ctx.lineTo(8, 5);
          ctx.stroke();
        }

        // Digital Twin Tag Card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-42, -54, 84, 22, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${activity.toUpperCase().replace('_', ' ')}`, 0, -42);

        // Coordinates in meters
        const mX = (pos.x - mx) / (rw / config.widthMeters);
        const mY = (pos.y - my) / (rh / config.lengthMeters);
        ctx.fillStyle = '#64748b';
        ctx.font = '8px monospace';
        ctx.fillText(`(${mX.toFixed(1)}m, ${mY.toFixed(1)}m)`, 0, -33);

        ctx.restore();
      };

      // Primary occupant
      if (occupancyCount >= 1) {
        renderAvatar(humanCanvas, 'SUBJECT-01', true);
      }
      if (occupancyCount >= 2) {
        renderAvatar({ x: humanCanvas.x + 85, y: humanCanvas.y - 36 }, 'SUBJECT-02', false);
      }
      if (occupancyCount >= 3) {
        renderAvatar({ x: humanCanvas.x - 70, y: humanCanvas.y + 40 }, 'SUBJECT-03', false);
      }

      // 7. Transmitter Node (TX)
      ctx.save();
      ctx.translate(txCanvas.x, txCanvas.y);
      // Soft outer ring
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 132, 199, 0.12)';
      ctx.fill();
      // Housing (Clean White with subtle border)
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-12, -12, 24, 24, 5);
      ctx.fill();
      ctx.stroke();
      // Antennas
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -12);
      ctx.lineTo(-6, -19);
      ctx.moveTo(6, -12);
      ctx.lineTo(6, -19);
      ctx.stroke();
      // Status LED
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Label
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('RF TRANSMITTER', 0, 24);
      ctx.fillStyle = '#0284c7';
      ctx.font = '8px monospace';
      ctx.fillText('TX: 5.18 GHz (Ch 36)', 0, 34);
      ctx.restore();

      // 8. CSI Receiver Node (RX)
      ctx.save();
      ctx.translate(rxCanvas.x, rxCanvas.y);
      // Outer ring
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(2, 132, 199, 0.12)';
      ctx.fill();
      // Housing
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-12, -12, 24, 24, 5);
      ctx.fill();
      ctx.stroke();
      // Antennas (Triple Array)
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(-8, -20);
      ctx.moveTo(0, -12);
      ctx.lineTo(0, -20);
      ctx.moveTo(8, -12);
      ctx.lineTo(8, -20);
      ctx.stroke();
      // Streaming pulse LED
      const rxPulse = Math.sin(t * 10) > 0;
      ctx.fillStyle = rxPulse ? '#0284c7' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // Label
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CSI RECEIVER', 0, 24);
      ctx.fillStyle = '#0284c7';
      ctx.font = '8px monospace';
      ctx.fillText('RX: 50 Hz STREAM', 0, 34);
      ctx.restore();

      // 9. Multipath Reflections HUD Legend Card (Light theme)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mx + 10, my + rh - 56, 185, 46, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('RF MULTIPATH TELEMETRY', mx + 18, my + rh - 42);

      ctx.font = '8px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('LOS Path: 4.85m • Reflections: 4 Walls', mx + 18, my + rh - 30);
      ctx.fillText('Doppler Dynamic Shift: ±1.8 Hz', mx + 18, my + rh - 20);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activity, occupancyCount, config, draggingTarget]);

  // Drag and drop handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const mx = 48;
    const my = 46;
    const rw = canvas.width - mx * 2;
    const rh = canvas.height - my * 2;

    const txX = mx + txPosRef.current.x * rw;
    const txY = my + txPosRef.current.y * rh;
    const rxX = mx + rxPosRef.current.x * rw;
    const rxY = my + rxPosRef.current.y * rh;
    const hX = mx + humanPosRef.current.x * rw;
    const hY = my + humanPosRef.current.y * rh;

    if (Math.hypot(cx - txX, cy - txY) < 30) {
      setDraggingTarget('tx');
    } else if (Math.hypot(cx - rxX, cy - rxY) < 30) {
      setDraggingTarget('rx');
    } else if (Math.hypot(cx - hX, cy - hY) < 40) {
      setDraggingTarget('human');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingTarget) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const cy = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const mx = 48;
    const my = 46;
    const rw = canvas.width - mx * 2;
    const rh = canvas.height - my * 2;

    const nx = Math.max(0.08, Math.min(0.92, (cx - mx) / rw));
    const ny = Math.max(0.08, Math.min(0.92, (cy - my) / rh));

    if (draggingTarget === 'human') {
      humanPosRef.current = { x: nx, y: ny };
      onChangeConfig({ ...config, humanPosition: { x: nx, y: ny } });
    } else if (draggingTarget === 'tx') {
      txPosRef.current = { x: nx, y: ny };
      onChangeConfig({ ...config, txPosition: { x: nx, y: ny } });
    } else if (draggingTarget === 'rx') {
      rxPosRef.current = { x: nx, y: ny };
      onChangeConfig({ ...config, rxPosition: { x: nx, y: ny } });
    }
  };

  const handleMouseUp = () => {
    setDraggingTarget(null);
  };

  return (
    <div className="relative w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden transition-all">
      {/* Top Banner inside Room Card (Fresnel status & coordinates) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#EEF1F5] border border-slate-200 text-xs font-mono text-slate-700 mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isDisturbanceInFresnel ? 'bg-rose-500' : 'bg-cyan-500'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isDisturbanceInFresnel ? 'bg-rose-500' : 'bg-cyan-600'
              }`}
            ></span>
          </span>
          <span className="font-bold text-slate-900 tracking-wide">
            {isDisturbanceInFresnel
              ? 'FRESNEL DISTURBANCE DETECTED (ZONE 1 INTERSECTION)'
              : 'STABLE RF CHANNEL PROPAGATION (BASELINE)'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-mono">
          <span>TX: (0.8m, 2.5m)</span>
          <span>•</span>
          <span>RX: (4.2m, 2.5m)</span>
          <span>•</span>
          <span className="text-cyan-700 font-semibold">5.0 GHz OFDM</span>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full h-[380px] sm:h-[440px] lg:h-[480px] rounded-xl overflow-hidden bg-[#f8fafc] border border-slate-200 cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={840}
          height={480}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full object-contain block"
        />

        {/* Drag Hint Pill */}
        <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 rounded-md bg-white/90 backdrop-blur-xs border border-slate-200 text-[10px] font-mono text-slate-600 flex items-center gap-1.5 shadow-xs">
          <Move className="w-3 h-3 text-cyan-600" />
          <span>Interactive: Click & Drag Subject, TX, or RX</span>
        </div>

        {/* Disturbance Badge on Canvas */}
        {isDisturbanceInFresnel && (
          <div className="absolute bottom-4 right-4 pointer-events-none px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold flex items-center gap-2 shadow-sm animate-pulse">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Wireless channel disturbance active</span>
          </div>
        )}
      </div>

      {/* Visual Layer Toggles Below Room */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 px-1 border-t border-slate-100 mt-2 text-xs font-mono">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={config.showFresnelZones}
              onChange={(e) => onChangeConfig({ ...config, showFresnelZones: e.target.checked })}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
            />
            <span className="font-sans font-medium text-[11px]">Fresnel Zones (1st/2nd)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={config.showMultipathRays}
              onChange={(e) => onChangeConfig({ ...config, showMultipathRays: e.target.checked })}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
            />
            <span className="font-sans font-medium text-[11px]">Multipath Rays (7 Paths)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 transition">
            <input
              type="checkbox"
              checked={config.showDigitalGrid}
              onChange={(e) => onChangeConfig({ ...config, showDigitalGrid: e.target.checked })}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
            />
            <span className="font-sans font-medium text-[11px]">Precision Grid</span>
          </label>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-2">
          <span>WAVELENGTH: <strong className="text-slate-800">λ ≈ 5.8cm</strong></span>
          <span>•</span>
          <span>SUBCARRIERS: <strong className="text-cyan-700">30 OFDM</strong></span>
        </div>
      </div>
    </div>
  );
};
