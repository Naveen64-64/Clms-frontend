import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Users, Building2, Clock } from 'lucide-react';

/**
 * LibraryOccupancyPanel Component (High-Density Compact Version)
 *
 * Space-efficient institutional seat occupancy dashboard displaying live visitors,
 * seat utilization progress bar, and capacity across all 3 KIET campus libraries.
 * Sized compactly to maximize vertical space for Recent Gate Activity.
 *
 * @param {Object} props
 * @param {Array} props.allLibraries - List of libraries with current active count and capacity
 * @param {string} props.selectedLibraryCode - Code of currently active library
 * @param {Object} props.activeStatus - Active library detailed status
 */
export const LibraryOccupancyPanel = ({
  allLibraries = [],
  selectedLibraryCode = 'KIET_MAIN',
  activeStatus = null,
  isLoading = false,
  error = null
}) => {
  return (
    <div className="space-y-2 shrink-0">
      {/* 2. Active Gate Terminal (Compact) */}
      {activeStatus && (
        <Card className="border-[#3B3142] bg-[#211C26] text-[#FFF4E9] shadow-sm overflow-hidden">
          <CardContent className="p-2 sm:p-2.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 min-w-0">
                <div className="p-1 bg-[#8D6B94] rounded-md text-white shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 truncate">
                  <h4 className="text-[9px] uppercase font-extrabold tracking-wider text-[#B8A6BD] leading-none">
                    ACTIVE GATE TERMINAL
                  </h4>
                  <p className="text-xs font-bold text-white truncate leading-tight mt-0.5">
                    {activeStatus.libraryName || activeStatus.library?.name || 'KIET Library'}
                  </p>
                </div>
              </div>

              <Badge
                variant={activeStatus.isOpen === false ? 'destructive' : 'success'}
                className={`text-[9px] font-bold px-1.5 py-0 uppercase tracking-wider shrink-0 ${
                  activeStatus.isOpen === false ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                <Clock className="w-2.5 h-2.5 mr-0.5 inline" />
                {activeStatus.isOpen === false ? 'CLOSED' : 'OPEN'}
              </Badge>
            </div>

            {/* Occupancy Stats Meter (Compact Single Row + Slim Bar) */}
            <div>
              <div className="flex items-baseline justify-between text-[11px] mb-1">
                <span className="text-[#B8A6BD] font-medium text-[10px]">Occupancy:</span>
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="font-extrabold text-white">
                    {activeStatus.activeVisits ?? activeStatus.activeCount ?? 0}
                    <span className="text-[10px] text-[#B8A6BD] font-normal"> / {activeStatus.capacity || 50}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    ({activeStatus.availableSeats ?? 50} Free)
                  </span>
                  <span className="text-[9px] text-[#B185A7] font-bold">
                    {Math.round(((activeStatus.activeVisits ?? activeStatus.activeCount ?? 0) / (activeStatus.capacity || 50)) * 100)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {(() => {
                const active = activeStatus.activeVisits ?? activeStatus.activeCount ?? 0;
                const cap = activeStatus.capacity || 50;
                const percent = Math.min(100, Math.round((active / cap) * 100));
                const barColor = percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-400' : 'bg-emerald-400';

                return (
                  <div className="w-full bg-[#1A151E] h-1.5 rounded-full overflow-hidden border border-[#3B3142]/60">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${barColor}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Campus Library Occupancy (Compact) */}
      <Card className="border-[#3B3142] bg-[#211C26] text-[#FFF4E9] shadow-sm">
        <CardHeader className="py-1.5 px-2.5 border-b border-[#3B3142]/80">
          <CardTitle className="text-[10px] font-extrabold uppercase tracking-wider text-[#B8A6BD] flex items-center gap-1.5">
            <Users className="w-3 h-3 text-[#8D6B94]" />
            Campus Library Occupancy
          </CardTitle>
        </CardHeader>
        <CardContent className="p-1.5 space-y-1">
          {isLoading && allLibraries.length === 0 ? (
            <p className="text-[11px] text-[#B8A6BD] text-center py-1 animate-pulse">Loading campus occupancy...</p>
          ) : error ? (
            <p className="text-[11px] text-rose-400 text-center py-1">Unable to load campus occupancy</p>
          ) : allLibraries.length === 0 ? (
            <p className="text-[11px] text-[#B8A6BD] text-center py-1">No library occupancy data available</p>
          ) : (
            allLibraries.map((lib) => {
              const isSelected = lib.code === selectedLibraryCode;
              const active = lib.activeVisits ?? 0;
              const cap = lib.capacity || 50;
              const available = Math.max(0, cap - active);

              return (
                <div
                  key={lib.code || lib.id}
                  className={`py-1 px-2 rounded-lg border transition-colors flex items-center justify-between text-[11px] ${
                    isSelected
                      ? 'bg-[#2D2534] border-[#8D6B94]'
                      : 'bg-[#1A151E] border-[#3B3142]/50 hover:border-[#3B3142]'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active > 40 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className={`font-semibold truncate max-w-[130px] ${isSelected ? 'text-white font-bold' : 'text-[#E8DBC5]'}`}>
                      {lib.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 font-mono text-[10px] shrink-0">
                    <span className="font-extrabold text-white">
                      {active} / {cap}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      ({available} free)
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};
