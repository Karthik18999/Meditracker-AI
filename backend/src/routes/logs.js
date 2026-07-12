const express = require('express');
const {
  getTodaySchedules,
  takeMedicine,
  triggerEmergency,
  getNotifications,
  readAllNotifications,
  getReportData
} = require('../controllers/logController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/today', getTodaySchedules);
router.post('/take/:scheduleId', takeMedicine);
router.post('/emergency', triggerEmergency);
router.get('/notifications', getNotifications);
router.put('/notifications/read', readAllNotifications);
router.get('/reports', getReportData);

module.exports = router;
