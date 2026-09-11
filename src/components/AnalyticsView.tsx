import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Clock,
  Radio,
  Wifi,
  Users,
  Download,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d'>('today');

  // Realistic synthetic historical dataset
  const activityDistribution = [
    { label: 'Walking', percentage: 42, color: '#3b82f6' },
    { label: 'Sitting', percentage: 28, color: '#8b5cf6' },
    { label: 'Standing', percentage: 18, color: '#06b6d4' },
    { label: 'Hand/Gestures', percentage: 8, color: '#10b981' },
    { label: 'Fall Simulations', percentage: 4, color: '#ef4444' },
  ];

  const hourlyData = [
    { hour: '08:00', events: 14, anomalies: 0, occupancy: 1 },
    { hour: '10:00', events: 38, anomalies: 1, occupancy: 2 },
    { hour: '12:00', events: 54, anomalies: 2, occupancy: 3 },
    { hour: '14:00', events: 42, anomalies: 0, occupancy: 1 },
    { hour: '16:00', events: 65, anomalies: 3, occupancy: 2 },
    { hour: '18:00', events: 72, anomalies: 1, occupancy: 2 },
    { hour: '20:00', events: 35, anomalies: 0, occupancy: 1 },
    { hour: '22:00', events: 12, anomalies: 0, occupancy: 1 },
  ];

  const maxEvents = Math.max(...hourlyData.map((d) => d.events));

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-serif">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-300 border border-zinc-400 text-zinc-950">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-black font-['Playfair_Display',serif]">
              Safety Intelligence & RF Analytics
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-300 border border-zinc-400 text-zinc-950">
              DEMO DATASET
            </span>
          </div>
          <p className="text-xs text-zinc-700 font-serif">
            Historical CSI channel variance trends, human activity breakdown, and emergency fall
            response time benchmarks.
          </p>
        </div>

        {/* Time filters & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-300 p-1 rounded-lg border border-zinc-400 text-xs font-mono">
            {(['today', '7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded transition ${
                  timeRange === r
                    ? 'bg-zinc-950 text-white font-bold shadow-2xs'
                    : 'text-zinc-800 hover:text-black'
                }`}
              >
                {r === 'today' ? 'Today' : r === '7d' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const data = JSON.stringify({ timeRange, hourlyData, activityDistribution }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `wisafe-analytics-${timeRange}.json`;
              a.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-400 bg-zinc-300 hover:bg-zinc-400 text-xs font-mono text-zinc-950 transition"
          >
            <Download className="w-3.5 h-3.5 text-zinc-800" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
          <span className="text-[11px] text-zinc-700 block mb-1">AVERAGE CONFIDENCE</span>
          <div className="text-2xl font-bold text-zinc-950 font-['Playfair_Display',serif]">93.8%</div>
          <span className="text-[10px] text-emerald-800 mt-1 block">↑ +2.1% calibration boost</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
          <span className="text-[11px] text-zinc-700 block mb-1">SIMULATED FALL EVENTS</span>
          <div className="text-2xl font-bold text-rose-800 font-['Playfair_Display',serif]">6 Tested</div>
          <span className="text-[10px] text-zinc-600 mt-1 block">100% multi-stage verification</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
          <span className="text-[11px] text-zinc-700 block mb-1">AVG RESPONSE TIME</span>
          <div className="text-2xl font-bold text-zinc-950 font-['Playfair_Display',serif]">1.8s</div>
          <span className="text-[10px] text-zinc-600 mt-1 block">Transient to flag latency</span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
          <span className="text-[11px] text-zinc-700 block mb-1">RF CHANNEL STABILITY</span>
          <div className="text-2xl font-bold text-zinc-950 font-['Playfair_Display',serif]">99.4%</div>
          <span className="text-[10px] text-zinc-600 mt-1 block">Zero packet drop / 50Hz</span>
        </div>
      </div>

      {/* 2-Column charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Activity & Anomaly Frequency Chart (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-serif text-black uppercase tracking-wider">
              Hourly Activity Frequency & Anomaly Timeline
            </h3>
            <span className="text-[10px] font-mono text-zinc-600">24-hour cycle</span>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-zinc-400">
            {hourlyData.map((d, i) => {
              const heightPct = (d.events / maxEvents) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex items-end justify-center h-44">
                    {/* Anomaly badge indicator */}
                    {d.anomalies > 0 && (
                      <span className="absolute -top-6 px-1 py-0.5 rounded bg-rose-100 border border-rose-300 text-[9px] font-mono text-rose-900 font-bold">
                        {d.anomalies} Anom
                      </span>
                    )}
                    {/* Activity Bar - Architectural Charcoal Grey */}
                    <div
                      className="w-full max-w-[28px] rounded-t-md bg-zinc-800 group-hover:bg-zinc-700 transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600 group-hover:text-black">
                    {d.hour}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-600 pt-1">
            <span>Bar: Human RF motion events</span>
            <span className="text-rose-700 font-semibold">Flags: CSI Anomaly excursions</span>
          </div>
        </div>

        {/* Activity Distribution Breakdown (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-serif text-black uppercase tracking-wider">
              Activity Classification Distribution
            </h3>
            <span className="text-[10px] font-mono text-zinc-600">Breakdown</span>
          </div>

          {/* Progress bar list */}
          <div className="space-y-3.5 pt-2 font-serif">
            {activityDistribution.map((item, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between text-zinc-900">
                  <span className="flex items-center gap-2 font-medium">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                  <span className="font-bold text-zinc-950 font-mono">{item.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-300 rounded-full overflow-hidden border border-zinc-400">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-[#cbd1d8] border border-zinc-400 text-[11px] text-zinc-700 font-serif leading-relaxed">
            All analytics are aggregated purely from wireless channel amplitude and phase vectors.
            No personal identity, facial data, or audio waveforms are recorded or stored.
          </div>
        </div>
      </div>
    </div>
  );
};
