# State Management (Zustand) & Data Flow

## 1. Global State Management Rule
We are using **Zustand** for all global state management. 
- Do NOT use React Context or Redux.
- All Zustand stores must be strictly typed using TypeScript interfaces.
- Use the `persist` middleware from `zustand/middleware` for authentication state so the user remains logged in after a page refresh.

## 2. Authentication Store (`useAuthStore.ts`)
This store manages the JWT token, user session, and role-based access.

**TypeScript Interfaces:**
```typescript
export type UserRole = 'patient' | 'pharmacy';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean; // Crucial for Pharmacy routing
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (token: string, user: User) => void;
  logout: () => void;
  setVerified: (status: boolean) => void; // Call this after successful document upload
}
```

**Implementation Details:**
- `login`: Sets the `token`, `user`, and `isAuthenticated: true`.
- `logout`: Sets `token: null`, `user: null`, and `isAuthenticated: false`.
- **Persistence:** Wrap the store in `persist` with `name: 'sanjeevani-auth'`. This will automatically sync the `token` and `user` to `localStorage`.

## 3. Location Store (`useLocationStore.ts`)
Since both the Pharmacy (during registration) and the Patient (during pinging) need GPS coordinates, manage this globally.

**TypeScript Interfaces:**
```typescript
export interface LocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  isFetching: boolean;
  
  // Actions
  fetchLocation: () => Promise<void>;
  setLocationManually: (lat: number, lng: number) => void;
  clearLocation: () => void;
}
```
**Implementation Details:**
- `fetchLocation`: An async function that calls `navigator.geolocation.getCurrentPosition`. 
- It sets `isFetching: true` before the call, and updates `lat`/`lng` on success, or sets the `error` string if the user denies permission.

## 4. Protected Routing Logic (Using Zustand)
When building the React Router setup (e.g., in `App.tsx` or `Routes.tsx`), use the `useAuthStore` to guard the routes:

- **Check Authentication:** `const { isAuthenticated, user } = useAuthStore()`
- **Public Routes (`/login`, `/register`):** If `isAuthenticated` is true, redirect them to `/dashboard/patient` or `/dashboard/pharmacy` based on `user.role`.
- **Protected Routes:** If `isAuthenticated` is false, redirect to `/login`.
- **The Verification Guard:** 
  - If a user tries to access `/dashboard/pharmacy`...
  - AND `user.role === 'pharmacy'`...
  - AND `user.isVerified === false`...
  - Force a redirect to `/profile/verify`.
  - They must not be able to bypass this screen until documents are submitted.
```

---
