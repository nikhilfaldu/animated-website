'use client';

import React from 'react';
import { useWorldStore } from '@/stores/useWorldStore';
import { WORLD_ORDER, WORLDS } from '@/config/worlds';

const NavigationDots: React.FC = () => {
  const { isIntroComplete, activeWorld, navigateToWorld } = useWorldStore();

  if (!isIntroComplete) return null;

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4">
      {/* Overview Dot */}
      <div className="relative group flex items-center justify-center w-6 h-6">
        <button
          onClick={() => navigateToWorld(null)}
          className={`w-[10px] h-[10px] rounded-full transition-all duration-300 ${
            activeWorld === null ? 'bg-white scale-[1.4]' : 'glass hover:bg-white/50'
          }`}
          aria-label="Overview"
        />
        <div className="absolute right-8 px-2 py-1 glass rounded text-xs font-sans text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          Overview
        </div>
      </div>

      <div className="w-[1px] h-4 bg-white/20" />

      {/* World Dots */}
      {WORLD_ORDER.map((worldId) => {
        const config = WORLDS[worldId];
        const isActive = activeWorld === worldId;

        return (
          <div key={worldId} className="relative group flex items-center justify-center w-6 h-6">
            <button
              onClick={() => navigateToWorld(worldId)}
              className={`w-[10px] h-[10px] rounded-full transition-all duration-300 ${
                isActive ? 'scale-[1.4]' : 'glass'
              }`}
              style={{
                backgroundColor: isActive ? config.colors.primary : undefined,
                boxShadow: isActive ? `0 0 10px ${config.colors.primary}` : undefined,
                borderColor: config.colors.primary,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderWidth = '1px';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderWidth = '0px';
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                }
              }}
              aria-label={`Navigate to ${config.name}`}
            />
            <div className="absolute right-8 px-2 py-1 glass rounded text-xs font-sans text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.colors.primary }} />
              {config.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(NavigationDots);
