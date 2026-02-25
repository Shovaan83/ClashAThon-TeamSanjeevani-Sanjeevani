import { apiClient } from "@/lib/api";

export interface PharmacyProfile {
  id: number;
  name: string;
  address: string;
  phone_number: string;
  lat: number;
  lng: number;
  email: string;
  user_name: string;
  profile_photo_url: string | null;
  document_url: string | null;
  document_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface PharmacyListItem {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
    phone_number: string;
    role: string;
  };
  lat: number;
  lng: number;
}

/**
 * Fetch authenticated pharmacy's own profile.
 * GET /pharmacy/profile/
 */
export async function getPharmacyProfile(): Promise<PharmacyProfile> {
  const response = await apiClient.get("/pharmacy/profile/");
  return response.data;
}

/**
 * Update authenticated pharmacy's profile.
 * PUT /pharmacy/profile/
 */
export async function updatePharmacyProfile(
  data: Partial<Pick<PharmacyProfile, "name" | "address" | "phone_number" | "lat" | "lng">>,
): Promise<PharmacyProfile> {
  const response = await apiClient.put("/pharmacy/profile/", data);
  return response.data;
}

/**
 * Fetch all registered pharmacies.
 * GET /register-pharmacy/
 */
export async function getAllPharmacies(): Promise<PharmacyListItem[]> {
  const response = await apiClient.get("/register-pharmacy/");
  return response.data;
}
