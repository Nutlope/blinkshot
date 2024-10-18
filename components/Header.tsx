import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import Logo from '@/components/logo';
import { motion } from 'framer-motion';

type HeaderProps = {
  userAPIKey: string;
  setUserAPIKey: (key: string) => void;
};

const Header: React.FC<HeaderProps> = ({ userAPIKey, setUserAPIKey }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <header className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center"
          >
            <a href='https://www.dub.sh/together-ai' target='_blank' rel='noopener noreferrer' className="mr-4">
              <Logo className="w-12 h-12" />
            </a>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Story<span className="text-yellow-300">Forge</span>
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <Input
              placeholder='Enter your Together API Key'
              type={isHovered ? 'text' : 'password'}
              value={userAPIKey}
              className="w-64 sm:w-80 bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-yellow-300"
              onChange={(e) => setUserAPIKey(e.target.value)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="absolute -top-8 left-0 text-xs text-yellow-300"
            >
              <a
                href='https://api.together.xyz/settings/api-keys'
                target='_blank'
                rel='noopener noreferrer'
                className="hover:underline"
              >
                Get your API Key
              </a>
            </motion.div>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-6 text-center"
        >
          <p className="text-xl text-white/80">
            Unleash your creativity with AI-powered storytelling
          </p>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
