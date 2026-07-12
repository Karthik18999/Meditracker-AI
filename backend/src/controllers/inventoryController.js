const Inventory = require('../models/Inventory');

/**
 * @desc    Get all inventory records
 * @route   GET /api/inventory
 * @access  Private
 */
const getInventory = async (req, res, next) => {
  try {
    const inventory = await Inventory.find({ userId: req.user.id })
      .populate('medicineId', 'name dosage type color');
    res.status(200).json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single inventory record by medicine ID
 * @route   GET /api/inventory/medicine/:medicineId
 * @access  Private
 */
const getInventoryByMedicine = async (req, res, next) => {
  try {
    const inventory = await Inventory.findOne({
      userId: req.user.id,
      medicineId: req.params.medicineId
    }).populate('medicineId', 'name dosage type color');

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }

    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update stock levels or metadata for an inventory item
 * @route   PUT /api/inventory/:id
 * @access  Private
 */
const updateInventory = async (req, res, next) => {
  try {
    let inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }

    // Check ownership
    if (inventory.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('medicineId', 'name dosage type color');

    res.status(200).json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInventory,
  getInventoryByMedicine,
  updateInventory,
};
