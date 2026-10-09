import React from 'react';
import { Badge } from '../ui/Badge';
import { CheckCircle2, User, Building2, Clock, LogIn, LogOut, ShieldCheck } from 'lucide-react';

/**
 * VerifiedProfileOverlay Component
 *
 * Full-screen or kiosk overlay displaying verified student/faculty credentials,
 * check-in / check-out action, occupancy count, and timestamps.
 *
 * @param {Object} props
 * @param {Object} props.result - Entrance API response object
 * @param {boolean} props.visible - Whether overlay is currently displayed
 */
export const VerifiedProfileOverlay = ({ result, visible }) => {
  if (!visible || !result) return null;

  const isEntry = result.action === 'IN';
  const user = result.user || {};
  const student = result.student || {};
  const rollNo = user.id || result.rollNumber || result.userId || 'STUDENT';
  const name = user.name || result.userName || result.studentName || 'Student Name';
  const role = user.role || result.userType || 'STUDENT';
  const libraryName = result.library?.name || result.libraryName || 'KIET Library';
  const department = student.department || result.department || '';
  const timestamp = new Date(result.timestamp || result.checkoutTime || result.checkInTime || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const currentOcc = result.occupancy?.current ?? result.currentOccupancy ?? 0;
  const cap = result.occupancy?.capacity ?? result.capacity ?? 50;

  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-md bg-[#211C26] border-2 border-[#8D6B94] rounded-3xl shadow-2xl p-6 sm:p-8 text-center text-[#FFF4E9] overflow-hidden">
        {/* Glow ambient background circle */}
        <div
          className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30 ${
            isEntry ? 'bg-emerald-500' : 'bg-[#B185A7]'
          }`}
        />

        {/* Action Icon Pill */}
        <div className="flex justify-center mb-4">
          <div
            className={`p-4 rounded-2xl shadow-xl flex items-center justify-center text-white ${
              isEntry
                ? 'bg-gradient-to-tr from-emerald-600 to-emerald-400'
                : 'bg-gradient-to-tr from-[#8D6B94] to-[#B185A7]'
            }`}
          >
            {isEntry ? <LogIn className="w-10 h-10 animate-bounce" /> : <LogOut className="w-10 h-10 animate-pulse" />}
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3 border shadow-sm ${
          isEntry
            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
            : 'bg-purple-950/80 text-purple-300 border-purple-500/50'
        }">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isEntry ? 'ENTRY RECORDED' : 'EXIT RECORDED'}</span>
        </div>

        {/* Roll Number in bold monospace */}
        <h2 className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-white">
          {rollNo}
        </h2>

        {/* Student Full Name */}
        <h3 className="text-base sm:text-lg font-bold text-[#E8DBC5] mt-1.5 line-clamp-2">
          {name}
        </h3>

        {/* Student Metadata Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          <Badge variant="outline" className="text-[11px] font-bold px-2.5 py-0.5 border-[#3B3142] text-[#B8A6BD]">
            {role}
          </Badge>
          {department && (
            <Badge variant="secondary" className="text-[11px] font-extrabold px-2.5 py-0.5 bg-[#8D6B94]/30 text-white border border-[#8D6B94]/40">
              DEPT: {department}
            </Badge>
          )}
        </div>

        {/* Details Grid */}
        <div className="mt-6 pt-5 border-t border-[#3B3142] grid grid-cols-2 gap-3 text-left">
          <div className="bg-[#1A151E] p-3 rounded-xl border border-[#3B3142]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8A6BD] flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#8D6B94]" />
              Library
            </span>
            <p className="text-xs font-extrabold text-white mt-0.5 truncate">{libraryName}</p>
          </div>

          <div className="bg-[#1A151E] p-3 rounded-xl border border-[#3B3142]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B8A6BD] flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              Timestamp
            </span>
            <p className="text-xs font-mono font-bold text-white mt-0.5">{timestamp}</p>
          </div>
        </div>

        {/* Live Occupancy Footer */}
        <div className="mt-4 p-3 bg-[#1A151E]/60 rounded-xl border border-[#3B3142] flex items-center justify-between text-xs">
          <span className="text-[#B8A6BD] font-medium">Live Occupancy:</span>
          <span className="font-mono font-extrabold text-emerald-400">
            {currentOcc} / {cap} Seats Occupied
          </span>
        </div>

        <p className="text-[10px] text-[#B8A6BD]/70 mt-4 tracking-wide">
          Scanner will automatically reset for the next person...
        </p>
      </div>
    </div>
  );
};
