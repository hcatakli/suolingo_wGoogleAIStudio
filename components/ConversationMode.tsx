
import React from 'react';
import { DifficultyLevel } from '../types';
import { useLiveAvatar } from '../hooks/useLiveAvatar';

interface ConversationModeProps {
  level: DifficultyLevel;
  avatarSrc: string | null;
  onAvatarTalkingChange: (talking: boolean) => void;
}

const ConversationMode: React.FC<ConversationModeProps> = ({ level, avatarSrc, onAvatarTalkingChange }) => {
  const systemInstruction = `You are Sulingo, a friendly and professional English teacher.
  The user is a student learning English at the ${level} level.
  
  Instructions:
  1. Act like a real teacher in a video call. Be encouraging, patient, and clear.
  2. Start by greeting the user warmly (e.g., "Hello! How are you today?").
  3. Engage in a natural conversation. Ask simple questions to keep the dialogue flowing.
  4. If the student makes a mistake, gently correct them and demonstrate the correct usage, but keep the tone conversational.
  5. Keep your responses concise (1-3 sentences) to allow the student ample time to speak.
  `;

  const { connect, disconnect, isConnected, isTalking, error } = useLiveAvatar({ 
    level, 
    systemInstruction 
  });

  // Sync talking state up to parent for Avatar animation
  React.useEffect(() => {
    onAvatarTalkingChange(isTalking);
  }, [isTalking, onAvatarTalkingChange]);

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Free Talk ({level})</h2>
        <p className="text-gray-500 mb-8">Have a real-time conversation with your AI Tutor.</p>

        {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                {error}
            </div>
        )}

        {!isConnected ? (
          <button 
            onClick={connect}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-blue-600 font-pj rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 hover:bg-blue-700"
          >
            <span className="absolute w-6 h-6 -ml-2 transition-all duration-200 bg-white rounded-full group-hover:w-full group-hover:h-full group-hover:ml-0 group-hover:rounded-full opacity-10"></span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Start Conversation
          </button>
        ) : (
          <div className="space-y-8">
             <div className="flex items-center justify-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-green-600 font-medium">Live Connection Active</span>
             </div>

             <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                {isTalking ? (
                    <div className="flex justify-center space-x-1 h-8 items-end">
                        <div className="w-2 bg-blue-500 animate-[bounce_1s_infinite] h-4"></div>
                        <div className="w-2 bg-blue-500 animate-[bounce_1s_infinite_0.2s] h-8"></div>
                        <div className="w-2 bg-blue-500 animate-[bounce_1s_infinite_0.4s] h-6"></div>
                        <div className="w-2 bg-blue-500 animate-[bounce_1s_infinite_0.1s] h-3"></div>
                    </div>
                ) : (
                    <p className="text-gray-500">Listening to you...</p>
                )}
             </div>

             <button 
                onClick={disconnect}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300"
             >
                End Call
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationMode;
