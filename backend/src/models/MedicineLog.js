const mongoose = require('mongoose');

const MedicineLogSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
  },
  scheduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicineSchedule',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: ['completed', 'missed', 'skipped', 'late'],
    required: true,
  },
  timeSlot: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  delayMinutes: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('MedicineLog', MedicineLogSchema);
