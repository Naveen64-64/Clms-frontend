import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Building2,
  Clock,
  Users,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';

export const StudentLibraryInfoModal = ({
  isOpen,
  onClose,
  library = null,
  studentGender = '',
}) => {
  if (!library) return null;

  const capacity = library.capacity || 50;
  const activeCount = library.activeVisits ?? library.currentOccupancy ?? 0;
  const availableSeats = Math.max(0, capacity - activeCount);
  const occupancyPct = capacity > 0 ? Math.min(100, Math.round((activeCount / capacity) * 100)) : 0;
  const isOpenNow = library.isOpen !== false;

  const isWomenOnly = Boolean(library.isWomenOnly || library.code === 'KIET_WOMEN');
  const upperGender = (studentGender || '').toUpperCase();
  const isEligible = !isWomenOnly || upperGender === 'FEMALE';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md sm:max-w-lg w-[95vw] p-5 sm:p-6 bg-white dark:bg-[#1E1823] border-[#E8DBC5] dark:border-[#3B3142]">
        <DialogHeader className="border-b border-[#E8DBC5]/60 dark:border-[#3B3142] pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#8D6B94]/15 text-[#8D6B94] dark:text-[#B185A7] shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#2B232E] dark:text-[#FFF4E9]">
                  {library.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#7A697E] dark:text-[#B8A6BD] flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8D6B94]" />
                  <span>{library.location || 'Campus Library Facility'}</span>
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant={isOpenNow ? 'normal' : 'important'}
              className="text-xs font-bold px-2.5 py-1 uppercase"
            >
              {isOpenNow ? 'OPEN' : 'CLOSED'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Operating Hours Alert */}
          <div className="p-3 rounded-xl bg-[#FFF4E9] dark:bg-[#2B232E]/60 border border-[#E8DBC5] dark:border-[#3B3142] flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#8D6B94]" />
              <span className="font-semibold text-[#2B232E] dark:text-[#FFF4E9]">Operating Hours:</span>
            </div>
            <span className="font-mono font-bold text-[#8D6B94] dark:text-[#B185A7]">
              09:00 AM - 05:00 PM (Asia/Kolkata)
            </span>
          </div>

          {/* Seat Capacity Metrics Grid */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-[#FFF4E9] dark:bg-[#251E27] border border-[#E8DBC5] dark:border-[#3B3142]">
              <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] block">Occupied</span>
              <p className="text-xl font-black text-[#8D6B94] dark:text-[#B185A7] mt-0.5">{activeCount}</p>
              <span className="text-[9px] text-[#7A697E]">Active visitors</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF4E9] dark:bg-[#251E27] border border-[#E8DBC5] dark:border-[#3B3142]">
              <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] block">Available</span>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{availableSeats}</p>
              <span className="text-[9px] text-[#7A697E]">Open seats</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF4E9] dark:bg-[#251E27] border border-[#E8DBC5] dark:border-[#3B3142]">
              <span className="text-[10px] uppercase font-bold text-[#7A697E] dark:text-[#B8A6BD] block">Total</span>
              <p className="text-xl font-black text-[#2B232E] dark:text-[#FFF4E9] mt-0.5">{capacity}</p>
              <span className="text-[9px] text-[#7A697E]">Capacity limit</span>
            </div>
          </div>

          {/* Occupancy Progress Bar */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#FFF4E9]/60 dark:bg-[#251E27]/60 border border-[#E8DBC5]/80 dark:border-[#3B3142]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#2B232E] dark:text-[#FFF4E9]">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#8D6B94]" />
                <span>Live Utilization</span>
              </span>
              <span className="font-bold text-[#8D6B94] dark:text-[#B185A7]">
                {occupancyPct}% Occupied
              </span>
            </div>
            <div className="h-2.5 w-full bg-[#E8DBC5]/80 dark:bg-[#3B3142] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  occupancyPct > 90
                    ? 'bg-rose-500'
                    : occupancyPct > 70
                    ? 'bg-amber-500'
                    : 'bg-[#8D6B94]'
                }`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>

          {/* Student Access Eligibility Status */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
            isEligible
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}>
            {isEligible ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className="font-bold">
                {isEligible ? 'Access Authorized' : 'Access Restricted'}
              </p>
              <p className="text-[11px] leading-relaxed opacity-90">
                {isWomenOnly
                  ? upperGender === 'FEMALE'
                    ? 'Female students have full access to KIEW Library facilities.'
                    : 'KIEW Library is exclusively reserved for female students and faculty.'
                  : 'Universal Co-Ed Library: Open to all registered students and faculty.'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E8DBC5]/60 dark:border-[#3B3142] flex justify-end">
          <Button
            size="sm"
            onClick={onClose}
            className="text-xs bg-[#8D6B94] hover:bg-[#795B80] cursor-pointer text-[#FFF4E9]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
