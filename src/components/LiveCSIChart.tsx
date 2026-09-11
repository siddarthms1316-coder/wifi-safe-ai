import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CSIDataFrame } from '../types';
import { Waves, Play, Pause, Maximize2, X } from 'lucide-react';

export type ChartViewMode =
  | 'raw_csi'
  | 'filtered_csi'
  | 'multi_subcarrier'
  | 'phase'
  | 'spectrogram';

interface LiveCSIChartProps {
  frames: CSIDataFrame[];
  isPaused: boolean;
  onTogglePause: () => void;
  subcarrierCount: number;
}

export const LiveCSIChart: React.FC<LiveCSIChartProps> = ({
  frames,
  isPaused,
  onTogglePause,
  subcarrierCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fullscreenRootRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<ChartViewMode>('filtered_csi');
  const [timeWindowSec, setTimeWindowSec] = useState<number>(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 720,
    height: 260,
  });

  // Spectrogram historical buffer (sliding 2D matrix)
  const spectrogramHistoryRef = useRef<number[][]>([]);

  // Toggle fullscreen handler (with browser API support & robust CSS fixed fallback)
  const handleToggleFullscreen = useCallback(async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    if (nextState) {
      try {
        if (fullscreenRootRef.current && !document.fullscreenElement) {
          await fullscreenRootRef.current.requestFullscreen?.().catch(() => {});
        }
      } catch {
        // Fallback to CSS fixed overlay is already active
      }
    } else {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen?.().catch(() => {});
        }
      } catch {
        // Fallback clean
      }
    }
  }, [isFullscreen]);

  // Lock background scroll when fullscreen is active
  useEffect(() => {
    if (!isFullscreen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyOverflowX = document.body.style.overflowX;
    const originalBodyOverflowY = document.body.style.overflowY;
    const originalDocOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.body.style.overflowX = 'hidden';
    document.body.style.overflowY = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.overflowX = originalBodyOverflowX;
      document.body.style.overflowY = originalBodyOverflowY;
      document.documentElement.style.overflow = originalDocOverflow;
    };
  }, [isFullscreen]);

  // Handle browser fullscreenchange event (e.g. user pressed ESC in browser native fullscreen)
  useEffect(() => {
    const handleFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [isFullscreen]);

  // Keyboard navigation: ESC to exit, F to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (e.key === 'Escape' && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
      } else if (
        (e.key === 'f' || e.key === 'F') &&
        !isTyping &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault();
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleToggleFullscreen]);

  // Dynamic ResizeObserver to guarantee the canvas fills 100% of available space
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measureAndSet = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height),
        });
      }
    };

    measureAndSet();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      }
    });

    ro.observe(container);
    window.addEventListener('resize', measureAndSet);
    window.addEventListener('orientationchange', measureAndSet);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureAndSet);
      window.removeEventListener('orientationchange', measureAndSet);
    };
  }, [isFullscreen]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const width = dimensions.width;
    const height = dimensions.height;

    // Set internal canvas resolution with DPR scaling for ultra-crisp high-DPI rendering
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear canvas - scientific architectural grey
    ctx.fillStyle = '#d8dce2';
    ctx.fillRect(0, 0, width, height);

    // Dynamic responsive grid lines in subtle grey
    ctx.strokeStyle = 'rgba(165, 175, 190, 0.7)';
    ctx.lineWidth = 1;

    // Horizontal grid
    const yStep = Math.max(30, Math.floor((height - 50) / 6));
    for (let y = 30; y < height - 25; y += yStep) {
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(width - 15, y);
      ctx.stroke();
    }

    // Vertical grid
    const xStep = Math.max(55, Math.floor((width - 65) / 10));
    for (let x = 48; x < width - 15; x += xStep) {
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x, height - 25);
      ctx.stroke();
    }

    if (frames.length === 0) return;

    // Filter frames to time window
    const targetPoints = timeWindowSec * 20; // 20Hz nominal
    const visibleFrames = frames.slice(-targetPoints);
    const n = visibleFrames.length;

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'right';

    // Min/Max amplitude scales
    let minAmp = 10;
    let maxAmp = 45;
    if (viewMode === 'phase') {
      minAmp = -Math.PI;
      maxAmp = Math.PI;
    }

    // Draw Y-axis labels
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const val = minAmp + ((maxAmp - minAmp) * (ySteps - i)) / ySteps;
      const y = 25 + (i / ySteps) * (height - 55);
      const label = viewMode === 'phase' ? `${val.toFixed(1)}π` : `${val.toFixed(0)} dB`;
      ctx.fillText(label, 44, y + 3);
    }

    // 1. View Mode: Spectrogram Heatmap
    if (viewMode === 'spectrogram') {
      const lastFrame = visibleFrames[visibleFrames.length - 1];
      if (lastFrame && lastFrame.subcarriers.length > 0) {
        const row = lastFrame.subcarriers.map((s) => s.amplitude);
        spectrogramHistoryRef.current.push(row);
        if (spectrogramHistoryRef.current.length > 120) {
          spectrogramHistoryRef.current.shift();
        }
      }

      const history = spectrogramHistoryRef.current;
      const cellWidth = Math.max(2, (width - 65) / Math.max(1, history.length));
      const cellHeight = (height - 50) / subcarrierCount;

      for (let t = 0; t < history.length; t++) {
        const subAmps = history[t];
        const x = 48 + t * cellWidth;
        for (let s = 0; s < subAmps.length; s++) {
          const amp = subAmps[s];
          const norm = Math.max(0, Math.min(1, (amp - 15) / 25));
          const y = height - 30 - (s + 1) * cellHeight;

          // Jet-style heatmap: Blue -> Cyan -> Green -> Yellow -> Red
          let r = 0,
            g = 0,
            b = 0;
          if (norm < 0.25) {
            b = Math.floor(norm * 4 * 255);
          } else if (norm < 0.5) {
            g = Math.floor((norm - 0.25) * 4 * 255);
            b = 255;
          } else if (norm < 0.75) {
            r = Math.floor((norm - 0.5) * 4 * 255);
            g = 255;
            b = Math.floor((1 - (norm - 0.5) * 4) * 255);
          } else {
            r = 255;
            g = Math.floor((1 - (norm - 0.75) * 4) * 255);
          }

          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(x, y, cellWidth + 0.5, cellHeight + 0.5);
        }
      }

      // Axis labels for spectrogram
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left';
      ctx.fillText(`Subcarrier Index (0–${subcarrierCount})`, 50, 18);
      ctx.textAlign = 'right';
      ctx.fillText('Time Waterfall →', width - 20, height - 10);
      return;
    }

    // 2. View Mode: Multi-Subcarrier Waterfall
    if (viewMode === 'multi_subcarrier') {
      const stepX = (width - 65) / Math.max(1, n - 1);
      const activeSubs = [2, 6, 10, 15, 20, 25, 28]; // Representative subcarriers

      activeSubs.forEach((subIdx, idx) => {
        const hue = (idx / activeSubs.length) * 260 + 140; // Emerald to Cyan to Purple
        ctx.strokeStyle = `hsla(${hue}, 85%, 60%, 0.75)`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();

        for (let i = 0; i < n; i++) {
          const frame = visibleFrames[i];
          const sub = frame.subcarriers[subIdx];
          const val = sub ? sub.amplitude : frame.rawMeanAmplitude;
          const x = 48 + i * stepX;
          const y = height - 30 - ((val - minAmp) / (maxAmp - minAmp)) * (height - 55);

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Legend
      ctx.font = '10px JetBrains Mono, monospace';
      activeSubs.forEach((subIdx, idx) => {
        const hue = (idx / activeSubs.length) * 260 + 140;
        ctx.fillStyle = `hsl(${hue}, 85%, 60%)`;
        ctx.fillText(`SC#${subIdx}`, 55 + idx * 50, 18);
      });
      return;
    }

    // 3. View Mode: Phase Variation
    if (viewMode === 'phase') {
      const stepX = (width - 65) / Math.max(1, n - 1);
      ctx.strokeStyle = '#a855f7'; // Purple phase line
      ctx.lineWidth = 1.8;
      ctx.beginPath();

      for (let i = 0; i < n; i++) {
        const frame = visibleFrames[i];
        const phaseVal = frame.subcarriers[15]?.phase || 0;
        const x = 48 + i * stepX;
        const y = height - 30 - ((phaseVal - minAmp) / (maxAmp - minAmp)) * (height - 55);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = '#a855f7';
      ctx.textAlign = 'left';
      ctx.fillText('Unwrapped Subcarrier Phase Angle (-π to +π)', 50, 18);
      return;
    }

    // 4. View Mode: Raw CSI vs Filtered CSI
    const stepX = (width - 65) / Math.max(1, n - 1);

    if (viewMode === 'raw_csi' || viewMode === 'filtered_csi') {
      // Draw Raw Amplitude Trace (crisp charcoal grey)
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();

      for (let i = 0; i < n; i++) {
        const frame = visibleFrames[i];
        const val = frame.rawMeanAmplitude;
        const x = 48 + i * stepX;
        const y = height - 30 - ((val - minAmp) / (maxAmp - minAmp)) * (height - 55);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw Low-pass Filtered Trace (Deep charcoal or Rose for high disturbance)
      const lastFrame = visibleFrames[visibleFrames.length - 1];
      const isHighDisturbance = lastFrame?.variance > 0.85;

      ctx.strokeStyle = isHighDisturbance ? '#dc2626' : '#18181b';
      ctx.lineWidth = 2.4;
      ctx.beginPath();

      for (let i = 0; i < n; i++) {
        const frame = visibleFrames[i];
        const val = frame.filteredMeanAmplitude;
        const x = 48 + i * stepX;
        const y = height - 30 - ((val - minAmp) / (maxAmp - minAmp)) * (height - 55);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Subtle area fill under filtered line (charcoal/grey)
      const firstX = 48;
      const lastX = 48 + (n - 1) * stepX;
      ctx.lineTo(lastX, height - 30);
      ctx.lineTo(firstX, height - 30);
      ctx.closePath();
      ctx.fillStyle = isHighDisturbance
        ? 'rgba(239, 68, 68, 0.08)'
        : 'rgba(24, 24, 27, 0.08)';
      ctx.fill();

      // Anomaly markers (if variance spikes)
      for (let i = 0; i < n; i++) {
        const frame = visibleFrames[i];
        if (frame.variance > 0.95) {
          const x = 48 + i * stepX;
          const y =
            height - 30 - ((frame.filteredMeanAmplitude - minAmp) / (maxAmp - minAmp)) * (height - 55);
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#dc2626';
          ctx.fill();
        }
      }

      // Legend
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.fillStyle = '#52525b';
      ctx.fillText('Raw CSI Sample (Mid Grey)', 50, 18);
      ctx.fillStyle = isHighDisturbance ? '#dc2626' : '#18181b';
      ctx.fillText('Filtered CSI Waveform (Charcoal)', 230, 18);
    }
  }, [frames, viewMode, timeWindowSec, subcarrierCount, dimensions]);

  const latestFrame = frames[frames.length - 1];

  // Core component layout
  const content = (
    <div
      ref={fullscreenRootRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999] w-screen h-[100dvh] flex flex-col bg-[#e4e7ec] text-zinc-900 font-serif select-none overflow-hidden'
          : 'flex flex-col rounded-xl border border-zinc-400 bg-[#e4e7ec] overflow-hidden shadow-xs relative w-full'
      }
      style={
        isFullscreen
          ? {
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              paddingLeft: 'env(safe-area-inset-left, 0px)',
              paddingRight: 'env(safe-area-inset-right, 0px)',
            }
          : undefined
      }
    >
      {/* 1. Header Toolbar (flex-shrink: 0) */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 border-b border-zinc-400 bg-[#cbd1d8] gap-3 flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-300 border border-zinc-400 text-zinc-900 shadow-2xs">
            <Waves className="w-4 h-4 text-cyan-800" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-black uppercase tracking-wider font-['Playfair_Display',serif]">
              Live CSI Signal Oscilloscope
            </h3>
            <p className="text-[10px] text-zinc-600 font-serif hidden xs:block">
              OFDM Subcarrier Amplitude & Phase Variations • 50Hz Ground Truth
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-zinc-300/90 p-1 rounded-lg border border-zinc-400 overflow-x-auto max-w-full">
            {(
              [
                { id: 'filtered_csi', label: 'Filtered' },
                { id: 'raw_csi', label: 'Raw + Filtered' },
                { id: 'multi_subcarrier', label: 'Multi-Subcarrier' },
                { id: 'phase', label: 'Phase' },
                { id: 'spectrogram', label: 'Spectrogram' },
              ] as { id: ChartViewMode; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono whitespace-nowrap transition ${
                  viewMode === m.id
                    ? 'bg-zinc-900 text-white font-semibold border border-zinc-900 shadow-2xs'
                    : 'text-zinc-700 hover:text-black'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Time Window selector */}
          <div className="flex items-center bg-zinc-300 rounded-lg border border-zinc-400 p-0.5 text-[10px] font-mono">
            {[5, 10, 30, 60].map((sec) => (
              <button
                key={sec}
                onClick={() => setTimeWindowSec(sec)}
                className={`px-2 py-0.5 rounded transition ${
                  timeWindowSec === sec
                    ? 'bg-zinc-900 text-white font-bold shadow-2xs border border-zinc-900'
                    : 'text-zinc-700 hover:text-black'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>

          {/* Stream Pause / Resume toggle */}
          <button
            onClick={onTogglePause}
            className={`p-1.5 rounded-lg border text-xs transition ${
              isPaused
                ? 'bg-amber-100 border-amber-300 text-amber-900'
                : 'bg-zinc-300 border-zinc-400 text-zinc-900 hover:bg-zinc-400'
            }`}
            title={isPaused ? 'Resume stream' : 'Pause stream'}
            aria-label={isPaused ? 'Resume CSI stream' : 'Pause CSI stream'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Toggle / Exit Button */}
          {isFullscreen ? (
            <button
              onClick={handleToggleFullscreen}
              aria-label="Exit fullscreen oscilloscope"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
              title="Exit Fullscreen (ESC)"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>EXIT FULLSCREEN</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 ml-1 text-[10px] bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-mono">
                ESC
              </kbd>
            </button>
          ) : (
            <button
              onClick={handleToggleFullscreen}
              aria-label="Enter fullscreen oscilloscope"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-400 bg-zinc-300 hover:bg-zinc-400 text-zinc-900 font-mono text-xs transition"
              title="Fullscreen (Press F)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-semibold text-[11px]">FULLSCREEN</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Visualization Container (Graph consumes ALL remaining vertical space) */}
      <div
        ref={containerRef}
        className={
          isFullscreen
            ? 'flex-1 min-h-0 w-full relative bg-[#d8dce2] overflow-hidden'
            : 'relative w-full h-[260px] bg-[#d8dce2] overflow-hidden'
        }
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />

        {/* In-chart HUD when in inline view */}
        {!isFullscreen && (
          <div className="absolute bottom-2 left-4 flex flex-wrap items-center space-x-3 font-mono text-[10px] text-zinc-900 bg-[#e4e7ec]/95 px-2.5 py-1 rounded border border-zinc-400 shadow-xs pointer-events-none">
            <span>
              AMP: <strong className="text-zinc-950">{latestFrame?.filteredMeanAmplitude.toFixed(1) || '0.0'} dB</strong>
            </span>
            <span>
              VAR: <strong className="text-zinc-950">{latestFrame?.variance.toFixed(3) || '0.000'}</strong>
            </span>
            <span>
              DOPPLER: <strong className="text-zinc-950">{latestFrame?.dopplerEnergy.toFixed(1) || '0.0'} Hz</strong>
            </span>
            <span>
              SNR: <strong className="text-zinc-950">{latestFrame?.snr.toFixed(0) || '32'} dB</strong>
            </span>
            <span>
              SUBCARRIERS: <strong className="text-black">{subcarrierCount}</strong>
            </span>
          </div>
        )}
      </div>

      {/* 3. Metrics Footer (Dedicated status bar in Fullscreen mode) */}
      {isFullscreen && (
        <div className="flex-shrink-0 border-t border-zinc-400 bg-[#cbd1d8] px-4 py-2 flex flex-wrap items-center justify-between text-xs font-mono text-zinc-900 gap-2">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              AMP: <strong className="text-zinc-950">{latestFrame?.filteredMeanAmplitude.toFixed(1) || '0.0'} dB</strong>
            </span>
            <span className="text-zinc-400">|</span>
            <span>
              VAR: <strong className="text-zinc-950">{latestFrame?.variance.toFixed(3) || '0.000'}</strong>
            </span>
            <span className="text-zinc-400">|</span>
            <span>
              DOPPLER: <strong className="text-zinc-950">{latestFrame?.dopplerEnergy.toFixed(1) || '0.0'} Hz</strong>
            </span>
            <span className="text-zinc-400">|</span>
            <span>
              SNR: <strong className="text-zinc-950">{latestFrame?.snr.toFixed(0) || '32'} dB</strong>
            </span>
            <span className="text-zinc-400">|</span>
            <span>
              SUBCARRIERS: <strong className="text-black">{subcarrierCount}</strong>
            </span>
            <span className="text-zinc-400">|</span>
            <span className="text-zinc-700">
              STREAM: <strong className="text-black">50 Hz</strong>
            </span>
          </div>
          <div className="text-[11px] text-zinc-600 font-mono flex items-center gap-2">
            <span>Window: {timeWindowSec}s</span>
            <span className="text-zinc-400">•</span>
            <span>
              Press <kbd className="px-1 py-0.5 bg-zinc-300 border border-zinc-400 rounded text-[10px] font-bold">F</kbd> or <kbd className="px-1 py-0.5 bg-zinc-300 border border-zinc-400 rounded text-[10px] font-bold">ESC</kbd> to toggle
            </span>
          </div>
        </div>
      )}
    </div>
  );

  // When fullscreen is active, render via Portal directly into document.body to escape any parent CSS stacking context
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};
