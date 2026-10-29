'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStore } from '@/stores/useWorldStore';
import universeData from '@/data/universe.json';

const DiscoveryLog: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { visitedObjects, isIntroComplete } = useWorldStore();

  if (!isIntroComplete) return null;

  const totalObjects = universeData.objects.length;
  const visitedCount = visitedObjects.length;
  const explorationPercentage = Math.round((visitedCount / totalObjects) * 100) || 0;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-6 left-6 z-40 px-4 py-2 glass-strong rounded-full text-xs font-heading tracking-widest text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors shadow-[0_0_15px_rgba(0,255,157,0.2)]"
      >
        DISCOVERY: {explorationPercentage}%
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-6 z-50 w-80 glass-strong border border-cyan-500/30 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pointer-events-auto"
          >
            <div className="p-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
              <h3 className="font-heading text-lg text-cyan-400">Discovery Log</h3>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">✕</button>
            </div>
            
            <div className="p-4 bg-black/20 flex flex-col gap-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
              <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${explorationPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-cyan-500 shadow-[0_0_10px_#00F5D4]"
                />
              </div>

              <div>
                <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Discovered Objects</h4>
                <div className="space-y-2">
                  {universeData.objects.map(obj => {
                    const isVisited = visitedObjects.includes(obj.id);
                    return (
                      <div key={obj.id} className={`p-2 rounded border ${isVisited ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-100' : 'bg-black/20 border-white/5 text-white/30'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-heading text-sm">{isVisited ? obj.name : 'Unknown Object'}</span>
                          <span className="text-[10px] uppercase font-mono">{obj.type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(DiscoveryLog);
