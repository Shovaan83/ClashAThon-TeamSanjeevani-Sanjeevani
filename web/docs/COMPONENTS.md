# UI Component Blueprint (Advanced Features)

## 1. Form & Canvas Components

### `PrivacyCanvasTool`
- **Purpose:** Allows patients to blur out names on prescriptions.
- **State:** `isDrawing: boolean`, `rectangles: Array<{x, y, w, h}>`.
- **UI:** An HTML5 `<canvas>` element. Mouse down/move/up events calculate rectangle coordinates and use `ctx.fillRect()` with `fillStyle = '#1C1917'` (Stone Black). Include a "Clear Redactions" flat button.

### `SanjeevaniRadarForm`
- **Purpose:** The main broadcast controls for the patient.
- **UI:** A Bento Grid cell containing:
  - `ImageUpload` component (or `PrivacyCanvasTool`).
  - `Slider` (shadcn) for Radius mapping to `1km` -> `5km`.
  - `Switch` (shadcn) for Emergency Triage.
  - A massive solid block button: "Broadcast Request".

## 2. Real-Time Pharmacy Components

### `VoicePingModal` (Awaz)
- **Purpose:** The hands-free incoming request screen.
- **Behavior:** Mounts automatically when the Zustand store registers an incoming ping.
- **UI:** 
  - Massive typography showing the Medicine Name or Prescription Image.
  - A pulsing microphone icon (using Framer Motion scale animation).
  - Status text: "Listening... Say CHA or CHAINA".
- **API:** Uses `useSpeechRecognition` custom hook to parse transcripts.

### `VikalpaDialog`
- **Purpose:** Substitute suggestion form.
- **UI:** A shadcn `Dialog`. Contains inputs for `Medicine Name` and `Price`. Crisp 1px borders, solid Soft Stone `#FAFAF9` background.

### `FOMOChart`
- **Purpose:** Visualizes lost revenue on the Pharmacy dashboard.
- **UI:** Uses `recharts` `<BarChart>`. 
  - Bars must be solid Cinnabar `#FF6B35` with no gradients and no rounded corners (`radius={[0, 0, 0, 0]}`).
  - X-Axis: Time of day. Y-Axis: Rupee Value.

## 3. Shared Utilities

### `CountdownTimer`
- **Purpose:** The 10-minute digital handshake lock.
- **UI:** A monospace text block (e.g., `font-mono text-4xl tracking-widest`).
- **Logic:** `setInterval` decrementing a 600-second state every 1000ms. Clears interval on unmount or reach 0. Changes text color to Cinnabar `#FF6B35` when under 60 seconds.