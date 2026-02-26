import { apiClient } from '@/lib/api';

/**
 * Get pharmacy profile
 */
export const getPharmacyProfile = async () => {
  return apiClient.get('/pharmacy/profile/');
};

/**
 * Upload pharmacy document
 */
export const uploadPharmacyDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('document', file);

  return apiClient.post('/pharmacy/document/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Upload pharmacy profile photo
 */
export const uploadPharmacyProfilePhoto = async (file: File) => {
  const formData = new FormData();
  formData.append('profile_photo', file);

  return apiClient.post('/pharmacy/profile-photo/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Delete pharmacy profile photo
 */
export const deletePharmacyProfilePhoto = async () => {
  return apiClient.delete('/pharmacy/profile-photo/upload/');
};