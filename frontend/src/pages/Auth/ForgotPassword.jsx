import React, { useState } from 'react';
import Footer from '../../components/Footer';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { HeartPulse, Mail, Lock, KeyRound, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password, 3: Success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Step 1: Send OTP code
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your registered email address.');
      return;
    }

    setError('');
    setInfoMessage('');
    setSubmitting(true);

    try {
      const res = await forgotPassword(email);
      setInfoMessage(res.message || `Verification code sent to ${email}`);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Please check your email.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Submit OTP and New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!code || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await resetPassword(email, code, newPassword);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please verify your code and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-slate-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Ambient Background Glow Elements */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-float-delayed pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.15, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="inline-flex items-center justify-center p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl mb-3 shadow-inner"
          >
            <HeartPulse className="w-8 h-8 text-rose-500 animate-heartbeat" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
            MediTracker AI
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
            Account Password Recovery
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                    Forgot Password?
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Enter your registered email address and we'll send you a 6-digit verification code to reset your password.
                  </p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl p-3 mb-6"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSendCode} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
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
                        className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group transition-all duration-300 disabled:opacity-50"
                  >
                    {submitting ? 'Sending Reset Code...' : 'Send Verification Code'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-6 text-center border-t border-slate-200/50 dark:border-slate-800/50 pt-5">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Remembered your password?{' '}
                    <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                      Back to Sign In
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                    Set New Password
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    Enter the 6-digit code sent to <span className="font-bold text-slate-700 dark:text-slate-200">{email}</span> and your new password.
                  </p>
                </div>

                {infoMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl p-3 mb-5 font-semibold">
                    {infoMessage}
                  </div>
                )}

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl p-3 mb-5"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      6-Digit Verification Code
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <KeyRound className="w-5 h-5" />
                      </span>
                      <input
                        type="text"
                        maxLength="6"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="123456"
                        className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-all font-mono tracking-widest text-lg font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <Lock className="w-5 h-5" />
                      </span>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <ShieldCheck className="w-5 h-5" />
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-4 py-2.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group transition-all duration-300 disabled:opacity-50 text-base"
                  >
                    {submitting ? 'Updating Password...' : 'Reset Password'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>

                <div className="mt-5 text-center flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-semibold"
                  >
                    ← Change Email
                  </button>
                  <Link to="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                    Back to Sign In
                  </Link>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-4"
              >
                <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 text-emerald-500 rounded-full mb-4 animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>

                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">
                  Password Updated!
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Your password has been changed successfully. You can now log in using your new credentials.
                </p>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  Proceed to Sign In
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Footer variant="simple" className="mt-6 border-t-0" />
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
