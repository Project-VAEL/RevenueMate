import React from 'react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'dark' | 'purple' | 'yellow' | 'coral' | 'mint' | 'zinc';
  onClick?: () => void;
  hoverEffect?: boolean;
}

export function BentoCard({
  children,
  className = '',
  variant = 'dark',
  onClick,
  hoverEffect = false,
}: BentoCardProps) {
  const variantStyles = {
    dark: 'bg-[#18181C] text-white border border-white/[0.08]',
    zinc: 'bg-[#202026] text-white border border-white/[0.08]',
    purple: 'bg-[#8B5CF6] text-white border border-purple-400/30',
    yellow: 'bg-[#F59E0B] text-zinc-950 border border-amber-400/30 font-medium',
    coral: 'bg-[#FB7185] text-zinc-950 border border-rose-400/30 font-medium',
    mint: 'bg-[#10B981] text-zinc-950 border border-emerald-400/30 font-medium',
  };

  const hoverStyle = hoverEffect
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20'
    : '';

  return (
    <div
      onClick={onClick}
      className={`rounded-3xl p-5 md:p-6 transition-colors ${variantStyles[variant]} ${hoverStyle} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

