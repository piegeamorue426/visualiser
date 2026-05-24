/**
 * Styled button component with neon variants.
 */

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400 shadow-neon',
  secondary:
    'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-400',
  ghost:
    'bg-transparent hover:bg-white/5 border border-transparent text-gray-300 hover:text-white',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-mono text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
