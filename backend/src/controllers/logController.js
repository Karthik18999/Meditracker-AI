const MedicineSchedule = require('../models/MedicineSchedule');
const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const MedicineLog = require('../models/MedicineLog');
const Notification = require('../models/Notification');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { emitToHousehold } = require('../config/socket');
const { sendEmail, sendSMS } = require('../services/notificationService');

/**
 * Helper to ensure schedules exist for today.
 * If grandpa opens the dashboard and today's schedules aren't set, we auto-generate them.
 */
const seedSchedulesIfEmpty = async (userId) => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  
  const existing = await MedicineSchedule.find({ userId, dateString });
  if (existing.length === 0) {
    const medicines = await Medicine.find({ userId });
    const { createTodaySchedules } = require('./medicineController');
    for (const med of medicines) {
      await createTodaySchedules(userId, med);
    }
  }
};

/**
 * @desc    Get today's schedules for Grandpa or Family view
 * @route   GET /api/logs/today
 * @access  Private
 */
const getTodaySchedules = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await seedSchedulesIfEmpty(userId);

    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    const schedules = await MedicineSchedule.find({ userId, dateString })
      .populate('medicineId');

    res.status(200).json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Confirm taking a medicine dose
 * @route   POST /api/logs/take/:scheduleId
 * @access  Private
 */
