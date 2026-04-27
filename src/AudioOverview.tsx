import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Youtube, UploadCloud, Play, Pause, FastForward, Rewind, Headphones, Loader2, Sparkles, Volume2, CheckCircle2 } from 'lucide-react';

export default function AudioOverview() {
  const [sourceType, setSourceType] = useState<'upload' | 'youtube'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  const [stage, setStage] = useState<'input' | 'analyzing' | 'generating' | 'ready'>('input');
  
  // Fake player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setYoutubeUrl('');
    }
  };

  const handleStartAnalysis = () => {
    if (sourceType === 'upload' && !file) return;
    if (sourceType === 'youtube' && !youtubeUrl) return;

    setStage('analyzing');
    
    setTimeout(() => {
      setStage('generating');
      setTimeout(() => {
        setStage('ready');
      }, 3000);
    }, 2500);
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  // Simple waveform generation
  const waveform = Array.from({ length: 40 }, () => Math.random() * 100);

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl mx-auto w-full p-6 pt-12">
      
      {stage === 'input' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-6"
        >
          <div className="mb-8 text-center bg-indigo-500/10 border border-indigo-500/20 p-8 rounded-3xl">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">AI Audio Overview</h2>
            <p className="text-indigo-200">Transform documents and lecture videos into an engaging podcast-style audio summary.</p>
          </div>

          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setSourceType('upload')}
              className={`flex-1 py-4 flex flex-col items-center gap-2 rounded-2xl border-2 transition-all ${sourceType === 'upload' ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}
            >
              <UploadCloud className={`w-6 h-6 ${sourceType === 'upload' ? 'text-indigo-400' : 'text-zinc-400'}`} />
              <span className={`font-semibold ${sourceType === 'upload' ? 'text-indigo-300' : 'text-zinc-400'}`}>Upload PDF/Doc</span>
            </button>
            <button 
              onClick={() => setSourceType('youtube')}
              className={`flex-1 py-4 flex flex-col items-center gap-2 rounded-2xl border-2 transition-all ${sourceType === 'youtube' ? 'border-rose-500 bg-rose-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}
            >
              <Youtube className={`w-6 h-6 ${sourceType === 'youtube' ? 'text-rose-400' : 'text-zinc-400'}`} />
              <span className={`font-semibold ${sourceType === 'youtube' ? 'text-rose-300' : 'text-zinc-400'}`}>YouTube Video</span>
            </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
            {sourceType === 'upload' ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-700 hover:border-indigo-500 bg-zinc-900/50 hover:bg-zinc-800/80 transition-all rounded-2xl p-12 cursor-pointer flex flex-col items-center justify-center"
              >
                <UploadCloud className="w-12 h-12 text-indigo-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">{file ? file.name : "Drag & Drop your document here"}</h3>
                <p className="text-zinc-500 text-sm">{file ? `${(file.size/1024/1024).toFixed(2)} MB` : "Supports PDF, DOCX, TXT"}</p>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.docx,.txt" />
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-zinc-400">Paste YouTube URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                     <Youtube className="w-5 h-5 text-zinc-500" />
                  </div>
                  <input 
                    type="url" 
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-zinc-950 border border-zinc-800 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button 
              onClick={handleStartAnalysis}
              disabled={sourceType === 'upload' ? !file : !youtubeUrl}
              className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/40 disabled:opacity-50 flex items-center justify-center gap-3 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-5 h-5" /> Analyze & Generate Audio
            </button>
          </div>
        </motion.div>
      )}

      {(stage === 'analyzing' || stage === 'generating') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center shadow-2xl"
        >
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
               {stage === 'analyzing' ? <Sparkles className="w-8 h-8" /> : <Volume2 className="w-8 h-8 animate-pulse" />}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">
             {stage === 'analyzing' ? "Analyzing Content..." : "Synthesizing Audio..."}
          </h2>
          <p className="text-zinc-400">
             {stage === 'analyzing' 
               ? "Extracting key concepts, extracting semantic meaning, and plotting conversation structure."
               : "Dual voices are being synthesized for realistic podcast delivery."
             }
          </p>
        </motion.div>
      )}

      {stage === 'ready' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
        >
           <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                   <Headphones className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg mb-1">
                    <CheckCircle2 className="w-3 h-3" /> AUDIO READY
                  </div>
                  <h3 className="text-2xl font-bold text-white leading-tight">
                    {sourceType === 'upload' && file ? file.name.replace(/\.[^/.]+$/, "") : "Youtube Video Analysis"} Overview
                  </h3>
                  <p className="text-zinc-500 text-sm mt-1">AI Podcast • 2 Hosts • 10 mins</p>
                </div>
              </div>
           </div>

           {/* Audio Player UI */}
           <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
             
             {/* Waveform visual */}
             <div className="flex items-end justify-between h-20 gap-1 mb-6 opacity-80">
               {waveform.map((h, i) => (
                 <div key={i} className="flex-1 bg-zinc-800 rounded-t-sm" style={{ height: `${h}%` }}>
                    <div className={`w-full bg-indigo-500 transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: isPlaying && i % 3 === 0 ? '100%' : '50%' }}></div>
                 </div>
               ))}
             </div>

             <div className="flex items-center justify-between gap-6 mb-6">
                <span className="text-xs font-mono text-zinc-500">01:23</span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full relative cursor-pointer">
                   <div className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full w-[15%]"></div>
                   <div className="absolute top-1/2 -translate-y-1/2 left-[15%] w-4 h-4 bg-white rounded-full shadow cursor-pointer"></div>
                </div>
                <span className="text-xs font-mono text-zinc-500">-08:37</span>
             </div>

             <div className="flex items-center justify-center gap-6">
                <button className="text-zinc-400 hover:text-white transition-colors">
                  <Rewind className="w-6 h-6" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 translate-x-0.5" />}
                </button>
                <button className="text-zinc-400 hover:text-white transition-colors">
                  <FastForward className="w-6 h-6" />
                </button>
             </div>
           </div>

           <div className="mt-8 flex gap-4">
             <button 
               onClick={() => setStage('input')}
               className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition"
             >
               Generate Another
             </button>
             <button className="flex-1 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-zinc-200 transition">
               Download MP3
             </button>
           </div>
        </motion.div>
      )}

    </div>
  );
}
