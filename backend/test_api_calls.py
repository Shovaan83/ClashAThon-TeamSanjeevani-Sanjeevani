"""
Quick test of the medicine request API with real HTTP calls
"""
import json
import requests
from pathlib import Path

# Load tokens
with open('test_tokens.json', 'r') as f:
    tokens = json.load(f)

BASE_URL = 'http://localhost:8000'

def test_create_medicine_request():
    """Test creating a medicine request (customer broadcasts to nearby pharmacies)"""
    print("\n" + "="*80)
    print("TEST 1: Customer Creates Medicine Request (Broadcast)")
    print("="*80)
    
    url = f'{BASE_URL}/medicine/request/'
    headers = {
        'Authorization': f"Bearer {tokens['customer']['token']}"
    }
    
    # Create a dummy image
    dummy_image = Path('test_prescription.txt')
    if not dummy_image.exists():
        dummy_image.write_text('This is a test prescription image')
    
    data = {
        'patient_lat': 27.7172,
        'patient_lng': 85.3240,
        'radius_km': 5.0,
        'quantity': 10,
    }
    
    files = {
        'image': ('prescription.jpg', open(dummy_image, 'rb'), 'image/jpeg')
    }
    
    try:
        response = requests.post(url, headers=headers, data=data, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            print("\n✅ Medicine request created successfully!")
            request_id = response.json()['id']
            nearby_count = response.json().get('nearby_pharmacies_notified', 0)
            print(f"   Request ID: {request_id}")
            print(f"   Nearby pharmacies notified: {nearby_count}")
            print(f"   Status: {response.json()['status']}")
            print(f"   Pharmacy assigned: {response.json().get('pharmacy_name', 'None (pending)')}")
            return request_id
        else:
            print(f"\n❌ Failed to create request: {response.text}")
            return None
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("Make sure Django server is running: python manage.py runserver")
        return None

def test_pharmacy_response(request_id):
    """Test pharmacy responding to request"""
    if not request_id:
        print("Skipping pharmacy response test (no request ID)")
        return
    
    print("\n" + "="*80)
    print("TEST 2: Pharmacy A Accepts Request")
    print("="*80)
    
    url = f'{BASE_URL}/medicine/response/'
    headers = {
        'Authorization': f"Bearer {tokens['pharmacy_A']['token']}",
        'Content-Type': 'application/json'
    }
    
    data = {
        'request_id': request_id,
        'response_type': 'ACCEPTED',
        'text_message': 'We have this medicine in stock! Ready for pickup.'
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 201:
            print("\n✅ Pharmacy response recorded successfully!")
            print(f"   Response Type: {response.json()['response_type']}")
            print(f"   Pharmacy: {response.json().get('pharmacy_name', 'Unknown')}")
            print(f"   Message: {response.json()['text_message']}")
        else:
            print(f"\n❌ Failed to record response: {response.text}")
    except Exception as e:
        print(f"\n❌ Error: {e}")

def test_view_requests():
    """Test viewing all requests"""
    print("\n" + "="*80)
    print("TEST 3: View All Medicine Requests")
    print("="*80)
    
    url = f'{BASE_URL}/medicine/request/'
    headers = {
        'Authorization': f"Bearer {tokens['customer']['token']}"
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            requests_data = response.json()
            print(f"\n✅ Found {len(requests_data)} request(s)")
            for req in requests_data:
                print(f"\n   Request ID: {req['id']}")
                print(f"   Status: {req['status']}")
                print(f"   Pharmacy: {req.get('pharmacy_name', 'None')}")
                print(f"   Quantity: {req['quantity']}")
                print(f"   Created: {req['created_at']}")
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"\n❌ Error: {e}")

def main():
    print("="*80)
    print("🧪 SANJEVANI API TESTING")
    print("="*80)
    print("\nPre-requisites:")
    print("  ✓ Django server running (python manage.py runserver)")
    print("  ✓ Redis running (docker run -d -p 6379:6379 redis:alpine)")
    print("  ✓ Test data created (python test_broadcast.py)")
    print("\nStarting tests...")
    
    # Test 1: Create request
    request_id = test_create_medicine_request()
    
    # Test 2: Pharmacy responds
    if request_id:
        input("\nPress Enter to continue to pharmacy response test...")
        test_pharmacy_response(request_id)
    
    # Test 3: View requests
    input("\nPress Enter to view all requests...")
    test_view_requests()
    
    print("\n" + "="*80)
    print("✅ Testing Complete!")
    print("="*80)
    print("\nNext Steps:")
    print("  1. Open test_websocket.html in browser to test WebSockets")
    print("  2. Connect multiple pharmacy clients to see broadcast in action")
    print("  3. Try creating multiple requests with different locations")
    print("  4. Test rejection scenarios")

if __name__ == '__main__':
    main()
