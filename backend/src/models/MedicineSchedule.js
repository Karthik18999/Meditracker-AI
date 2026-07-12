const mongoose = require('mongoose');

const MedicineScheduleSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dateString: {
    type: String, // "YYYY-MM-DD" for direct query comparison
    required: true,
  },
  timeSlot: {
    type: String,
    enum: ['morning', 'afternoon', 'night', 'custom'],
    required: true,
  },
  timeLabel: {
    type: String, // e.g. "08:00 AM", "02:00 PM", etc.
    required: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  isSkipped: {
    type: Boolean,
    default: false,
  },
  isMissed: {
    type: Boolean,
    default: false,
  },
  notificationAlertsSent: {
    type: [Number], // tracks if [15, 30, 45, 60] minute alerts were sent
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure we don't duplicate schedules for same day/slot/medicine
MedicineScheduleSchema.index({ medicineId: 1, dateString: 1, timeSlot: 1, timeLabel: 1 }, { unique: true });

module.exports = mongoose.model('MedicineSchedule', MedicineScheduleSchema);
