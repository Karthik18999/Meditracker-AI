import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Info, X, ShieldCheck, Stethoscope, Heart, Users, BookOpen, ExternalLink } from 'lucide-react';

const Footer = ({ className = '' }) => {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const version = 'v1.0.0';

  return (
    <>
      <footer className={`py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2 font-medium">
          <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="font-extrabold text-slate-700 dark:text-slate-300">MediTracker AI</span>
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
            {version}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAboutModal(true)}
            className="flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Us & Feature Catalog</span>
          </button>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span>© {new Date().getFullYear()} MediTracker AI Inc.</span>
        </div>
      </footer>

      {/* About Us & Feature Catalog Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto text-slate-800 dark:text-slate-100"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAboutModal(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                  <HeartPulse className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                    About MediTracker AI
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    Version {version} • Intelligent Healthcare & Adherence Platform
                  </p>
                </div>
              </div>

              {/* Mission Statement */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 mb-6">
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Our Mission
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  MediTracker AI bridges patients, family caregivers, and doctors in real time. Designed for supreme accessibility, remote medication monitoring, emergency response, and AI-powered health analytics.
                </p>
              </div>

              {/* Feature Catalog */}
              <div className="space-y-4 mb-6">
                <h3 className="text-base font-extrabold flex items-center gap-2 text-slate-800 dark:text-white">
                  <BookOpen className="w-5 h-5 text-teal-500" /> Application Role Catalogs
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      <Heart className="w-4 h-4" /> Patient Mode
                    </div>
                    <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                      <li>• Single-tap dose completion</li>
                      <li>• Native Web Speech assistant</li>
                      <li>• SOS Emergency with live GPS</li>
                      <li>• Accessible touch design</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 font-bold text-teal-600 dark:text-teal-400 text-sm">
                      <Users className="w-4 h-4" /> Family Monitor
                    </div>
                    <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                      <li>• Real-time Socket.IO feed</li>
                      <li>• Audio emergency siren synth</li>
                      <li>• Inventory & stock prediction</li>
                      <li>• PDF & Excel report export</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2 font-bold text-blue-600 dark:text-blue-400 text-sm">
                      <Stethoscope className="w-4 h-4" /> Doctor Portal
                    </div>
                    <ul className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                      <li>• Dual-email prescription link</li>
                      <li>• Patient compliance tracking</li>
                      <li>• Clinical visit logs & notes</li>
                      <li>• AI Clinical Assistant</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Disclaimer & Contact */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                <p className="italic">
                  ⚠️ <strong>Notice:</strong> MediTracker AI is designed to support daily adherence routines and emergency communication. Always consult licensed medical professionals for diagnosis and clinical prescriptions.
                </p>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">System Build: {version}-production</span>
                  <button
                    onClick={() => setShowAboutModal(false)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all"
                  >
                    Got It
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Footer;
