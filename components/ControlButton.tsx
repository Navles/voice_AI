
import React from 'react';
import type { ConversationStatus } from '../types';

interface ControlButtonProps {
  onClick: () => void;
  status: ConversationStatus;
}

const MicrophoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
);

const Spinner = () => (
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-800/80"></div>
);


export const ControlButton: React.FC<ControlButtonProps> = ({ onClick, status }) => {
  const getButtonContent = () => {
    switch(status) {
      case 'connecting':
        return <Spinner />;
      case 'error':
        return (
          <div className="flex flex-col items-center">
            <MicrophoneIcon />
            <span className="text-xs mt-1">Retry</span>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center">
            <MicrophoneIcon />
            <span className="text-xs mt-1">Start</span>
          </div>
        );
    }
  };

  const getIconColor = () => {
    switch(status) {
      case 'error':
        return 'text-red-500';
      case 'connecting':
        return 'text-blue-500';
      default:
        return 'text-gray-600 hover:text-blue-500';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`absolute w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-black/10 hover:bg-gray-200/50 active:scale-95 group ${status === 'connecting' ? 'cursor-not-allowed' : ''}`}
      disabled={status === 'connecting'}
      aria-label={status === 'connecting' ? 'Connecting...' : 'Start conversation'}
    >
      <div className={`transition-all duration-300 group-hover:scale-110 ${getIconColor()}`}>
        {getButtonContent()}
      </div>
    </button>
  );
};
