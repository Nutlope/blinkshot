import React from 'react';
import { motion } from 'framer-motion';
import '@/styles/ProgressIndicator.css';

interface ProgressIndicatorProps {
  progress: number;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress }) => {
  return (
    <div className="progress-container">
      <motion.div 
        className="progress-bar"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
      <div className="progress-text">
        {progress.toFixed(0)}%
      </div>
    </div>
  );
};

export default ProgressIndicator;
