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

*   **Backend:** Python, Django, Django REST Framework (DRF)
*   **Real-Time Engine:** Django Channels (WebSockets) + Redis
*   **Database:** SQLite (Prototyping) / Spatial logic for geofencing
*   **Web Frontend (Dashboard):** React.js, Tailwind CSS, shadcn/ui, Framer Motion
*   **Mobile App (Patient/Pharmacy):** Flutter, Dart, `speech_to_text` for Voice API

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