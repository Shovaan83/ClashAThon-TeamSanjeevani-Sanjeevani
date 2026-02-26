# Sanjeevani — System Architecture

> **Theme:** The Friction We Forget — *Building solutions for problems we've stopped noticing in Nepal.*

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Backend (Django)](#3-backend-django)
4. [Real-Time Engine](#4-real-time-engine)
5. [Web Frontend (React)](#5-web-frontend-react)
6. [Mobile App (Flutter)](#6-mobile-app-flutter)
7. [Data Models](#7-data-models)
8. [API Reference](#8-api-reference)
9. [Key Flows](#9-key-flows)
10. [Infrastructure & Config](#10-infrastructure--config)
11. [Design System](#11-design-system)

---

## 1. System Overview

Sanjeevani is a **tri-platform healthcare ecosystem** solving two critical frictions in Nepali healthcare:

| Problem | Solution |
|---|---|
| **The Medicine Hunt** — patients visiting 5+ pharmacies to find rare stock | **Sanjeevani Radar** — geofenced real-time broadcast to nearby pharmacies |
| **Dosage Confusion** — elderly patients missing pills or ignoring food rules | **Medicine Reminder** — culturally localised alarms with Nepali dosage logic |

Unlike traditional pharmacy apps that require a full digital inventory, Sanjeevani requires **zero prior digitisation**. The entire system activates on demand — the patient asks, the pharmacist answers, the match happens in under 42 seconds.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│                                                             │
│   ┌──────────────────┐        ┌──────────────────────────┐  │
│   │  Web App (React) │        │  Mobile App (Flutter)    │  │
│   │  Pharmacy Dash   │        │  Patient / Pharmacy App  │  │
│   └────────┬─────────┘        └────────────┬─────────────┘  │
│            │  HTTPS / WSS                  │  HTTPS / WSS   │
└────────────┼──────────────────────────────-┼────────────────┘
             │                               │
┌────────────▼───────────────────────────────▼────────────────┐
│                   Django Backend (DRF)                       │
│                                                             │
│   REST API  ·  WebSocket (Channels)  ·  Celery Tasks        │
│                                                             │
│   accounts  ·  pharmacy  ·  medicine  ·  customer           │
│   DailyRemainder  ·  fomo  ·  adminapis  ·  accountsprofile │
└───────────┬────────────────────────────┬────────────────────┘
            │                            │
   ┌────────▼────────┐        ┌─────────▼──────────┐
   │   SQLite / DB   │        │   Redis             │
   │   (Prototype)   │        │   Channel Layer +   │
   └─────────────────┘        │   Celery Broker     │
                               └─────────────────────┘
                                          │
                               ┌──────────▼──────────┐
                               │  Firebase FCM        │
                               │  Push Notifications  │
                               └─────────────────────┘
```

---

## 3. Backend (Django)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Python · Django 4.x · Django REST Framework |
| Real-Time | Django Channels 4.x (ASGI) |
| Task Queue | Celery + Redis |
| Database | SQLite3 (prototype) |
| Auth | Firebase Authentication + SimpleJWT (access: 1 day · refresh: 7 days) |
| Notifications | Firebase Cloud Messaging (FCM) |
| API Docs | drf-yasg (Swagger `/swagger/` · ReDoc `/redoc/`) |
| Timezone | `Asia/Kathmandu` |

### Django Apps

```
backend/
├── core/               # settings, urls, asgi, wsgi
├── accounts/           # CustomUser, OTP email verification
├── pharmacy/           # Pharmacy model, KYC documents, SSE stream
├── medicine/           # MedicineRequest, PharmacyResponse — core broadcast loop
├── customer/           # Customer profile & request history
├── accountsprofile/    # PharmacyProfile CRUD
├── DailyRemainder/     # Alarm, Medicine, AlarmOccurrence, DeviceToken
├── fomo/               # MissedOpportunity ledger & analytics
├── adminapis/          # Admin KYC actions, user/pharmacy management
└── utils/              # JWT helpers, email, Firebase SDK wrapper
```

### URL Routing

```
/                    → accounts  (OTP, login, logout)
/customer/           → customer  (register, profile, requests)
/api/profile/        → accountsprofile
/medicine/           → medicine  (request, response, select)
/api/daily-reminder/ → DailyRemainder
/api/fomo/           → fomo
/admin/api/          → adminapis
/admin/              → Django Admin
/swagger/            → Swagger UI
/redoc/              → ReDoc UI
```

### Celery Beat Schedule

| Task | Interval |
|---|---|
| Generate daily occurrences | Daily at midnight |
| Mark missed occurrences | Every 30 minutes |
| Send reminder notifications | Every 2 minutes |
| Record FOMO timeouts | Every 10 minutes |

---

## 4. Real-Time Engine

### Django Channels + Redis

WebSocket connections are managed per entity via named channel groups:

| Group Name | Purpose |
|---|---|
| `pharmacy_{id}` | Push incoming `medicine_request` pings to pharmacy dashboard |
| `user_{id}` | Push `pharmacy_response` events back to the patient |

**Broadcast Flow:**
1. Patient POSTs a `MedicineRequest` → backend runs Haversine geofencing.
2. All pharmacies within `radius_km` are placed in `get_nearby_pharmacies()`.
3. An `incoming_ping` WebSocket event is dispatched to each `pharmacy_{id}` group via Redis channel layer.
4. Pharmacy responds → `pharmacy_response` event sent to `user_{id}` group.
5. Patient selects a pharmacy → request status set to `ACCEPTED`.

### Geofencing (Haversine)

Distance calculation is done in pure Python inside `MedicineRequest.get_nearby_pharmacies()` — no PostGIS required for the prototype.

```
d = 2R · arcsin(√(sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2)))
```

---

## 5. Web Frontend (React)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 · TypeScript · Vite (SWC) |
| Routing | React Router DOM 7 |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui · Radix UI |
| Animations | Framer Motion (motion/react) |
| Maps | Leaflet 1.9 · React Leaflet 5 |
| Charts | Recharts 3 |
| Forms | React Hook Form · Zod |
| HTTP | Axios |

### Route Map

```
PUBLIC
  /home                     → HomePage (landing + AnimatedBeam demo)
  /search                   → SearchPage (pharmacy map search)
  /pharmacy/:id             → PharmacyProfile (public view)
  /login                    → LoginPage
  /signup                   → SignupPage (4-step wizard)

PROTECTED (requires JWT)
  /dashboard                → Redirects by role
  /dashboard/patient        → PatientDashboardPage
  /dashboard/pharmacy       → PharmacyDashboardPage
  /broadcast                → PatientDashboardPage (alias)
  /profile                  → PatientProfilePage
  /pharmacy/analytics       → PharmacyAnalyticsPage
  /pharmacy/requests        → MedicineRequestHistory

ADMIN (role === 'admin')
  /admin                    → AdminDashboard (layout)
  /admin/dashboard          → AdminOverviewPage
  /admin/kyc                → KycPage (pharmacy KYC approvals)
  /admin/pharmacies         → AdminPharmaciesPage
  /admin/users              → AdminUsersPage
```

### Zustand Stores

| Store | Responsibility |
|---|---|
| `useAuthStore` | JWT tokens, user object, role, isAuthenticated |
| `useRequestStore` | Active pharmacy request, voice mode, Vikalpa modal state |
| `usePatientOffersStore` | Patient's list of pharmacy offers, selection state |
| `useNotificationStore` | In-app notification queue |
| `useAdminStore` | KYC documents, pharmacy/user lists, pagination |

### Feature Modules

```
web/src/
├── features/
│   ├── auth/
│   │   ├── pages/          LoginPage · SignupPage
│   │   └── components/     LoginForm · BrandPanel · RoleSwitcher
│   │                       registration/ (EmailStep · OtpStep · ProfileStep)
│   └── home/
│       ├── pages/          HomePage · PatientDashboardPage · PharmacyDashboardPage
│       │                   PharmacyAnalyticsPage · SearchPage · PharmacyProfile
│       │                   admin/ (AdminDashboard · KycPage · AdminPharmaciesPage …)
│       └── components/     BroadcastPanel · RadarMapPanel · IncomingRequestModal
│                           PharmacyOffersPanel · VikalpaPanel · FomoLedger
│                           WeeklyFomoTrend · TopMissedMedicines · ResponseRateCard
│                           AnimatedBeamBroadcast · AnimatedBeamAcceptance
│                           HeroSection · HowItWorksSection · HomeFooter
├── components/
│   ├── Navbar.tsx          (animated SVG logo + role-aware nav links)
│   ├── ProtectedRoute.tsx
│   ├── AdminProtectedRoute.tsx
│   └── ui/                 button · input · input-otp · switch · animated-beam
├── store/                  (Zustand stores)
├── lib/                    (Axios API client)
└── hooks/                  useVoiceRecognition · …
```

### Voice Feature — Awaz

The **Awaz** (Voice Ping) feature uses the **Web Speech API**:
- Pharmacy dashboard wakes on incoming WebSocket ping.
- `useVoiceRecognition` hook listens for "CHA" (have it) or "CHAINA" (don't have it).
- Recognised keyword auto-accepts or declines the request hands-free.

---

## 6. Mobile App (Flutter)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Flutter · Dart (SDK ≥ 3.8) |
| State | Provider 6 |
| HTTP | `http` ^1.6 |
| WebSocket | `web_socket_channel` ^3 |
| Maps | `flutter_map` 8 + `latlong2` |
| Location | `location` ^8 |
| Audio | `record` + `audioplayers` |
| Notifications | Firebase Messaging + `flutter_local_notifications` |
| OCR | `google_mlkit_text_recognition` (prescription scan) |
| Media | `image_picker` |

### Screen Map

```
lib/features/
├── auth/screens/
│   ├── email_screen.dart
│   ├── otp_verification_screen.dart
│   ├── signup_screen.dart
│   ├── signup_details_screen.dart
│   └── login_screen.dart
├── home/screens/
│   ├── main_screen.dart           (role-based entry)
│   ├── patient_home_content.dart
│   ├── pharmacy_home_content.dart
│   ├── add_screen.dart            (new request)
│   ├── search_screen.dart
│   ├── request_detail_screen.dart
│   ├── notification_screen.dart
│   ├── profile_screen.dart
│   └── broadcast/
│       ├── screens/pharmacy_offers_screen.dart
│       └── widgets/
│           ├── prescription_uploader_widget.dart
│           └── radius_selector_widget.dart
├── daily_rem/screens/
│   ├── daily_reminders_screen.dart
│   └── add_alarm_screen.dart
└── chatbot/
    ├── screens/chatbot_screen.dart
    └── services/chatbot_service.dart
```

---

## 7. Data Models

### `accounts` — CustomUser

| Field | Type | Notes |
|---|---|---|
| `email` | EmailField | Unique, used as username |
| `name` | CharField | Full name |
| `phone_number` | CharField | |
| `role` | CharField | `ADMIN` · `PHARMACY` · `CUSTOMER` |

### `pharmacy` — Pharmacy + PharmacyDocument

| Model | Key Fields |
|---|---|
| `Pharmacy` | user (OneToOne), name, profile_photo, address, lat, lng |
| `PharmacyDocument` | pharmacy (OneToOne), document, status (`PENDING/APPROVED/REJECTED`), message |

### `medicine` — MedicineRequest + PharmacyResponse

| Model | Key Fields |
|---|---|
| `MedicineRequest` | patient (FK), pharmacy (FK nullable), patient_lat/lng, radius_km, quantity, image, status (`PENDING/ACCEPTED/REJECTED/CANCELLED`) |
| `PharmacyResponse` | request (FK), pharmacy (FK), response_type (`ACCEPTED/REJECTED/SUBSTITUTE`), audio, text_message, substitute_name, substitute_price |

### `DailyRemainder` — Alarm System

| Model | Key Fields |
|---|---|
| `Medicine` | user (FK), name |
| `Alarm` | medicine (FK), start/end date, times_per_day, interval_days, custom_weekdays (JSON), timezone, is_active |
| `AlarmOccurrence` | alarm (FK), scheduled_at, taken_at, status (`scheduled/taken/missed/skipped`) |
| `DeviceToken` | user (FK), token, platform (`android/ios`), is_active |

### `fomo` — MissedOpportunity

| Field | Type |
|---|---|
| `pharmacy` | FK → Pharmacy |
| `item_name` | CharField |
| `amount_lost` | DecimalField |
| `timestamp` | DateTimeField |

---

## 8. API Reference

### Auth (`/`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/send-otp` | Send OTP to email |
| POST | `/verify-otp` | Verify OTP |
| POST | `/login` | Unified login → returns JWT pair |
| POST | `/logout` | Blacklist refresh token |

### Medicine (`/medicine/`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/medicine/request/` | Patient creates request; triggers WebSocket broadcast |
| POST | `/medicine/response/` | Pharmacy responds (accept/reject/substitute + audio) |
| GET | `/medicine/response/` | List responses (filtered by role) |
| POST | `/medicine/select/` | Patient selects a pharmacy offer |

### Pharmacy (`/`)

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/register-pharmacy/` | Create or list pharmacy |
| GET | `/events/` | SSE stream for real-time updates |
| GET/PUT | `/pharmacy/profile/` | View/update pharmacy profile |
| POST | `/pharmacy/document/upload/` | Upload KYC document |
| POST | `/pharmacy/profile-photo/upload/` | Upload profile photo |

### Daily Reminder (`/api/daily-reminder/`)

| Method | Endpoint | Description |
|---|---|---|
| GET/POST | `/medicines/` | List or create medicines |
| GET/PUT/DELETE | `/medicines/<id>/` | Detail view |
| GET/POST | `/alarms/` | List or create alarms |
| GET/PUT/DELETE | `/alarms/<id>/` | Detail view |
| GET | `/occurrences/` | List today's occurrences |
| PATCH | `/occurrences/<id>/` | Mark taken/skipped |
| POST | `/device-tokens/` | Register FCM token |
| GET | `/dashboard/` | Reminder dashboard summary |

### FOMO (`/api/fomo/`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Today's missed opportunities |
| GET | `/analytics/` | Response rate & avg response time |
| GET | `/weekly/` | 7-day missed revenue trend |
| GET | `/top-missed/` | Top 5 most missed medicines |

### Admin (`/admin/api/`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/pharmacies/` | Paginated pharmacy list |
| GET | `/pharmacy/<id>/` | Pharmacy detail |
| GET | `/pharmacy-documents/` | KYC queue |
| POST | `/pharmacy/<id>/kyc/` | Approve or reject KYC |
| GET | `/users/` | Paginated user list |

---

## 9. Key Flows

### Flow 1 — Medicine Broadcast (Radar)

```
Patient App
  │  POST /medicine/request/ { image, lat, lng, radius_km, quantity }
  ▼
Backend
  │  1. Create MedicineRequest (status=PENDING)
  │  2. Run Haversine geofencing → list of pharmacies within radius
  │  3. For each pharmacy → send WebSocket event to pharmacy_{id} group
  ▼
Pharmacy Dashboard (Web / Mobile)
  │  Receives incoming_ping event
  │  Plays audio alert, shows IncomingRequestModal
  │  Pharmacist says "CHA" (voice) or taps Accept
  │  POST /medicine/response/ { response_type=ACCEPTED, request_id }
  ▼
Backend
  │  Create PharmacyResponse
  │  Send pharmacy_response WebSocket event to user_{id} group
  ▼
Patient App
  │  PharmacyOffersPanel updates with new offer
  │  Patient selects pharmacy → POST /medicine/select/
  │  MedicineRequest status → ACCEPTED
```

### Flow 2 — Pharmacy KYC Onboarding

```
Pharmacy signs up → multi-step registration (email → OTP → profile → docs)
  │  POST /pharmacy/document/upload/ → PharmacyDocument (status=PENDING)
  ▼
Admin Dashboard
  │  GET /admin/api/pharmacy-documents/ → KYC queue
  │  POST /admin/api/pharmacy/<id>/kyc/ { action: 'approve' | 'reject' }
  ▼
PharmacyDocument.status → APPROVED / REJECTED
Pharmacy can now receive pings
```

### Flow 3 — Daily Medicine Reminder

```
Patient adds medicine → POST /api/daily-reminder/medicines/
Patient creates alarm → POST /api/daily-reminder/alarms/
  │  { times_per_day: 2, interval_days: 1, start_date, end_date, timezone }
  ▼
Celery Beat (midnight)
  │  generate_daily_occurrences task → AlarmOccurrence rows created
  ▼
Celery Beat (every 2 min)
  │  send_reminder_notifications → FCM push via Firebase → mobile alert
  ▼
Patient marks dose → PATCH /api/daily-reminder/occurrences/<id>/ { status: 'taken' }
Celery Beat (every 30 min)
  │  check_missed_occurrences → status → 'missed'
```

### Flow 4 — FOMO Ledger

```
Pharmacy receives ping but does not respond within timeout window
  ▼
Celery Beat (every 10 min)
  │  record_fomo_timeouts → MissedOpportunity { item_name, amount_lost }
  ▼
Pharmacy Dashboard
  │  GET /api/fomo/ → FomoLedger component (today's Rs. lost)
  │  GET /api/fomo/weekly/ → WeeklyFomoTrend (Recharts bar chart)
  │  GET /api/fomo/top-missed/ → TopMissedMedicines
```

### Flow 5 — Vikalpa (Substitute Offer)

```
Pharmacy does not have requested medicine
  │  POST /medicine/response/ { response_type=SUBSTITUTE, substitute_name, substitute_price }
  ▼
Patient App
  │  Offer appears in PharmacyOffersPanel with substitute details
  │  Patient can accept substitute or wait for another offer
```

---

## 10. Infrastructure & Config

### Environment Variables

**Backend (`backend/.env`)**
```env
SECRET_KEY=
DEBUG=True
REDIS_URL=redis://localhost:6379
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Firebase (`backend/firebase-credentials.json`)**
Service account key from Firebase Console → Project Settings → Service Accounts.

**Web Frontend (`web/.env`)**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
```

### Running Locally

```bash
# 1. Redis (required for WebSockets + Celery)
docker run -p 6379:6379 redis

# 2. Backend
cd backend
python -m venv env && env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver        # ASGI via daphne in production

# Celery worker + beat (separate terminals)
celery -A core worker -l info
celery -A core beat -l info

# 3. Web
cd web && npm install && npm run dev

# 4. Mobile
cd mobile && flutter pub get && flutter run
```

---

## 11. Design System

The UI follows a strict **Bento Grid Doctrine** — the app must feel like a precision medical instrument.

### Rules

- **No gradients. No soft shadows.** Crisp 1px borders only.
- **Bento Grid Layout** — UI grouped in compartmentalised cells.
- **Tailwind (Web):** `border-stone-200` · `rounded-sm` · `bg-[#FAFAF9]`
- **Flutter (Mobile):** `Border.all(color: Color(0xFFE7E5E4), width: 1.0)` · `BorderRadius.circular(4.0)` · no `boxShadow`

### Colour Palette

| Token | Hex | Flutter | Usage |
|---|---|---|---|
| Brand Evergreen | `#2D5A40` | `Color(0xFF2D5A40)` | Primary actions · trust · success |
| Action Cinnabar | `#FF6B35` | `Color(0xFFFF6B35)` | Alerts · pings · emergency |
| Surface Soft Stone | `#FAFAF9` | `Color(0xFFFAFAF9)` | Grid backgrounds |
| Text Stone Black | `#1C1917` | `Color(0xFF1C1917)` | Headings |

### Nepali UX Context

| Term | Meaning | Usage |
|---|---|---|
| **Cha** | Yes / Have it | Pharmacy voice accept trigger |
| **Chaina** | No / Don't have it | Pharmacy voice decline trigger |
| **Khali Pet** | Empty stomach | Alarm warning label |
| **Khana Pachi** | After food | Alarm timing label |
| **1-0-1** | Morning & Night | Doctor dosage notation |
| **1-1-1** | Morning, Midday, Night | Doctor dosage notation |
| **Rs.** | Nepali Rupees | FOMO ledger currency |

---

*Sanjeevani — Built for Clash-A-Thon 2026. Team: Shovan Bhattai · Abhishek Sharma · Sudan Khadka · Raghav Dahal · Pranisha Karki*
