import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, User, Mail, Lock, Link as LinkIcon, ArrowRight, KeyRound, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';

const Register = () => {
  const [step, setStep] = useState(1); // Step 1: Account Info, Step 2: OTP Verification
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('family');
  const [familyEmail, setFamilyEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, sendOTP } = useAuth();
  const navigate = useNavigate();

  // Step 1: Submit Account Info & Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (role === 'grandpa' && !familyEmail) {
      setError("Please link Grandpa to a Family Monitor's email address.");
      return;
    }

    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await sendOTP(email);
      setSuccessMsg(res.message || `Verification code sent to ${email}`);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Submit Verification Code & Complete Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await register(name, email, password, role, familyEmail, verificationCode.trim());

      if (role === 'grandpa') {
        navigate('/grandpa');
      } else {
        navigate('/family');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl mb-3">
            <Heart className="w-8 h-8 fill-emerald-500/20" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
            MediTracker AI
          </h1>
        </div>

        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden">
          
          {/* Header depending on Step */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {step === 1 ? 'Create Account' : 'Email Verification'}
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
              Step {step} of 2
            </span>
          </div>

          {/* Feedback Banners */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl p-3 mb-6"
            >
              {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl p-3 mb-6 flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              /* Step 1 Form */
              <motion.form 
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestOTP} 
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <User className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Grandpa Joseph"
                      className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
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
                      className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
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
                      className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-all text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                    Choose Mode / Role
                  </label>
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setRole('family')}
                      className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        role === 'family'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      Family Monitor
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('grandpa')}
                      className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        role === 'grandpa'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      Grandpa Mode
                    </button>
                  </div>
                </div>

                {role === 'grandpa' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1.5 pt-1"
                  >
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Family Monitor's Email Link
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <LinkIcon className="w-5 h-5" />
                      </span>
                      <input
                        type="email"
                        value={familyEmail}
                        onChange={(e) => setFamilyEmail(e.target.value)}
                        placeholder="family@example.com"
                        className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-all text-sm"
                        required={role === 'grandpa'}
                      />
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group transition-all duration-300 disabled:opacity-50"
                >
                  {submitting ? 'Sending Code...' : 'Send Verification Code'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.form>
            ) : (
              /* Step 2 Verification Code Form */
              <motion.form 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyAndRegister} 
                className="space-y-5"
              >
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    We sent a 6-digit verification code to <strong className="text-slate-800 dark:text-white">{email}</strong>. Please enter it below:
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <KeyRound className="w-5 h-5" />
                    </span>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border-2 border-emerald-500/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center tracking-[8px] font-mono text-2xl font-bold text-slate-800 dark:text-white transition-all"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || verificationCode.length !== 6}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group transition-all duration-300 disabled:opacity-50 text-base"
                >
                  {submitting ? 'Verifying...' : 'Verify Code & Create Account'}
                  <CheckCircle2 className="w-5 h-5" />
                </button>

                <div className="flex justify-between items-center text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back / Edit Email
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={async () => {
                      setError('');
                      setSuccessMsg('');
                      try {
                        const res = await sendOTP(email);
                        setSuccessMsg(res.message || 'New verification code sent!');
                      } catch (err) {
                        setError(err.message);
                      }
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Resend Code
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center border-t border-slate-200/50 dark:border-slate-800/50 pt-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
