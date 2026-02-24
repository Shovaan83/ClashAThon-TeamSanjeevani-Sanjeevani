"""
Test script for location-based medicine request broadcast system
Run this after starting Django server: python manage.py runserver
"""

import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from accounts.models import CustomUser, Otp
from pharmacy.models import Pharmacy
from medicine.models import MedicineRequest, PharmacyResponse
from django.contrib.auth.hashers import make_password

def clear_test_data():
    """Clear previous test data"""
    print("\n🗑️  Clearing previous test data...")
    PharmacyResponse.objects.all().delete()
    MedicineRequest.objects.all().delete()
    Pharmacy.objects.filter(user__email__startswith='test').delete()
    CustomUser.objects.filter(email__startswith='test').delete()
    Otp.objects.filter(email__startswith='test').delete()
    print("✅ Test data cleared")

def create_test_pharmacies():
    """Create test pharmacies at different locations"""
    print("\n🏥 Creating test pharmacies...")
    
    pharmacies = [
        {
            'name': 'Test Pharmacy A',
            'email': 'testpharmacyA@example.com',
            'lat': 27.7172,  # Kathmandu coords
            'lng': 85.3240,
        },
        {
            'name': 'Test Pharmacy B',
            'email': 'testpharmacyB@example.com',
            'lat': 27.7100,  # ~1 km away
            'lng': 85.3300,
        },
        {
            'name': 'Test Pharmacy C',
            'email': 'testpharmacyC@example.com',
            'lat': 27.7000,  # ~2 km away
            'lng': 85.3400,
        },
        {
            'name': 'Test Pharmacy D - Far',
            'email': 'testpharmacyD@example.com',
            'lat': 27.6000,  # ~15 km away (should NOT receive broadcast)
            'lng': 85.2000,
        }
    ]
    
    created_pharmacies = []
    for p_data in pharmacies:
        # Create user
        user = CustomUser.objects.create(
            username=p_data['email'].split('@')[0],
            email=p_data['email'],
            password=make_password('test123'),
            role='PHARMACY',
            name=p_data['name'],
            phone_number='9841000001'
        )
        
        # Create OTP entry to mark as verified
        Otp.objects.create(
            email=user.email,
            otp='000000',
            is_verified=True
        )
        
        # Create pharmacy
        pharmacy = Pharmacy.objects.create(
            user=user,
            lat=p_data['lat'],
            lng=p_data['lng']
        )
        created_pharmacies.append(pharmacy)
        print(f"   ✓ {user.name} ({user.email}) - Location: ({p_data['lat']}, {p_data['lng']})")
    
    return created_pharmacies

def create_test_customer():
    """Create a test customer"""
    print("\n👤 Creating test customer...")
    
    customer = CustomUser.objects.create(
        username='testcustomer',
        email='testcustomer@example.com',
        password=make_password('test123'),
        role='CUSTOMER',
        name='Test Customer',
        phone_number='9841999999'
    )
    
    # Create OTP entry to mark as verified
    Otp.objects.create(
        email=customer.email,
        otp='000000',
        is_verified=True
    )
    
    print(f"   ✓ Customer: {customer.email}")
    return customer

def get_auth_tokens():
    """Generate JWT tokens for testing"""
    from rest_framework_simplejwt.tokens import RefreshToken
    
    print("\n🔑 Generating authentication tokens...")
    
    # Customer token
    customer = CustomUser.objects.get(email='testcustomer@example.com')
    customer_refresh = RefreshToken.for_user(customer)
    customer_token = str(customer_refresh.access_token)
    
    # Pharmacy A token
    pharmacy_user = CustomUser.objects.get(email='testpharmacyA@example.com')
    pharmacy_refresh = RefreshToken.for_user(pharmacy_user)
    pharmacy_token = str(pharmacy_refresh.access_token)
    
    tokens = {
        'customer': {
            'email': customer.email,
            'token': customer_token
        },
        'pharmacy_A': {
            'email': pharmacy_user.email,
            'token': pharmacy_token
        }
    }
    
    print("   ✓ Tokens generated")
    return tokens

