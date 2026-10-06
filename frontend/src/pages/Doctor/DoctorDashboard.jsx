import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Stethoscope, Plus, Edit, Trash2, Calendar, TrendingUp, AlertCircle, Clock, 
  ArrowRight, Bot, Download, Sparkles, LogOut, Bell, RefreshCw, Send, Check, 
  FileText, User, Pill, Activity, ShieldAlert, ChevronRight, Search
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const DoctorDashboard = () => {
  const { logout, user } = useAuth();
  const { socketNotifications } = useSocket();

  // Navigation
  const [activeTab, setActiveTab] = useState('overview');

  // Core Data
  const [medicines, setMedicines] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  
  // Reporting & AI states
  const [reportSummary, setReportSummary] = useState(null);
  const [reportGraph, setReportGraph] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: `Hello Dr. ${user?.name || ''}! I am your MediTracker AI Clinical Assistant. You can ask me about drug interactions, dosage recommendations, or patient compliance history.` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // CRUD Modals / Forms State
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [medForm, setMedForm] = useState({
    name: '', dosage: '', isMorning: false, isAfternoon: false, isNight: false,
    customTimesString: '', foodRelation: 'any', doctorNotes: '', color: '#10b981', type: 'tablet',
    currentStock: 30, minStock: 10, supplier: '', purchaseDate: '', expiryDate: ''
  });

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    doctorName: `Dr. ${user?.name || ''}`, hospital: '', prescription: '', visitDate: '', nextAppointment: '', notes: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [medsRes, invRes, apptsRes, contactsRes, schedsRes, reportRes, aiRes] = await Promise.all([
        api.get('/medicines'),
        api.get('/inventory'),
        api.get('/appointments'),
        api.get('/contacts'),
        api.get('/logs/today'),
        api.get('/logs/reports'),
        api.get('/ai/insights')
      ]);

      setMedicines(medsRes.data || []);
      setInventories(invRes.data || []);
      setAppointments(apptsRes.data || []);
      setContacts(contactsRes.data || []);
      setSchedules(schedsRes.data || []);
      setReportSummary(reportRes.data?.summary || null);
      setReportGraph(reportRes.data?.graphData || []);
      setAiInsights(aiRes.data || null);
      setError('');
    } catch (err) {
      setError(err.message || 'Error pulling latest patient data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 10 seconds for real-time dose confirmation updates
    const pollInterval = setInterval(fetchDashboardData, 10000);

    return () => clearInterval(pollInterval);
  }, [socketNotifications]);

  // Flash message handler
  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Medicine CRUD Handlers
  const handleOpenMedModal = (med = null) => {
    if (med) {
      setEditingMed(med);
      const inv = inventories.find(i => i.medicineId?._id === med._id || i.medicineId === med._id);
      
      const morn = med.times?.some(t => t.period === 'morning') || false;
      const aft = med.times?.some(t => t.period === 'afternoon') || false;
      const nit = med.times?.some(t => t.period === 'night') || false;
      const custom = med.times?.filter(t => t.period === 'custom').map(t => t.time).join(', ') || '';

      setMedForm({
        name: med.name || '',
        dosage: med.dosage || '',
        isMorning: morn,
        isAfternoon: aft,
        isNight: nit,
        customTimesString: custom,
        foodRelation: med.foodRelation || 'any',
        doctorNotes: med.doctorNotes || '',
        color: med.color || '#10b981',
        type: med.type || 'tablet',
        currentStock: inv?.currentStock ?? 30,
        minStock: inv?.minStock ?? 10,
        supplier: inv?.supplier || '',
        purchaseDate: inv?.purchaseDate ? inv.purchaseDate.split('T')[0] : '',
        expiryDate: inv?.expiryDate ? inv.expiryDate.split('T')[0] : ''
      });
    } else {
      setEditingMed(null);
      setMedForm({
        name: '', dosage: '', isMorning: true, isAfternoon: false, isNight: false,
        customTimesString: '', foodRelation: 'after_meal', doctorNotes: '', color: '#10b981', type: 'tablet',
        currentStock: 30, minStock: 10, supplier: '', purchaseDate: '', expiryDate: ''
      });
    }
    setIsMedModalOpen(true);
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    try {
      const times = [];
      if (medForm.isMorning) times.push({ time: '08:00', period: 'morning' });
      if (medForm.isAfternoon) times.push({ time: '13:00', period: 'afternoon' });
      if (medForm.isNight) times.push({ time: '20:00', period: 'night' });
      
      if (medForm.customTimesString.trim()) {
        const customArr = medForm.customTimesString.split(',').map(t => t.trim()).filter(Boolean);
        customArr.forEach(t => times.push({ time: t, period: 'custom' }));
      }

      if (times.length === 0) {
        alert('Please select at least one schedule time for the medication.');
        return;
      }

      const payload = {
        name: medForm.name,
        dosage: medForm.dosage,
        type: medForm.type,
        color: medForm.color,
        foodRelation: medForm.foodRelation,
        doctorNotes: medForm.doctorNotes,
        isMorning: medForm.isMorning,
        isAfternoon: medForm.isAfternoon,
        isNight: medForm.isNight,
        customTimes: medForm.customTimesString ? medForm.customTimesString.split(',').map(t => t.trim()).filter(Boolean) : [],
        times,
        currentStock: Number(medForm.currentStock),
        minStock: Number(medForm.minStock),
        supplier: medForm.supplier,
        purchaseDate: medForm.purchaseDate,
        expiryDate: medForm.expiryDate
      };

      if (editingMed) {
        await api.put(`/medicines/${editingMed._id}`, payload);
        showNotification(`Updated prescription for ${medForm.name}`);
      } else {
        await api.post('/medicines', payload);
        showNotification(`Prescribed new medication: ${medForm.name}`);
      }

      setIsMedModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to save medication.');
    }
  };

  const handleDeleteMedicine = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove the prescription for ${name}?`)) {
      try {
        await api.delete(`/medicines/${id}`);
        showNotification(`Discontinued medication: ${name}`);
        fetchDashboardData();
      } catch (err) {
        alert(err.message || 'Failed to delete medication.');
      }
    }
  };

  // Appointment / Visit Handlers
  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', appointmentForm);
      showNotification('Recorded doctor visit & clinical note successfully.');
      setIsAppointmentModalOpen(false);
      setAppointmentForm({
        doctorName: `Dr. ${user?.name || ''}`, hospital: '', prescription: '', visitDate: '', nextAppointment: '', notes: ''
      });
      fetchDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to record visit.');
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (window.confirm('Delete this visit record?')) {
      try {
        await api.delete(`/appointments/${id}`);
        showNotification('Visit record deleted.');
        fetchDashboardData();
      } catch (err) {
        alert(err.message || 'Failed to delete visit.');
      }
    }
  };

  // AI Chat Handler
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', { prompt: userMessage });
      setChatHistory(prev => [...prev, { role: 'assistant', text: res.data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Sorry, I ran into an issue analyzing that request. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Export PDF Report
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129);
    doc.text('MediTracker AI - Clinical Health & Prescription Report', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Attending Doctor: Dr. ${user?.name || 'Doctor'}`, 14, 30);
    doc.text(`Linked Patient Email: ${user?.patientEmail || 'N/A'}`, 14, 36);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 42);
    doc.text(`Overall Adherence Rate: ${reportSummary?.adherenceRate || 0}%`, 14, 48);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Active Medications', 14, 60);

    let y = 68;
    medicines.forEach((m, idx) => {
      doc.setFontSize(11);
      doc.text(`${idx + 1}. ${m.name} (${m.dosage}) - ${m.type.toUpperCase()}`, 14, y);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`   Instructions: ${m.doctorNotes || 'Take as prescribed'} | Relation: ${m.foodRelation.replace('_', ' ')}`, 14, y + 5);
      y += 12;
    });

    if (appointments.length > 0) {
      y += 6;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Recent Doctor Visits & Clinical Notes', 14, y);
      y += 8;
      appointments.forEach((a, idx) => {
        doc.setFontSize(10);
        doc.text(`${idx + 1}. ${a.doctorName} (${a.hospital || 'Clinic'}) - Date: ${new Date(a.visitDate).toLocaleDateString()}`, 14, y);
        if (a.notes) {
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(`   Notes: ${a.notes}`, 14, y + 5);
          y += 10;
        } else {
          y += 6;
        }
      });
    }

    doc.save(`Patient_Clinical_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export Excel
  const exportExcel = () => {
    const medData = medicines.map(m => ({
      'Medication Name': m.name,
      'Dosage': m.dosage,
      'Type': m.type,
      'Food Relation': m.foodRelation,
      'Doctor Notes': m.doctorNotes || 'N/A',
    }));
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(medData);
    XLSX.utils.book_append_sheet(wb, ws, 'Prescriptions');
    XLSX.writeFile(wb, `Patient_Prescriptions_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-24 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Dr. {user?.name || 'Doctor Portal'}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Patient: <strong className="text-slate-700 dark:text-slate-200">{user?.patientEmail || 'Linked Patient'}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={logout}
              className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm hover:bg-red-500/20 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">

        {/* Notifications / Banners */}
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-2xl flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 glass-card rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Adherence Rate</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
                {reportSummary?.adherenceRate ?? 0}%
              </div>
              <p className="text-xs text-slate-500 mt-1">Patient dose compliance</p>
            </div>
          </div>

          <div className="p-5 glass-card rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Prescriptions</span>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                <Pill className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
                {medicines.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Prescribed medications</p>
            </div>
          </div>

          <div className="p-5 glass-card rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock Alerts</span>
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
                {inventories.filter(i => i.currentStock <= i.minStock).length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Low inventory items</p>
            </div>
          </div>

          <div className="p-5 glass-card rounded-3xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recorded Visits</span>
              <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl font-extrabold text-slate-800 dark:text-white">
                {appointments.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Clinical notes & visits</p>
            </div>
          </div>
        </div>

        {/* Tab Header Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 no-scrollbar">
          {[
            { id: 'overview', label: 'Patient Overview', icon: Activity },
            { id: 'medicines', label: 'Prescriptions', icon: Pill },
            { id: 'visits', label: 'Clinical Visits & Notes', icon: Calendar },
            { id: 'reports', label: 'Reports & Export', icon: FileText },
            { id: 'ai', label: 'AI Clinical Assistant', icon: Bot },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                  active
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Adherence Chart */}
              <div className="lg:col-span-2 p-6 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  Patient Dose Compliance History
                </h2>
                {reportGraph.length > 0 ? (
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={reportGraph}>
                        <defs>
                          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="rate" stroke="#10b981" fillOpacity={1} fill="url(#colorRate)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                    No compliance history logged yet.
                  </div>
                )}
              </div>

              {/* Patient Quick Summary */}
              <div className="p-6 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-500" />
                    Linked Patient Profile
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Email</span>
                      <strong className="text-slate-800 dark:text-white">{user?.patientEmail}</strong>
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Total Scheduled Doses Today</span>
                      <strong className="text-slate-800 dark:text-white">{schedules.length} Doses</strong>
                    </div>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
                      <span className="text-xs text-slate-400 block font-semibold uppercase">Doses Taken Today</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {schedules.filter(s => s.isCompleted || s.status === 'taken').length} / {schedules.length} Doses
                      </strong>
                    </div>
                  </div>

                  {/* Today's Dose Confirmations Breakdown */}
                  {schedules.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Today's Dose Logs</span>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                        {schedules.map((s, idx) => {
                          const medName = s.medicineId?.name || 'Medication';
                          const taken = s.isCompleted || s.status === 'taken';
                          return (
                            <div key={s._id || idx} className="flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs">
                              <div>
                                <strong className="text-slate-800 dark:text-slate-200 block">{medName}</strong>
                                <span className="text-slate-500 font-medium capitalize">{s.timeLabel || s.timeSlot}</span>
                              </div>
                              {taken ? (
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  Taken
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold rounded-lg flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Pending
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setActiveTab('medicines')}
                  className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Pill className="w-4 h-4" />
                  Prescribe Medication
                </button>
              </div>
            </div>

            {/* Current Active Prescriptions Table */}
            <div className="p-6 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-500" />
                  Current Active Prescriptions
                </h2>
                <button
                  onClick={() => handleOpenMedModal()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Medication
                </button>
              </div>

              {medicines.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">No medications prescribed yet. Click "Add Medication" above to start.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase">
                        <th className="py-3 px-4">Medication</th>
                        <th className="py-3 px-4">Dosage</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Relation to Food</th>
                        <th className="py-3 px-4">Clinical Notes</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                      {medicines.map(med => (
                        <tr key={med._id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-bold flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: med.color || '#10b981' }} />
                            {med.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{med.dosage}</td>
                          <td className="py-3 px-4 capitalize">{med.type}</td>
                          <td className="py-3 px-4 capitalize text-slate-500">{med.foodRelation?.replace('_', ' ')}</td>
                          <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{med.doctorNotes || '—'}</td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button onClick={() => handleOpenMedModal(med)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-500 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteMedicine(med._id, med.name)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-red-500 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEDICINES / PRESCRIBE */}
        {activeTab === 'medicines' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Prescription & Medication Management</h2>
                <p className="text-xs text-slate-500">Manage all prescribed medicines, dosages, and administration schedules for this patient.</p>
              </div>
              <button
                onClick={() => handleOpenMedModal()}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Prescribe New Medication
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicines.map(med => {
                const inv = inventories.find(i => i.medicineId?._id === med._id || i.medicineId === med._id);
                return (
                  <div key={med._id} className="p-6 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md" style={{ backgroundColor: med.color || '#10b981' }}>
                            <Pill className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base">{med.name}</h3>
                            <span className="text-xs text-slate-500 font-semibold">{med.dosage} ({med.type})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenMedModal(med)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-blue-500 rounded-xl">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteMedicine(med._id, med.name)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-red-500 rounded-xl">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/60 pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Administration:</span>
                          <span className="font-semibold capitalize">{med.foodRelation?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current Stock:</span>
                          <span className={`font-bold ${inv && inv.currentStock <= inv.minStock ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
                            {inv ? `${inv.currentStock} units` : 'N/A'}
                          </span>
                        </div>
                        {med.doctorNotes && (
                          <div className="mt-2 p-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-slate-600 dark:text-slate-300 italic">
                            "{med.doctorNotes}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CLINICAL VISITS & NOTES */}
        {activeTab === 'visits' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Doctor Visit & Clinical Notes History</h2>
                <p className="text-xs text-slate-500">Record health consultations, hospital visits, and clinical instructions for family reference.</p>
              </div>
              <button
                onClick={() => setIsAppointmentModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Record Clinical Visit
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="p-12 text-center glass-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="font-bold text-base">No visit records yet</h3>
                <p className="text-xs text-slate-500 mt-1">Click "Record Clinical Visit" above to log a visit and doctor notes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map(appt => (
                  <div key={appt._id} className="p-6 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                          <Stethoscope className="w-5 h-5" />
                        </span>
                        <div>
                          <h3 className="font-bold text-base">{appt.doctorName}</h3>
                          <p className="text-xs text-slate-500">{appt.hospital || 'Clinical Consultation'}</p>
                        </div>
                      </div>

                      {appt.notes && (
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl">
                          <strong className="text-xs text-slate-400 uppercase block mb-1">Clinical Notes:</strong>
                          {appt.notes}
                        </p>
                      )}

                      {appt.prescription && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Prescription notes: {appt.prescription}
                        </p>
                      )}
                    </div>

                    <div className="sm:text-right flex flex-col justify-between shrink-0">
                      <div>
                        <span className="text-xs text-slate-400 block font-semibold">Visit Date</span>
                        <strong className="text-sm">{new Date(appt.visitDate).toLocaleDateString()}</strong>
                        {appt.nextAppointment && (
                          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-bold">
                            Follow-up: {new Date(appt.nextAppointment).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAppointment(appt._id)}
                        className="mt-3 p-2 hover:bg-red-500/10 text-red-500 rounded-xl self-end transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REPORTS & EXPORT */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Patient Health Reports & Exports</h2>
                <p className="text-xs text-slate-500">Download complete medication charts, clinical notes, and compliance reports.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportPDF}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-red-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={exportExcel}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </button>
              </div>
            </div>

            <div className="p-6 glass-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 space-y-4">
              <h3 className="font-bold text-base">Summary Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block">TOTAL PRESCRIBED MEDICINES</span>
                  <strong className="text-2xl text-slate-800 dark:text-white">{medicines.length}</strong>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block">PATIENT ADHERENCE RATE</span>
                  <strong className="text-2xl text-emerald-600 dark:text-emerald-400">{reportSummary?.adherenceRate ?? 0}%</strong>
                </div>
                <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
                  <span className="text-xs text-slate-400 font-bold block">TOTAL VISITS RECORDED</span>
                  <strong className="text-2xl text-blue-600 dark:text-blue-400">{appointments.length}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AI CLINICAL ASSISTANT */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bot className="w-6 h-6 text-emerald-500" />
                  AI Clinical Assistant
                </h2>
                <p className="text-xs text-slate-500">Ask intelligent queries regarding drug-drug interactions, adherence predictions, and clinical guidelines.</p>
              </div>
            </div>

            <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-6 flex flex-col h-[500px]">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-emerald-600 text-white font-medium rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-sm animate-pulse">
                      Analyzing query...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendChatMessage} className="mt-4 flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about drug interactions or adherence patterns..."
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* MEDICATION MODAL */}
      <AnimatePresence>
        {isMedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editingMed ? 'Edit Prescription' : 'Prescribe New Medication'}</h2>
              <form onSubmit={handleSaveMedicine} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Medication Name</label>
                  <input
                    type="text"
                    required
                    value={medForm.name}
                    onChange={e => setMedForm({ ...medForm, name: e.target.value })}
                    placeholder="e.g. Metformin"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Dosage</label>
                    <input
                      type="text"
                      required
                      value={medForm.dosage}
                      onChange={e => setMedForm({ ...medForm, dosage: e.target.value })}
                      placeholder="e.g. 500mg"
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
                    <select
                      value={medForm.type}
                      onChange={e => setMedForm({ ...medForm, type: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="syrup">Syrup</option>
                      <option value="injection">Injection</option>
                      <option value="drops">Drops</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Schedule Times</label>
                  <div className="flex gap-4 text-xs font-semibold">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={medForm.isMorning} onChange={e => setMedForm({ ...medForm, isMorning: e.target.checked })} className="rounded accent-emerald-500" />
                      Morning
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={medForm.isAfternoon} onChange={e => setMedForm({ ...medForm, isAfternoon: e.target.checked })} className="rounded accent-emerald-500" />
                      Afternoon
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={medForm.isNight} onChange={e => setMedForm({ ...medForm, isNight: e.target.checked })} className="rounded accent-emerald-500" />
                      Night
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Relation to Food</label>
                  <select
                    value={medForm.foodRelation}
                    onChange={e => setMedForm({ ...medForm, foodRelation: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="after_meal">After Meal</option>
                    <option value="before_meal">Before Meal</option>
                    <option value="with_food">With Food</option>
                    <option value="any">Any Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Doctor Notes & Instructions</label>
                  <textarea
                    rows={3}
                    value={medForm.doctorNotes}
                    onChange={e => setMedForm({ ...medForm, doctorNotes: e.target.value })}
                    placeholder="Specific instructions for taking this medicine..."
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button type="button" onClick={() => setIsMedModalOpen(false)} className="px-4 py-2.5 text-slate-500 font-bold text-sm">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm">Save Prescription</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VISIT RECORD MODAL */}
      <AnimatePresence>
        {isAppointmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
              <h2 className="text-xl font-bold mb-4">Record Doctor Visit & Clinical Note</h2>
              <form onSubmit={handleSaveAppointment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={appointmentForm.doctorName}
                    onChange={e => setAppointmentForm({ ...appointmentForm, doctorName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Hospital / Clinic</label>
                  <input
                    type="text"
                    value={appointmentForm.hospital}
                    onChange={e => setAppointmentForm({ ...appointmentForm, hospital: e.target.value })}
                    placeholder="City General Hospital"
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Visit Date</label>
                    <input
                      type="date"
                      required
                      value={appointmentForm.visitDate}
                      onChange={e => setAppointmentForm({ ...appointmentForm, visitDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Follow-up Date</label>
                    <input
                      type="date"
                      value={appointmentForm.nextAppointment}
                      onChange={e => setAppointmentForm({ ...appointmentForm, nextAppointment: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Clinical Notes</label>
                  <textarea
                    rows={3}
                    value={appointmentForm.notes}
                    onChange={e => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                    placeholder="Observations, BP readings, blood work notes..."
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button type="button" onClick={() => setIsAppointmentModalOpen(false)} className="px-4 py-2.5 text-slate-500 font-bold text-sm">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm">Save Record</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;
