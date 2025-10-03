'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import AnimatedSpheres from './AnimatedSpheres';
import GlassOverlay from './GlassOverlay';
import { AuthGlassPanelProps } from './types';

const AuthGlassPanel: React.FC<AuthGlassPanelProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={containerRef}
      className={`
        relative flex items-center justify-center min-h-screen
        bg-[#F3F7FB]
        backdrop-blur-[20px]
        overflow-hidden
        ${className}
      `}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Стеклянный фон всего блока */}
      <div className="absolute inset-0 backdrop-blur-[15px] bg-white/10 border border-white/20" />
      
      {/* Анимированные шарики */}
      <AnimatedSpheres containerRef={containerRef} />
      
      {/* Легкий стеклянный blur поверх шариков */}
      <div className="absolute inset-0 backdrop-blur-[5px] bg-white/3 pointer-events-none" />
      
      {/* Стеклянный overlay с контентом - по центру */}
      <div className="relative z-10 flex items-center justify-center w-full h-full p-4">
        <GlassOverlay className="max-w-lg w-full" />
      </div>
      
      {/* Дополнительные декоративные элементы */}
      <div className="absolute top-10 right-10 w-20 h-20 bg-blue-200/20 rounded-full blur-xl" />
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-200/20 rounded-full blur-xl" />
      <div className="absolute top-1/2 left-10 w-16 h-16 bg-green-200/20 rounded-full blur-xl" />
    </motion.div>
  );
};

export default AuthGlassPanel;
