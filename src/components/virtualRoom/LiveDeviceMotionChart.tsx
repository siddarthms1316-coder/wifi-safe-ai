import React, { useRef, useEffect } from 'react';
import { Activity, Radio, Zap, Sliders, Smartphone } from 'lucide-react';
import { DeviceTelemetryData } from '../../types/virtualRoom';

interface LiveDeviceMotionChartProps {
  currentTelemetry: DeviceTelemetryData | null;
  telemetryHistory: DeviceTelemetryData[];
  packetRate: number;
}

export const LiveDeviceMotionChart: React.FC<LiveDeviceMotionChartProps> = ({
  currentTelemetry,
  telemetryHistory,
  packetRate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear with clean laboratory grey background
      ctx.fillStyle = '#e8ecf0';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid lines
      ctx.strokeStyle = '#d0d7de';
      ctx.lineWidth = 1;

      // Horizontal zero and grid lines
      const midY = height / 2;
      ctx.beginPath();
      for (let y = midY - 60; y <= midY + 60; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      for (let x = 0; x < width; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      // Bold baseline zero line
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Zero label
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText('0 m/s²', 6, midY - 4);
      ctx.fillText('+20 m/s²', 6, midY - 54);
      ctx.fillText('-20 m/s²', 6, midY + 64);

      if (telemetryHistory.length < 2) {
        // Draw waiting prompt
        ctx.fillStyle = '#4b5563';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('WAITING FOR PHONE MOTION TELEMETRY STREAM...', width / 2, midY);
        ctx.textAlign = 'left';
        return;
      }

      const points = telemetryHistory.slice(-120);
      const stepX = width / Math.max(points.length - 1, 1);
      const scaleY = 3.2; // 1 m/s² = 3.2px

      // 1. Draw Accel X (Emerald)
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = i * stepX;
        const y = midY - p.accel.x * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 2. Draw Accel Y (Cyan)
      ctx.strokeStyle = '#0891b2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = i * stepX;
        const y = midY - p.accel.y * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 3. Draw Accel Z (Purple)
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = i * stepX;
        const y = midY - p.accel.z * scaleY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };

    render();
    animationFrameId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationFrameId);
  }, [telemetryHistory]);

  const xVal = currentTelemetry?.accel.x.toFixed(2) ?? '0.00';
  const yVal = currentTelemetry?.accel.y.toFixed(2) ?? '0.00';
  const zVal = currentTelemetry?.accel.z.toFixed(2) ?? '0.00';

  return (
    <div className="rounded-xl border border-zinc-400 bg-[#e4e7ec] p-4 flex flex-col gap-3 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-300 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-100 text-cyan-950 border border-cyan-400">
            LIVE DEVICE TELEMETRY
          </span>
          <span className="text-xs font-mono font-bold text-zinc-900 tracking-tight">
            TRI-AXIAL MOTION OSCILLOSCOPE
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span className="text-zinc-800">Accel X: {xVal}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 inline-block" />
            <span className="text-zinc-800">Accel Y: {yVal}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
            <span className="text-zinc-800">Accel Z: {zVal}</span>
          </div>
          <div className="text-zinc-700 bg-zinc-200 px-2 py-0.5 rounded border border-zinc-400">
            {packetRate} pkts/sec
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full h-44 rounded-lg overflow-hidden border border-zinc-400 bg-[#e8ecf0]">
        <canvas
          ref={canvasRef}
          width={800}
          height={176}
          className="w-full h-full block"
        />
      </div>

      {/* Bottom Summary Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs font-mono text-zinc-700 pt-1">
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-zinc-800" />
          <span>Device: {currentTelemetry?.deviceName || 'Android Client'}</span>
          <span className="text-zinc-400">•</span>
          <span>Sampling: {currentTelemetry?.samplingRateHz || 25} Hz</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-600">Motion State:</span>
          <strong
            className={`font-bold uppercase ${
              currentTelemetry?.motionState === 'POSSIBLE_FALL'
                ? 'text-rose-700 animate-pulse'
                : currentTelemetry?.motionState === 'ACTIVE'
                ? 'text-cyan-800'
                : 'text-zinc-900'
            }`}
          >
            {currentTelemetry?.motionState || 'STATIONARY'}
          </strong>
        </div>
      </div>
    </div>
  );
};
