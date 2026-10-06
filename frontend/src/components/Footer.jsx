import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, Info, X, ShieldCheck, Stethoscope, Heart, Users, BookOpen, 
  Phone, Mail, Lock, FileText, HelpCircle, Star, MessageSquare, MapPin, Pill 
} from 'lucide-react';

const Footer = ({ variant = 'full', className = '' }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const version = 'v1.0.0';

  const closeModal = () => setActiveModal(null);

  // Simple minimal version footer (For Auth / Opening Pages: Login & Register)
  if (variant === 'simple') {
    return (
      <footer className={`py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2 font-medium">
          <HeartPulse className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="font-extrabold text-slate-700 dark:text-slate-300">MediTracker AI</span>
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
            {version}
          </span>
        </div>
        <div className="text-slate-400 text-[11px] font-medium">
          © {new Date().getFullYear()} MediTracker AI Inc. All rights reserved.
        </div>
      </footer>
    );
  }

  // Full Rich Health Application Footer (For Application Dashboards: Family, Patient, Doctor)
  return (
    <>
      <footer className={`bg-slate-900 text-slate-300 border-t border-slate-800/80 pt-10 pb-8 px-6 sm:px-12 mt-12 w-full select-none ${className}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          
          {/* Left Side: Brand Identity & Mission Tagline */}
          <div className="space-y-2.5 max-w-md">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <span className="font-black text-xl text-white tracking-wide">MediTracker AI</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {version}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              © {new Date().getFullYear()} MediTracker AI Inc. All rights reserved.<br />
              Made with purpose for patient care, elder accessibility, and family peace of mind.
            </p>
          </div>

          {/* Right Side: Structured Link Catalog Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 text-xs sm:text-sm font-medium w-full md:w-auto">
            {/* Column 1 */}
            <div className="space-y-2.5">
              <button 
                onClick={() => setActiveModal('about')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                About Us
              </button>
              <button 
                onClick={() => setActiveModal('disclaimer')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                Disclaimer
              </button>
              <button 
                onClick={() => setActiveModal('refills')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                Subscriptions
              </button>
            </div>

            {/* Column 2 */}
            <div className="space-y-2.5">
              <button 
                onClick={() => setActiveModal('contact')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                Contact
              </button>
              <button 
                onClick={() => setActiveModal('faq')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                FAQ
              </button>
              <button 
                onClick={() => setActiveModal('sitemap')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                Sitemap
              </button>
            </div>

            {/* Column 3 */}
            <div className="space-y-2.5">
              <button 
                onClick={() => setActiveModal('privacy')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setActiveModal('stories')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                Success Stories
              </button>
            </div>

            {/* Column 4 */}
            <div className="space-y-2.5">
              <button 
                onClick={() => setActiveModal('terms')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => setActiveModal('community')} 
                className="hover:text-emerald-400 text-slate-300 transition-colors block text-left font-semibold cursor-pointer"
              >
                Community
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating Support/Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setShowFloatingChat(prev => !prev)}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer border-2 border-white/20"
          title="Health Assistant & Quick Support"
        >
          <MessageSquare className="w-6 h-6 fill-white/20" />
        </button>

        {/* Quick Health Assistant Popup */}
        <AnimatePresence>
          {showFloatingChat && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute bottom-16 right-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-800 dark:text-slate-100"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    <HeartPulse className="w-5 h-5 animate-pulse" />
                  </div>
                  <span className="font-extrabold text-sm">Health Support Assistant</span>
                </div>
                <button 
                  onClick={() => setShowFloatingChat(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Need immediate help or compliance guidance? Query the live AI assistant on your dashboard or contact emergency support.
              </p>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => { setShowFloatingChat(false); setActiveModal('contact'); }}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 hover:text-emerald-500 font-bold rounded-xl text-left transition-colors flex items-center justify-between"
                >
                  <span>📞 Emergency Care Contacts</span>
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setShowFloatingChat(false); setActiveModal('faq'); }}
                  className="w-full py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200 hover:text-emerald-500 font-bold rounded-xl text-left transition-colors flex items-center justify-between"
                >
                  <span>❓ Health Reminders FAQ</span>
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Health Modal System */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[85vh] overflow-y-auto text-slate-800 dark:text-slate-100"
            >
              <button
                onClick={closeModal}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* 1. ABOUT US */}
              {activeModal === 'about' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                      <HeartPulse className="w-8 h-8 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">About MediTracker AI</h2>
                      <p className="text-xs text-slate-500 font-semibold">Version {version} • Next-Gen Remote Healthcare</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    MediTracker AI was founded to solve healthcare compliance gaps for vulnerable patients, elderly individuals, and busy families. We connect patients, caregivers, and doctors into a unified real-time ecosystem.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <Heart className="w-5 h-5 text-rose-500 mb-2" />
                      <h4 className="font-bold text-sm">Patient First</h4>
                      <p className="text-xs text-slate-500 mt-1">Single-tap dose logging & voice speech instructions.</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <Users className="w-5 h-5 text-emerald-500 mb-2" />
                      <h4 className="font-bold text-sm">Family Sync</h4>
                      <p className="text-xs text-slate-500 mt-1">Real-time dosage feeds & emergency audio sirens.</p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <Stethoscope className="w-5 h-5 text-blue-500 mb-2" />
                      <h4 className="font-bold text-sm">Doctor Linked</h4>
                      <p className="text-xs text-slate-500 mt-1">Dual-email routing & clinical visit notes.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CONTACT CARE TEAM */}
              {activeModal === 'contact' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                      <Phone className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Contact & Care Support</h2>
                      <p className="text-xs text-slate-500 font-semibold">24/7 Assistance & Emergency Response</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm pt-2">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-white">Primary Emergency Support Line</span>
                        <span className="text-xs text-slate-500">Instant triage dispatch for SOS alerts</span>
                      </div>
                      <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">+1 (800) 555-MED1</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="font-bold block text-slate-800 dark:text-white">Email Care Desk</span>
                        <span className="text-xs text-slate-500">General queries & account linking</span>
                      </div>
                      <span className="font-bold text-slate-600 dark:text-slate-300">support@meditracker-ai.com</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. PRIVACY POLICY */}
              {activeModal === 'privacy' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Health Data Privacy Policy</h2>
                      <p className="text-xs text-slate-500 font-semibold">HIPAA & GDPR Standards Compliant</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    MediTracker AI strictly enforces end-to-end data encryption for medical records, patient email routing, and emergency contacts. Your clinical data is never sold or shared with unverified third parties.
                  </p>
                  <ul className="text-xs text-slate-500 space-y-1.5 list-disc pl-4">
                    <li>All JWT tokens expire securely every 30 days.</li>
                    <li>Live location tracking is only transmitted during active emergency SOS triggers.</li>
                    <li>Adherence logs are accessible only to linked family monitors and doctors.</li>
                  </ul>
                </div>
              )}

              {/* 4. TERMS OF SERVICE */}
              {activeModal === 'terms' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Terms of Care & Service</h2>
                      <p className="text-xs text-slate-500 font-semibold">Platform Usage Agreement</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    By registering for MediTracker AI, users agree to provide accurate medication schedules, linked emergency contacts, and valid email addresses. Family caregivers accept responsibility for double-checking stock predictions and dosages.
                  </p>
                </div>
              )}

              {/* 5. MEDICAL DISCLAIMER */}
              {activeModal === 'disclaimer' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-2xl">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Medical & Clinical Disclaimer</h2>
                      <p className="text-xs text-slate-500 font-semibold">Important Safety Information</p>
                    </div>
                  </div>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-xs text-yellow-800 dark:text-yellow-200 leading-relaxed font-medium">
                    ⚠️ <strong>Notice:</strong> MediTracker AI is an automated tracking assistant intended to aid medication compliance. It is NOT a substitute for professional medical diagnosis or 911 emergency services. Always follow prescription guidelines provided by your licensed doctor.
                  </div>
                </div>
              )}

              {/* 6. HEALTH FAQ */}
              {activeModal === 'faq' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-500/10 text-teal-500 rounded-2xl">
                      <HelpCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                      <p className="text-xs text-slate-500 font-semibold">Common Queries & Help</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <h4 className="font-bold text-slate-800 dark:text-white">Q: How does Doctor Mode link to Patient Mode?</h4>
                      <p className="text-xs text-slate-500 mt-1">When a doctor prescribes medication, they enter both Family Email and Patient Email. The system automatically syncs schedules across both dashboards.</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <h4 className="font-bold text-slate-800 dark:text-white">Q: What triggers the Family Emergency Siren?</h4>
                      <p className="text-xs text-slate-500 mt-1">When a patient presses "EMERGENCY HELP", Socket.IO broadcasts a high-priority alarm synth sound to all online family dashboards with live GPS coordinates.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. PATIENT SUCCESS STORIES */}
              {activeModal === 'stories' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                      <Star className="w-7 h-7 fill-rose-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Patient Success Stories</h2>
                      <p className="text-xs text-slate-500 font-semibold">Impact on Adherence & Family Peace of Mind</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1 text-yellow-500 mb-1">
                        <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic">"MediTracker AI gave our family complete peace of mind. When dad takes his morning tablet, we get instant confirmation!"</p>
                      <span className="text-[11px] font-bold text-slate-400 block mt-2">— Sarah M., Family Caregiver</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 8. CAREGIVER COMMUNITY */}
              {activeModal === 'community' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Caregiver Community</h2>
                      <p className="text-xs text-slate-500 font-semibold">Peer Support & Elder Care Resources</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    Join thousands of family caregivers sharing routines, accessibility tips, and medicine organization strategies in our monthly support webinars and caregiver forum.
                  </p>
                </div>
              )}

              {/* 9. SUBSCRIPTIONS & REFILLS */}
              {activeModal === 'refills' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                      <Pill className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Refill Subscriptions & Inventory</h2>
                      <p className="text-xs text-slate-500 font-semibold">Automated Depletion Projections</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    MediTracker AI calculates daily dose consumption to predict exact stock runout dates. When stock falls below 7 days, automatic alerts trigger on Family dashboards.
                  </p>
                </div>
              )}

              {/* 10. SITEMAP */}
              {activeModal === 'sitemap' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-500/10 text-slate-500 rounded-2xl">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white">Platform Sitemap</h2>
                      <p className="text-xs text-slate-500 font-semibold">Quick Portal Navigation Map</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-emerald-500 font-bold block mb-1">Public Portals</span>
                      <p>/login — User Authentication</p>
                      <p>/register — Multi-Role Registration</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <span className="text-emerald-500 font-bold block mb-1">Application Dashboards</span>
                      <p>/patient — Patient Accessible UI</p>
                      <p>/family — Caregiver Monitor Feed</p>
                      <p>/doctor — Doctor Clinical Portal</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">MediTracker AI System • {version}</span>
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  Close Window
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Footer;
