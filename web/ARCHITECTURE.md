# React Web Architecture & Routing

## 1. Technology Stack
*   **Framework:** React 18 + Vite (SWC compiler for extreme speed)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (Strict Bento Grid, no gradients)
*   **Components:** shadcn/ui (Radix UI primitives)
*   **Form Management:** `react-hook-form` + `@hookform/resolvers/zod` + `zod`
*   **Routing:** `react-router-dom` (v6)

## 2. Folder Structure
```text
src/
├── assets/             # Logos, Samarkan font files
├── components/
│   ├── ui/             # shadcn reusable components (buttons, inputs)
│   ├── auth/           # LoginForm.tsx, RegisterPatientForm.tsx, RegisterPharmacyForm.tsx
│   ├── map/            # LocationPicker.tsx (Leaflet/Mapbox wrapper)
│   └── shared/         # BentoGridWrapper.tsx, Navbar.tsx
├── hooks/
│   ├── useAuth.ts          # Manages JWT and user session
│   ├── useGeolocation.ts   # HTML5 Geolocation API wrapper
│   └── useWebSocket.ts     # Django Channels connection manager
├── lib/
│   ├── api.ts          # Axios instance with interceptors for JWT
│   └── schemas.ts      # Zod validation schemas (Auth, Uploads)
├── pages/
│   ├── auth/
│   │   └── AuthIndex.tsx           # Split screen login/register
│   ├── profile/
│   │   ├── PatientProfile.tsx      # Patient details
│   │   └── PharmacyVerification.tsx# Document uploads
│   └── dashboard/
│       ├── PatientRadar.tsx        # The ping screen
│       └── PharmacyLedger.tsx      # The FOMO ledger & incoming pings
├── App.tsx             # Route definitions
└── main.tsx            # Entry point