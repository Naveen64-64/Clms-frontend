import React from 'react';
import { Logo } from './Logo';

export const AuthLoadingScreen = () => {
  return (
    <div className="min-h-screen bg-[#211A22] flex flex-col items-center justify-center p-6 text-[#FFF4E9]">
      <div className="space-y-6 text-center max-w-sm">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#8D6B94]/40 blur-xl animate-pulse" />
          <Logo size="2xl" showText={false} className="relative z-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-extrabold tracking-tight">KDL - KIET Digital Library</h2>
          <p className="text-xs font-medium text-slate-400">Restoring your session securely...</p>
        </div>

        <div className="flex justify-center pt-2">
          <div className="h-1.5 w-32 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#E8DBC5]/500 rounded-full animate-pulse w-2/3 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
