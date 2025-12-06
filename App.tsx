
import React, { useState } from 'react';
import { DifficultyLevel, AppMode } from './types';
import Avatar from './components/Avatar';
import VocabularyPractice from './components/VocabularyPractice';
import ConversationMode from './components/ConversationMode';

const App = () => {
  const [currentLevel, setCurrentLevel] = useState<DifficultyLevel>(DifficultyLevel.A1);
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.HOME);
  const [isAvatarTalking, setIsAvatarTalking] = useState(false);
  const [avatarGender, setAvatarGender] = useState<'female' | 'male'>('female');

  // Simple Level Selector Component
  const LevelSelector = () => (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {Object.values(DifficultyLevel).map((level) => (
        <button
          key={level}
          onClick={() => setCurrentLevel(level)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            currentLevel === level
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 text-gray-900 font-sans pb-10">
      {/* Header */}
      <header className="w-full bg-white shadow-sm p-4 mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentMode(AppMode.HOME)}>
            <div className="bg-blue-600 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Sulingo</span>
          </div>
          {currentMode !== AppMode.HOME && (
             <button onClick={() => setCurrentMode(AppMode.HOME)} className="text-sm font-medium text-gray-500 hover:text-gray-900">
                Exit Mode
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-4xl px-4 flex-1 flex flex-col">
        
        {/* Avatar Section */}
        <div className="mb-6 w-full flex flex-col items-center">
            <Avatar isTalking={isAvatarTalking} gender={avatarGender} />
            
            {/* Gender Toggle */}
            <div className="flex items-center space-x-4 mt-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase">Tutor:</span>
                <button 
                    onClick={() => setAvatarGender('female')}
                    className={`p-2 rounded-full transition-colors ${avatarGender === 'female' ? 'bg-pink-100 text-pink-600' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Female Tutor"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.633 1.585l.5 1.5a1 1 0 01-1.9.632l-.5-1.5a1 1 0 01-.633-1.585A3.989 3.989 0 016.667 13.98 3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="w-px h-4 bg-gray-200"></div>
                <button 
                    onClick={() => setAvatarGender('male')}
                    className={`p-2 rounded-full transition-colors ${avatarGender === 'male' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    title="Male Tutor"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>

        {/* Level Selection */}
        {currentMode !== AppMode.CONVERSATION && <LevelSelector />}

        {currentMode === AppMode.HOME && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <button
              onClick={() => setCurrentMode(AppMode.VOCABULARY)}
              className="group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-left border border-gray-100 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Learn Vocabulary</h3>
              <p className="text-gray-500">Practice pronunciation with AI feedback. Drill words specific to your level.</p>
              <span className="inline-block mt-4 text-blue-600 font-semibold group-hover:underline">Start Practice &rarr;</span>
            </button>

            <button
              onClick={() => setCurrentMode(AppMode.CONVERSATION)}
              className="group relative p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-left border border-gray-100 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Free Conversation</h3>
              <p className="text-gray-500">Chat naturally with your AI tutor. Improve fluency through real-time dialogue.</p>
              <span className="inline-block mt-4 text-green-600 font-semibold group-hover:underline">Start Talking &rarr;</span>
            </button>
          </div>
        )}

        {currentMode === AppMode.VOCABULARY && (
          <VocabularyPractice level={currentLevel} />
        )}

        {currentMode === AppMode.CONVERSATION && (
          <ConversationMode 
            level={currentLevel} 
            avatarSrc={null}
            onAvatarTalkingChange={setIsAvatarTalking}
          />
        )}

      </main>

      <footer className="mt-12 text-center text-gray-400 text-sm">
        <p>Powered by Gemini 2.5 Flash, TTS & Live API</p>
      </footer>
    </div>
  );
};

export default App;
