import React from 'react';

export const Logo = ({
  size = 'md',
  showText = true,
  className = '',
  title = 'KDL',
  subtitle = 'KIET Digital Library',
  textClassName = '',
  isLight = false,
  titleClassName = '',
  subtitleClassName = ''
}) => {
  const sizeMap = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24',
  };

  const imgSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center space-x-3 group ${className}`}>
      <div className={`relative shrink-0 flex items-center justify-center rounded-full p-0.5 shadow-xs transition-transform duration-300 group-hover:scale-105 ${
        isLight ? 'bg-white/25 backdrop-blur-xs' : 'bg-[#8D6B94]/20 dark:bg-[#8D6B94]/40'
      }`}>
        <img
          src="/clms-logo.png"
          alt="KDL - KIET Digital Library Logo"
          className={`${imgSize} rounded-full object-cover shrink-0`}
        />
      </div>
      {showText && (
        <div className={textClassName}>
          <span className={`font-extrabold text-base tracking-tight block leading-none ${
            isLight ? 'text-white drop-shadow-xs' : 'text-[#2B232E] dark:text-[#FFF4E9]'
          } ${titleClassName}`}>
            {title}
          </span>
          {subtitle && (
            <span className={`block text-[9px] uppercase font-bold tracking-widest mt-1 ${
              isLight ? 'text-[#E8DBC5]' : 'text-[#8D6B94] dark:text-[#B185A7]'
            } ${subtitleClassName}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
