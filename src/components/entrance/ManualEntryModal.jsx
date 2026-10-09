import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Keyboard, ArrowRightCircle, AlertCircle } from 'lucide-react';

/**
 * ManualEntryModal Component
 *
 * Fallback dialog for manually keying in a Roll Number or Faculty ID
 * when a physical ID card is damaged, scratched, or camera is unavailable.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Function} props.onSubmit - Callback: (identifier: string) => Promise<void>
 * @param {boolean} props.isLoading
 * @param {string} props.selectedLibraryName
 */
export const ManualEntryModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  selectedLibraryName = 'KIET Library'
}) => {
  const [val, setVal] = useState('');
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setVal('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = val.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a valid Roll Number or User ID');
      return;
    }
    onSubmit(clean);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#211C26] text-[#FFF4E9] rounded-2xl border border-[#3B3142] shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#3B3142]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-[#8D6B94] rounded-lg text-white">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                MANUAL ROLL NUMBER ENTRY
              </h3>
              <p className="text-[11px] text-[#B8A6BD] font-medium">{selectedLibraryName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-[#B8A6BD] hover:text-white hover:bg-[#2D2534] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#E8DBC5]">
              STUDENT ROLL NUMBER / USER ID
            </label>
            <Input
              ref={inputRef}
              type="text"
              value={val}
              onChange={(e) => {
                setVal(e.target.value);
                setError(null);
              }}
              placeholder="e.g. 23B21A4268 or 23B21A4595"
              className="h-12 text-base font-mono uppercase font-bold tracking-wider px-4 border-[#3B3142] bg-[#1A151E] text-white focus:ring-[#8D6B94]"
              autoComplete="off"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </p>
          )}

          <div className="p-3 bg-[#1A151E] rounded-xl border border-[#3B3142] text-[11px] text-[#B8A6BD] leading-relaxed">
            Note: Manual entry is an emergency fallback for physically damaged ID cards.
            Standard entry requires presenting the physical card to the camera.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#3B3142] text-white hover:bg-[#2D2534]"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="bg-[#8D6B94] hover:bg-[#795B80] text-white font-bold"
            >
              <ArrowRightCircle className="w-4 h-4 mr-1.5" />
              Process Entry / Exit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
