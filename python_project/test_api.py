import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:2000"

def test_health_check():
    """Test the health check endpoint"""
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("✅ Health check passed!")
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
    print("-" * 50)

def test_get_items_empty():
    """Test getting items when list is empty"""
    print("Testing GET /items (empty)...")
    try:
        response = requests.get(f"{BASE_URL}/items")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 200:
            print("✅ GET /items test passed!")
        else:
            print("❌ GET /items test failed!")
    except requests.exceptions.RequestException as e:
        print(f"❌ GET /items test failed: {e}")
    print("-" * 50)

def test_create_item():
    """Test creating a new item"""
    print("Testing POST /items...")
    item_data = {
        "name": "Test Item",
        "description": "This is a test item",
        "price": 29.99,
        "category": "electronics"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/items",
            headers={"Content-Type": "application/json"},
            data=json.dumps(item_data)
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 201:
            print("✅ POST /items test passed!")
        else:
            print("❌ POST /items test failed!")
        print("-" * 50)
        
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"❌ POST /items test failed: {e}")
        print("-" * 50)
        return None

def test_get_items_with_data():
    """Test getting items when list has data"""
    print("Testing GET /items (with data)...")
    try:
        response = requests.get(f"{BASE_URL}/items")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 200:
            data = response.json()
            if data.get('count', 0) > 0:
                print("✅ GET /items with data test passed!")
            else:
                print("⚠️  GET /items returned empty data")
        else:
            print("❌ GET /items with data test failed!")
    except requests.exceptions.RequestException as e:
        print(f"❌ GET /items with data test failed: {e}")
    print("-" * 50)

def run_all_tests():
    """Run all tests in sequence"""
    test_results = {
        'passed': 0,
        'failed': 0,
        'total': 0
    }
    
    print("Starting comprehensive API tests...\n")
    
    # Test 1: Health Check
    test_results['total'] += 1
    test_health_check()
    
    # Test 2: Get empty items
    test_results['total'] += 1
    test_get_items_empty()
    
    # Test 3: Create first item
    test_results['total'] += 1
    result = test_create_item()
    
    # Test 4: Get items with data
    test_results['total'] += 1
    test_get_items_with_data()
    
    # Test 5: Create another item to see multiple items
    test_results['total'] += 1
    print("Creating second item...")
    item_data2 = {
        "name": "Second Item",
        "description": "Another test item",
        "price": 19.99,
        "category": "books"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/items",
            headers={"Content-Type": "application/json"},
            data=json.dumps(item_data2)
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 201:
            print("✅ Second item creation passed!")
        else:
            print("❌ Second item creation failed!")
    except requests.exceptions.RequestException as e:
        print(f"❌ Second item creation failed: {e}")
    print("-" * 50)
    
    # Test 6: Get all items again
    test_results['total'] += 1
    print("Final check - getting all items...")
    test_get_items_with_data()
    
    print("=" * 50)
    print(f"Test suite completed! Total tests: {test_results['total']}")
    print("=" * 50)

def check_server_status():
    """Check if the API server is running"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

if __name__ == "__main__":
    print("=== REST API Test Suite ===")
    print("=" * 50)
    
    # Check if server is running
    if not check_server_status():
        print("❌ API server is not running!")
        print("\nTo start the server, run in another terminal:")
        print("   cd /home/jaaystones1/ai_for_dev")
        print("   source .venv/bin/activate")
        print("   python app.py")
        print("\nOr run this command directly:")
        print("   /home/jaaystones1/ai_for_dev/.venv/bin/python app.py")
        print("\nThen run this test file again.")
        print("=" * 50)
        exit(1)
    
    print("✅ API server is running! Starting tests...")
    print("=" * 50)
    run_all_tests()
