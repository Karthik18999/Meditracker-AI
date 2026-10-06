# MediTracker AI - Full-Stack Healthcare & Medication Adherence Platform

**MediTracker AI** is a production-ready, full-stack healthcare platform engineered to ensure medication compliance for patients while enabling family members and doctors to remotely monitor health routines, manage prescriptions, record clinical visits, and track adherence in real-time.

---

## 🌟 Key Features & Role Portals

### 👴 1. Grandpa Mode Dashboard (`/grandpa`)
- **Extreme Accessibility UI**: Oversized touch targets, large typography, high-contrast themes, and intuitive visual cues.
- **Voice Synthesis Assistant**: Uses the Web Speech API to read instructions out loud and confirm taken doses.
- **Audio Alarm System**: Synthesizes audible alerts when a scheduled medication is due.
- **Overdue Medication Overlay**: Displays prominent reminders when doses are past due.
- **Single-Tap Dose Logging**: Instantly marks medications as taken, logs timestamps, updates stock levels, and broadcasts updates via WebSockets.
- **One-Tap SOS Emergency**: Fetches GPS location, sends instant notifications, and triggers emergency alerts across connected family dashboards.

---

### 🧑‍⚕️ 2. Family Monitor Dashboard (`/family`)
- **Real-Time Live Feed**: WebSockets (Socket.io) sync compliance statistics, dose updates, and charts live.
- **Prescription & Inventory Management**: Full CRUD operations for medicines, dosages, color tags, food timing relations, and custom schedules.
- **Refill Forecasting**: Calculates stock depletion rates and alerts family members before medications run low.
- **AI Health Assistant Chatbot**: Natural language interface providing real-time answers on inventory status, compliance history, and missed doses.
- **Health Reports & Export**: Generates downloadable PDF health reports and Excel spreadsheets.
- **Clinical Visit Directory & Emergency Contacts**.

---

### 🩺 3. Doctor Portal & Dashboard (`/doctor`)
- **Prescription Control**: Direct prescribing capabilities to update patient medications, dosages, administration schedules, and clinical instructions.
- **Clinical Visits & Hospital Notes**: Record doctor visits, hospital consultations, blood work notes, and follow-up appointment schedules.
- **Patient Health Reports**: Comprehensive adherence metrics with direct **PDF** and **Excel** export functionality.
- **AI Clinical Assistant**: Intelligent clinical assistant trained to assist with drug interaction queries, dosage adjustments, and adherence trends.

---

### 🔒 4. 2-Step Email OTP Verification
- **Secure Registration**: Generates 6-digit one-time passcodes (OTP) sent directly to the user's email inbox during sign-up.
- **High-Performance Background Dispatch**: Non-blocking asynchronous email processing for instantaneous UI transitions (<50ms).
- **Native Brevo & SMTP Support**: Out-of-the-box integration with Brevo (Sendinblue) REST API / SMTP and Gmail SMTP with socket connection pooling.

---

### 📱 5. Universal Responsive Design
- **Cross-Device Optimization**: Clean, structured layout with dedicated mobile bottom-sheet navigation, responsive cards, and adaptive typography for smartphones, tablets, and desktop displays.

---

## 📁 Project Structure

```
Meditracker AI/
├── docker-compose.yml       # Docker orchestration for DB, backend, and frontend
├── backend/
│   ├── src/
│   │   ├── config/          # Mongoose DB connection & Socket.io initialization
│   │   ├── controllers/     # Auth (OTP, Login, Register), Medicines, Logs, Appointments, AI
│   │   ├── middleware/      # JWT authentication, targetUserId routing, error handling
│   │   ├── models/          # User (Family, Grandpa, Doctor), Medicine, Schedules, Appointments, Contacts
│   │   ├── routes/          # RESTful API endpoints
│   │   ├── services/        # Notification service (Nodemailer, Brevo API/SMTP, SMS)
│   │   └── utils/           # Missed medicine cron scheduler
│   ├── .env.example
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── components/      # ProtectedRoute, Modals, Responsive Layouts
    │   ├── context/         # AuthContext, SocketContext
    │   ├── pages/
    │   │   ├── Auth/        # Login, 2-Step OTP Register
    │   │   ├── Doctor/      # Dedicated Doctor Dashboard & Clinical Portal
    │   │   ├── Family/      # Recharts analytics, Inventory CRUD, AI Chatbot, Export Reports
    │   │   └── Grandpa/     # Accessible UI, Voice Synthesizer, Audio Alarms
    │   └── services/        # Axios API client
    └── Dockerfile
```

---

## 🚀 Quick Start Guide

### Option A: Local Development

#### 1. Prerequisites
- **Node.js**: v18 or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas connection URI

#### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Runs the REST API server on `http://localhost:5000`.

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Runs the Vite React application on `http://localhost:5173`.

---

### Option B: Docker Compose (Production Setup)

Spin up the entire application stack (MongoDB, Node API, and React Frontend) with a single command:
```bash
docker-compose up --build
```
- **Frontend App**: `http://localhost`
- **Backend API**: `http://localhost:5000`
- **MongoDB**: `http://localhost:27017`

---

## ⚙️ Environment Variables Setup

### Backend (`backend/.env`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/meditracker
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Email Configuration (Brevo / Gmail SMTP)
EMAIL_SERVICE=brevo
BREVO_USER=your_brevo_account_email@gmail.com
BREVO_KEY=xsmtpsib-your-smtp-api-key
```

### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🤖 AI Assistant Capabilities

MediTracker AI features an intelligent statistical engine and NLP chatbot. Try querying:
- *"Did Grandpa take today's morning medications?"*
- *"Which medicines are running low in stock?"*
- *"When is the next predicted refill date?"*
- *"Check potential interaction between Metformin and Aspirin."*

---

## 📄 License
This project is open-source under the MIT License.
