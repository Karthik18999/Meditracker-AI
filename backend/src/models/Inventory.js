const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
  },
  minStock: {
    type: Number,
    required: true,
    default: 10,
  },
  dosePerDay: {
    type: Number,
    required: true,
    default: 1,
  },
  purchaseDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
  supplier: {
    type: String,
    trim: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

InventorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Inventory', InventorySchema);
