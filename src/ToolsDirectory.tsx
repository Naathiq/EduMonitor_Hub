import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Eye, 
  Ear, 
  Mic, 
  MessageSquare, 
  ExternalLink,
  ChevronRight,
  Link as LinkIcon
} from 'lucide-react';

type ToolType = 'visually-impaired' | 'ai-sign-to-voice' | 'ml-sign-to-voice' | 'voice-to-sign' | null;

export default function ToolsDirectory() {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [customLink, setCustomLink] = useState('');

  const tools = [
    {
      id: 'visually-impaired',
      title: 'Visually-Impaired Students Dashboard',
      description: 'Central hub optimized with high contrast, screen reader support, and audio cues.',
      icon: <Eye className="w-8 h-8" />,
      color: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-cyan-500/20'
    },
    {
      id: 'ai-sign-to-voice',
      title: 'AI Based Sign to Voice',
      description: 'Real-time gesture recognition using generative AI models for natural translation.',
      icon: <Ear className="w-8 h-8" />,
      color: 'from-indigo-500 to-purple-600',
      shadow: 'shadow-purple-500/20'
    },
    {
      id: 'ml-sign-to-voice',
      title: 'ML Based Sign to Voice',
      description: 'Edge-computed ML models for low-latency, offline-capable sign language translation.',
      icon: <MessageSquare className="w-8 h-8" />,
      color: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/20'
    },
    {
      id: 'voice-to-sign',
      title: 'Voice to Sign',
      description: 'Convert spoken language into 3D avatar sign language animations.',
      icon: <Mic className="w-8 h-8" />,
      color: 'from-rose-500 to-orange-500',
      shadow: 'shadow-rose-500/20'
    }
  ];

  const handleOpenLink = () => {
    if (customLink) {
      window.open(customLink, '_blank');
    }
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full p-6 pb-20">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">Accessibility Tools</h2>
        <p className="text-zinc-400 text-lg">Integrated AI and ML models tailored for specialized classroom needs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <motion.div
            key={tool.id}
            whileHover={{ y: -4 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl"
          >
            <div className="p-8">
              <div className={`w-16 h-16 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg ${tool.shadow}`}>
                {tool.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">{tool.title}</h3>
              <p className="text-zinc-400 mb-8 max-w-sm">
                {tool.description}
              </p>
              
              {activeTool === tool.id ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-4 border-t border-zinc-800"
                >
                  <label className="text-sm font-medium text-zinc-400 block">Custom Tool Link URL</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LinkIcon className="w-4 h-4 text-zinc-500" />
                      </div>
                      <input 
                        type="url"
                        value={customLink}
                        onChange={(e) => setCustomLink(e.target.value)}
                        placeholder="https://your-tool-url.com"
                        className="w-full bg-zinc-950 border border-zinc-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setActiveTool(null)}
                      className="px-6 py-3 rounded-xl font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleOpenLink}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 bg-gradient-to-r ${tool.color} ${tool.shadow}`}
                    >
                      Open Tool <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button 
                  onClick={() => {
                    setActiveTool(tool.id as ToolType);
                    setCustomLink('');
                  }}
                  className="flex items-center gap-2 text-white font-medium hover:gap-3 transition-all"
                >
                  Configure & Open <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
