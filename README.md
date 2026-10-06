# 🩺 MediTracker AI

<div align="center">

![MediTracker Banner](https://img.shields.io/badge/MediTracker%20AI-Healthcare%20%26%20Adherence%20Platform-0284c7?style=for-the-badge&logo=medicare&logoColor=white)

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**An intelligent, multi-role full-stack healthcare ecosystem connecting Elderly Patients (Grandpa Mode), Family Caregivers (Family Mode), and Healthcare Providers (Doctor Mode) in real time.**

[Features](#-key-features--role-portals) • [Architecture](#-project-architecture) • [Quick Start](#-quick-start-guide) • [Environment Setup](#%EF%B8%8F-environment-variables) • [License](#-license)

</div>

---

## 💡 Overview

**MediTracker AI** bridges the gap between elderly patients, family caregivers, and physicians. Designed for maximum accessibility, reliability, and real-time responsiveness, MediTracker AI ensures zero missed doses, instant emergency alerts with live location tracking, seamless prescription sharing, and AI-powered clinical guidance.

---

## 🌟 Key Features & Role Portals

### 👴 1. Grandpa Mode Dashboard (`/grandpa`)
* **Extreme Accessibility UI**: Oversized touch controls, high-contrast visual indicators, and simple single-tap actions.
* **One-Tap "I Have Taken Tablet"**: Grandpa logs medication with one tap. Stock counts automatically decrement, adherence logs populate, and live Socket.IO events update both Doctor & Family dashboards.
* **Voice Assistant & Speech Synthesis**: Uses the native Web Speech API to speak medicine names, dosages, and friendly instructions out loud.
* **Audible Medication Reminders**: Built-in sound synthesis alarms notify Grandpa when a scheduled medication is due or overdue.
* **One-Tap Critical SOS Emergency**: Single press immediately captures live GPS coordinates, emits socket alerts, and triggers an urgent audible alarm sweep on family dashboards.

---

### 🧑‍🧑‍🧒 2. Family Caregiver Dashboard (`/family`)
* **Live Emergency Alerting & Audio Siren**: Receives instant emergency alerts when Grandpa requests help. Features an automatic repeating Web Audio synthesizer siren sound and live GPS map pin urging family to visit immediately.
* **Real-Time Adherence Monitoring**: Live Socket.io feed displaying dosage logs, adherence statistics, and medicine compliance charts in real time.
* **Prescription & Inventory Tracking**: Full CRUD management for medicines, dosage schedules, food timing relations, color tags, and stock counts with low-refill alerts.
* **AI Health Assistant Chatbot**: Natural language query engine to check medicine stock, compliance rates, and recent dose updates.
* **Clinical Export & Reports**: Instant PDF health report and Excel spreadsheet export capabilities.

---

### 🩺 3. Doctor Portal & Dashboard (`/doctor`)
* **Dual-Email Prescription Routing**: When prescribing medicines, Doctor Mode accepts both **Family Email** and **Grandpa Email**, automatically synchronizing prescribed regimens to both Grandpa and Family dashboards.
* **Real-Time Dose Adherence Track**: Doctor Mode tracks when Grandpa logs dosage completion ("I have taken tablet"), showing full adherence records.
* **Clinical Notes & Visit Logs**: Record consultation notes, diagnosis summaries, lab report uploads, and follow-up schedules visible directly in Family Mode.
* **AI Clinical Assistant**: Built-in AI assistant trained to analyze drug interactions, dosage compliance history, and patient health trends.

---

### 🔐 4. Seamless Direct Authentication
* **Streamlined Sign-up & Login**: Instant 1-step registration without cumbersome email verification wait times.
* **Role-Based Access Control (RBAC)**: Dedicated permissions and token security for Doctor, Family, and Grandpa profiles.

---

## 🏗️ Project Architecture

```
MediTracker AI/
├── docker-compose.yml       # Production container orchestration
├── backend/
│   ├── src/
│   │   ├── config/          # MongoDB Mongoose connection & Socket.io setup
│   │   ├── controllers/     # Auth, Medicines, Logs, Emergency, Appointments, AI Chatbot
│   │   ├── middleware/      # JWT RBAC verification, error handling
│   │   ├── models/          # User, Medicine, Schedule, Appointment, Log schemas
│   │   ├── routes/          # Express REST API routes
│   │   ├── services/        # Socket notification & email service integration
│   │   └── utils/           # Missed dose cron schedulers
│   ├── .env.example
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── components/      # Emergency alert banners, modals, protected routes
    │   ├── context/         # AuthContext, SocketContext (WebSockets)
    │   ├── pages/
    │   │   ├── Auth/        # Login & Register views
    │   │   ├── Doctor/      # Doctor Portal, Prescriptions & Notes
    │   │   ├── Family/      # Live adherence, Inventory, Emergency Siren, AI Chatbot
    │   │   └── Grandpa/     # Accessibility UI, Speech Assistant, SOS Alert
    │   └── services/        # Axios API client
    └── Dockerfile
```

---

## ⚡ Quick Start Guide

### Option A: Local Development

#### 1. Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: Local MongoDB server or MongoDB Atlas URI

#### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Backend API will start on **`http://localhost:5000`**.

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend App will start on **`http://localhost:5173`**.

---

### Option B: Docker Compose (Production Deployment)

Spin up MongoDB, Node.js API, and React Frontend in isolated containers with a single command:
```bash
docker-compose up --build
```
- 🌐 **Frontend Application**: `http://localhost`
- ⚙️ **Backend REST API**: `http://localhost:5000`
- 🗄️ **MongoDB Database**: `http://localhost:27017`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/meditracker
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## 🤖 AI Assistant Capabilities

The integrated AI assistant provides intelligent health insights for caregivers and doctors:
* 💬 *"Did Grandpa take his morning Metformin today?"*
* 📦 *"Which medicines are running low in stock this week?"*
* ⚠️ *"Check potential interactions between Aspirin and Lisinopril."*
* 📊 *"Summarize Grandpa's adherence rate over the last 30 days."*

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) - feel free to use, modify, and distribute.

---

<div align="center">
  <sub>Built with ❤️ for elderly care and family peace of mind.</sub>
</div>
