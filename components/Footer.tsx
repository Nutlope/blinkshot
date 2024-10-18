import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import GithubIcon from '@/components/icons/github-icon';
import XIcon from '@/components/icons/x-icon';
import Spinner from '@/components/spinner';
import { Download, Heart, Coffee, Sparkles } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';

type FooterProps = {
  downloadBook: () => void;
  isGeneratingDocx: boolean;
};

const Footer: React.FC<FooterProps> = ({ downloadBook, isGeneratingDocx }) => {
  const [loveCount, setLoveCount] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    controls.start({
      y: [0, -10, 0],
      transition: { duration: 0.5, repeat: Infinity, repeatType: 'reverse' }
    });
  }, [controls]);

  const handleLoveClick = () => {
    setLoveCount(loveCount + 1);
    controls.start({
      scale: [1, 1.2, 1],
      transition: { duration: 0.3 }
    });
  };

  return (
    <footer className="relative mt-16 pb-8 bg-gradient-to-b from-indigo-900 to-purple-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-8 text-center"
          >
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-4">
              Crafted with <span className="text-pink-400">AI</span>, Powered by <span className="text-yellow-400">Imagination</span>
            </h2>
            <p className="text-xl text-indigo-200 mb-8">
              Join thousands of storytellers revolutionizing the art of writing
            </p>
          </motion.div>

          <div className="flex space-x-6 mb-8">
            <a href='https://github.com/Nutlope/blinkshot' target='_blank' rel='noopener noreferrer'>
              <Button
                variant='outline'
                size='lg'
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <GithubIcon className="w-5 h-5 mr-2" />
                Star on GitHub
              </Button>
            </a>
            <a href='https://x.com/nutlope' target='_blank' rel='noopener noreferrer'>
              <Button
                variant='outline'
                size='lg'
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <XIcon className="w-5 h-5 mr-2" />
                Follow on Twitter
              </Button>
            </a>
          </div>

          <Button 
            onClick={downloadBook} 
            className="mb-8 bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transform transition duration-300 hover:scale-105"
            disabled={isGeneratingDocx}
          >
            {isGeneratingDocx ? (
              <>
                <Spinner className="w-5 h-5 mr-2" />
                Crafting Your Masterpiece...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download Your Story
              </>
            )}
          </Button>

          <motion.div
            animate={controls}
            className="flex items-center space-x-2 mb-8 cursor-pointer"
            onClick={handleLoveClick}
          >
            <Heart className="w-6 h-6 text-pink-500" fill="currentColor" />
            <span className="text-lg font-semibold">{loveCount} loves</span>
          </motion.div>

          <p className="text-sm text-indigo-200">
            Powered by{' '}
            <a href='https://www.dub.sh/together-ai' target='_blank' rel='noopener noreferrer' className="underline hover:text-white">
              Together.ai
            </a>
            {' '}&{' '}
            <a href='https://dub.sh/together-flux' target='_blank' rel='noopener noreferrer' className="underline hover:text-white">
              Flux
            </a>
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute inset-0 z-0"
      >
        {[...Array(50)].map((_, i) => (
          <Sparkles
            key={i}
            className="absolute text-yellow-300 opacity-50"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 10 + 5}px`,
              animationDuration: `${Math.random() * 2 + 1}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </motion.div>
    </footer>
  );
};

export default Footer;
