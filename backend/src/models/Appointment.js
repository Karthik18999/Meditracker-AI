const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorName: {
    type: String,
    required: true,
    trim: true,
  },
  hospital: {
    type: String,
    trim: true,
  },
  prescription: {
    type: String, // Can store prescription text or attachment path
    trim: true,
  },
  visitDate: {
    type: Date,
    required: true,
  },
  nextAppointment: {
    type: Date,
  },
  notes: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
