# Web Frontend Sprint Plan (React + TS + SWC)

## Day 1: Auth, Routing, & Onboarding (Tuesday, Feb 24 - 12:00 PM Onwards)
*   **12:00 PM - 2:00 PM:** Initialize React + Vite (SWC) + TypeScript project. Install Tailwind CSS, `shadcn/ui`, `react-hook-form`, `zod`, and `react-router-dom`.
*   **2:00 PM - 4:00 PM:** Build the Dual Auth Page (Login/Register). Implement Zod schemas for the exact Patient and Pharmacy fields.
*   **4:00 PM - 5:00 PM:** Write the `useGeolocation` custom hook and integrate a basic map picker for Pharmacy registration.
*   **5:00 PM - 7:00 PM:** Build the Protected Routes logic. Build the Pharmacy Profile Verification page (Photo, License, PAN upload zones).

## Day 2: The Dashboards & Bento Grid (Wednesday, Feb 25)
*   **Morning:** Build the Patient Dashboard. Implement the "Sanjeevani Radar" UI (Map view, broadcast form, radius slider).
*   **Afternoon:** Build the Pharmacy Dashboard. Implement the "FOMO Ledger" and the incoming request Bento Grid layout.
*   **Evening:** Ensure strict adherence to the Bento Grid design system (No gradients, 1px solid borders, solid colors: Evergreen/Cinnabar).

## Day 3: Real-Time & Audio APIs (Thursday, Feb 26)
*   **Morning:** Integrate standard REST APIs (Login, Register, Upload Documents) with Axios/Fetch.
*   **Afternoon:** Connect WebSocket logic. Ensure the React app can receive real-time pings and update the UI state instantly without refreshing.
*   **Evening:** Implement the `Web Audio API` to trigger the "Background Siren" for pharmacies when a ping arrives.

## Day 4: Demo Prep & Polish (Friday, Feb 27)
*   **Morning:** UI Polish. Check all form error states, loading spinners, and empty states.
*   **10:00 AM:** Code Freeze.
*   **12:00 PM:** Run full E2E demo test on localhost (Open two incognito windows: One Patient, One Pharmacy).