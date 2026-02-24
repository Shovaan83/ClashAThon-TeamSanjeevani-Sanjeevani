# Pharmacy Profile Page

This directory contains the Pharmacy Profile page and its components.

## Structure

```
PharmacyProfile/
├── PharmacyProfile.tsx       # Main page component
├── PharmacyProfile.css        # Custom styles (if any)
└── components/
    ├── PharmacyHeader.tsx     # Pharmacy header with image and badges
    ├── PharmacyInfo.tsx       # Main info section with CTA buttons
    ├── AvailableServices.tsx  # Services grid display
    ├── OpeningHours.tsx       # Opening hours schedule
    ├── LocationMap.tsx        # Location map and address
    ├── RecentReviews.tsx      # Customer reviews section
    └── ContactInfo.tsx        # Contact details (phone/email)
```

## Usage

Navigate to `/pharmacy/:id` to view a pharmacy's profile. For example:

```
/pharmacy/1
```

## Components

### PharmacyHeader

Displays the pharmacy image with verification badge and open/closed status.

### PharmacyInfo

Shows main pharmacy information including:

- Name and location
- Rating and review count
- Handshake count
- Response time
- Call and directions buttons

### AvailableServices

Grid display of available services with icons:

- Prescription Refill
- Vaccinations
- BP Checkup
- Home Delivery
- Device Rentals
- Consultation

### OpeningHours

Weekly schedule of operating hours with today highlighted.

### LocationMap

Interactive map with:

- Google Maps integration
- Address details
- Share location button

### RecentReviews

Customer reviews with:

- Reviewer name and initials
- Star rating
- Review text
- Time posted

### ContactInfo

Contact details including phone and email with clickable links.

## API Integration

The page uses the `pharmacyApi` utility from `utils/api/pharmacyApi.ts` to fetch pharmacy data.

To integrate with your backend:

1. Update the API endpoints in `pharmacyApi.ts`
2. Replace mock data in `PharmacyProfile.tsx` with actual API calls
3. Handle loading and error states appropriately

## Styling

The page uses:

- TailwindCSS for styling
- Custom color palette from the design system
- Responsive grid layout (single column on mobile, 3-column on desktop)

## Navigation

Users can:

- Navigate back using the back button
- Call the pharmacy directly
- Get directions via Google Maps
- Share location
- View all reviews
