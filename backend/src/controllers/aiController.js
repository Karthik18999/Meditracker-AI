const Medicine = require('../models/Medicine');
const Inventory = require('../models/Inventory');
const MedicineSchedule = require('../models/MedicineSchedule');
const MedicineLog = require('../models/MedicineLog');

/**
 * Helper to predict stock completion (Refill date projection)
 */
const calculateRefillPredictions = async (userId) => {
  const inventories = await Inventory.find({ userId }).populate('medicineId');
  const predictions = [];

  for (const inv of inventories) {
    if (!inv.medicineId) continue;
    const dailyUse = inv.dosePerDay || 1;
    const stock = inv.currentStock;
    const daysLeft = dailyUse > 0 ? Math.floor(stock / dailyUse) : 999;
    
    const refillDate = new Date();
    refillDate.setDate(refillDate.getDate() + daysLeft);

    predictions.push({
      medicineId: inv.medicineId._id,
      name: inv.medicineId.name,
      currentStock: stock,
      minStock: inv.minStock,
      daysLeft,
      estimatedRefillDate: refillDate.toISOString().split('T')[0],
      isCritical: daysLeft <= 3,
      isWarning: daysLeft <= 7 && daysLeft > 3,
    });
  }

  return predictions;
};

/**
 * @desc    Generate AI insights and summary logs
 * @route   GET /api/ai/insights
 * @access  Private
 */
