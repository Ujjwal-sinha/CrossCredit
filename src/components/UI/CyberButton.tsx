import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface CyberButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  glitch?: boolean;
}

const CyberButton: React.FC<CyberButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  className = '',
  type = 'button',
  glitch = false,
}) => {
  const baseClasses = 'cyber-button relative inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyber-500 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed font-orbitron';
  
  const variants = {
    primary: 'bg-gradient-cyber text-black hover:shadow-cyber border border-cyber-500 hover:border-cyber-400',
    secondary: 'bg-cyber-900/50 text-cyber-400 hover:bg-cyber-800/50 border border-cyber-700 hover:border-cyber-500',
    outline: 'border-2 border-cyber-500 text-cyber-400 hover:bg-cyber-500 hover:text-black cyber-glass',
    ghost: 'text-cyber-400 hover:bg-cyber-500/10 hover:text-cyber-300',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-6 py-2.5 text-sm rounded-lg',
    lg: 'px-8 py-3 text-base rounded-xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${glitch ? 'glitch' : ''}`}
      data-text={glitch ? children : undefined}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cyber glow effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-cyber opacity-0 hover:opacity-20 transition-opacity duration-300 blur-sm"></div>
      
      {/* Content */}
      <div className="relative flex items-center space-x-2">
        {Icon && iconPosition === 'left' && (
          <Icon className={`${iconSizes[size]} ${children ? 'mr-1' : ''}`} />
        )}
        {children && <span className="neon-text">{children}</span>}
        {Icon && iconPosition === 'right' && (
          <Icon className={`${iconSizes[size]} ${children ? 'ml-1' : ''}`} />
        )}
      </div>
      
      {/* Scanning line effect */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyber-400 to-transparent animate-pulse"></div>
      </div>
    </motion.button>
  );
};

export default CyberButton;