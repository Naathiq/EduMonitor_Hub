import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle2, Loader2, Play, Square, Video } from 'lucide-react';
import { motion } from 'motion/react';

export default function LiveRecording({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const [recordingState, setRecordingState] = useState<'setup' | 'recording' | 'processing' | 'completed'>('setup');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hearingProgress, setHearingProgress] = useState(0);
  const [visualProgress, setVisualProgress] = useState(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setRecordingState('recording');
    } catch (err) {
      console.warn('Error accessing media devices:', err);
      // Fallback for preview environments without permissions
      setRecordingState('recording');
    }
  };

  useEffect(() => {
    if (recordingState === 'recording' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [recordingState]);

  const stopRecording = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setRecordingState('processing');
  };

  useEffect(() => {
    if (recordingState === 'processing') {
      const hearingInterval = setInterval(() => {
        setHearingProgress(p => {
          if (p >= 100) return 100;
          return p + Math.random() * 8 + 2;
        });
      }, 500);

      const visualInterval = setInterval(() => {
        setVisualProgress(p => {
          if (p >= 100) return 100;
          return p + Math.random() * 5 + 1;
        });
      }, 500);

      return () => {
        clearInterval(hearingInterval);
        clearInterval(visualInterval);
      };
    }
  }, [recordingState]);

  useEffect(() => {
    if (recordingState === 'processing' && hearingProgress >= 100 && visualProgress >= 100) {
       setTimeout(() => setRecordingState('completed'), 1000);
    }
  }, [recordingState, hearingProgress, visualProgress]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full max-w-5xl mx-auto w-full p-4">
      {recordingState === 'setup' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'} border rounded-3xl p-12 text-center max-w-lg w-full`}
        >
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
            <Camera className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} mb-4`}>Live Class Recording</h2>
          <p className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} mb-8 max-w-sm mx-auto`}>
            Start a new live session. The recording will be automatically processed and optimized for all students.
          </p>
          <button 
            onClick={startRecording}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/40 flex items-center gap-3 mx-auto"
          >
            <Play className="w-6 h-6 fill-current" /> Initialize Camera
          </button>
        </motion.div>
      )}

      {recordingState === 'recording' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full h-full flex flex-col p-2"
        >
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-3">
               <span className="relative flex h-4 w-4">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500"></span>
               </span>
               <span className="text-rose-400 font-mono font-bold tracking-widest uppercase">Live Demo Recording</span>
             </div>
             <button 
               onClick={stopRecording}
               className="px-6 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-900/40 flex items-center gap-2"
             >
               <Square className="w-4 h-4 fill-current" /> Complete Recording
             </button>
          </div>
          <div className="flex-1 bg-black rounded-3xl border border-zinc-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
            {streamRef.current ? (
               <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="absolute inset-0 w-full h-full object-cover"
                />
            ) : (
                <div className="text-zinc-500 flex flex-col items-center gap-4">
                  <Video className="w-16 h-16 opacity-50" />
                  <p>Camera permission denied or unavailable in preview.</p>
                  <p className="text-sm">Pretending to record anyway for demo purposes...</p>
                </div>
            )}
            
            {/* Viewfinder UI Details */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-white/20"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-white/20"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-white/20"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-white/20"></div>
          </div>
        </motion.div>
      )}

      {recordingState === 'processing' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 w-full max-w-2xl shadow-2xl relative overflow-hidden"
        >
          {/* Subtle animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 animate-pulse"></div>

          <div className="relative z-10 flex flex-col items-center mb-10">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-6" />
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Processing Class Media</h2>
            <p className="text-zinc-400">Applying AI models to transcribe and optimize the lesson.</p>
          </div>

          <div className="relative z-10 space-y-8">
            {/* Hearing-Impaired Optimization Bar */}
            <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50">
              <div className="flex justify-between items-center mb-4">
                <div>
                   <h4 className="text-lg font-semibold text-purple-400">Sign-Language & Captions Sync</h4>
                   <p className="text-sm text-zinc-500 mt-1">Extracting gestures, improving visibility, and syncing high-contrast captions for hearing-impaired students.</p>
                </div>
                <span className="text-purple-300 font-mono text-xl font-bold">{Math.floor(hearingProgress)}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-zinc-800">
                <motion.div 
                  className="bg-gradient-to-r from-purple-600 to-indigo-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${hearingProgress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
            </div>

            {/* Visually-Impaired Optimization Bar */}
            <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50">
              <div className="flex justify-between items-center mb-4">
                <div>
                   <h4 className="text-lg font-semibold text-orange-400">Audio Descriptions & Screen Reader</h4>
                   <p className="text-sm text-zinc-500 mt-1">Generating timestamped audio descriptions and accessible UI elements for visually-impaired students.</p>
                </div>
                <span className="text-orange-300 font-mono text-xl font-bold">{Math.floor(visualProgress)}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden border border-zinc-800">
                <motion.div 
                  className="bg-gradient-to-r from-orange-600 to-amber-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${visualProgress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {recordingState === 'completed' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-900/20 border border-emerald-800/50 rounded-3xl p-12 text-center max-w-lg w-full shadow-2xl"
        >
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Optimizations Complete</h2>
          <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
            The recording has been successfully processed and added to today's schedule materials.
          </p>
          <button 
            onClick={() => setRecordingState('setup')}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/40 w-full"
          >
            Start New Recording
          </button>
        </motion.div>
      )}
    </div>
  );
}