const getAIInsights = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get compliance metrics
    const schedules = await MedicineSchedule.find({ userId });
    const completed = schedules.filter(s => s.isCompleted).length;
    const missed = schedules.filter(s => s.isMissed).length;
    const total = schedules.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 100;

    // Find frequently missed medicines
    const logs = await MedicineLog.find({ userId, action: 'missed' }).populate('medicineId');
    const missedCount = {};
    logs.forEach(l => {
      if (l.medicineId) {
        missedCount[l.medicineId.name] = (missedCount[l.medicineId.name] || 0) + 1;
      }
    });

    const frequentlyMissed = Object.keys(missedCount)
      .map(name => ({ name, count: missedCount[name] }))
      .sort((a, b) => b.count - a.count);

    // Calculate predictions
    const stockPredictions = await calculateRefillPredictions(userId);
    const criticalStocks = stockPredictions.filter(p => p.isCritical);

    // AI summary card creation
    let summaryText = 'Grandpa is tracking well overall! ';
    let riskAlerts = [];

    if (rate < 70) {
      summaryText = 'Adherence is lower than recommended. Attention needed.';
      riskAlerts.push('Adherence rate has dropped below safety levels (70%). Consider reviewing dosage schedules.');
    } else if (rate >= 90) {
      summaryText = 'Outstanding compliance! Grandpa is taking his medicines exactly as scheduled.';
    }

    if (frequentlyMissed.length > 0) {
      riskAlerts.push(`Grandpa frequently misses: ${frequentlyMissed[0].name}. Try setting an alarm helper.`);
    }

    if (criticalStocks.length > 0) {
      riskAlerts.push(`Refill action required: ${criticalStocks.map(s => s.name).join(', ')} will be out of stock soon.`);
    }

    res.status(200).json({
      success: true,
      data: {
        adherenceRate: rate,
        frequentlyMissed,
        stockPredictions,
        weeklySummary: summaryText,
        riskAlerts: riskAlerts.length > 0 ? riskAlerts : ['No active health risks detected.'],
        refillAdvice: criticalStocks.length > 0 ? 'Buy immediately' : 'Inventory is stable',
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    AI Assistant Chatbot query response
 * @route   POST /api/ai/chat
 * @access  Private
 */
const handleChatQuery = async (req, res, next) => {
  const { question } = req.body;

  if (!question || question.trim() === '') {
    return res.status(400).json({ success: false, message: 'Please provide a question' });
  }

  try {
    const userId = req.user.id;
    const query = question.toLowerCase();

    // Gather context
    const schedules = await MedicineSchedule.find({ userId }).populate('medicineId');
    const inventories = await Inventory.find({ userId }).populate('medicineId');
    const logs = await MedicineLog.find({ userId }).populate('medicineId');

    let reply = "";

    // 1. "Did Grandpa take today's medicines?"
    if (query.includes('today') && (query.includes('take') || query.includes('completed') || query.includes('status'))) {
      const today = new Date().toISOString().split('T')[0];
      const todayScheds = schedules.filter(s => s.dateString === today);

      if (todayScheds.length === 0) {
        reply = "There are no medicines scheduled for Grandpa today.";
      } else {
        const taken = todayScheds.filter(s => s.isCompleted);
        const pending = todayScheds.filter(s => !s.isCompleted && !s.isSkipped && !s.isMissed);
        const takenNames = taken.map(t => `${t.medicineId.name} (${t.timeSlot})`).join(', ');
        const pendingNames = pending.map(p => `${p.medicineId.name} (${p.timeSlot})`).join(', ');

        reply = `Today, Grandpa has completed ${taken.length} of ${todayScheds.length} doses.`;
        if (taken.length > 0) {
          reply += `\n\nCompleted: ${takenNames}.`;
        }
        if (pending.length > 0) {
          reply += `\n\nPending remaining: ${pendingNames}.`;
        } else {
          reply += `\n\nGreat job! All scheduled doses for today have been completed.`;
        }
      }
    }
    // 2. "How many tablets are remaining?" / stock levels
    else if (query.includes('remaining') || query.includes('stock') || query.includes('left') || query.includes('how many')) {
      const items = inventories.map(inv => `${inv.medicineId.name}: ${inv.currentStock} tablets left (Min threshold: ${inv.minStock})`);
      if (items.length === 0) {
        reply = "No inventory information found. Please register medicines and stock numbers first.";
      } else {
        reply = "Here is the current stock remaining:\n\n" + items.join('\n');
      }
    }
    // 3. "Which medicines are frequently missed?"
    else if (query.includes('missed') || query.includes('frequently') || query.includes('forgot')) {
      const missedCount = {};
      const missedLogs = logs.filter(l => l.action === 'missed');
      
      missedLogs.forEach(l => {
        if (l.medicineId) {
          missedCount[l.medicineId.name] = (missedCount[l.medicineId.name] || 0) + 1;
        }
      });

      const items = Object.keys(missedCount).map(name => `${name} (forgotten ${missedCount[name]} times)`);
      
      if (items.length === 0) {
        reply = "Excellent news! Grandpa hasn't missed any scheduled medicines in recent logs.";
      } else {
        reply = "Based on logs, these medicines are missed most frequently:\n\n" + items.join('\n');
      }
    }
    // 4. "When should I buy medicines?" / refill projection
    else if (query.includes('buy') || query.includes('refill') || query.includes('purchase') || query.includes('when')) {
      const predictions = await calculateRefillPredictions(userId);
      const items = predictions.map(p => `${p.name}: Estimate refill by ${p.estimatedRefillDate} (${p.daysLeft} days remaining).`);
      
      if (items.length === 0) {
        reply = "No medication configurations found. Add medicines with stock counts to calculate prediction dates.";
      } else {
        reply = "Here is my projected refill shopping list based on inventory consumption rates:\n\n" + items.join('\n');
      }
    }
    // 5. "Show this month's adherence."
    else if (query.includes('adherence') || query.includes('compliance') || query.includes('percentage') || query.includes('month')) {
      const completed = schedules.filter(s => s.isCompleted).length;
      const total = schedules.length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 100;

      reply = `Grandpa's average medicine adherence rate sits at **${rate}%** across all registered historical doses.`;
      if (rate >= 90) {
        reply += " This is in the optimal therapeutic window. Keep up the great support!";
      } else if (rate < 70) {
        reply += " This is below the safety threshold. Consider adding additional alarms or double checking daily routines.";
      }
    }
    // 6. Generic greeting/fallback
    else {
      reply = "Hello! I am your MediTracker AI assistant. I analyze Grandpa's adherence data, logs, and stock in real-time. You can ask me:\n" +
              "- Did Grandpa take today's medicines?\n" +
              "- How many tablets are remaining?\n" +
              "- Which medicines are frequently missed?\n" +
              "- When should I buy medicines?\n" +
              "- Show this month's adherence.";
    }

    res.status(200).json({ success: true, reply });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAIInsights,
  handleChatQuery,
};
