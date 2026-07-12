import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Plus, Edit, Trash2, Calendar, TrendingUp, AlertCircle, Clock, 
  ArrowRight, Bot, Download, Sparkles, Stethoscope, LogOut, Bell, 
  ShieldAlert, RefreshCw, Send, Check, Phone, PlusCircle, Trash, FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const FamilyDashboard = () => {
  const { logout, user } = useAuth();
  const { socketNotifications, activeEmergency, clearEmergency } = useSocket();

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
    { role: 'assistant', text: 'Hello! I am your MediTracker AI assistant. You can ask me questions about Grandpa\'s compliance, stocks, or refill predictions.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // CRUD Modals/Forms State
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [medForm, setMedForm] = useState({
    name: '', dosage: '', isMorning: false, isAfternoon: false, isNight: false,
    customTimesString: '', foodRelation: 'any', doctorNotes: '', color: '#3b82f6', type: 'tablet',
    currentStock: 30, minStock: 10, supplier: '', purchaseDate: '', expiryDate: ''
  });

  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    doctorName: '', hospital: '', prescription: '', visitDate: '', nextAppointment: '', notes: ''
  });

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '', relation: '', phone: '', email: '', isPrimary: false
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      const [medsRes, invRes, apptsRes, contactsRes, schedsRes, reportRes, aiRes] = await Promise.all([
        api.get('/medicines'),
        api.get('/inventory'),
        api.get('/appointments'),
        api.get('/contacts'),
        api.get('/logs/today'),
        api.get('/logs/reports'),
        api.get('/ai/insights')
      ]);

      setMedicines(medsRes.data);
      setInventories(invRes.data);
      setAppointments(apptsRes.data);
      setContacts(contactsRes.data);
      setSchedules(schedsRes.data);
      setReportSummary(reportRes.data.summary);
      setReportGraph(reportRes.data.graphData);
      setAiInsights(aiRes.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Error pulling latest dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to socket triggers to update data in real-time
    if (window.io) {
      const handleRealtimeUpdate = () => {
        console.log('Real-time data update received via sockets.');
        fetchDashboardData();
      };
      
      // We can attach listener trigger events
      // (The useSocket context provides notifications. We poll or register custom listener on active socket)
    }
    
    // Set up a 10s short poll for absolute real-time reliability if sockets drop
    const poll = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(poll);
  }, []);

  // Handle Form changes
  const handleMedFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMedForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit Medicine CRUD
  const handleMedSubmit = async (e) => {
    e.preventDefault();
    try {
      // Parse custom times
      const customTimes = medForm.customTimesString 
        ? medForm.customTimesString.split(',').map(t => t.trim()) 
        : [];

      const payload = {
        ...medForm,
        customTimes
      };

      if (editingMed) {
        await api.put(`/medicines/${editingMed._id}`, payload);
      } else {
        await api.post('/medicines', payload);
      }

      setIsMedModalOpen(false);
      setEditingMed(null);
      resetMedForm();
      fetchDashboardData();
    } catch (err) {
      alert(`Error saving medicine: ${err.message}`);
    }
  };

  const editMedicineClick = (med) => {
    setEditingMed(med);
    const relatedInv = inventories.find(i => i.medicineId?._id === med._id);
    
    setMedForm({
      name: med.name,
      dosage: med.dosage,
      isMorning: med.isMorning,
      isAfternoon: med.isAfternoon,
      isNight: med.isNight,
      customTimesString: med.customTimes ? med.customTimes.join(', ') : '',
      foodRelation: med.foodRelation || 'any',
      doctorNotes: med.doctorNotes || '',
      color: med.color || '#3b82f6',
      type: med.type || 'tablet',
      currentStock: relatedInv ? relatedInv.currentStock : 30,
      minStock: relatedInv ? relatedInv.minStock : 10,
      supplier: relatedInv ? relatedInv.supplier || '' : '',
      purchaseDate: relatedInv?.purchaseDate ? relatedInv.purchaseDate.split('T')[0] : '',
      expiryDate: relatedInv?.expiryDate ? relatedInv.expiryDate.split('T')[0] : ''
    });
    setIsMedModalOpen(true);
  };

  const deleteMedicineClick = async (medId) => {
    if (!window.confirm('Are you sure you want to delete this medicine and all its logs?')) return;
    try {
      await api.delete(`/medicines/${medId}`);
      fetchDashboardData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const resetMedForm = () => {
    setMedForm({
      name: '', dosage: '', isMorning: false, isAfternoon: false, isNight: false,
      customTimesString: '', foodRelation: 'any', doctorNotes: '', color: '#3b82f6', type: 'tablet',
      currentStock: 30, minStock: 10, supplier: '', purchaseDate: '', expiryDate: ''
    });
  };

  // Submit appointment
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/appointments', appointmentForm);
      setIsAppointmentModalOpen(false);
      setAppointmentForm({ doctorName: '', hospital: '', prescription: '', visitDate: '', nextAppointment: '', notes: '' });
      fetchDashboardData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const deleteAppointmentClick = async (id) => {
    if (!window.confirm('Delete appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit contact
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/contacts', contactForm);
      setIsContactModalOpen(false);
      setContactForm({ name: '', relation: '', phone: '', email: '', isPrimary: false });
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteContactClick = async (id) => {
    if (!window.confirm('Remove emergency contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      fetchDashboardData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Quick Refill Stock Trigger
  const handleQuickRefill = async (inventoryId, currentStock) => {
    const amountStr = window.prompt('Enter tablet count to add to stock:', '30');
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount <= 0) return;

    try {
      await api.put(`/inventory/${inventoryId}`, { currentStock: currentStock + amount });
      fetchDashboardData();
    } catch (err) {
      alert(`Refill failed: ${err.message}`);
    }
  };

  // Chat Query Submission
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await api.post('/ai/chat', { question: userText });
      setChatHistory(prev => [...prev, { role: 'assistant', text: res.reply }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Error contacting AI engine: ' + err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Export PDF Report (Client Side jsPDF)
  const generatePDFReport = () => {
    const doc = new jsPDF();
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('MediTracker AI - Patient Adherence Report', 14, 20);
    
    doc.setFontSize(12);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Patient Supervisor Account: ${user.name} (${user.email})`, 14, 34);

    // Summary Card stats
    doc.setFont('Helvetica', 'bold');
    doc.text('Medication Adherence Summary:', 14, 48);
    doc.setFont('Helvetica', 'normal');
    doc.text(`• Total scheduled doses logged: ${reportSummary?.totalDoses || 0}`, 14, 56);
    doc.text(`• Completed successfully: ${reportSummary?.completedDoses || 0}`, 14, 62);
    doc.text(`• Missed (Un-adhered): ${reportSummary?.missedDoses || 0}`, 14, 68);
    doc.text(`• Adherence Compliance Rate: ${reportSummary?.complianceRate || 0}%`, 14, 74);

    // Inventory lists
    doc.setFont('Helvetica', 'bold');
    doc.text('Current Inventory Status:', 14, 90);
    doc.setFont('Helvetica', 'normal');
    let offset = 98;
    inventories.forEach((inv) => {
      if (offset > 270) {
        doc.addPage();
        offset = 20;
      }
      doc.text(`- ${inv.medicineId?.name || 'Unknown'}: ${inv.currentStock} remaining (Min threshold: ${inv.minStock})`, 14, offset);
      offset += 8;
    });

    doc.save(`MediTracker_Adherence_Report_${Date.now()}.pdf`);
  };

  // Export Excel Report (Client Side xlsx)
  const generateExcelReport = () => {
    const dataRows = medicines.map(med => {
      const inv = inventories.find(i => i.medicineId?._id === med._id);
      return {
        'Medicine Name': med.name,
        'Dosage': med.dosage,
        'Morning Slot': med.isMorning ? 'Yes' : 'No',
        'Afternoon Slot': med.isAfternoon ? 'Yes' : 'No',
        'Night Slot': med.isNight ? 'Yes' : 'No',
        'Food Timing': med.foodRelation,
        'Current Stock': inv ? inv.currentStock : 0,
        'Min Required Stock': inv ? inv.minStock : 10,
        'Supplier Details': inv ? inv.supplier : '',
        'Expiry Date': inv?.expiryDate ? new Date(inv.expiryDate).toLocaleDateString() : ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Medication Inventory');
    XLSX.writeFile(workbook, `MediTracker_Inventory_Export_${Date.now()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Dynamic Emergency banner (Socket Event driven) */}
      <AnimatePresence>
        {activeEmergency && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 inset-x-0 bg-red-600 text-white font-black text-center p-4 z-50 flex items-center justify-center gap-4 shadow-xl"
          >
            <ShieldAlert className="w-8 h-8 animate-ping" />
            <span>🚨 EMERGENCY BUTTON PRESSED BY GRANDPA! LIVE ALERT DISPATCHED.</span>
            <button 
              onClick={clearEmergency}
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition-all"
            >
              DISMISS
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side Navigation Bar */}
      <aside className="w-full md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Heart className="w-6 h-6 fill-emerald-500/20" />
            </div>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              MediTracker AI
            </h1>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'overview', label: 'Overview Dashboard', icon: TrendingUp },
              { id: 'medicines', label: 'Manage Medicines', icon: PlusCircle },
              { id: 'inventory', label: 'Inventory Stock', icon: ShieldAlert },
              { id: 'care', label: 'Care & Doctors', icon: Stethoscope },
              { id: 'reports', label: 'Data Reports', icon: FileText },
              { id: 'chatbot', label: 'AI Helper Chatbot', icon: Bot },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user.role} Mode</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-red-500/10 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/20 dark:hover:text-red-400 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout Account
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-h-screen">
        
        {/* Error notification header */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab content rendering */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            
            {/* Overview Dashboard Tab */}
            {activeTab === 'overview' && (
              <>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold">Compliance Overview</h2>
                    <p className="text-slate-500 mt-1">Real-time prescription completion metrics</p>
                  </div>
                  <button 
                    onClick={fetchDashboardData}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 font-semibold text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                </div>

                {/* Score Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="glass-card p-6 rounded-2xl border border-white/20 shadow-sm">
                    <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Adherence Rate</div>
                    <div className="text-4xl font-extrabold text-emerald-500 mt-2">
                      {reportSummary?.complianceRate || 0}%
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Target adherence: 90%+</div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-white/20 shadow-sm">
                    <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Today's Doses</div>
                    <div className="text-4xl font-extrabold text-slate-800 dark:text-white mt-2">
                      {schedules.filter(s => s.isCompleted).length} / {schedules.length}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Completion target today</div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-white/20 shadow-sm">
                    <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Missed Doses</div>
                    <div className="text-4xl font-extrabold text-red-500 mt-2">
                      {reportSummary?.missedDoses || 0}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Overdue alert count</div>
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-white/20 shadow-sm">
                    <div className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Stock warnings</div>
                    <div className="text-4xl font-extrabold text-amber-500 mt-2">
                      {inventories.filter(i => i.currentStock <= i.minStock).length}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Low-quantity prescriptions</div>
                  </div>
                </div>

                {/* Main insights column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: AI insights summary */}
                  <div className="lg:col-span-2 space-y-6">
                    {aiInsights && (
                      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold mb-3">
                          <Sparkles className="w-5 h-5 fill-emerald-500/10" />
                          <span>AI Smart Diagnostics</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">Weekly Summary:</h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                          "{aiInsights.weeklySummary}"
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
                          <h4 className="font-bold text-sm text-slate-500 mb-2">Refill Advice:</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                            aiInsights.refillAdvice.includes('Buy') ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 'bg-emerald-500/20 text-emerald-600'
                          }`}>
                            {aiInsights.refillAdvice}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Today's schedule preview */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                      <h3 className="text-lg font-bold mb-4">Today's Live Scheduled Doses</h3>
                      <div className="space-y-3.5">
                        {schedules.length === 0 ? (
                          <p className="text-slate-500 text-sm">No scheduled medicines today.</p>
                        ) : (
                          schedules.map((sched) => (
                            <div key={sched._id} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/50 pb-3 last:border-b-0 last:pb-0">
                              <div>
                                <span className="font-bold">{sched.medicineId?.name}</span>
                                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 capitalize">
                                  {sched.timeSlot}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500">{sched.timeLabel}</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                                  sched.isCompleted 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : sched.isMissed 
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  {sched.isCompleted ? 'Completed' : sched.isMissed ? 'Missed' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Notifications Logs */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col max-h-[500px]">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Bell className="w-5 h-5 text-emerald-500" />
                        Live Adherence Alerts
                      </h3>
                      <button 
                        onClick={async () => {
                          await api.put('/logs/notifications/read');
                          fetchDashboardData();
                        }}
                        className="text-xs text-emerald-600 hover:underline font-bold"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                      {socketNotifications.length === 0 && (
                        <p className="text-slate-500 text-sm">No new alert warnings log.</p>
                      )}
                      {socketNotifications.map((notif, idx) => (
                        <div 
                          key={notif._id || idx} 
                          className={`p-3 rounded-xl border text-xs leading-relaxed ${
                            notif.type === 'emergency' 
                              ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 font-bold'
                              : notif.type === 'missed'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                              : notif.type === 'completion'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="font-extrabold uppercase mb-1">{notif.title}</div>
                          <div>{notif.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </>
            )}

            {/* Medicines List Tab */}
            {activeTab === 'medicines' && (
              <>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold">Active Prescriptions</h2>
                    <p className="text-slate-500 mt-1">Add, edit, or adjust medicine schedules</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingMed(null);
                      resetMedForm();
                      setIsMedModalOpen(true);
                    }}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Medicine
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {medicines.length === 0 ? (
                    <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                      <p className="text-slate-500">No active medicines found. Click button above to register.</p>
                    </div>
                  ) : (
                    medicines.map((med) => {
                      const relatedInv = inventories.find(i => i.medicineId?._id === med._id);
                      return (
                        <div key={med._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between">
                          <div 
                            className="absolute top-0 inset-x-0 h-2" 
                            style={{ backgroundColor: med.color || '#3b82f6' }}
                          />
                          
                          <div>
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-extrabold text-xl">{med.name}</h3>
                                <p className="text-xs text-slate-500 capitalize">{med.type} • {med.dosage}</p>
                              </div>
                              <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded uppercase font-bold">
                                {med.foodRelation} food
                              </span>
                            </div>

                            <div className="space-y-1.5 mb-4 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Active Slots:</span>
                                <span className="font-semibold text-xs flex gap-1">
                                  {med.isMorning && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded">Morning</span>}
                                  {med.isAfternoon && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded">Afternoon</span>}
                                  {med.isNight && <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-600 rounded">Night</span>}
                                  {med.customTimes?.length > 0 && <span className="px-1.5 py-0.5 bg-slate-500/10 text-slate-600 rounded">Custom</span>}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Current Stock:</span>
                                <span className={`font-bold ${relatedInv?.currentStock <= relatedInv?.minStock ? 'text-red-500' : ''}`}>
                                  {relatedInv ? relatedInv.currentStock : 'N/A'} units
                                </span>
                              </div>
                              {med.doctorNotes && (
                                <p className="text-xs text-amber-600 italic bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 mt-2">
                                  "{med.doctorNotes}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800/50 pt-4 mt-4 shrink-0">
                            <button
                              onClick={() => editMedicineClick(med)}
                              className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit Settings
                            </button>
                            <button
                              onClick={() => deleteMedicineClick(med._id)}
                              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* Inventory Management Tab */}
            {activeTab === 'inventory' && (
              <>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold">Inventory & Supplies</h2>
                    <p className="text-slate-500 mt-1">Track medicine amounts and refill limits</p>
                  </div>
                  <button 
                    onClick={generateExcelReport}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Export Sheet
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                          <th className="p-4">Medication Name</th>
                          <th className="p-4">Current Stock</th>
                          <th className="p-4">Minimum Limit</th>
                          <th className="p-4">Estimated Refill</th>
                          <th className="p-4">Supplier</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventories.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-slate-500">No inventory lines found. Add a medicine first.</td>
                          </tr>
                        ) : (
                          inventories.map((inv) => {
                            const isLow = inv.currentStock <= inv.minStock;
                            const dailyUse = inv.dosePerDay || 1;
                            const daysLeft = Math.floor(inv.currentStock / dailyUse);

                            return (
                              <tr key={inv._id} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                                <td className="p-4 font-bold">{inv.medicineId?.name || 'Deleted Medicine'}</td>
                                <td className="p-4">
                                  <span className={`font-bold ${isLow ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                    {inv.currentStock}
                                  </span>
                                </td>
                                <td className="p-4 text-slate-500">{inv.minStock} units</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                    daysLeft <= 3 ? 'bg-red-500/20 text-red-600' : daysLeft <= 7 ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'
                                  }`}>
                                    {daysLeft} days left
                                  </span>
                                </td>
                                <td className="p-4 text-slate-500">{inv.supplier || 'Not specified'}</td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleQuickRefill(inv._id, inv.currentStock)}
                                    className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs transition-all"
                                  >
                                    Quick Refill (+Dose)
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* Care and Doctors Mode Tab */}
            {activeTab === 'care' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Left Column: Doctor Visits */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-extrabold flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-emerald-500" />
                        Doctor Visits & Prescriptions
                      </h3>
                      <button
                        onClick={() => setIsAppointmentModalOpen(true)}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Record
                      </button>
                    </div>

                    <div className="space-y-4">
                      {appointments.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                          No registered appointment records.
                        </div>
                      ) : (
                        appointments.map((appt) => (
                          <div key={appt._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative">
                            <button
                              onClick={() => deleteAppointmentClick(appt._id)}
                              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                            <h4 className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{appt.doctorName}</h4>
                            <p className="text-sm font-semibold text-slate-500">{appt.hospital || 'Hospital unspecified'}</p>
                            
                            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-slate-400 block">Visit Date:</span>
                                <span className="font-bold">{new Date(appt.visitDate).toLocaleDateString()}</span>
                              </div>
                              {appt.nextAppointment && (
                                <div>
                                  <span className="text-slate-400 block">Next Appointment:</span>
                                  <span className="font-bold text-amber-600">{new Date(appt.nextAppointment).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>

                            {appt.prescription && (
                              <div className="mt-3.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                <span className="font-bold block mb-1">Prescribed Drugs:</span>
                                <p className="text-slate-600 dark:text-slate-300 font-semibold">{appt.prescription}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right Column: Emergency Contacts */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-extrabold flex items-center gap-2">
                        <Phone className="w-6 h-6 text-red-500 animate-pulse" />
                        Care & Emergency Contacts
                      </h3>
                      <button
                        onClick={() => setIsContactModalOpen(true)}
                        className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Contact
                      </button>
                    </div>

                    <div className="space-y-4">
                      {contacts.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
                          No emergency contacts specified. Please register one for alert routing.
                        </div>
                      ) : (
                        contacts.map((contact) => (
                          <div key={contact._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-lg">{contact.name}</h4>
                                <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-bold text-slate-500">
                                  {contact.relation}
                                </span>
                                {contact.isPrimary && (
                                  <span className="text-[10px] px-2 py-0.5 bg-red-500/10 text-red-600 rounded font-extrabold">
                                    Primary Alert
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-slate-500 mt-1">{contact.phone}</p>
                              {contact.email && <p className="text-xs text-slate-400 mt-0.5">{contact.email}</p>}
                            </div>

                            <button
                              onClick={() => deleteContactClick(contact._id)}
                              className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </>
            )}

            {/* Reports and Export Tab */}
            {activeTab === 'reports' && (
              <>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-3xl font-extrabold">Adherence Analytics</h2>
                    <p className="text-slate-500 mt-1">Generate PDF reports and view trend charts</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={generatePDFReport}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-red-600/10 transition-all"
                    >
                      <FileText className="w-4 h-4" />
                      Download PDF Report
                    </button>
                  </div>
                </div>

                {/* Graph Analytics Panel */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-bold mb-6">Daily Compliance Compliance Trends</h3>
                  <div className="h-80 w-full">
                    {reportGraph.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm">No historical log data available. Check back tomorrow!</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reportGraph} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                          <Area type="monotone" dataKey="completed" name="Doses Taken" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                          <Area type="monotone" dataKey="total" name="Doses Scheduled" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* AI Assistant Chatbot Tab */}
            {activeTab === 'chatbot' && (
              <>
                <div>
                  <h2 className="text-3xl font-extrabold flex items-center gap-2">
                    <Bot className="w-8 h-8 text-emerald-500" />
                    AI Health Assistant Chatbot
                  </h2>
                  <p className="text-slate-500 mt-1">Ask context-aware questions about Grandpa's medicine logs and stock levels</p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col h-[550px] shadow-sm">
                  
                  {/* Chat logs */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 text-sm">
                    {chatHistory.map((msg, index) => (
                      <div 
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xl p-4 rounded-2xl leading-relaxed whitespace-pre-line ${
                          msg.role === 'user'
                            ? 'bg-emerald-500 text-white font-semibold rounded-tr-none'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce"></span>
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleChatSubmit} className="flex gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="e.g. Did Grandpa take today's medicines?"
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="p-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Add/Edit Medication Modal */}
      <AnimatePresence>
        {isMedModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="text-2xl font-extrabold mb-6">
                {editingMed ? 'Edit Medication Settings' : 'Add Medication Setup'}
              </h3>

              <form onSubmit={handleMedSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5 text-slate-500">Medicine Name</label>
                    <input
                      type="text"
                      name="name"
                      value={medForm.name}
                      onChange={handleMedFormChange}
                      placeholder="e.g. Lisinopril BP"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-slate-500">Dose Quantity</label>
                    <input
                      type="text"
                      name="dosage"
                      value={medForm.dosage}
                      onChange={handleMedFormChange}
                      placeholder="e.g. 1 Tablet, 5ml"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold mb-1.5 text-slate-500">Medicine Type</label>
                    <select
                      name="type"
                      value={medForm.type}
                      onChange={handleMedFormChange}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="syrup">Syrup</option>
                      <option value="injection">Injection</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-slate-500">Food Constraint</label>
                    <select
                      name="foodRelation"
                      value={medForm.foodRelation}
                      onChange={handleMedFormChange}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="any">Any Time</option>
                      <option value="before">Before Food</option>
                      <option value="after">After Food</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1.5 text-slate-500">Visual Theme Color</label>
                    <input
                      type="color"
                      name="color"
                      value={medForm.color}
                      onChange={handleMedFormChange}
                      className="w-full h-11 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="font-extrabold text-slate-500 mb-2">Medication Schedule Times</h4>
                  <div className="flex flex-wrap gap-4 items-center mb-3">
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        name="isMorning"
                        checked={medForm.isMorning}
                        onChange={handleMedFormChange}
                        className="rounded accent-emerald-500 w-4 h-4"
                      />
                      Morning (8:00 AM)
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        name="isAfternoon"
                        checked={medForm.isAfternoon}
                        onChange={handleMedFormChange}
                        className="rounded accent-emerald-500 w-4 h-4"
                      />
                      Afternoon (2:00 PM)
                    </label>
                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        name="isNight"
                        checked={medForm.isNight}
                        onChange={handleMedFormChange}
                        className="rounded accent-emerald-500 w-4 h-4"
                      />
                      Night (8:00 PM)
                    </label>
                  </div>
                  <div>
                    <label className="block font-bold mb-1 text-slate-500">Custom Times (comma separated, 24h format)</label>
                    <input
                      type="text"
                      name="customTimesString"
                      value={medForm.customTimesString}
                      onChange={handleMedFormChange}
                      placeholder="e.g. 10:30, 16:45"
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                  <h4 className="font-extrabold text-slate-500 mb-2.5">Inventory & Supplier</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold mb-1 text-slate-500">Current Stock Count</label>
                      <input
                        type="number"
                        name="currentStock"
                        value={medForm.currentStock}
                        onChange={handleMedFormChange}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1 text-slate-500">Alert Threshold Limit (Min)</label>
                      <input
                        type="number"
                        name="minStock"
                        value={medForm.minStock}
                        onChange={handleMedFormChange}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1.5 text-slate-500">Doctor Notes & Instructions</label>
                  <textarea
                    name="doctorNotes"
                    value={medForm.doctorNotes}
                    onChange={handleMedFormChange}
                    placeholder="e.g. Drink plenty of water. Take with milk."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 h-20"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsMedModalOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Appointment Modal */}
      <AnimatePresence>
        {isAppointmentModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-extrabold mb-4">Register Doctor Visit</h3>
              <form onSubmit={handleAppointmentSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-500">Doctor Name</label>
                  <input
                    type="text"
                    value={appointmentForm.doctorName}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, doctorName: e.target.value }))}
                    placeholder="e.g. Dr. Emily Smith"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-500">Hospital / Clinic</label>
                  <input
                    type="text"
                    value={appointmentForm.hospital}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, hospital: e.target.value }))}
                    placeholder="e.g. Mercy General Hospital"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-500">Visit Date</label>
                  <input
                    type="date"
                    value={appointmentForm.visitDate}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, visitDate: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-500">Next Scheduled Appointment</label>
                  <input
                    type="date"
                    value={appointmentForm.nextAppointment}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, nextAppointment: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-500">Prescribed Drug Notes</label>
                  <textarea
                    value={appointmentForm.prescription}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, prescription: e.target.value }))}
                    placeholder="Drugs, doses specified during visit..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none h-16"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAppointmentModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
                  >
                    Save Visit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Emergency Contact Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-extrabold mb-4">Add Caregiver Contact</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1 text-slate-500">Contact Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-500">Relation</label>
                  <input
                    type="text"
                    value={contactForm.relation}
                    onChange={(e) => setContactForm(prev => ({ ...prev, relation: e.target.value }))}
                    placeholder="e.g. Son, Daughter, Nurse"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-500">Phone Number</label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +1 555-0199"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-500">Email (Optional)</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. helper@example.com"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <label className="flex items-center gap-2 font-bold cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={contactForm.isPrimary}
                    onChange={(e) => setContactForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="rounded accent-emerald-500 w-4 h-4"
                  />
                  Mark as Primary Caregiver
                </label>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsContactModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
                  >
                    Save Contact
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default FamilyDashboard;
