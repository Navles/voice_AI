
import React from 'react';
import type { ConversationStatus } from '../types';

interface VoiceVisualizerProps {
  status: ConversationStatus;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ status }) => {
  const isListening = status === 'listening';
  const isSpeaking = status === 'speaking';
  const isConnecting = status === 'connecting';
  const isActive = isListening || isSpeaking || isConnecting;

  const getRingClasses = (
    baseSize: string,
    animationClass: string,
    color: string,
    opacity: string,
    delay: string = ''
  ) => {
    return `absolute rounded-full border transition-all duration-700 ease-in-out ${baseSize} ${isActive ? animationClass : ''} ${color} ${opacity} ${delay}`;
  };

  const speakingColor = 'border-teal-400';
  const listeningColor = 'border-blue-500';
  const connectingColor = 'border-yellow-500';
  const idleColor = 'border-gray-300/70';
  
  let color = idleColor;
  if (isSpeaking) color = speakingColor;
  else if (isListening) color = listeningColor;
  else if (isConnecting) color = connectingColor;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className={getRingClasses('w-64 h-64', 'animate-pulse-slow', color, 'opacity-20', 'delay-300')}></div>
      <div className={getRingClasses('w-56 h-56', 'animate-pulse-slow', color, 'opacity-30', 'delay-150')}></div>
      <div className={getRingClasses('w-48 h-48', 'animate-pulse-slow', color, 'opacity-40', '')}></div>
      <div className={`absolute w-40 h-40 rounded-full bg-white/50 shadow-inner ring-1 ring-black/5`}></div>
    </div>
  );
};
