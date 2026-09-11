import React, { useRef, useEffect } from 'react';
import { CSIRawPacket } from '../../types/virtualRoom';
import { Flame, Layers, Sparkles } from 'lucide-react';

interface SubcarrierHeatmapProps {
  packetHistory: CSIRawPacket[];
  variance: number;
}

export const SubcarrierHeatmap: React.FC<SubcarrierHeatmapProps> = ({
  packetHistory,
  variance,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Very light grey base canvas
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    if (packetHistory.length < 2) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating CSI Subcarrier Spectral Frames...', width / 2, height / 2);
      return;
    }

    const history = packetHistory.slice(-70); // last 70 frames
    const numCols = history.length;
    const numRows = 30; // 30 OFDM Subcarriers

    const cellW = (width - 48) / numCols;
    const cellH = (height - 24) / numRows;

    // Draw Heatmap Cells: light grey (#f1f5f9) base -> cyan (#38bdf8 / #0284c7) -> amber (#d97706)
    for (let c = 0; c < numCols; c++) {
      const pkt = history[c];
      const prevPkt = c > 0 ? history[c - 1] : pkt;

      for (let r = 0; r < numRows; r++) {
        const amp = pkt.amplitude[r] || 20;
        const prevAmp = prevPkt.amplitude[r] || amp;
        const delta = Math.abs(amp - prevAmp);
        const normalized = Math.min(1, delta * 2.2 + (amp - 16) * 0.04);

        let rVal = 241;
        let gVal = 245;
        let bVal = 249;

        if (normalized < 0.25) {
          // #f1f5f9 to light sky blue #bae6fd
          const factor = normalized / 0.25;
          rVal = Math.round(241 + factor * (186 - 241));
          gVal = Math.round(245 + factor * (230 - 245));
          bVal = Math.round(249 + factor * (253 - 249));
        } else if (normalized < 0.7) {
          // light sky blue to active cyan/blue #0284c7
          const factor = (normalized - 0.25) / 0.45;
          rVal = Math.round(186 + factor * (2 - 186));
          gVal = Math.round(230 + factor * (132 - 230));
          bVal = Math.round(253 + factor * (199 - 253));
        } else {
          // cyan to amber/red #d97706
          const factor = (normalized - 0.7) / 0.3;
          rVal = Math.round(2 + factor * (217 - 2));
          gVal = Math.round(132 + factor * (119 - 132));
          bVal = Math.round(199 + factor * (6 - 199));
        }

        ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
        ctx.fillRect(44 + c * cellW, r * cellH + 4, cellW + 0.5, cellH + 0.5);
      }
    }

    // Y Axis Labels (Subcarriers: 0, 10, 20, 29)
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    [0, 10, 20, 29].forEach((sc) => {
      const y = sc * cellH + 12;
      ctx.fillText(`SC#${sc}`, 38, y);
    });

    // X Axis Label
    ctx.textAlign = 'left';
    ctx.fillText('◄ PAST (T-3.5s)', 46, height - 4);
    ctx.textAlign = 'right';
    ctx.fillText('LATEST TIME ►', width - 10, height - 4);
  }, [packetHistory, variance]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-cyan-600" />
          <span className="font-bold text-sm text-slate-900 font-sans tracking-tight">
            SUBCARRIER ACTIVITY
          </span>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <span>STATIC</span>
          <div className="h-2 w-20 rounded-full bg-gradient-to-r from-[#f1f5f9] via-[#38bdf8] via-[#0284c7] to-[#d97706] border border-slate-300" />
          <span className="text-amber-700 font-semibold">VARIATION</span>
        </div>
      </div>

      {/* Heatmap Canvas */}
      <div className="relative w-full h-[180px] mt-3 rounded-xl overflow-hidden bg-[#f8fafc] border border-slate-200">
        <canvas ref={canvasRef} width={640} height={180} className="w-full h-full block" />
      </div>

      {/* Footnote */}
      <div className="mt-2 text-[11px] font-mono text-slate-500 flex items-center justify-between">
        <span>X: TIME • Y: SUBCARRIER (0–29)</span>
        <span className="text-cyan-700 font-sans font-medium">Doppler perturbations create spectral ridges</span>
      </div>
    </div>
  );
};