const takeMedicine = async (req, res, next) => {
  try {
    const schedule = await MedicineSchedule.findById(req.params.scheduleId).populate('medicineId');

    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Schedule record not found' });
    }

    if (schedule.isCompleted) {
      return res.status(400).json({ success: false, message: 'Medicine already taken' });
    }

    // Mark schedule completed
    schedule.isCompleted = true;
    schedule.completedAt = new Date();
    await schedule.save();

    const userId = schedule.userId;
    const medicine = schedule.medicineId;

    // Deduct stock from Inventory
    const inventory = await Inventory.findOne({ medicineId: medicine._id });
    let currentStockValue = 0;
    let minStockValue = 0;

    if (inventory) {
      // Deduct dose
      inventory.currentStock = Math.max(0, inventory.currentStock - 1);
      await inventory.save();
      currentStockValue = inventory.currentStock;
      minStockValue = inventory.minStock;

      // Broadcast inventory updates
      emitToHousehold(userId.toString(), 'inventory-updated', {
        medicineId: medicine._id,
        currentStock: inventory.currentStock,
        minStock: inventory.minStock,
      });

      // Low stock check (7 days, 3 days, 0 tablets alerts)
      const daysRemaining = inventory.dosePerDay > 0 ? (inventory.currentStock / inventory.dosePerDay) : 99;
      
      let lowStockAlert = null;
      let alertType = 'info';

      if (inventory.currentStock === 0) {
        lowStockAlert = `CRITICAL: ${medicine.name} is completely OUT OF STOCK! Please refill immediately.`;
        alertType = 'inventory_out';
      } else if (daysRemaining <= 3) {
        lowStockAlert = `URGENT ALERT: Only ${inventory.currentStock} tablets of ${medicine.name} remaining (estimated 3 days or less).`;
        alertType = 'inventory_low';
      } else if (daysRemaining <= 7) {
        lowStockAlert = `WARNING: Low stock for ${medicine.name} (${inventory.currentStock} remaining, approx. 7 days left).`;
        alertType = 'inventory_low';
      }

      if (lowStockAlert) {
        // Log notification
        const lowStockNotif = await Notification.create({
          userId,
          title: 'Low Stock Alert',
          message: lowStockAlert,
          type: alertType,
        });

        // Socket broadcast
        emitToHousehold(userId.toString(), 'new-notification', lowStockNotif);

        // Fetch family contacts
        const familyUser = await User.findById(userId);
        if (familyUser && familyUser.email) {
          await sendEmail(familyUser.email, 'MediTracker AI: Low Stock Alert', lowStockAlert);
        }
      }
    }

    // Record action log
    const delayMinutes = 0; // Simple calculation can be expanded based on timezone/target times
    const log = await MedicineLog.create({
      medicineId: medicine._id,
      scheduleId: schedule._id,
      userId,
      action: 'completed',
      timeSlot: schedule.timeSlot,
      delayMinutes,
    });

    // Create Notification for completion
    const formattedTime = schedule.completedAt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const completionMsg = `Grandpa completed his ${schedule.timeSlot} dose of ${medicine.name} at ${formattedTime}.`;
    
    const notif = await Notification.create({
      userId,
      title: 'Dose Taken',
      message: completionMsg,
      type: 'completion',
    });

    // Real-time socket broadcast
    emitToHousehold(userId.toString(), 'grandpa-completed', {
      scheduleId: schedule._id,
      medicineName: medicine.name,
      timeSlot: schedule.timeSlot,
      completedAt: schedule.completedAt,
      currentStock: currentStockValue,
    });
    emitToHousehold(userId.toString(), 'new-notification', notif);

    // Email alert
    const familyUser = await User.findById(userId);
    if (familyUser && familyUser.email) {
      await sendEmail(familyUser.email, 'MediTracker AI: Dose Taken', completionMsg);
    }

    res.status(200).json({
      success: true,
      message: 'Medicine confirmed successfully',
      data: { schedule, log }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Grandpa triggers emergency alert
 * @route   POST /api/logs/emergency
 * @access  Private
 */
const triggerEmergency = async (req, res, next) => {
  const { latitude, longitude } = req.body;

  try {
    const userId = req.user.id;

    // Create notification
    const locationString = latitude && longitude 
      ? `Live Location: https://maps.google.com/?q=${latitude},${longitude}` 
      : 'Location details unavailable';
      
    const emergencyMsg = `CRITICAL: Grandpa triggered the Emergency Help Button! ${locationString}`;

    const notif = await Notification.create({
      userId,
      title: 'EMERGENCY ALERT',
      message: emergencyMsg,
      type: 'emergency',
    });

    // Socket broadcast
    emitToHousehold(userId.toString(), 'emergency-triggered', {
      message: emergencyMsg,
      latitude,
      longitude,
      timestamp: new Date(),
    });
    emitToHousehold(userId.toString(), 'new-notification', notif);

    // Notify primary emergency contacts
    const contacts = await Contact.find({ userId });
    const familyUser = await User.findById(userId);

    // Send emails & simulated SMS
    if (familyUser && familyUser.email) {
      await sendEmail(familyUser.email, '🚨 EMERGENCY ALERT - MediTracker AI', emergencyMsg);
    }

    for (const contact of contacts) {
      if (contact.email) {
        await sendEmail(contact.email, '🚨 EMERGENCY ALERT - MediTracker AI', emergencyMsg);
      }
      if (contact.phone) {
        await sendSMS(contact.phone, `EMERGENCY ALERT: Grandpa needs assistance. ${locationString}`);
      }
    }

    res.status(200).json({ success: true, message: 'Emergency alerts triggered successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user notifications
 * @route   GET /api/logs/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notifications as read
 * @route   PUT /api/logs/notifications/read
 * @access  Private
 */
const readAllNotifications = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
    res.status(200).json({ success: true, message: 'Notifications marked read' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate reporting logs and adherence rates
 * @route   GET /api/logs/reports
 * @access  Private
 */
const getReportData = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch all logs to run metrics
    const logs = await MedicineLog.find({ userId }).populate('medicineId');
    const schedules = await MedicineSchedule.find({ userId }).populate('medicineId');

    // Calculate total slots, completed slots
    const totalDoses = schedules.length;
    const completedDoses = schedules.filter(s => s.isCompleted).length;
    const missedDoses = schedules.filter(s => s.isMissed).length;
    const skippedDoses = schedules.filter(s => s.isSkipped).length;

    const complianceRate = totalDoses > 0 ? Math.round((completedDoses / totalDoses) * 100) : 100;

    // Group logs by day to show trends
    const dailyStats = {};
    schedules.forEach(sched => {
      const day = sched.dateString;
      if (!dailyStats[day]) {
        dailyStats[day] = { date: day, total: 0, completed: 0, missed: 0 };
      }
      dailyStats[day].total++;
      if (sched.isCompleted) dailyStats[day].completed++;
      if (sched.isMissed) dailyStats[day].missed++;
    });

    const graphData = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDoses,
          completedDoses,
          missedDoses,
          skippedDoses,
          complianceRate,
        },
        graphData,
        logs: logs.slice(0, 100) // limit to recent 100 logs for presentation
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodaySchedules,
  takeMedicine,
  triggerEmergency,
  getNotifications,
  readAllNotifications,
  getReportData,
};
