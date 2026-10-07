import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Activity, Building2, CreditCard, Camera, Watch, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

const RoadmapModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const features = [
    {
      icon: Activity,
      title: 'Diagnostic Reports & Scans',
      color: 'from-rose-500 to-pink-600',
      badge: 'AI OCR & Trends',
      desc: 'Upload blood tests, MRIs, X-rays, and CT scans. AI automatically parses biomarker levels (Hemoglobin, Glucose, Thyroid) and plots historical fluctuation graphs.',
    },
    {
      icon: Building2,
      title: 'Nearby Hospitals & Pharmacies',
      color: 'from-emerald-500 to-teal-600',
      badge: 'Real-Time Stock',
      desc: 'Instant GPS locator for nearby hospitals with ICU bed availability, direct emergency directions, and live medicine stock checkers across local pharmacies.',
    },
    {
      icon: CreditCard,
      title: 'Healthcare Payments & Orders',
      color: 'from-cyan-500 to-blue-600',
      badge: 'Instant Checkout',
      desc: 'One-click payment for prescription doorstep delivery, home sample blood test bookings, and multi-gateway checkout (Stripe, UPI, Card).',
    },
    {
      icon: Camera,
      title: 'AI Pill Scanner & Safety Guard',
      color: 'from-amber-500 to-orange-600',
      badge: 'Computer Vision',
      desc: 'Snap a picture of any pill for instant AI identification, dosage instructions, and automated drug-drug interaction alerts against active prescriptions.',
    },
    {
      icon: Watch,
      title: 'Wearables & Vital Signs Sync',
      color: 'from-indigo-500 to-purple-600',
      badge: 'Live Telemetry',
      desc: 'Seamless integration with Apple HealthKit & Google Health Connect for live pulse, SpO2 blood oxygen, blood pressure, and automated emergency anomaly alerts.',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col text-slate-800 dark:text-slate-100"
        >
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-amber-300 animate-spin-slow" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                Next Major Release
              </span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">
              MediTracker AI v2.0 Roadmap
            </h2>
            <p className="text-emerald-100 text-sm mt-1">
              Explore upcoming diagnostic scans, pharmacy stock locators, healthcare payments, and AI pill scanning.
            </p>
          </div>

          {/* Feature List */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all flex items-start gap-4 group"
                >
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${feat.color} text-white shadow-md group-hover:scale-110 transition-transform shrink-0`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-extrabold text-base text-slate-800 dark:text-white">
                        {feat.title}
                      </h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        {feat.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {feat.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Features currently in active development for v2.0 release</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all shrink-0"
            >
              Got It
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RoadmapModal;
