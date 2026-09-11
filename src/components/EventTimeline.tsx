import React, { useState } from 'react';
import { SafetyEvent } from '../types';
import { ACTIVITY_METADATA } from '../lib/csiSimulator';
import {
  History,
  ShieldAlert,
  AlertTriangle,
  Info,
  Download,
  Filter,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface EventTimelineProps {
  events: SafetyEvent[];
  onClearEvents: () => void;
  onSelectEvent?: (event: SafetyEvent) => void;
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  onClearEvents,
  onSelectEvent,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'normal' | 'warning' | 'critical'>('all');

  const filteredEvents = events.filter((ev) => {
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'critical') return ev.riskLevel === 'CRITICAL' || ev.riskLevel === 'HIGH';
    if (filterSeverity === 'warning') return ev.riskLevel === 'MODERATE';
    if (filterSeverity === 'normal') return ev.riskLevel === 'LOW';
    return true;
  });

  const exportEvents = () => {
    const data = JSON.stringify(events, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wisafe-event-log-${Date.now()}.json`;
    a.click();
  };

  const getSeverityBadge = (level: SafetyEvent['riskLevel']) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-50 border-rose-300 text-rose-800';
      case 'HIGH':
        return 'bg-orange-50 border-orange-300 text-orange-800';
      case 'MODERATE':
        return 'bg-amber-50 border-amber-300 text-amber-800';
      case 'LOW':
      default:
        return 'bg-zinc-100 border-zinc-300 text-zinc-700';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-serif">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-zinc-400 bg-[#e4e7ec] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-300 border border-zinc-400 text-zinc-950">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-black font-['Playfair_Display',serif]">
              Safety Event Audit Log & Timeline
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-300 border border-zinc-400 text-zinc-950 font-bold">
              {events.length} RECORDED
            </span>
          </div>
          <p className="text-xs text-zinc-700 font-serif">
            Chronological audit trail of CSI amplitude excursions, human activity classifications,
            and safety threshold confirmations.
          </p>
        </div>

        {/* Filter and Export actions */}
        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center bg-zinc-300 p-1 rounded-lg border border-zinc-400 text-xs font-mono">
            {(['all', 'normal', 'warning', 'critical'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded capitalize transition ${
                  filterSeverity === sev
                    ? 'bg-zinc-950 text-white font-bold shadow-2xs'
                    : 'text-zinc-800 hover:text-black'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button
            onClick={exportEvents}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-400 bg-zinc-300 hover:bg-zinc-400 text-xs font-mono text-zinc-950 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-zinc-800" />
            <span>Export</span>
          </button>

          <button
            onClick={onClearEvents}
            disabled={events.length === 0}
            className="p-2 rounded-lg border border-zinc-400 bg-zinc-300 hover:bg-rose-100 hover:border-rose-400 text-zinc-800 hover:text-rose-800 transition disabled:opacity-50"
            title="Clear all events"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Events Table / Timeline List */}
      <div className="rounded-2xl border border-zinc-400 bg-[#e4e7ec] overflow-hidden shadow-xs">
        {filteredEvents.length > 0 ? (
          <div className="divide-y divide-zinc-400">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectEvent && onSelectEvent(ev)}
                className="p-4 hover:bg-[#cbd1d8] transition flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs cursor-pointer group"
              >
                <div className="flex items-start gap-3.5">
                  {/* Status Indicator Icon */}
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${
                      ev.riskLevel === 'CRITICAL'
                        ? 'bg-rose-100 border-rose-300 text-rose-800'
                        : ev.riskLevel === 'HIGH'
                        ? 'bg-orange-100 border-orange-300 text-orange-800'
                        : ev.riskLevel === 'MODERATE'
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-zinc-300 border-zinc-400 text-zinc-800'
                    }`}
                  >
                    {ev.riskLevel === 'CRITICAL' ? (
                      <ShieldAlert className="w-4 h-4 animate-pulse" />
                    ) : ev.riskLevel === 'HIGH' || ev.riskLevel === 'MODERATE' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Info className="w-4 h-4" />
                    )}
                  </div>

                  {/* Title & Explanation */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-zinc-950 font-bold font-serif text-sm group-hover:underline transition">
                        {ev.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(
                          ev.riskLevel
                        )}`}
                      >
                        {ev.riskLevel}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-serif">{ev.room}</span>
                    </div>

                    <p className="text-xs text-zinc-700 font-serif leading-relaxed max-w-3xl">
                      {ev.explanation}
                    </p>
                  </div>
                </div>

                {/* Right Metadata */}
                <div className="flex items-center md:flex-col md:items-end gap-2 text-right shrink-0">
                  <span className="text-zinc-950 font-bold">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-[11px] text-zinc-900 font-semibold">
                    Conf: {ev.confidence.toFixed(1)}% | Risk: {ev.riskScore}/100
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold ${
                      ev.status === 'active'
                        ? 'text-rose-700'
                        : ev.status === 'acknowledged'
                        ? 'text-zinc-950'
                        : 'text-zinc-600'
                    }`}
                  >
                    [{ev.status}]
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center font-serif text-xs text-zinc-600">
            No events found matching the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
