import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertTriangle, Volume2, PhoneCall, LogOut, Moon, Sun } from 'lucide-react';

const GrandpaDashboard = () => {
  const { logout } = useAuth();
  const { socket } = useSocket();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('Good Morning Grandpa ❤️');
  const [spokenScheduleId, setSpokenScheduleId] = useState(null);
  
  // Alarm state
  const [activeAlarm, setActiveAlarm] = useState(null);
  const audioContextRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  
  // Location sharing state
  const [emergencySending, setEmergencySending] = useState(false);
  const [emergencySuccess, setEmergencySuccess] = useState(false);

  // Load schedules
  const fetchTodaySchedules = async () => {
    try {
      const res = await api.get('/logs/today');
      setSchedules(res.data);
      checkActiveAlarms(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load medicines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySchedules();

    // Setup periodic refresh
    const pollInterval = setInterval(fetchTodaySchedules, 30000);

    // Setup greeting based on hour
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning Grandpa ❤️');
    else if (hour < 17) setGreeting('Good Afternoon Grandpa ❤️');
    else setGreeting('Good Evening Grandpa ❤️');

    return () => {
      clearInterval(pollInterval);
      stopAlarmSound();
    };
  }, []);

  // Web Speech API Voice synthesis helper
  const speakInstruction = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop active speaking
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slightly slower for elder accessibility
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Check schedules and trigger fullscreen alarms
  const checkActiveAlarms = (scheds) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Determine current phase
    let currentSlot = '';
    if (currentHour >= 6 && currentHour < 11) currentSlot = 'morning';
    else if (currentHour >= 11 && currentHour < 16) currentSlot = 'afternoon';
    else if (currentHour >= 16 && currentHour < 23) currentSlot = 'night';

    // Find any incomplete medicine in the current active slot
    const alarmCandidate = scheds.find(s => !s.isCompleted && !s.isSkipped && (s.timeSlot === currentSlot || s.timeSlot === 'custom'));
    
    if (alarmCandidate) {
      setActiveAlarm(alarmCandidate);
      startAlarmSound();
      
      // Auto speak instruction once per candidate
      if (spokenScheduleId !== alarmCandidate._id) {
        const mealText = alarmCandidate.medicineId.foodRelation === 'before' ? 'before breakfast' : alarmCandidate.medicineId.foodRelation === 'after' ? 'after breakfast' : 'at any time';
        speakInstruction(`It is time to take your ${alarmCandidate.medicineId.name}. Dose is ${alarmCandidate.medicineId.dosage}. Take ${mealText}.`);
        setSpokenScheduleId(alarmCandidate._id);
      }
    } else {
      setActiveAlarm(null);
      stopAlarmSound();
    }
  };

  // Synthesize alarm sound using Web Audio API (Zero external file dependencies)
  const startAlarmSound = () => {
    if (alarmIntervalRef.current) return; // Already running

    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      const playBeep = () => {
        if (!audioContextRef.current) return;
        
        const osc = audioContextRef.current.createOscillator();
        const gainNode = audioContextRef.current.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);

        osc.type = 'sawtooth';
        osc.frequency.value = 880; // High beep frequency
        gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
        
        osc.start();
        osc.stop(audioContextRef.current.currentTime + 0.15);
      };

      // Double beep every 1.5 seconds
      alarmIntervalRef.current = setInterval(() => {
        playBeep();
        setTimeout(playBeep, 200);
      }, 1500);
    } catch (e) {
      console.error('Audio synthesis failed to start:', e.message);
    }
  };

  const stopAlarmSound = () => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Complete Dose handler
  const handleTakeMedicine = async (scheduleId) => {
    stopAlarmSound();
    try {
      const res = await api.post(`/logs/take/${scheduleId}`);
      
      // Update local state immediately
      setSchedules(prev => prev.map(s => s._id === scheduleId ? { ...s, isCompleted: true, completedAt: new Date() } : s));
      
      const finishedSched = schedules.find(s => s._id === scheduleId);
      const name = finishedSched ? finishedSched.medicineId.name : 'medicine';
      
      // Success feedback
      speakInstruction(`Great job. ${name} completed.`);
      setActiveAlarm(null);

      // Re-query to fetch fresh times
      fetchTodaySchedules();
    } catch (err) {
      alert(`Could not save completion: ${err.message}`);
    }
  };

  // Emergency trigger
  const handleEmergency = () => {
    setEmergencySending(true);
    setEmergencySuccess(false);
    
    speakInstruction('Calling for help and sending your live location.');

    const triggerApi = async (lat, lon) => {
      try {
        await api.post('/logs/emergency', { latitude: lat, longitude: lon });
        setEmergencySuccess(true);
        setTimeout(() => setEmergencySuccess(false), 5000);
      } catch (err) {
        console.error('Emergency alert failed:', err.message);
      } finally {
        setEmergencySending(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          triggerApi(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation failed, sending emergency alert without coordinates:', error.message);
          triggerApi(null, null);
        },
        { timeout: 10000 }
      );
    } else {
      triggerApi(null, null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <h1 className="text-5xl font-black animate-pulse">LOADING MEDICINES...</h1>
      </div>
    );
  }

  // Count items
  const completedCount = schedules.filter(s => s.isCompleted).length;
  const totalCount = schedules.length;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col justify-between font-sans select-none">
      
      {/* Upper Navigation Header */}
      <header className="flex justify-between items-center bg-slate-800 p-6 rounded-3xl border-2 border-slate-700 shadow-xl mb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide">{greeting}</h1>
          <p className="text-2xl text-emerald-400 font-bold mt-2">
            {completedCount} of {totalCount} Completed Today
          </p>
        </div>
        <button 
          onClick={logout}
          className="bg-slate-700 hover:bg-red-600 text-white px-8 py-5 rounded-2xl flex items-center gap-3 border-2 border-slate-600 font-black text-2xl transition-all"
        >
          <LogOut className="w-8 h-8" />
          EXIT
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 grid grid-cols-1 gap-8 mb-6">
        
        {/* Today's Schedule Rows */}
        <section className="space-y-6">
          <h2 className="text-3xl font-black tracking-wider text-slate-400 mb-2 uppercase">Today's Medicines</h2>
          
          {schedules.length === 0 ? (
            <div className="bg-slate-800 rounded-3xl p-12 text-center border-4 border-dashed border-slate-700">
              <h3 className="text-4xl font-extrabold text-slate-400">No medicines scheduled for today. ❤️</h3>
            </div>
          ) : (
            schedules.map((sched) => {
              const med = sched.medicineId;
              if (!med) return null;

              return (
                <div 
                  key={sched._id}
                  className={`relative p-8 rounded-[36px] border-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl transition-all ${
                    sched.isCompleted 
                      ? 'bg-emerald-950/40 border-emerald-500' 
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-6 flex-1">
                    {/* Medicine Visual Color Tag */}
                    <div 
                      className="w-8 h-24 rounded-2xl shrink-0" 
                      style={{ backgroundColor: med.color || '#3b82f6' }}
                    />
                    
                    <div>
                      <div className="flex items-center gap-4 flex-wrap">
                        <h3 className="text-4xl md:text-5xl font-black tracking-tight">{med.name}</h3>
                        <span className="bg-slate-700 text-yellow-400 px-4 py-1.5 rounded-full text-2xl font-black uppercase">
                          {sched.timeLabel}
                        </span>
                      </div>
                      
                      <p className="text-2xl text-slate-300 font-semibold mt-2">
                        Dose: <strong className="text-white text-3xl font-extrabold">{med.dosage}</strong> • 
                        <span className="capitalize text-emerald-400 ml-2 font-black">
                          {med.foodRelation === 'before' ? 'Before Food' : med.foodRelation === 'after' ? 'After Food' : 'Any Time'}
                        </span>
                      </p>

                      {med.doctorNotes && (
                        <p className="text-xl text-yellow-300/80 italic mt-2 font-semibold">
                          Note: "{med.doctorNotes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full md:w-auto">
                    {sched.isCompleted ? (
                      <div className="bg-emerald-500 text-slate-950 px-10 py-6 rounded-3xl flex items-center justify-center gap-3 font-black text-3xl shadow-lg">
                        <Check className="w-10 h-10 stroke-[4px]" />
                        TAKEN
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTakeMedicine(sched._id)}
                        className="w-full md:w-auto px-12 py-7 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-slate-950 font-black text-3xl rounded-[28px] shadow-xl shadow-emerald-500/20 transition-all uppercase tracking-wider"
                      >
                        TAKE MEDICINE
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* Footer Care Mode / Emergency Alert Controls */}
      <footer className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Emergency Trigger Button */}
        <button
          onClick={handleEmergency}
          disabled={emergencySending}
          className={`w-full py-8 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-4xl rounded-[36px] flex items-center justify-center gap-4 border-4 border-red-700 shadow-2xl transition-all disabled:opacity-50`}
        >
          <PhoneCall className="w-12 h-12 fill-white/10 animate-bounce" />
          {emergencySending ? 'SENDING HELP...' : emergencySuccess ? 'HELP NOTIFIED! ❤️' : 'EMERGENCY HELP'}
        </button>

        {/* Audio / Voice controls helper card */}
        <div className="bg-slate-800 p-6 rounded-[36px] border-4 border-slate-700 flex justify-between items-center px-8 shadow-xl">
          <div className="flex items-center gap-4">
            <Volume2 className="w-10 h-10 text-emerald-400 animate-pulse" />
            <div>
              <h4 className="text-2xl font-bold text-slate-200">Voice Assistant Active</h4>
              <p className="text-lg text-slate-400">Speaker will read instructions automatically</p>
            </div>
          </div>
          <button 
            onClick={() => speakInstruction("Grandpa, please remember to take your daily medicines on time.")}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-2xl font-black text-xl border-2 border-slate-600"
          >
            TEST VOICE
          </button>
        </div>
      </footer>

      {/* Fullscreen Alarm Overdue Screen Overlay */}
      <AnimatePresence>
        {activeAlarm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-950/95 z-50 flex flex-col justify-between p-12 text-center critical-alarm-active"
          >
            <div className="flex flex-col items-center gap-6 mt-12">
              <AlertTriangle className="w-28 h-28 text-yellow-400 stroke-[3px] animate-pulse" />
              <h1 className="text-6xl md:text-7xl font-black tracking-tight text-white uppercase">
                TIME TO TAKE MEDICINE!
              </h1>
              <p className="text-3xl md:text-4xl text-slate-200 max-w-3xl mt-4 font-bold">
                Grandpa, please take your <strong className="text-yellow-300 text-5xl font-black underline">{activeAlarm.medicineId.name}</strong> now.
              </p>
            </div>

            <div className="bg-slate-900/80 p-8 rounded-[40px] border-4 border-red-500 max-w-xl mx-auto my-6 w-full shadow-2xl">
              <h3 className="text-3xl font-black text-slate-300">Instructions</h3>
              <p className="text-4xl font-extrabold text-white mt-4 uppercase">
                Dose: {activeAlarm.medicineId.dosage}
              </p>
              <p className="text-3xl font-bold text-yellow-300 mt-2 capitalize">
                {activeAlarm.medicineId.foodRelation === 'before' ? 'Before Food' : activeAlarm.medicineId.foodRelation === 'after' ? 'After Breakfast' : 'Take Any Time'}
              </p>
            </div>

            <div className="mb-12">
              <button
                onClick={() => handleTakeMedicine(activeAlarm._id)}
                className="w-full max-w-2xl py-10 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-5xl rounded-[40px] shadow-2xl border-4 border-emerald-400 tracking-widest uppercase transition-all"
              >
                I TOOK MY MEDICINE
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GrandpaDashboard;
