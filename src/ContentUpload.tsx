import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, FileType, CheckCircle2, Loader2, Sparkles, FileAudio, FileVideo, FileText, Settings2 } from 'lucide-react';

export default function ContentUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'uploaded' | 'generating' | 'done'>('idle');
  
  // States for generation progress
  const [progresses, setProgresses] = useState({
    signLanguage: 0,
    captions: 0,
    voiceNote: 0,
    braille: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      simulateUpload();
    }
  };

  const simulateUpload = () => {
    setUploadState('uploading');
    setTimeout(() => {
      setUploadState('uploaded');
    }, 1500);
  };

  const startGeneration = () => {
    setUploadState('generating');
    
    // Simulate concurrent generation
    const interval = setInterval(() => {
      setProgresses(prev => {
        const next = {
          signLanguage: Math.min(prev.signLanguage + Math.random() * 15, 100),
          captions: Math.min(prev.captions + Math.random() * 20, 100),
          voiceNote: Math.min(prev.voiceNote + Math.random() * 10, 100),
          braille: Math.min(prev.braille + Math.random() * 25, 100),
        };
        
        if (next.signLanguage === 100 && next.captions === 100 && next.voiceNote === 100 && next.braille === 100) {
          clearInterval(interval);
          setTimeout(() => setUploadState('done'), 1000);
        }
        
        return next;
      });
    }, 500);
  };

  const reset = () => {
    setFile(null);
    setUploadState('idle');
    setProgresses({ signLanguage: 0, captions: 0, voiceNote: 0, braille: 0 });
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-4xl mx-auto w-full p-6 pt-12">
      {uploadState === 'idle' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center space-y-6"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">Upload Learning Materials</h2>
            <p className="text-zinc-400">Upload documents, videos, or presentations to automatically generate accessible formats.</p>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-zinc-700 hover:border-indigo-500 bg-zinc-900/50 hover:bg-zinc-800/80 transition-all rounded-3xl p-16 cursor-pointer flex flex-col items-center justify-center shadow-lg shadow-black/20"
          >
            <UploadCloud className="w-16 h-16 text-indigo-400 mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Drag & Drop your file</h3>
            <p className="text-zinc-500 mb-6 text-sm">Supports PDF, MP4, PPTX, DOCX (Max 50MB)</p>
            <button className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl font-medium border border-zinc-700 hover:bg-zinc-700 transition">
              Browse Files
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </div>
        </motion.div>
      )}

      {uploadState === 'uploading' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl"
        >
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-bold text-white mb-2">Uploading file...</h3>
          <p className="text-zinc-400 truncate">{file?.name}</p>
        </motion.div>
      )}

      {uploadState === 'uploaded' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-8"
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-8 flex items-center justify-between shadow-xl">
             <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                 <FileType className="w-7 h-7 text-indigo-400" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white truncate max-w-sm">{file?.name}</h3>
                  <p className="text-zinc-400 text-sm mt-1">{(file?.size ? (file.size / 1024 / 1024).toFixed(2) : 0)} MB • Ready for optimization</p>
               </div>
             </div>
             <button 
               onClick={reset}
               className="text-zinc-500 hover:text-rose-400 transition-colors text-sm font-medium"
             >
               Remove
             </button>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <Settings2 className="w-6 h-6 text-indigo-400" /> Convert to Accessible Formats
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl flex items-start gap-4">
                 <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-600 bg-zinc-900" />
                 <div>
                   <p className="font-semibold text-white">Sign Language & Captions</p>
                   <p className="text-xs text-zinc-400 mt-1">Generate AI avatar overlays and deep-synced CC for Hearing-Impaired students.</p>
                 </div>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl flex items-start gap-4">
                 <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-600 bg-zinc-900" />
                 <div>
                   <p className="font-semibold text-white">Voice Notations / Explanation</p>
                   <p className="text-xs text-zinc-400 mt-1">Text-to-speech audio insights to aid specific needs.</p>
                 </div>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl flex items-start gap-4">
                 <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-600 bg-zinc-900" />
                 <div>
                   <p className="font-semibold text-white">Interactive Text Features</p>
                   <p className="text-xs text-zinc-400 mt-1">Interactive prompts and screen reader descriptions for Visually-Impaired students.</p>
                 </div>
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-2xl flex items-start gap-4">
                 <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-600 bg-zinc-900" />
                 <div>
                   <p className="font-semibold text-white">Braille Structured Output</p>
                   <p className="text-xs text-zinc-400 mt-1">Format syntax perfectly for electronic Braille displays.</p>
                 </div>
              </div>
            </div>

            <button 
              onClick={startGeneration}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-3"
            >
              <Sparkles className="w-5 h-5" /> Generate Optimizations
            </button>
          </div>
        </motion.div>
      )}

      {uploadState === 'generating' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-8"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Processing Optimizations</h2>
            <p className="text-sm text-zinc-400">Our AI is generating accessible sub-formats...</p>
          </div>

          <div className="space-y-6">
            <ProgressRow icon={<FileVideo />} label="Sign Language Video / Captions (Hearing-Impaired)" color="bg-indigo-500" value={progresses.signLanguage} />
            <ProgressRow icon={<FileAudio />} label="Voice Explanations (Visually-Impaired)" color="bg-emerald-500" value={progresses.voiceNote} />
            <ProgressRow icon={<FileType />} label="Interactive Text & Screen Reader (Visually-Impaired)" color="bg-orange-500" value={progresses.captions} />
            <ProgressRow icon={<FileText />} label="Braille Display Formatting (Visually-Impaired)" color="bg-cyan-500" value={progresses.braille} />
          </div>
        </motion.div>
      )}

      {uploadState === 'done' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-12 text-center max-w-lg w-full shadow-2xl"
        >
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20 text-indigo-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Complete!</h2>
          <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
            All accessible formats have been generated and appended to the material.
          </p>
          <button 
            onClick={reset}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors w-full"
          >
            Upload Another File
          </button>
        </motion.div>
      )}
    </div>
  );
}

function ProgressRow({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) {
  const isDone = value >= 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className={`flex items-center gap-2 ${isDone ? 'text-zinc-300' : 'text-zinc-400'}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
          <span className="font-medium text-sm">{label}</span>
        </div>
        <span className="text-xs font-mono font-bold text-zinc-500">{Math.floor(value)}%</span>
      </div>
      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-700/50">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ease-out ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
