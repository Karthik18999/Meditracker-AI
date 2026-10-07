import React, { useState } from 'react';
import Footer from '../../components/Footer';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, HeartPulse, ArrowRight, Sparkles, Activity, Users, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import GoogleAuthButton from '../../components/GoogleAuthButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      if (user.role === 'patient' || user.role === 'grandpa') {
        navigate('/patient');
      } else if (user.role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/family');
      }
    } catch (err) {
      setError(err.message || 'Incorrect credentials. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Animated ECG Pulse Wave Watermark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 dark:opacity-25 flex items-center justify-center">
        <svg className="w-full h-full min-w-[1000px] text-emerald-500 animate-heartbeat" viewBox="0 0 1200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M0 200 H300 L330 150 L360 270 L400 80 L440 310 L470 170 L500 200 H700 L730 140 L760 280 L800 60 L840 330 L870 180 L900 200 H1200" 
            stroke="currentColor" 
            strokeWidth="7" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Glowing Ambient Mesh Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-400/25 dark:bg-emerald-500/15 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-400/25 dark:bg-teal-500/15 rounded-full blur-3xl animate-float-delayed pointer-events-none" />
      <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-rose-400/15 dark:bg-rose-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />

      {/* Main Grid Content */}
      <div className="w-full max-w-6xl mx-auto my-auto py-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Platform Showcase Hero */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            {/* Top Badge */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span>Next-Gen AI Healthcare Platform</span>
              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase">v2.0 Ready</span>
            </motion.div>

            {/* Brand Title */}
            <div className="space-y-3">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
                  <HeartPulse className="w-8 h-8 animate-heartbeat text-rose-200" />
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
                  MediTracker AI
                </h1>
              </div>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
                Smart medicine compliance & remote family care circle.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-emerald-100 dark:border-slate-800 shadow-lg shadow-emerald-500/5 backdrop-blur-xl flex items-start gap-3"
              >
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl flex-shrink-0 mt-0.5">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">Smart AI Pill Vision</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Instant medicine scanning & dosage schedule verification.</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-teal-100 dark:border-slate-800 shadow-lg shadow-teal-500/5 backdrop-blur-xl flex items-start gap-3"
              >
                <div className="p-2.5 bg-teal-500/10 text-teal-500 rounded-xl flex-shrink-0 mt-0.5">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">Family Live Circle</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Real-time alerts for missed doses & emergency notifications.</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-rose-100 dark:border-slate-800 shadow-lg shadow-rose-500/5 backdrop-blur-xl flex items-start gap-3"
              >
                <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl flex-shrink-0 mt-0.5">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">Vital ECG Pulse Stream</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">Live pulse tracking and health report logs for doctors.</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ y: -4, scale: 1.02 }}
                className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-emerald-100 dark:border-slate-800 shadow-lg shadow-emerald-500/5 backdrop-blur-xl flex items-start gap-3"
              >
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-white text-sm">Encrypted & Secure</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">HIPAA compliant health data protection & privacy.</p>
                </div>
              </motion.div>
            </div>

            {/* Quick Stats Banner */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 99.8% On-Time Compliance</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 24/7 Family Sync</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Multi-Role Support</span>
            </div>
          </motion.div>

          {/* Right Column: Glassmorphic Auth Card */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-6 w-full max-w-md mx-auto"
          >
            <div className="relative">
              
              {/* Outer Glow Ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-rose-400 rounded-[2rem] blur-xl opacity-30 group-hover:opacity-100 transition duration-1000 animate-pulse pointer-events-none" />

              <div className="glass-card rounded-[2rem] p-7 sm:p-9 border border-white/40 dark:border-slate-800/80 shadow-2xl backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 relative z-10 overflow-hidden">
                
                {/* Header */}
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    Don't have an account yet?{' '}
                    <Link to="/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition-all">
                      Sign Up
                    </Link>
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl p-3.5 mb-6 shadow-sm flex items-center gap-2"
                  >
                    <span>⚠️</span>
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Google Auth Button */}
                <div className="mb-6">
                  <GoogleAuthButton isRegister={false} />
                </div>

                {/* Divider */}
                <div className="my-6 flex items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-xs font-extrabold uppercase tracking-wider text-slate-400">Or email login</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Mail className="w-5 h-5" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 dark:text-white transition-all font-medium placeholder-slate-400 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Lock className="w-5 h-5" />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-800 dark:text-white transition-all font-medium placeholder-slate-400 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-3 py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 hover:from-emerald-700 hover:to-teal-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group transition-all duration-300 disabled:opacity-50 text-base"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In to Portal</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

              </div>
            </div>
          </motion.div>

        </div>
      </div>

      <Footer variant="simple" className="relative z-10 border-t-0 mt-4" />
    </div>
  );
};

export default Login;
