import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, HeartPulse } from 'lucide-react';

const GoogleAuthButton = ({ isRegister = false, className = '' }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [role, setRole] = useState('family');
  const [familyEmail, setFamilyEmail] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [pendingGoogleData, setPendingGoogleData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '355205856343-04kd72s0fa3h40bi1tjat6ejc6pqts03.apps.googleusercontent.com';

  useEffect(() => {
    const initGoogle = () => {
      if (GOOGLE_CLIENT_ID && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });
      }
    };

    initGoogle();
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        initGoogle();
        clearInterval(timer);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [GOOGLE_CLIENT_ID]);

  // Decode JWT helper for Google Credential response
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const handleGoogleResponse = async (response) => {
    const payload = parseJwt(response.credential);
    if (!payload || !payload.email) {
      alert('Google authentication failed. Please try again.');
      return;
    }

    const gData = {
      email: payload.email,
      name: payload.name || payload.given_name || payload.email.split('@')[0],
      googleId: payload.sub,
      picture: payload.picture,
    };

    if (isRegister) {
      setPendingGoogleData(gData);
      setShowRoleModal(true);
    } else {
      executeGoogleAuth(gData);
    }
  };

  const executeGoogleAuth = async (gData, selectedRole, fEmail, pEmail) => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...gData,
        role: selectedRole || role,
        familyEmail: fEmail || familyEmail,
        patientEmail: pEmail || patientEmail,
      };

      const user = await googleLogin(payload);

      if (user.role === 'patient' || user.role === 'grandpa') {
        navigate('/patient');
      } else if (user.role === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/family');
      }
    } catch (err) {
      if (!isRegister && err.message?.includes('not found')) {
        setPendingGoogleData(gData);
        setShowRoleModal(true);
      } else {
        setError(err.message || 'Google authentication failed.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePromptGoogle = () => {
    if (GOOGLE_CLIENT_ID && window.google) {
      window.google.accounts.id.prompt();
    } else {
      const userEmail = prompt('Enter your Google account email address:');
      if (userEmail && userEmail.includes('@')) {
        const userName = userEmail.split('@')[0];
        const gData = {
          email: userEmail,
          name: userName.charAt(0).toUpperCase() + userName.slice(1),
          googleId: 'g_' + Date.now(),
        };

        if (isRegister) {
          setPendingGoogleData(gData);
          setShowRoleModal(true);
        } else {
          executeGoogleAuth(gData);
        }
      }
    }
  };

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    if ((role === 'patient' || role === 'grandpa') && !familyEmail) {
      setError("Please link Patient to a Family Monitor's email address.");
      return;
    }
    if (role === 'doctor' && !familyEmail && !patientEmail) {
      setError("Please link Doctor account to Patient or Family Monitor's email address.");
      return;
    }

    if (pendingGoogleData) {
      executeGoogleAuth(pendingGoogleData, role, familyEmail, patientEmail);
    }
  };

  return (
    <>
      <div className={`w-full ${className}`}>
        <button
          type="button"
          onClick={handlePromptGoogle}
          disabled={submitting}
          className="w-full py-3 px-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer text-sm"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{submitting ? 'Connecting Google...' : isRegister ? 'Sign up with Google' : 'Continue with Google'}</span>
        </button>

        {error && (
          <p className="text-xs text-red-500 font-semibold text-center mt-2">{error}</p>
        )}
      </div>

      {/* Role Setup Modal for Google Registration */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative text-slate-800 dark:text-slate-100"
            >
              <button
                onClick={() => setShowRoleModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <HeartPulse className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg">Google Account Setup</h3>
                  <p className="text-xs text-slate-500">{pendingGoogleData?.email}</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 text-red-500 text-xs rounded-xl p-2.5 mb-3 font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleRoleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                    Select Account Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('family')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        role === 'family'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Family
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('patient')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        role === 'patient'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Patient
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('doctor')}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        role === 'doctor'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500'
                      }`}
                    >
                      Doctor
                    </button>
                  </div>
                </div>

                {(role === 'patient' || role === 'grandpa') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Family Monitor's Email Link
                    </label>
                    <input
                      type="email"
                      value={familyEmail}
                      onChange={(e) => setFamilyEmail(e.target.value)}
                      placeholder="family@example.com"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      required
                    />
                  </div>
                )}

                {role === 'doctor' && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Family Monitor's Email
                      </label>
                      <input
                        type="email"
                        value={familyEmail}
                        onChange={(e) => setFamilyEmail(e.target.value)}
                        placeholder="family@example.com"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Patient's Email
                      </label>
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="patient@example.com"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 transition-all"
                >
                  {submitting ? 'Completing Google Registration...' : 'Complete Google Registration'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GoogleAuthButton;
