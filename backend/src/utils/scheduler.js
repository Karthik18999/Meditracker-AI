const MedicineSchedule = require('../models/MedicineSchedule');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const Notification = require('../models/Notification');
const MedicineLog = require('../models/MedicineLog');
const Contact = require('../models/Contact');
const { emitToHousehold } = require('../config/socket');
const { sendEmail, sendSMS } = require('../services/notificationService');

// Helper to parse timeLabel like "08:00 AM" or "10:30 PM" into hours and minutes
const parseTimeLabel = (timeLabel) => {
  try {
    const [time, ampm] = timeLabel.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
  } catch (error) {
    // Default fallback values
    return { hours: 8, minutes: 0 };
  }
};

const runMissedMedicineCheck = async () => {
  console.log('Running missed medicine adherence check...');
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];

    // Find all incomplete, non-skipped, non-missed schedules for today
    const schedules = await MedicineSchedule.find({
      dateString,
      isCompleted: false,
      isSkipped: false,
      // We still check even if isMissed is already true, in case we need to escalate reminders
    }).populate('medicineId');

    for (const schedule of schedules) {
      if (!schedule.medicineId) continue;

      const { hours, minutes } = parseTimeLabel(schedule.timeLabel);
      
      // Construct target datetime in local time
      const targetTime = new Date(today);
      targetTime.setHours(hours, minutes, 0, 0);

      // Difference in minutes
      const diffMs = today - targetTime;
      const diffMins = Math.floor(diffMs / 1000 / 60);

      if (diffMins <= 0) {
        // Not past target time yet
        continue;
      }

      const medicine = schedule.medicineId;
      const userId = schedule.userId.toString();
      const alerts = schedule.notificationAlertsSent || [];

      // Helper to execute notification tasks
      const notifyAdherenceIssue = async (level, message, isCritical = false) => {
        // Check if alert level already sent
        if (alerts.includes(level)) return;

        console.log(`Triggering ${level}-min alert: ${message}`);
        
        // Log Notification in DB
        const notif = await Notification.create({
          userId: schedule.userId,
          title: isCritical ? 'CRITICAL: Missed Medicine' : 'Missed Medicine Warning',
          message,
          type: 'missed',
        });

        // Push level to sent list
        schedule.notificationAlertsSent.push(level);
        if (level === 60) {
          schedule.isMissed = true; // Mark as officially missed in DB at 60m threshold
        }
        await schedule.save();

        // Broadcast to clients via socket
        emitToHousehold(userId, 'new-notification', notif);
        emitToHousehold(userId, 'missed-medicine', {
          scheduleId: schedule._id,
          medicineName: medicine.name,
          timeSlot: schedule.timeSlot,
          timeLabel: schedule.timeLabel,
          level,
        });

        // Email / SMS dispatch
        const familyUser = await User.findById(schedule.userId);
        if (familyUser && familyUser.email) {
          await sendEmail(
            familyUser.email, 
            isCritical ? '🚨 CRITICAL ADHERENCE ALERT - MediTracker AI' : '⚠️ Medicine Reminder - MediTracker AI', 
            message
          );
        }

        // Notify emergency contacts at 45 & 60 mins
        if (level >= 45) {
          const contacts = await Contact.find({ userId: schedule.userId });
          for (const contact of contacts) {
            if (contact.email) {
              await sendEmail(contact.email, '🚨 URGENT: Grandpa Missed Medicine', message);
            }
            if (contact.phone) {
              await sendSMS(contact.phone, `URGENT ALERT: Grandpa has missed taking ${medicine.name} by ${level} minutes!`);
            }
          }
        }

        // If level 60, create an audit log
        if (level === 60) {
          await MedicineLog.create({
            medicineId: medicine._id,
            scheduleId: schedule._id,
            userId: schedule.userId,
            action: 'missed',
            timeSlot: schedule.timeSlot,
          });
        }
      };

      // Check thresholds
      if (diffMins >= 60) {
        await notifyAdherenceIssue(60, `CRITICAL: Grandpa has missed his ${schedule.timeLabel} dose of ${medicine.name} by over 1 hour!`, true);
      } else if (diffMins >= 45) {
        await notifyAdherenceIssue(45, `URGENT: Grandpa has missed his ${schedule.timeLabel} dose of ${medicine.name} by 45 minutes. Emergency contacts have been informed.`, true);
      } else if (diffMins >= 30) {
        await notifyAdherenceIssue(30, `Reminder: Grandpa's ${schedule.timeLabel} dose of ${medicine.name} was scheduled 30 minutes ago. Please remind him.`);
      } else if (diffMins >= 15) {
        await notifyAdherenceIssue(15, `Alert: Grandpa's ${schedule.timeLabel} dose of ${medicine.name} is 15 minutes overdue.`);
      }
    }
  } catch (error) {
    console.error('Error checking missed schedules:', error.message);
  }
};

const startScheduler = () => {
  // Run check every 60 seconds
  const interval = setInterval(runMissedMedicineCheck, 60 * 1000);
  console.log('Missed medicine cron scheduler started (polling every 60s).');
  return interval;
};

module.exports = {
  startScheduler,
  runMissedMedicineCheck
};
