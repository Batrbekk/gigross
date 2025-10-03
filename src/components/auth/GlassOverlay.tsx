'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { GlassOverlayProps } from './types';
import styles from './glass-effect.module.css';
import Image from 'next/image';

const GlassOverlay: React.FC<GlassOverlayProps> = ({ className = '' }) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  return (
    <motion.div
      className={`
        relative z-10 p-8 md:p-12
        backdrop-blur-[20px]
        bg-white/20
        border border-white/40
        rounded-[20px]
        shadow-2xl
        glass-overlay
        ${styles.glassOverlay}
        ${className}
      `}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Логотип и заголовок */}
      <motion.div className="text-center mb-8" variants={itemVariants}>
        <motion.div 
          className="mb-2 w-full relative h-10"
          variants={itemVariants}
        >
          <Image src="/logo.svg" alt="Logo" fill priority className='object-contain' />
        </motion.div>
        <motion.p 
          className="text-base md:text-base text-gray-700"
          variants={itemVariants}
        >
          Gigross сокращает время сделок, обеспечивает прозрачность платежей и дает доступ к инвестиционному капиталу через единую платформу
        </motion.p>
      </motion.div>

      {/* <motion.div 
        className="mt-8 text-center"
        variants={itemVariants}
      >
        <motion.p 
          className="text-sm text-gray-600"
          variants={itemVariants}
        >
          Современная платформа для торговли халяльными напитками
        </motion.p>
      </motion.div> */}
    </motion.div>
  );
};

export default GlassOverlay;
