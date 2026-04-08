import React from 'react';
import { cn } from '../utils/cn';
import { motion } from 'framer-motion';

export const GlassCard = ({ children, className, glow = false, animate = false, onClick }) => {
  const CardContent = (
    <div
      onClick={onClick}
      className={cn(
        'glass-panel p-6 relative overflow-hidden transition-all duration-300',
        glow && 'glow-active border-smartops-primary/30',
        onClick && 'cursor-pointer hover:border-smartops-primary/50 hover:bg-white/[0.06]',
        className
      )}
    >
      {/* Subtle top reflection */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {CardContent}
      </motion.div>
    );
  }

  return CardContent;
};
