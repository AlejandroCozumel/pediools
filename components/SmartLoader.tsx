"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from "lucide-react";
import { useTranslations } from 'next-intl';

interface SmartLoaderProps {
  type?: 'growth' | 'analysis' | 'calculation' | 'processing';
  duration?: number; // Total duration in milliseconds
  onComplete?: () => void;
}

const SmartLoader: React.FC<SmartLoaderProps> = ({
  type = 'growth',
  duration = 2000,
  onComplete
}) => {
  const t = useTranslations('SmartLoader');
  const [currentStep, setCurrentStep] = useState(0);

  // Two-step messages with translation
  const getMessages = (type: string) => {
    switch (type) {
      case 'growth':
        return [
          t('growth.step1'),
          t('growth.step2')
        ];
      case 'analysis':
        return [
          t('analysis.step1'),
          t('analysis.step2')
        ];
      case 'calculation':
        return [
          t('calculation.step1'),
          t('calculation.step2')
        ];
      default:
        return [
          t('processing.step1'),
          t('processing.step2')
        ];
    }
  };

  const messages = getMessages(type);
  const stepDuration = duration / messages.length;

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < messages.length - 1) {
          return prev + 1;
        }
        clearInterval(stepTimer);
        // Complete after showing the last message
        setTimeout(() => {
          onComplete?.();
        }, stepDuration * 0.8); // Complete before the step would naturally end
        return prev;
      });
    }, stepDuration);

    return () => clearInterval(stepTimer);
  }, [stepDuration, messages.length, onComplete]);

  return (
    <div className="flex items-center justify-center min-h-dvh-nav">
      <motion.div
        className="flex flex-col items-center space-y-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Main Icon Animation - Responsive Sizes */}
        <div className="relative">
          {/* Progress Ring */}
          <motion.div
            className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 border-3 md:border-4 border-transparent border-t-medical-600 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />

          {/* Center Icon */}
          <motion.div
            className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-white rounded-full shadow-sm border border-medical-100"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Brain className="w-9 h-9 md:w-12 md:h-12 text-medical-600" />
          </motion.div>
        </div>

        {/* Smooth Message Transition - Responsive Text */}
        <div className="h-10 md:h-12 flex items-center justify-center px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                duration: 0.5,
                ease: "easeInOut"
              }}
              className="text-center"
            >
              <p className="text-xl md:text-2xl font-medium text-medical-700">
                {messages[currentStep]}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Subtle animated dots - Responsive Sizes */}
        <div className="flex justify-center space-x-1.5 md:space-x-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 md:w-2.5 md:h-2.5 bg-medical-400 rounded-full"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default SmartLoader;