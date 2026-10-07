import React, { useState } from 'react';
import { HeartPulse, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import RoadmapModal from './RoadmapModal';

const Footer = ({ className = '' }) => {
  const [showRoadmap, setShowRoadmap] = useState(false);
  const version = 'v1.0.0';

  return (
    <>
      <footer className={`py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-3 select-none ${className}`}>
        <div className="flex flex-wrap items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 font-medium cursor-default"
          >
            <HeartPulse className="w-4 h-4 text-rose-500 animate-heartbeat" />
            <span className="font-extrabold text-slate-700 dark:text-slate-300">MediTracker AI</span>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-sm">
              {version}
            </span>
          </motion.div>

          <button
            type="button"
            onClick={() => setShowRoadmap(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold rounded-full border border-emerald-500/20 shadow-sm transition-all cursor-pointer group"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
            <span>What's Coming in v2.0</span>
          </button>
        </div>

        <div className="text-slate-400 text-[11px] font-medium">
          © {new Date().getFullYear()} MediTracker AI Inc. All rights reserved.
        </div>
      </footer>

      <RoadmapModal isOpen={showRoadmap} onClose={() => setShowRoadmap(false)} />
    </>
  );
};

export default Footer;
