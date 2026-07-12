const express = require('express');
const { getInventory, getInventoryByMedicine, updateInventory } = require('../controllers/inventoryController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInventory);

router.route('/medicine/:medicineId')
  .get(getInventoryByMedicine);

router.route('/:id')
  .put(updateInventory);

module.exports = router;
