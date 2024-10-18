import React from 'react';
import { motion } from 'framer-motion';

interface TranslationProgressIndicatorProps {
  progress: number;
  isTranslating: boolean;
}

const TranslationProgressIndicator: React.FC<TranslationProgressIndicatorProps> = ({ progress, isTranslating }) => {
  if (!isTranslating) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50"
    >
      <h3 className="text-lg font-semibold mb-2">Translating Content</h3>
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-indigo-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <p className="mt-2 text-sm text-gray-600">{progress.toFixed(0)}% Complete</p>
    </motion.div>
  );
};

export default TranslationProgressIndicator;
