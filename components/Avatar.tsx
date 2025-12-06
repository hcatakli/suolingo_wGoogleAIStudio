
import React, { useRef, useEffect, useState } from 'react';

interface AvatarProps {
  isTalking: boolean;
  gender: 'female' | 'male';
}

const Avatar: React.FC<AvatarProps> = ({ isTalking, gender }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Use reliable static images and videos
  // We prefer the video element to remain visible even when paused to prevent "shapeshifting" (changing faces).
  const assets = {
    female: {
      video: "https://cdn.pixabay.com/video/2024/02/12/200238-912555673_tiny.mp4", // Woman talking
      poster: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop" // Fallback only
    },
    male: {
      video: "https://cdn.pixabay.com/video/2023/10/19/185732-876008639_tiny.mp4", // Man talking
      poster: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600&auto=format&fit=crop" // Fallback only
    }
  };

  const currentAsset = assets[gender];

  // Reset state when gender changes
  useEffect(() => {
    setVideoError(false);
    setVideoLoaded(false);
  }, [gender]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && !videoError && videoLoaded) {
      if (isTalking) {
        video.play().catch(err => {
          // Auto-play policies might block unmuted playback, but we mute it.
          // If it fails, we just ignore it, the user sees the idle state.
          console.warn("Avatar video play interrupted:", err.message);
        });
      } else {
        // Pause quickly but gracefully
        video.pause();
      }
    }
  }, [isTalking, videoError, videoLoaded, gender]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Avatar Container */}
      <div 
        className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 transition-all duration-300 bg-gray-200 ${
          isTalking 
            ? 'border-green-400 scale-105 shadow-[0_0_20px_rgba(74,222,128,0.5)]' 
            : 'border-gray-200 shadow-lg'
        }`}
      >
        {/* 1. Video Layer (Primary for both Talk and Idle) */}
        {!videoError && (
            <video 
                key={gender + "-video"}
                ref={videoRef}
                src={currentAsset.video}
                poster={currentAsset.poster} // Shown while loading
                muted 
                loop 
                playsInline
                preload="auto"
                onLoadedData={() => setVideoLoaded(true)}
                onError={() => {
                    console.warn("Avatar video failed to load, switching to fallback image.");
                    setVideoError(true);
                    setVideoLoaded(false);
                }}
                className={`absolute inset-0 w-full h-full object-cover object-center 
                ${isTalking ? '' : 'animate-alive'} 
                transition-transform duration-700`}
            />
        )}

        {/* 2. Loading / Fallback Layer */}
        {/* Only visible if video hasn't loaded yet OR if video failed */}
        <div 
            className={`absolute inset-0 w-full h-full bg-gray-300 pointer-events-none transition-opacity duration-500
            ${videoLoaded && !videoError ? 'opacity-0' : 'opacity-100'}`}
        >
             <img 
                src={currentAsset.poster} 
                alt={`${gender} AI Tutor`} 
                className={`w-full h-full object-cover object-center ${
                    // If we are falling back to image, animate it too
                    !isTalking ? 'animate-alive' : 'animate-[pulse_0.5s_ease-in-out_infinite] scale-105'
                }`}
             />
             
             {/* Spinner if not loaded and not error */}
             {!videoLoaded && !videoError && (
                 <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                     <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 </div>
             )}
        </div>
        
        {/* Inner Shadow Ring for depth */}
        <div className="absolute inset-0 ring-1 ring-black/10 rounded-full pointer-events-none z-10" />
      </div>
      
      <div className="mt-4 text-center">
        <h3 className="text-lg font-semibold text-gray-800">Sulingo AI Tutor</h3>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{gender} Teacher</p>
      </div>
    </div>
  );
};

export default Avatar;
