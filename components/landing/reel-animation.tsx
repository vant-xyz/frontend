"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReelAnimationProps {
  text?: string;
  texts?: string[];
  className?: string;
  rotateInterval?: number;
  animateOnHover?: boolean;
}

export function ReelAnimation({ 
  text = "VANT", 
  texts,
  className = "",
  rotateInterval = 3000,
  animateOnHover = true
}: ReelAnimationProps) {
  const [hoverKey, setHoverKey] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  
  const displayText = texts ? texts[currentTextIndex] : text;
  const characters = String(displayText).split("");

  useEffect(() => {
    // Initial mount animation
    setHasAnimated(true);
  }, []);

  useEffect(() => {
    if (!texts || texts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      setHoverKey((prev) => prev + 1);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [texts, rotateInterval]);

  const handleHover = useCallback(() => {
    if (animateOnHover) {
      setHoverKey(prev => prev + 1);
    }
  }, [animateOnHover]);

  return (
    <span
      className={`inline-flex overflow-hidden cursor-default ${className}`}
      onMouseEnter={handleHover}
    >
      <AnimatePresence mode="popLayout" initial={true}>
        {characters.map((char, index) => (
          <motion.span
            key={`${hoverKey}-${index}-${char}`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.32, 0.72, 0, 1],
              delay: index * 0.03
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
