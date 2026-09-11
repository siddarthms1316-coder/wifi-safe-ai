import React from 'react';
import { VirtualRoomEvent } from '../../types/virtualRoom';
import { History, Activity, AlertTriangle, ShieldCheck, Wifi, Radio } from 'lucide-react';

interface LiveEventTimelineProps {
  events: VirtualRoomEvent[];
  onClear?: () => void;
}

export const LiveEventTimeline: React.FC<LiveEventTimelineProps> = ({ events, onClear }) => {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-600" />
          <span className="font-bold text-sm text-slate-900 font-sans tracking-tight">
            LIVE EVENT STREAM
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">
            {events.length} events
          </span>
          {onClear && (
            <button
              onClick={onClear}
              className="text-[10px] font-sans font-medium text-slate-400 hover:text-slate-700 transition"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <div className="text-center py-6 text-xs font-sans text-slate-400">
            No events logged yet. Active stream telemetry will appear here in chronological order.
          </div>
        ) : (
          events.map((ev) => {
            const isAlert = ev.type === 'alert';
            const isWarning = ev.type === 'warning';
            const isConn = ev.type === 'connection';

            return (
              <div
                key={ev.id}
                className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition ${
                  isAlert
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : isWarning
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : isConn
                    ? 'bg-cyan-50 border-cyan-200 text-cyan-950'
                    : 'bg-[#F8FAFC] border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex-shrink-0">
                    {isAlert ? (
                      <span className="h-2 w-2 rounded-full bg-rose-500 inline-block mt-1" />
                    ) : isWarning ? (
                      <span className="h-2 w-2 rounded-full bg-amber-500 inline-block mt-1" />
                    ) : isConn ? (
                      <span className="h-2 w-2 rounded-full bg-cyan-600 inline-block mt-1" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-400 inline-block mt-1" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 font-sans leading-tight">
                      {ev.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-sans leading-relaxed">
                      {ev.details}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-slate-500 whitespace-nowrap pt-0.5">
                  {ev.timestamp}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
