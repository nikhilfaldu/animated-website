'use client';

import React, { useEffect, useRef } from 'react';
import { useChat } from 'ai/react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorldStore } from '@/stores/useWorldStore';
import universeData from '@/data/universe.json';
import { Sparkles, Bot, X } from 'lucide-react';

const NovaChat: React.FC = () => {
  const { activeObject, activeWorld, isNovaOpen, setNovaOpen } = useWorldStore();
  
  const currentId = activeObject?.id || activeWorld;
  const objectData = currentId ? universeData.objects.find(o => o.id === currentId) || activeObject : null;
  const extData = objectData as { description?: string, suggestedQuestions?: string[] } | null;
  const bottomRef = useRef<HTMLDivElement>(null);

  const defaultWelcomeMessage = objectData
    ? `Greetings, traveler.\n\nYou are inspecting **${objectData.name}**.\n\nHow may I assist your exploration?`
    : `Greetings, traveler.\n\nI am **Nova**, your cosmic oracle and guide to **The Architect of Worlds**.\n\nYou can click any planet in the cosmos to explore its NASA physical specs, lore, and anomalies. What would you like to know?`;

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    body: {
      objectId: currentId || 'universe-overview',
      proceduralData: objectData || { name: 'Deep Space Cosmos', type: 'Universe' }
    },
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: defaultWelcomeMessage
      }
    ]
  });

  // Reset chat when switching objects
  useEffect(() => {
    setMessages([
      {
        id: `welcome-${currentId || 'universe'}`,
        role: 'assistant',
        content: defaultWelcomeMessage
      }
    ]);
  }, [currentId, objectData, setMessages, defaultWelcomeMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isNovaOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-950/95 border-l border-cyan-500/30 backdrop-blur-2xl z-50 flex flex-col pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.9)]"
    >
      {/* Header */}
      <div className="p-6 border-b border-cyan-500/20 flex justify-between items-start bg-black/50">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest">
            <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>NOVA COSMIC ORACLE</span>
          </div>
          <h2 className="font-heading text-xl text-white tracking-wider mt-0.5">
            {objectData ? objectData.name : 'Universal Guide'}
          </h2>
        </div>
        <button 
          onClick={() => setNovaOpen(false)} 
          className="text-slate-400 hover:text-white transition-colors p-2 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Info Panel Preview */}
      <div className="px-6 py-3 border-b border-cyan-500/10 bg-slate-900/40 shrink-0">
        <h3 className="text-[10px] font-bold font-mono text-cyan-300 mb-0.5">
          {objectData ? (objectData.type?.toUpperCase() || 'CELESTIAL OBJECT') : 'DEEP SPACE COMPASS'}
        </h3>
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
          {extData?.description || 'Select any planet to inspect physical specs, or ask Nova about universe lore.'}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
        <AnimatePresence>
          {messages.map(m => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`text-[10px] text-slate-400 mb-1 font-mono uppercase`}>
                {m.role === 'user' ? 'Traveler' : 'Nova AI'}
              </div>
              <div className={`
                max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed
                ${m.role === 'user' 
                  ? 'bg-cyan-600/30 border border-cyan-500/40 text-white rounded-tr-sm' 
                  : 'bg-slate-900/90 border border-purple-500/30 text-slate-200 rounded-tl-sm'}
              `}>
                {m.role === 'assistant' ? (
                  <div className="prose prose-invert prose-xs max-w-none prose-p:leading-relaxed">
                    <ReactMarkdown>
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex items-center gap-2 text-cyan-400/50 p-2">
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 1 && (
        <div className="px-6 pb-3 flex flex-wrap gap-2 shrink-0">
          {(extData?.suggestedQuestions || [
            "How do I explore planets?",
            "Who is the Architect of Worlds?",
            "What is the Celestial Forge?"
          ]).map((q: string, i: number) => (
            <button
              key={i}
              onClick={() => handleInputChange({ target: { value: q } } as React.ChangeEvent<HTMLInputElement>)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-6 border-t border-cyan-500/20 bg-slate-950 shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Nova about planets, lore, or science..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-4 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square rounded-lg bg-cyan-600/40 hover:bg-cyan-500/60 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default React.memo(NovaChat);
