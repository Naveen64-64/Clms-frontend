import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Activity, LogIn, LogOut } from 'lucide-react';

/**
 * LiveGateActivityLog Component
 *
 * Real-time event log panel displaying the latest check-in / check-out records
 * for the entrance kiosk terminal. Optimized vertically to display ~8-10 events
 * simultaneously on a laptop/desktop screen with smooth internal scrolling for older records.
 *
 * @param {Object} props
 * @param {Array} props.visits - Chronological list of recent gate events (newest first)
 * @param {Function} props.onRefresh - Callback to refresh logs
 */
export const LiveGateActivityLog = ({ visits = [], onRefresh, isLoading = false, error = null }) => {
  return (
    <Card className="border-[#3B3142] bg-[#211C26] text-[#FFF4E9] shadow-md flex flex-col flex-1 min-h-[340px] lg:min-h-0 overflow-hidden">
      <CardHeader className="py-2 px-3 border-b border-[#3B3142] flex flex-row items-center justify-between shrink-0 bg-[#1D1822]">
        <div className="flex items-center gap-2">
          <CardTitle className="text-[11px] font-extrabold uppercase tracking-wider text-[#B8A6BD] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#8D6B94]" />
            Recent Gate Activity
          </CardTitle>
          {visits.length > 0 && (
            <Badge className="bg-[#8D6B94]/30 text-[#FFF4E9] border border-[#8D6B94]/50 font-mono text-[9px] px-1.5 py-0">
              {visits.length} Events
            </Badge>
          )}
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-[10px] text-[#B8A6BD] hover:text-white transition-colors cursor-pointer font-semibold px-2 py-0.5 rounded hover:bg-[#2D2534]"
          >
            Refresh
          </button>
        )}
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-0 overflow-y-auto divide-y divide-[#3B3142]/40 scrollbar-thin scrollbar-thumb-[#3B3142] scrollbar-track-transparent">
        {isLoading && visits.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#B8A6BD] animate-pulse">
            <p>Loading recent activity...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-400">
            <p>Unable to load gate activity.</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#B8A6BD]">
            <p>No recent gate logs recorded today.</p>
            <p className="text-[10px] text-[#7A697E] mt-1">Scanned student check-ins will stream here live.</p>
          </div>
        ) : (
          <div>
            {visits.map((item, idx) => {
              const actionType = item.event || item.action || 'IN';
              const isEntry = actionType === 'IN';
              const identifier = item.rollNumber || item.userId || item.user?.id || 'STUDENT';
              const name = item.name || item.userName || item.studentName || item.user?.name || 'Student';
              const timeStr = item.timestamp
                ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : 'Now';

              return (
                <div
                  key={item.id || `${identifier}_${item.timestamp || idx}`}
                  className="py-1.5 px-2.5 sm:px-3 hover:bg-[#2D2534] transition-colors flex items-center justify-between gap-2 text-xs"
                >
                  {/* Left: Row Number + Action Icon + Student Info */}
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {/* Event index counter */}
                    <span className="font-mono text-[10px] font-bold text-[#7A697E] w-4 shrink-0 text-right">
                      {idx + 1}.
                    </span>

                    {/* Compact IN/OUT icon */}
                    <div
                      className={`p-1 rounded-md text-white shrink-0 ${
                        isEntry ? 'bg-emerald-600' : 'bg-purple-600'
                      }`}
                      title={isEntry ? 'Check-IN' : 'Check-OUT'}
                    >
                      {isEntry ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
                    </div>

                    {/* Roll Number & Name */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 leading-tight">
                        <span className="font-mono font-bold text-white text-[11px] tracking-tight">
                          {identifier}
                        </span>
                        <span className="text-[11px] text-[#E8DBC5]/80 truncate font-medium max-w-[130px] sm:max-w-[170px]">
                          {name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: IN / OUT Badge + Event Timestamp */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-[10px] text-[#B8A6BD] font-mono hidden sm:inline">
                      {timeStr}
                    </span>
                    <Badge
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs ${
                        isEntry ? 'bg-emerald-600 text-white' : 'bg-purple-600 text-white'
                      }`}
                    >
                      {actionType}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
