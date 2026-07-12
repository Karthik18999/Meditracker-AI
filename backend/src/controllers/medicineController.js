const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const MedicineSchedule = require('../models/MedicineSchedule');

// Helper function to format 24h custom time to 12h AM/PM label
const formatTimeLabel = (timeStr, slot) => {
  if (slot === 'morning') return '08:00 AM';
  if (slot === 'afternoon') return '02:00 PM';
  if (slot === 'night') return '08:00 PM';

  try {
    const [hoursStr, minutesStr] = timeStr.split(':');
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours.toString().padStart(2, '0')}:${minutesStr} ${ampm}`;
  } catch (error) {
    return timeStr;
  }
};

// Helper to generate schedules for today
const createTodaySchedules = async (userId, medicine) => {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // "YYYY-MM-DD"
  
  const schedulesToCreate = [];

  if (medicine.isMorning) {
    schedulesToCreate.push({
      medicineId: medicine._id,
      userId,
      dateString,
      timeSlot: 'morning',
      timeLabel: '08:00 AM',
    });
  }
  if (medicine.isAfternoon) {
    schedulesToCreate.push({
      medicineId: medicine._id,
      userId,
      dateString,
      timeSlot: 'afternoon',
      timeLabel: '02:00 PM',
    });
  }
  if (medicine.isNight) {
    schedulesToCreate.push({
      medicineId: medicine._id,
      userId,
      dateString,
      timeSlot: 'night',
      timeLabel: '08:00 PM',
    });
  }

  if (medicine.customTimes && medicine.customTimes.length > 0) {
    medicine.customTimes.forEach(time => {
      schedulesToCreate.push({
        medicineId: medicine._id,
        userId,
        dateString,
        timeSlot: 'custom',
        timeLabel: formatTimeLabel(time, 'custom'),
      });
    });
  }

  for (const sched of schedulesToCreate) {
    try {
      // Avoid duplicate insert errors using findOneAndUpdate with upsert
      await MedicineSchedule.findOneAndUpdate(
        {
          medicineId: sched.medicineId,
          dateString: sched.dateString,
          timeSlot: sched.timeSlot,
          timeLabel: sched.timeLabel
        },
        sched,
        { upsert: true, new: true }
      );
    } catch (e) {
      console.error('Schedule creation collision handled:', e.message);
    }
  }
};

/**
 * @desc    Get all medicines for user
 * @route   GET /api/medicines
 * @access  Private
 */
const getMedicines = async (req, res, next) => {
  try {
    const medicines = await Medicine.find({ userId: req.user.id });
    res.status(200).json({ success: true, count: medicines.length, data: medicines });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new medicine
 * @route   POST /api/medicines
 * @access  Private
 */
const createMedicine = async (req, res, next) => {
  const {
    name,
    dosage,
    isMorning,
    isAfternoon,
    isNight,
    customTimes,
    foodRelation,
    doctorNotes,
    color,
    type,
    imageUrl,
    // Inventory fields if passed together
    currentStock,
    minStock,
    dosePerDay,
    supplier,
    purchaseDate,
    expiryDate
  } = req.body;

  try {
    const medicine = await Medicine.create({
      name,
      dosage,
      isMorning,
      isAfternoon,
      isNight,
      customTimes,
      foodRelation,
      doctorNotes,
      color,
      type,
      imageUrl,
      userId: req.user.id,
    });

    // Create inventory record
    const inventory = await Inventory.create({
      medicineId: medicine._id,
      userId: req.user.id,
      currentStock: currentStock || 0,
      minStock: minStock || 10,
      dosePerDay: dosePerDay || (Number(isMorning) + Number(isAfternoon) + Number(isNight) + (customTimes ? customTimes.length : 0)) || 1,
      supplier: supplier || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    });

    // Seed schedule for today immediately
    await createTodaySchedules(req.user.id, medicine);

    res.status(201).json({
      success: true,
      data: {
        medicine,
        inventory
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update medicine
 * @route   PUT /api/medicines/:id
 * @access  Private
 */
const updateMedicine = async (req, res, next) => {
  try {
    let medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check ownership
    if (medicine.userId.toString() !== req.user.id && req.user.role !== 'grandpa') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // Refresh today's schedules with updated times/settings
    await createTodaySchedules(req.user.id, medicine);

    res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete medicine
 * @route   DELETE /api/medicines/:id
 * @access  Private
 */
const deleteMedicine = async (req, res, next) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    // Check ownership
    if (medicine.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Remove associated schedules, inventory, logs
    await MedicineSchedule.deleteMany({ medicineId: medicine._id });
    await Inventory.deleteMany({ medicineId: medicine._id });
    await medicine.deleteOne();

    res.status(200).json({ success: true, message: 'Medicine and related records deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  createTodaySchedules
};
