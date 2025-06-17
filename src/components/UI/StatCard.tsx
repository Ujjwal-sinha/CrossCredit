import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import CyberCard from './CyberCard';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  animated?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  description,
  animated = true,
}) => {
  const changeColor = {
    positive: 'text-matrix-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  };

  const changeIcon = {
    positive: '↗',
    negative: '↘',
    neutral: '→',
  };

  return (
    <CyberCard animated={animated} glowing>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-cyber rounded-lg shadow-glow-sm">
          <Icon className="w-6 h-6 text-black" />
        </div>
        {change && (
          <motion.div
            className={`flex items-center space-x-1 text-sm font-mono ${changeColor[changeType]}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <span>{changeIcon[changeType]}</span>
            <span>{change}</span>
          </motion.div>
        )}
      </div>
      
      <div className="space-y-2">
        <motion.h3
          className="text-3xl font-bold text-white font-orbitron neon-text"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {value}
        </motion.h3>
        <p className="text-cyber-300 text-sm font-medium">{title}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-2 font-mono">{description}</p>
        )}
      </div>
      
      {/* Animated border */}
      <div className="absolute inset-0 rounded-xl border border-cyber-500/30 animate-pulse"></div>
    </CyberCard>
  );
};

export default StatCard;