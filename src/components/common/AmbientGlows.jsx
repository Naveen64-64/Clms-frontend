import React from 'react';

export const AmbientGlows = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 aria-hidden:true">
      {/* Top Left: Soft Vintage Lavender Glow */}
      <div 
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-[140px] opacity-30 transition-opacity duration-700"
        style={{ background: 'radial-gradient(circle, rgba(141,107,148,0.35) 0%, rgba(141,107,148,0) 70%)' }}
      />
      
      {/* Top Right: Rosy Taupe & Sand Dune Ambient Lighting */}
      <div 
        className="absolute -top-40 -right-40 w-[650px] h-[650px] rounded-full blur-[160px] opacity-30 transition-opacity duration-700"
        style={{ background: 'radial-gradient(circle, rgba(195,162,158,0.3) 0%, rgba(232,219,197,0.2) 45%, rgba(0,0,0,0) 70%)' }}
      />

      {/* Bottom/Side: Soft Amethyst Smoke Atmospheric Glow */}
      <div 
        className="absolute bottom-10 right-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-25 transition-opacity duration-700"
        style={{ background: 'radial-gradient(circle, rgba(177,133,167,0.28) 0%, rgba(177,133,167,0) 70%)' }}
      />
    </div>
  );
};
