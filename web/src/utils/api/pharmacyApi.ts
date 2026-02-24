import { apiClient } from "@/lib/api";

export interface PharmacyProfile {
  id: string;
  name: string;
  location: string;
  image: string;
  isVerified: boolean;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  handshakes: number;
  responseTime: string;
  phone: string;
  email: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  nearbyLandmark: string;
  services: Service[];
  schedule: DaySchedule[];
  reviews: Review[];
}

export interface Service {
  id: string;
  name: string;
  icon:
    | "prescription"
    | "vaccination"
    | "bp-checkup"
    | "home-delivery"
    | "device-rentals"
    | "consultation";
}

export interface DaySchedule {
  day: string;
  hours: string;
  isClosed?: boolean;
  isToday?: boolean;
}

export interface Review {
  id: string;
  authorName: string;
  authorInitials: string;
  rating: number;
  comment: string;
  timeAgo: string;
}

/**
 * Fetch pharmacy profile by ID
 */
export async function getPharmacyProfile(
  pharmacyId: string,
): Promise<PharmacyProfile> {
  const response = await apiClient.get(`/api/pharmacies/${pharmacyId}/`);
  return response.data;
}

/**
 * Fetch all pharmacies (with optional filters)
 */
export async function getAllPharmacies(params?: {
  search?: string;
  location?: string;
  isOpen?: boolean;
}): Promise<PharmacyProfile[]> {
  const response = await apiClient.get("/api/pharmacies/", { params });
  return response.data;
}

/**
 * Add a review for a pharmacy
 */
export async function addPharmacyReview(
  pharmacyId: string,
  data: {
    rating: number;
    comment: string;
  },
): Promise<Review> {
  const response = await apiClient.post(
    `/api/pharmacies/${pharmacyId}/reviews/`,
    data,
  );
  return response.data;
}

/**
 * Get pharmacy reviews
 */
export async function getPharmacyReviews(
  pharmacyId: string,
): Promise<Review[]> {
  const response = await apiClient.get(
    `/api/pharmacies/${pharmacyId}/reviews/`,
  );
  return response.data;
}
