# Web Frontend Functional Specifications (React + Zustand)

*Legend: ❌ Not Started | 🔄 In Progress | ✅ Completed*

## 1. Auth & Verification Module (Day 1)
*   [ ] ❌ **Dual Auth Page:** Login and Registration forms with `react-hook-form` and `zod`.
*   [ ] ❌ **Pharmacy Verification:** Bento Grid layout for uploading Photo, License, and PAN.
*   [ ] ❌ **Zustand Auth Store:** Persisted store managing `token`, `user.role`, and `user.isVerified`.
*   [ ] ❌ **Protected Routes:** `<ProtectedRoute>` wrapper enforcing role-based access and verification blocks.

## 2. Patient Dashboard Module (The Seeker)
*   [ ] ❌ **Sanjeevani Radar (Map UI):**
    *   Integrate `react-leaflet` to show the user's location.
    *   Slider component to set search radius (1km - 5km), visually expanding a circle on the map.
*   [ ] ❌ **Privacy Shield (Canvas Redaction):**
    *   When a user uploads a prescription photo, render it inside an HTML5 `<canvas>`.
    *   Allow the user to click/drag to draw solid black `#1C1917` rectangles over sensitive text.
    *   Export the modified canvas as a base64 string/Blob for the API payload.
*   [ ] ❌ **Urgency Triage (Toggle):**
    *   A shadcn `Switch` for "Life-Critical Emergency".
    *   When toggled `true`, change the primary action buttons from Evergreen (`#2D5A40`) to Cinnabar (`#FF6B35`).
*   [ ] ❌ **The Digital Handshake (Countdown):**
    *   When a pharmacy accepts, display their details in a Stacking Card.
    *   When the user clicks "I'm Coming", mount a `CountdownTimer` component starting at `10:00`.
    *   Format as `MM:SS` in a monospace font.

## 3. Pharmacy Dashboard Module (The Keeper)
*   [ ] ❌ **Awaz (Voice Response Modal):**
    *   A full-screen, high-z-index Modal that triggers via WebSocket event.
    *   Integrate the browser `Web Speech API` (`window.SpeechRecognition`).
    *   Listen for keywords: "Cha", "Yes", "Chaina", "No". 
    *   Include large manual fallback buttons (Solid Evergreen for Yes, Solid Stone Black for No).
*   [ ] ❌ **Vikalpa (Substitute Modal):**
    *   If the user clicks "No, but I have a substitute", open a shadcn `Dialog`.
    *   Form fields: `Substitute Name`, `Price (Rs)`, and an optional photo upload.
*   [ ] ❌ **FOMO Ledger (Analytics):**
    *   Use `recharts` to build a simple, solid-color Bar Chart showing "Missed Requests by Hour".
    *   Display a large, bold metric: "Potential Revenue Lost Today: Rs. X".
*   [ ] ❌ **Siren Override (Web Audio API):**
    *   A `useEffect` hook listening to the Zustand WebSocket store.
    *   When `incomingPing` triggers, execute `new Audio('/siren.mp3').play()`.
    *   Ensure a "Mute/Unmute Alerts" toggle exists in the UI to comply with browser autoplay policies.

## 4. Institutional Module (Hospital/Admin)
*   [ ] ❌ **Bulk Broadcast (Drag & Drop):**
    *   Use `react-dropzone` to accept `.csv` or `.txt` lists of medicines.
    *   Parse the file in the browser and display a checklist before triggering the bulk API call.
*   [ ] ❌ **Pulse Map (Live God-Mode):**
    *   A dark-themed Leaflet map listening to global WebSockets.
    *   Render CSS animations (pulsing dots) at specific Lat/Lng coordinates when requests fire across the city.