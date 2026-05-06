import React, { useState, useEffect } from 'react';
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
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleFirestoreError, OperationType } from './firestore-error';

type ToolType = 'visually-impaired' | 'ai-sign-to-voice' | 'ml-sign-to-voice' | 'voice-to-sign' | null;

export default function ToolsDirectory({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [customLink, setCustomLink] = useState('');
  const [savedLinks, setSavedLinks] = useState<Record<string, string>>({});

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

  useEffect(() => {
    let unsubData: (() => void) | undefined;
    
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const docRef = doc(db, 'toolLinks', user.uid);
        unsubData = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setSavedLinks(docSnap.data().links || {});
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, 'toolLinks'));
      } else {
        if (unsubData) {
          unsubData();
          unsubData = undefined;
        }
        setSavedLinks({});
      }
    });

    return () => {
      unsubAuth();
      if (unsubData) unsubData();
    };
  }, []);

  const handleSaveAndOpen = async (toolId: string) => {
    const linkToOpen = customLink || savedLinks[toolId];
    
    if (customLink && customLink !== savedLinks[toolId] && auth.currentUser) {
      const updatedLinks = { ...savedLinks, [toolId]: customLink };
      setSavedLinks(updatedLinks);
      try {
        await setDoc(doc(db, 'toolLinks', auth.currentUser.uid), {
          teacherId: auth.currentUser.uid,
          links: updatedLinks,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'toolLinks');
      }
    }
    
    if (linkToOpen) {
      window.open(linkToOpen, '_blank');
    }
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full p-6 pb-20">
      <div className="mb-10">
        <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} mb-2`}>Accessibility Tools</h2>
        <p className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} text-lg`}>Integrated AI and ML models tailored for specialized classroom needs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <motion.div
            key={tool.id}
            whileHover={{ y: -4 }}
            className={`${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 shadow-xl shadow-black/20' : 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50'} border rounded-3xl overflow-hidden`}
          >
            <div className="p-8">
              <div className={`w-16 h-16 bg-gradient-to-br ${tool.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg ${tool.shadow}`}>
                {tool.icon}
              </div>
              <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} mb-3`}>{tool.title}</h3>
              <p className={`${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} mb-8 max-w-sm`}>
                {tool.description}
              </p>
              
              {activeTool === tool.id ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`space-y-4 pt-4 border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}
                >
                  <label className={`text-sm font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'} block`}>Custom Tool Link URL</label>
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
                        className={`w-full ${theme === 'dark' ? 'bg-zinc-950 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'} border pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setActiveTool(null)}
                      className={`px-6 py-3 rounded-xl font-medium ${theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'} transition`}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleSaveAndOpen(tool.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 bg-gradient-to-r ${tool.color} ${tool.shadow}`}
                    >
                      {savedLinks[tool.id] && customLink === savedLinks[tool.id] ? 'Open Tool' : 'Save & Open'} <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button 
                  onClick={() => {
                    setActiveTool(tool.id as ToolType);
                    setCustomLink(savedLinks[tool.id] || '');
                  }}
                  className={`flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'} font-medium hover:gap-3 transition-all`}
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
