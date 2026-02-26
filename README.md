# 🌿 Sanjeevani (संजीवनी)
**The digital Hanuman for Nepal's fragmented healthcare.**  
*Stop the search. Start the finding.*

[![Built for Clash-A-Thon 2026](https://img.shields.io/badge/Built_for-Clash--A--Thon_2026-2D5A40?style=for-the-badge)](https://clash-a-thon.com)
[![Theme](https://img.shields.io/badge/Theme-The_Friction_We_Forget-FF6B35?style=for-the-badge)]()
[![Tech Stack](https://img.shields.io/badge/Stack-Django_|_React_|_Flutter-1C1917?style=for-the-badge)]()

---

## 🛑 The Friction We Forget
In Nepal, the pharmaceutical market is offline and highly fragmented. When a patient needs critical or rare medication (like specific insulin, post-surgery antibiotics, or psychiatric meds), family members are forced into a physical "treasure hunt." They drive from shop to shop, asking *"Do you have this?"* only to hear *"Chaina, tyo mathi ko chowk ma hernus"* (Don't have it, check the upper junction).

We tolerate this friction because we assume checking inventory requires physically visiting the shop. This causes measurable waste: **wasted time, wasted fuel, and immense anxiety for patients waiting for relief.**

## 💡 The Solution: A Reverse-Marketplace
**Sanjeevani** digitizes the question *"Do you have this?"* instead of forcing pharmacies to digitize their entire inventory. 
Users broadcast their prescription to pharmacies within a specific radius. Pharmacies receive a real-time ping and simply reply "Yes" or "No". The user gets a live map of exactly who has the medicine right now.

## 🏆 What Makes This Different
Unlike traditional pharmacy apps that require shopkeepers to upload and maintain a full digital inventory (a behavioural change they'll never adopt), Sanjeevani requires **zero prior digitisation**. The entire system activates on demand — the patient asks, the pharmacist answers, the match happens in under 42 seconds.

---

## ✨ Groundbreaking Features

### 🟢 For the "Seeker" (Patient View)
*   **Sanjeevani Radar:** A geofenced broadcast system. Set a radius (1km - 5km) and watch a real-time sonar ping nearby pharmacies.
*   **Privacy Shield:** On-screen image redaction. Users can physically draw a black block over sensitive patient info on the prescription before broadcasting.
*   **Urgency Triage:** Toggle an "Emergency" switch for life-critical meds. Pings show up as flashing Cinnabar (Red) on the pharmacist's screen instead of standard Evergreen.
*   **The Digital Handshake:** A 10-minute countdown lock. When a user clicks "I'm Coming," the pharmacy holds the medicine, ensuring it isn't sold while the user is in traffic.

### 🔵 For the "Keeper" (Pharmacy Dashboard)
*   **Awaz (Hands-Free Voice Response) 🎙️:** Pharmacists have busy, dirty hands. When a ping arrives, the device wakes up and listens. The pharmacist simply shouts **"CHA!"** (Yes) or **"CHAINA!"** (No) to accept or reject the request.
*   **Vikalpa (Substitute Suggester):** If the exact brand isn't available, pharmacists can instantly suggest and price an alternative generic substitute.
*   **FOMO Ledger:** A data-dense dashboard showing missed requests. Uses FOMO (Fear Of Missing Out) to show shopkeepers exactly how much potential revenue they lost by ignoring pings.

---

## 📐 UI / UX Architecture
The web dashboard is built strictly using a **Bento Grid** architecture.
*   **Philosophy:** Mechanical Precision. No gradients, no floating soft cards. 
*   **Layout:** Flush, modular, solid-color compartments utilizing CSS Grid.
*   **Color Palette:**
    *   `Evergreen (#2D5A40)` - Brand & Trust
    *   `Cinnabar (#FF6B35)` - Action & Alerts
    *   `Soft Stone (#FAFAF9)` - Grid Background

---

## 🛠️ Tech Stack
This project uses a unified API architecture to serve both Web and Mobile clients in real-time.

| Layer | Technology |
|---|---|
| **Backend** | Python, Django, Django REST Framework (DRF) |
| **Real-Time Engine** | Django Channels (WebSockets) + Redis |
| **Database** | SQLite (Prototyping) / Spatial logic for geofencing |
| **Auth** | Firebase Authentication + JWT |
| **Web Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| **Mobile App** | Flutter, Dart, `speech_to_text` for Voice API |

---

## 🚀 How to Run Locally

### 1. Backend (Django)
```bash
cd backend
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Web Frontend (React)
```bash
cd web
npm install
npm run dev
```

### 3. Mobile App (Flutter)
```bash
cd mobile
flutter pub get
flutter run
```

> **Note:** Redis must be running locally for WebSocket support.  
> `docker run -p 6379:6379 redis` or install Redis natively.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
SECRET_KEY=your_django_secret_key_here
DEBUG=True
REDIS_URL=redis://localhost:6379
ALLOWED_HOSTS=localhost,127.0.0.1
```

### Firebase (`backend/firebase-credentials.json`)
Place your Firebase service account JSON file at `backend/firebase-credentials.json`.  
Download it from **Firebase Console → Project Settings → Service Accounts → Generate new private key**.

### Web Frontend (`web/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
```

---

## 🌐 Deployment

| Platform | Link |
|---|---|
| **Web App (Pharmacy Dashboard)** | _Coming soon_ |
| **Mobile APK (Patient App)** | _Coming soon_ |
| **Backend API** | _Coming soon_ |

---

## 👥 Team Members

| Name | Role |
|---|---|
| **Shovan Bhattai** | Full-Stack & Web Lead |
| **Abhishek Sharma** | Full Stack & Mobile Lead |
| **Sudan Khadka** | Full Stack & Backend Lead|
| **Raghav Dahal** | Full Stack & Backend Lead |
| **Pranisha Karki** | Full Stack & Web Lead |
