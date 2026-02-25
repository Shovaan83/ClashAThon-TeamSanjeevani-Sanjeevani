from medicine.models import MedicineRequest

req = MedicineRequest.objects.last()
if req:
    print(f'Request ID: {req.id}')
    print(f'Patient location: {req.patient_lat}, {req.patient_lng}')
    print(f'Radius: {req.radius_km}km')
    print(f'Status: {req.status}')
    nearby = req.get_nearby_pharmacies()
    print(f'\nNearby pharmacies found: {len(nearby)}')
    for p in nearby:
        print(f'  - Pharmacy {p["pharmacy"].id}: {p["pharmacy"].user.name} at ({p["pharmacy"].lat}, {p["pharmacy"].lng}) - Distance: {p["distance"]:.2f}km')
else:
    print('No medicine requests found')