def print_api_guide(tokens):
    """Print API testing guide"""
    print("\n" + "="*80)
    print("🚀 API TESTING GUIDE")
    print("="*80)
    
    print("\n📍 STEP 1: Start Django Server (in another terminal)")
    print("   cd D:\\Sanjevani\\backend")
    print("   & venv\\Scripts\\Activate.ps1")
    print("   python manage.py runserver")
    
    print("\n📍 STEP 2: Test Customer Medicine Request with Custom Radius")
    print("   POST http://localhost:8000/medicine/request/")
    print("   Headers:")
    print(f"      Authorization: Bearer {tokens['customer']['token'][:50]}...")
    print("   Body (multipart/form-data):")
    print("""   patient_lat: 27.7172
   patient_lng: 85.3240
   radius_km: 10.0      # USER CHOOSES RADIUS! (can be 1, 5, 10, 20, etc.)
   quantity: 10
   image: <upload prescription image>""")
    
    print("\n   Expected Response:")
    print("   - Request created with status PENDING")
    print("   - pharmacy field is null (not assigned yet)")
    print("   - Returns count of nearby pharmacies within YOUR chosen radius")
    print("   - Only pharmacies within radius receive WebSocket notification")
    
    print("\n📍 STEP 3: Connect to WebSocket (Auto-Authentication)")
    print("   🎯 NO MANUAL IDs NEEDED! System auto-identifies user from JWT token")
    print(f"\n   Customer WebSocket:")
    print(f"   ws://localhost:8000/ws/customer/?token={tokens['customer']['token'][:50]}...")
    print(f"   \n   Pharmacy WebSocket:")
    print(f"   ws://localhost:8000/ws/pharmacy/?token={tokens['pharmacy_A']['token'][:50]}...")
    
    print("\n   Benefits:")
    print("   ✅ No need to manually enter user/pharmacy IDs")
    print("   ✅ System automatically validates user role")
    print("   ✅ Customer tokens only work for customer endpoint")
    print("   ✅ Pharmacy tokens only work for pharmacy endpoint")
    print("   ✅ Matches real mobile/web app behavior")
    
    print("\n📍 STEP 4: Pharmacy Responds (First to Accept Wins)")
    print("   POST http://localhost:8000/medicine/response/")
    print("   Headers:")
    print(f"      Authorization: Bearer {tokens['pharmacy_A']['token'][:50]}...")
    print("   Body (JSON):")
    print("""   {
       "request_id": <request_id_from_step2>,
       "response_type": "ACCEPTED",
       "text_message": "We have the medicine in stock!",
       "audio": "<optional audio file>"
   }""")
    
    print("\n   Expected Behavior:")
    print("   - First pharmacy to accept gets assigned to the request")
    print("   - Customer receives pharmacy_response via WebSocket AUTOMATICALLY")
    print("   - Other pharmacies receive request_taken notification")
    print("   - Subsequent accepts/rejects return error (already assigned)")
    
    print("\n📍 STEP 5: Open WebSocket Visual Tester")
    print("   1. Open test_websocket.html in your browser")
    print("   2. Paste tokens from test_tokens.json (auto-saved to localStorage)")
    print("   3. Click Connect - authentication is automatic!")
    print("   4. Watch real-time medicine request broadcasts")
    
    print("\n" + "="*80)
    print("📊 Test Database State:")
    print("="*80)
    print(f"   Customers: {CustomUser.objects.filter(role='CUSTOMER').count()}")
    print(f"   Pharmacies: {Pharmacy.objects.count()}")
    print(f"   Medicine Requests: {MedicineRequest.objects.count()}")
    print(f"   Pharmacy Responses: {PharmacyResponse.objects.count()}")
    
    print("\n✨ NEW FEATURES:")
    print("="*80)
    print("   🎯 AUTO-AUTHENTICATION: No manual user/pharmacy IDs")
    print("   📏 FLEXIBLE RADIUS: Customer chooses search radius (1-50 km)")
    print("   🔒 ROLE VALIDATION: Tokens validated based on user role")
    print("   📍 LOCATION-BASED: Only nearby pharmacies receive broadcasts")
    
    print("\n💾 Tokens saved to test_tokens.json")
    print("\n✅ Ready to test! Start the Django server and follow the steps above.")
    print("="*80 + "\n")

def main():
    print("="*80)
    print("🧪 SANJEVANI - BROADCAST SYSTEM TEST SETUP")
    print("="*80)
    
    try:
        clear_test_data()
        pharmacies = create_test_pharmacies()
        customer = create_test_customer()
        tokens = get_auth_tokens()
        print_api_guide(tokens)
        
        # Save tokens to file for easy access
        with open('test_tokens.json', 'w') as f:
            json.dump(tokens, f, indent=2)
        print("💾 Tokens saved to test_tokens.json\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
