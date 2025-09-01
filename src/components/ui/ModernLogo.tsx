
import React from 'react';
import { motion } from 'framer-motion';

interface ModernLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const ModernLogo: React.FC<ModernLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <motion.div
        whileHover={{ scale: 1.1 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
        className={`${sizeClasses[size]} bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden`}
      >
        {/* Icône principale */}
        <div className="text-white font-bold text-sm">
          3W
        </div>
        
        {/* Effet de brillance */}
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '100%', opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
        />
      </motion.div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent ${textSizeClasses[size]}`}>
            3W-LOC
          </span>
          <span className="text-xs text-gray-500 -mt-1">
            Equipment Rental
          </span>
        </div>
      )}
    </div>
  );
};

export default ModernLogo;
