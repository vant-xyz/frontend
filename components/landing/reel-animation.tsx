"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReelAnimationProps {
  text?: string;
  className?: string;
}

export function ReelAnimation({ text = "VANT", className = "" }: ReelAnimationProps) {
  const [hoverKey, setHoverKey] = useState(0);
  const characters = String(text).split("");

  return (
    <span 
      className={`inline-flex overflow-hidden cursor-default ${className}`}
      onMouseEnter={() => setHoverKey(prev => prev + 1)}
    >
      <AnimatePresence mode="popLayout" initial={true}>
        {characters.map((char, index) => (
          <motion.span
            key={`${hoverKey}-${index}-${char}`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ 
              duration: 1.0, 
              ease: [0.32, 0.72, 0, 1],
              delay: index * 0.02 
            }}
            className="inline-block"
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </AnimatePresence>
    </span>
  );
}
