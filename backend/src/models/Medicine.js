const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  dosage: {
    type: String,
    required: true,
    trim: true,
  },
  // Schedule options
  isMorning: {
    type: Boolean,
    default: false,
  },
  isAfternoon: {
    type: Boolean,
    default: false,
  },
  isNight: {
    type: Boolean,
    default: false,
  },
  customTimes: [{
    type: String, // format "HH:MM" e.g., "10:30"
  }],
  // Food constraints
  foodRelation: {
    type: String,
    enum: ['before', 'after', 'any'],
    default: 'any',
  },
  doctorNotes: {
    type: String,
    trim: true,
  },
  color: {
    type: String, // e.g. "#3B82F6" or "blue"
    default: '#3B82F6',
  },
  type: {
    type: String,
    enum: ['tablet', 'capsule', 'syrup', 'injection'],
    default: 'tablet',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Medicine', MedicineSchema);
