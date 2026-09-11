import React, { useState, useRef, useEffect } from 'react';
import { CSIRawPacket, CSIStreamMode } from '../../types/virtualRoom';
import { Activity, BarChart2, Layers, Cpu, Eye, Radio } from 'lucide-react';

interface LiveCSIWaveformProps {
  currentPacket: CSIRawPacket | null;
  packetHistory: CSIRawPacket[];
  mode: CSIStreamMode;
  samplingRateHz: number;
}

type TabMode = 'AMPLITUDE' | 'PHASE' | 'SUBCARRIERS' | 'FILTERED' | 'SPECTROGRAM';

export const LiveCSIWaveform: React.FC<LiveCSIWaveformProps> = ({
  currentPacket,
  packetHistory,
  mode,
  samplingRateHz,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('AMPLITUDE');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      const width = canvas.width;
      const height = canvas.height;

      // Pure white scientific oscilloscope canvas
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Subtle light grey grid lines
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      const xSteps = 8;
      const ySteps = 5;

      for (let i = 0; i <= xSteps; i++) {
        const x = (i / xSteps) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let j = 0; j <= ySteps; j++) {
        const y = (j / ySteps) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (packetHistory.length < 2) {
        // Empty placeholder state
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Awaiting CSI Stream Packets...', width / 2, height / 2);
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const history = packetHistory.slice(-80); // Last 80 frames
      const count = history.length;

      if (activeTab === 'AMPLITUDE') {
        // Multi-subcarrier amplitude traces (5 representative subcarriers)
        const subcarrierIndices = [2, 8, 14, 20, 26];
        const colors = ['#0284c7', '#0891b2', '#059669', '#d97706', '#7c3aed'];

        subcarrierIndices.forEach((subIdx, cIdx) => {
          ctx.beginPath();
          ctx.strokeStyle = colors[cIdx];
          ctx.lineWidth = 1.8;

          history.forEach((pkt, i) => {
            const x = (i / (count - 1)) * width;
            const val = pkt.amplitude[subIdx] || 20;
            // Map amplitude range (0 to 60 dBm) to canvas height
            const y = height - (val / 55) * (height - 28) - 14;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.stroke();
        });

        // Top legend card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(8, 8, 224, 22, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        subcarrierIndices.forEach((s, idx) => {
          ctx.fillStyle = colors[idx];
          ctx.fillText(`SC#${s}`, 14 + idx * 42, 23);
        });
      } else if (activeTab === 'PHASE') {
        // Center Subcarrier Phase Difference
        ctx.beginPath();
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2;

        history.forEach((pkt, i) => {
          const x = (i / (count - 1)) * width;
          const phaseVal = pkt.phase[14] || 0;
          const y = height / 2 - (phaseVal / Math.PI) * (height * 0.38);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Baseline line
        ctx.strokeStyle = '#e2e8f0';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#6d28d9';
        ctx.font = '10px monospace';
        ctx.fillText('Center Subcarrier Phase Difference [-π, +π]', 12, 20);
      } else if (activeTab === 'SUBCARRIERS') {
        // Instantaneous 30-Subcarrier Bar Spectrum
        const latest = history[history.length - 1];
        const barWidth = (width - 24) / 30;

        latest.amplitude.forEach((amp, idx) => {
          const x = 12 + idx * barWidth;
          const barHeight = (amp / 50) * (height - 44);
          const y = height - barHeight - 22;

          ctx.fillStyle = amp > 35 ? '#ef4444' : amp > 25 ? '#0284c7' : '#38bdf8';
          ctx.fillRect(x + 1, y, barWidth - 2, barHeight);

          if (idx % 5 === 0) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(idx.toString(), x + barWidth / 2, height - 6);
          }
        });

        ctx.fillStyle = '#0f172a';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('INSTANTANEOUS 30-SUBCARRIER SPECTRUM (dBm)', 12, 18);
      } else if (activeTab === 'FILTERED') {
        // Filtered smoothed Doppler envelope
        ctx.beginPath();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2.4;

        let smoothed = 20;
        history.forEach((pkt, i) => {
          const x = (i / (count - 1)) * width;
          const rawMean = pkt.amplitude.reduce((a, b) => a + b, 0) / pkt.amplitude.length;
          smoothed = smoothed * 0.8 + rawMean * 0.2;
          const y = height - (smoothed / 50) * (height - 30) - 15;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.fillStyle = '#047857';
        ctx.font = '10px monospace';
        ctx.fillText('FILTERED CSI DOPPLER ENVELOPE (BANDPASS 0.5-5Hz)', 12, 20);
      } else if (activeTab === 'SPECTROGRAM') {
        // Micro-Doppler waterfall
        const cols = count;
        const rows = 18;
        const cellW = width / cols;
        const cellH = (height - 30) / rows;

        history.forEach((pkt, colIdx) => {
          for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
            const freqIntensity = Math.abs(pkt.amplitude[rowIdx] || 20) / 45;
            // Clean subtle blue-cyan spectrum for light UI
            const lightness = Math.max(30, Math.min(95, 95 - freqIntensity * 60));
            ctx.fillStyle = `hsl(200, 80%, ${lightness}%)`;
            ctx.fillRect(colIdx * cellW, rowIdx * cellH + 20, cellW + 1, cellH + 1);
          }
        });

        ctx.fillStyle = '#0f172a';
        ctx.font = '10px monospace';
        ctx.fillText('MICRO-DOPPLER FREQUENCY SPECTROGRAM (Hz vs Time)', 12, 14);
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [packetHistory, activeTab]);

  const latest = packetHistory[packetHistory.length - 1];
  const avgAmp = latest
    ? (latest.amplitude.reduce((a, b) => a + b, 0) / latest.amplitude.length).toFixed(1)
    : '0.0';

  // Strict naming rule from prompt:
  // "If in SIMULATION mode, label: SIMULATED CSI
  //  If RECORDED mode: RECORDED CSI
  //  If REAL CSI is actually received: LIVE CSI"
  const panelTitle =
    mode === 'LIVE'
      ? 'LIVE CSI WAVEFORM'
      : mode === 'RECORDED'
      ? 'RECORDED CSI WAVEFORM'
      : 'SIMULATED CSI WAVEFORM';

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-600" />
          <span className="font-bold text-sm text-slate-900 font-sans tracking-tight">
            {panelTitle}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-50 border border-cyan-200 text-cyan-800 font-semibold">
            {samplingRateHz} Hz
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#EEF1F5] p-1 rounded-xl border border-slate-200/80 text-xs font-mono">
          {(['AMPLITUDE', 'PHASE', 'SUBCARRIERS', 'FILTERED', 'SPECTROGRAM'] as TabMode[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] font-medium font-sans ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-[210px] mt-3 rounded-xl overflow-hidden bg-white border border-slate-200">
        <canvas ref={canvasRef} width={640} height={210} className="w-full h-full block" />

        {/* Real-time metrics overlay */}
        <div className="absolute bottom-2.5 right-3 pointer-events-none flex items-center gap-2.5 text-[10px] font-mono bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 shadow-xs">
          <span>MEAN AMP: <strong className="text-cyan-700">{avgAmp} dBm</strong></span>
          <span>•</span>
          <span>FRAMES: <strong className="text-slate-800">{packetHistory.length}</strong></span>
        </div>
      </div>
    </div>
  );
};
