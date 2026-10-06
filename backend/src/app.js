const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment config first
dotenv.config();

const errorHandler = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicine');
const inventoryRoutes = require('./routes/inventory');
const appointmentRoutes = require('./routes/appointment');
const contactRoutes = require('./routes/contact');
const logRoutes = require('./routes/logs');
const aiRoutes = require('./routes/ai');

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile/curl/postman) or any local dev origin
    callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to MediTracker AI REST API Server' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middleware
app.use(errorHandler);

module.exports = app;
