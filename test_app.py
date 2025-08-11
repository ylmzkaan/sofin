#!/usr/bin/env python3
"""
Simple test script for the Social Finance API
This script tests the basic functionality of the backend API
"""

import requests
import json
import time
from typing import Dict, Any

class SocialFinanceAPITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_user = None
        self.test_analysis = None
        
    def test_health_check(self) -> bool:
        """Test the health check endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                print("✅ Health check passed")
                return True
            else:
                print(f"❌ Health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False
    
    def test_root_endpoint(self) -> bool:
        """Test the root endpoint"""
        try:
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Root endpoint passed: {data}")
                return True
            else:
                print(f"❌ Root endpoint failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Root endpoint error: {e}")
            return False
    
    def test_user_registration(self) -> bool:
        """Test user registration"""
        try:
            user_data = {
                "email": f"testuser{int(time.time())}@example.com",
                "username": f"testuser{int(time.time())}",
                "password": "testpassword123",
                "full_name": "Test User"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/register",
                json=user_data
            )
            
            if response.status_code == 201:
                data = response.json()
                self.test_user = data
                print(f"✅ User registration passed: {data['username']}")
                return True
            else:
                print(f"❌ User registration failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ User registration error: {e}")
            return False
    
    def test_user_login(self) -> bool:
        """Test user login"""
        if not self.test_user:
            print("❌ No test user available for login test")
            return False
            
        try:
            login_data = {
                "username": self.test_user["username"],
                "password": "testpassword123"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/token",
                data=login_data
            )
            
            if response.status_code == 200:
                data = response.json()
                # Store the token for future requests
                self.session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
                print("✅ User login passed")
                return True
            else:
                print(f"❌ User login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ User login error: {e}")
            return False
    
    def test_get_users(self) -> bool:
        """Test getting users list"""
        try:
            response = self.session.get(f"{self.base_url}/api/v1/users")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Get users passed: {len(data)} users found")
                return True
            else:
                print(f"❌ Get users failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Get users error: {e}")
            return False
    
    def test_create_analysis(self) -> bool:
        """Test creating a stock analysis"""
        if not self.test_user:
            print("❌ No test user available for analysis test")
            return False
            
        try:
            analysis_data = {
                "title": "Test Stock Analysis",
                "content": "This is a test analysis for testing purposes.",
                "ticker": "TEST",
                "target_price": 100.50,
                "time_horizon_days": 30,
                "tags": ["test", "example"]
            }
            
            response = self.session.post(
                f"{self.base_url}/api/v1/analyses",
                json=analysis_data
            )
            
            if response.status_code == 201:
                data = response.json()
                self.test_analysis = data
                print(f"✅ Create analysis passed: {data['title']}")
                return True
            else:
                print(f"❌ Create analysis failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Create analysis error: {e}")
            return False
    
    def test_get_analyses(self) -> bool:
        """Test getting analyses list"""
        try:
            response = self.session.get(f"{self.base_url}/api/v1/analyses")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Get analyses passed: {len(data)} analyses found")
                return True
            else:
                print(f"❌ Get analyses failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Get analyses error: {e}")
            return False
    
    def test_get_user_profile(self) -> bool:
        """Test getting user profile"""
        if not self.test_user:
            print("❌ No test user available for profile test")
            return False
            
        try:
            response = self.session.get(f"{self.base_url}/api/v1/users/me")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Get user profile passed: {data['username']}")
                return True
            else:
                print(f"❌ Get user profile failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Get user profile error: {e}")
            return False
    
    def run_all_tests(self) -> Dict[str, bool]:
        """Run all tests and return results"""
        print("🚀 Starting Social Finance API Tests...")
        print("=" * 50)
        
        tests = [
            ("Health Check", self.test_health_check),
            ("Root Endpoint", self.test_root_endpoint),
            ("User Registration", self.test_user_registration),
            ("User Login", self.test_user_login),
            ("Get Users", self.test_get_users),
            ("Create Analysis", self.test_create_analysis),
            ("Get Analyses", self.test_get_analyses),
            ("Get User Profile", self.test_get_user_profile),
        ]
        
        results = {}
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            try:
                results[test_name] = test_func()
            except Exception as e:
                print(f"❌ Test {test_name} crashed: {e}")
                results[test_name] = False
        
        print("\n" + "=" * 50)
        print("📊 Test Results Summary:")
        print("=" * 50)
        
        passed = sum(results.values())
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\n🎯 Overall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! The API is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the logs above for details.")
        
        return results

def main():
    """Main function to run the tests"""
    import sys
    
    # Allow custom base URL
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    print(f"🔗 Testing API at: {base_url}")
    
    tester = SocialFinanceAPITester(base_url)
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if all(results.values()):
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main() 