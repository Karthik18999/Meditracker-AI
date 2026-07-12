# MediTracker AI - Full Stack Healthcare Adherence Platform

MediTracker AI is a complete, production-ready full-stack application designed to guarantee medicine compliance for elderly patients while allowing family members to monitor and configure schedule routines remotely.

---

## Key Features

### 👴 Grandpa Mode Dashboard
- **Extreme Accessibility**: Very large text scaling, oversized buttons, high-contrast layouts.
- **Voice Synthesis Assistant**: Speaks instruction directives on page load and checked-off status out loud using the browser Web Speech API.
- **Web Audio Alarm System**: Double beep alert synth rings automatically when a medicine is due.
- **Fullscreen Overdue Warnings**: Locks Grandpa's screen if a medication is late until confirmed.
- **Single-Tap Checkoff**: Tapping "Take Medicine" marks it completed, logs timestamp, updates inventory, and notifies the family in real-time.
- **Care Mode Emergency Button**: Single-tap triggers location fetching, sends email/SMS alerts to contacts, and alerts active family dashboards via Socket.io.

### 🧑‍⚕️ Family Monitor Dashboard
- **Live Status Stream**: Socket.io updates statistics, inventory, and charts live when Grandpa confirms his doses.
- **Medicine CRUD & Schedules**: Set names, dosages, visual colors, medicine types, before/after meals timing, and custom schedules.
- **Refill Predictor**: Tracks stock rates and projects precise refill dates.
- **AI Health Assistant Chatbot**: Natural language helper providing prompt answers on stock counts, compliance history, and missed doses.
- **Reports Export**: Generates local PDFs and Excel spreadsheets.
- **Doctor appointments tracker** & **Emergency contact directory**.

---

## Directory Structure
```
Meditracker AI/
├── docker-compose.yml     # Orchestrates DB, backend and frontend
├── backend/
│   ├── src/
│   │   ├── config/        # Mongoose DB config, Socket connection hooks
│   │   ├── controllers/   # Auth, Medicine, Logs, AI, Doctor, Contacts
│   │   ├── middleware/    # Auth token verification & error formatters
│   │   ├── models/        # Schemas (User, Medicine, Schedules, Logs)
│   │   ├── routes/        # REST routing controllers
│   │   ├── services/      # Nodemailer alerts, Twilio mocks
│   │   └── utils/         # 15/30/45/60 min missed doses cron scheduler
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── components/    # Navigation protection, Layout overlays
    │   ├── context/       # Auth state, Real-time Socket sync
    │   ├── pages/
    │   │   ├── Auth/      # Modern sliding login & register
    │   │   ├── Family/    # Recharts trends, CRUD grids, Excel downloads, chatbot
    │   │   └── Grandpa/   # Big button screens, Voice synthesizers, Audio alarms
    │   └── services/      # Axios endpoints
    └── Dockerfile
```

---

## Setup & Execution Guide

### Method A: Docker Compose (Production Build)
Start the entire database and microservices mesh instantly:
```bash
docker-compose up --build
```
- **Frontend URL**: `http://localhost`
- **Backend Port**: `http://localhost:5000`
- **Database Port**: `http://localhost:27017`

### Method B: Local Development
Ensure you have **Node.js (v18+)** and a local running instance of **MongoDB**.

#### 1. Setup Backend
```bash
cd backend
npm install
npm run dev
```
Runs API server on `http://localhost:5000`.

#### 2. Setup Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Runs React development server on `http://localhost:5173`.

---

## AI Insights & Chatbot Prompts
The application features a statistical forecasting engine that projects inventory depletion dates and aggregates compliance statistics. Try asking the chatbot:
- *"Did Grandpa take today's medicines?"*
- *"How many tablets are remaining?"*
- *"When should I buy medicines?"*
- *"Show this month's adherence."*

---

## Environment Variables Configuration

### Backend (`backend/.env`):
- `PORT` (Default: `5000`)
- `MONGODB_URI` (Default: `mongodb://localhost:27017/meditracker`)
- `JWT_SECRET` (Secure JWT key)
- `EMAIL_USER` (Nodemailer alert dispatch mailbox)
- `EMAIL_PASS` (Mailbox password)

### Frontend (`frontend/.env`):
- `VITE_API_URL` (Default: `http://localhost:5000/api`)
- `VITE_SOCKET_URL` (Default: `http://localhost:5000`)
