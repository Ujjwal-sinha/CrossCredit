import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface CyberCardProps {
  children: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  className?: string;
  glowing?: boolean;
  animated?: boolean;
}

const CyberCard: React.FC<CyberCardProps> = ({
  children,
  title,
  icon: Icon,
  className = '',
  glowing = false,
  animated = true,
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    hover: { 
      y: -5,
      scale: 1.02,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      className={`cyber-glass rounded-xl p-6 relative overflow-hidden group ${
        glowing ? 'shadow-cyber animate-cyber-pulse' : ''
      } ${className}`}
      variants={animated ? cardVariants : undefined}
      initial={animated ? "hidden" : undefined}
      animate={animated ? "visible" : undefined}
      whileHover={animated ? "hover" : undefined}
    >
      {/* Background grid pattern */}
      <div className="absolute inset-0 cyber-grid-bg opacity-10"></div>
      
      {/* Hologram effect */}
      <div className="absolute inset-0 hologram-effect opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
      
      {/* Header */}
      {(title || Icon) && (
        <div className="flex items-center space-x-3 mb-4 relative z-10">
          {Icon && (
            <div className="p-2 bg-cyber-500/20 rounded-lg border border-cyber-500/30">
              <Icon className="w-5 h-5 text-cyber-400" />
            </div>
          )}
          {title && (
            <h3 className="text-lg font-semibold text-white font-orbitron neon-text">
              {title}
            </h3>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-500 opacity-50"></div>
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyber-500 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyber-500 opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-500 opacity-50"></div>
    </motion.div>
  );
};

export default CyberCard;