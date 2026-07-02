# MediShield AI 🚀

> AI-powered medication safety platform that prevents harmful drug interactions by securely unifying prescriptions from multiple doctors
---

## 🎯 What It Does

MediShield AI helps elderly and chronic patients who receive prescriptions from multiple doctors by creating a unified digital medication record. Using AI, OCR, and trusted medical knowledge, it detects dangerous drug interactions, duplicate medications, dosage conflicts, and securely shares records with doctors only through patient-approved consent.

---

## 👥 Team

- **Swathi N** – AI/ML Engineer
- **Keerthana G** – Research & Documentation
- **Praveen N** – Frontend Developer
- **Prasanna V** – UI/UX Designer
- **Umaiyaoandiyan B** – Backend Developer

---

## 🚀 How to Run It

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/MediShield-AI.git

# Navigate to project directory
cd MediShield-AI

# Install frontend dependencies
cd mobile
npm install

# Install backend dependencies
cd ../backend
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Add your API keys and database credentials

# Start Backend
uvicorn app.main:app --reload

# Start Frontend
cd ../mobile
npm start
```

Open the Expo app or emulator to run the application.

---

# ✨ Features

✅ AI Drug Interaction Detection

✅ OCR Prescription Scanner

✅ Unified Medication History

✅ OTP-Based Doctor Access

✅ Smart Medicine Reminders

✅ AI-Powered Medication Safety Reports

✅ Daily Health Monitoring

✅ Downloadable Digital Health Report

---

# 🛠️ Tech Stack

## Frontend

- React Native (Expo)
- React.js (Admin Dashboard)
- TypeScript

## Backend

- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication

## AI/ML

- LangChain (RAG)
- FAISS Vector Database
- Claude API
- Tesseract OCR
- Whisper Speech-to-Text
- 
---

## 📌 Problem Statement

Patients, especially elderly individuals, often consult multiple specialists who prescribe medications independently. Since doctors cannot view each other's prescriptions, dangerous drug interactions, duplicate medicines, and dosage errors frequently go unnoticed.

---

## 💡 Our Solution

MediShield AI acts as a centralized medication safety platform that securely stores prescriptions, continuously checks all active medicines using AI, alerts patients about potential risks, and allows verified doctors to access records only with patient consent.

---

## 🔒 Privacy & Security

- Patient-controlled OTP-based access
- JWT Authentication
- Encrypted medical records
- Complete audit logs
- Role-based access control (Patient, Doctor, Admin)

---

## 🌍 Future Scope

- Integration with Hospital Information Systems (HIS)
- Wearable device support
- Voice assistant for elderly users
- Multi-language support
- Predictive health risk analysis

---

## 📄 License

This project was developed as part of a 36-Hour Hackathon.
