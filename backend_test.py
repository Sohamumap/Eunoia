#!/usr/bin/env python3
"""
Backend Testing Suite for Eunoia Burnout Tracker
Tests the new GET /api/burnout/weekly endpoint and regression checks
"""

import requests
import json
from datetime import datetime, date, timedelta
import sys

# Backend URL from frontend/.env
BASE_URL = "https://app-preview-mobile-19.preview.emergentagent.com/api"

class BurnoutTrackerTester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def authenticate(self):
        """Authenticate with demo user and get JWT token"""
        print("🔐 Authenticating with demo user...")
        
        login_data = {"email": "demo@eunoia.app"}
        response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code != 200:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
            
        data = response.json()
        self.token = data.get("token") or data.get("access_token")
        
        if not self.token:
            print(f"❌ No access token in response: {data}")
            return False
            
        # Set auth header for subsequent requests
        self.session.headers.update({
            'Authorization': f'Bearer {self.token}'
        })
        
        print(f"✅ Authentication successful")
        return True
    
    def test_burnout_weekly_endpoint(self):
        """Test GET /api/burnout/weekly with comprehensive validation"""
        print("\n📊 Testing GET /api/burnout/weekly endpoint...")
        
        response = self.session.get(f"{BASE_URL}/burnout/weekly")
        
        if response.status_code != 200:
            print(f"❌ Burnout weekly endpoint failed: {response.status_code} - {response.text}")
            return False
            
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            print(f"❌ Invalid JSON response: {e}")
            return False
        
        # Validate response structure
        required_fields = [
            'week_start', 'week_end', 'today_index', 'days', 'previous_days',
            'current_avg', 'previous_avg', 'latest_score', 'latest_day',
            'delta', 'trend', 'category', 'baseline_from_assessment'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
            return False
        
        # Validate week_start is a Sunday
        try:
            week_start_date = date.fromisoformat(data['week_start'])
            if week_start_date.weekday() != 6:  # Sunday = 6 in Python
                print(f"❌ week_start {data['week_start']} is not a Sunday (weekday: {week_start_date.weekday()})")
                return False
        except ValueError as e:
            print(f"❌ Invalid week_start date format: {e}")
            return False
        
        # Validate days array structure
        if not isinstance(data['days'], list) or len(data['days']) != 7:
            print(f"❌ days array should have exactly 7 items, got {len(data.get('days', []))}")
            return False
        
        # Validate each day in days array
        day_labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        for i, day in enumerate(data['days']):
            required_day_fields = ['date', 'day', 'day_index', 'score', 'has_data', 'mood', 'is_future', 'display_score']
            missing_day_fields = [field for field in required_day_fields if field not in day]
            if missing_day_fields:
                print(f"❌ Day {i} missing fields: {missing_day_fields}")
                return False
            
            # Validate day_index
            if day['day_index'] != i:
                print(f"❌ Day {i} has incorrect day_index: {day['day_index']}")
                return False
            
            # Validate day label
            if day['day'] != day_labels[i]:
                print(f"❌ Day {i} has incorrect day label: {day['day']}, expected {day_labels[i]}")
                return False
            
            # Validate score range if present
            if day['score'] is not None and not (0 <= day['score'] <= 100):
                print(f"❌ Day {i} score {day['score']} not in range 0-100")
                return False
            
            # Validate display_score range if present
            if day['display_score'] is not None and not (0 <= day['display_score'] <= 100):
                print(f"❌ Day {i} display_score {day['display_score']} not in range 0-100")
                return False
        
        # Validate previous_days array structure
        if not isinstance(data['previous_days'], list) or len(data['previous_days']) != 7:
            print(f"❌ previous_days array should have exactly 7 items, got {len(data.get('previous_days', []))}")
            return False
        
        # Validate previous_days structure (should not have display_score)
        for i, day in enumerate(data['previous_days']):
            required_prev_day_fields = ['date', 'day', 'day_index', 'score', 'has_data', 'mood', 'is_future']
            missing_prev_day_fields = [field for field in required_prev_day_fields if field not in day]
            if missing_prev_day_fields:
                print(f"❌ Previous day {i} missing fields: {missing_prev_day_fields}")
                return False
            
            # previous_days should NOT have display_score
            if 'display_score' in day:
                print(f"❌ Previous day {i} should not have display_score field")
                return False
        
        # Validate trend values
        valid_trends = ["up", "down", "flat"]
        if data['trend'] not in valid_trends:
            print(f"❌ Invalid trend value: {data['trend']}, must be one of {valid_trends}")
            return False
        
        # Validate trend consistency with delta
        delta = data['delta']
        trend = data['trend']
        if delta >= 3 and trend != "up":
            print(f"❌ Delta {delta} >= 3 should have trend 'up', got '{trend}'")
            return False
        elif delta <= -3 and trend != "down":
            print(f"❌ Delta {delta} <= -3 should have trend 'down', got '{trend}'")
            return False
        elif -3 < delta < 3 and trend != "flat":
            print(f"❌ Delta {delta} between -3 and 3 should have trend 'flat', got '{trend}'")
            return False
        
        # Validate category values
        valid_categories = ["low", "moderate", "elevated", "high", "unknown"]
        if data['category'] not in valid_categories:
            print(f"❌ Invalid category value: {data['category']}, must be one of {valid_categories}")
            return False
        
        # Validate today_index for demo user (should be 0-6 since demo user has current data)
        today_index = data['today_index']
        if today_index is not None and not (0 <= today_index <= 6):
            print(f"❌ today_index {today_index} not in range 0-6")
            return False
        
        # For demo user with 40 days of seeded data, both averages should be non-null
        if data['current_avg'] is None:
            print(f"❌ current_avg should not be null for demo user with seeded data")
            return False
        
        if data['previous_avg'] is None:
            print(f"❌ previous_avg should not be null for demo user with seeded data")
            return False
        
        # Validate consecutive dates in days array
        for i in range(1, 7):
            prev_date = date.fromisoformat(data['days'][i-1]['date'])
            curr_date = date.fromisoformat(data['days'][i]['date'])
            if (curr_date - prev_date).days != 1:
                print(f"❌ Days are not consecutive: {prev_date} -> {curr_date}")
                return False
        
        print(f"✅ Burnout weekly endpoint validation passed")
        print(f"   📅 Week: {data['week_start']} to {data['week_end']}")
        print(f"   📊 Current avg: {data['current_avg']}, Previous avg: {data['previous_avg']}")
        print(f"   📈 Trend: {data['trend']} (Δ{data['delta']:+d})")
        print(f"   🎯 Latest: {data['latest_score']}/100 ({data['latest_day']}) - {data['category']}")
        print(f"   🏠 Today index: {data['today_index']}")
        
        return True
    
    def test_auth_enforcement(self):
        """Test that burnout endpoint requires authentication"""
        print("\n🔒 Testing auth enforcement...")
        
        # Create a new session without any auth
        test_session = requests.Session()
        test_session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
        response = test_session.get(f"{BASE_URL}/burnout/weekly")
        print(f"   Response status: {response.status_code}")
        
        if response.status_code in [401, 403]:
            print(f"✅ Auth enforcement working: {response.status_code}")
            return True
        else:
            print(f"❌ Auth enforcement failed: expected 401/403, got {response.status_code}")
            return False
    
    def test_regression_endpoints(self):
        """Test that existing endpoints still work"""
        print("\n🔄 Testing regression endpoints...")
        
        # Test mood/today
        response = self.session.get(f"{BASE_URL}/mood/today")
        if response.status_code != 200:
            print(f"❌ GET /mood/today failed: {response.status_code}")
            return False
        print(f"✅ GET /mood/today working")
        
        # Test dashboard/summary
        response = self.session.get(f"{BASE_URL}/dashboard/summary")
        if response.status_code != 200:
            print(f"❌ GET /dashboard/summary failed: {response.status_code}")
            return False
        print(f"✅ GET /dashboard/summary working")
        
        # Test moderation/check (prescription-seeking feature)
        moderation_data = {"text": "What medicine should I take"}
        response = self.session.post(f"{BASE_URL}/moderation/check", json=moderation_data)
        if response.status_code != 200:
            print(f"❌ POST /moderation/check failed: {response.status_code}")
            return False
        
        data = response.json()
        if data.get('status') != 'seeking_prescription':
            print(f"❌ Moderation check should return seeking_prescription, got {data.get('status')}")
            return False
        print(f"✅ POST /moderation/check still working (seeking_prescription)")
        
        return True
    
    def run_all_tests(self):
        """Run all test scenarios"""
        print("🚀 Starting Burnout Tracker Backend Tests")
        print("=" * 50)
        
        # Authenticate first
        if not self.authenticate():
            print("\n❌ AUTHENTICATION FAILED - Cannot proceed with tests")
            return False
        
        # Run all tests
        tests = [
            ("Burnout Weekly Endpoint", self.test_burnout_weekly_endpoint),
            ("Auth Enforcement", self.test_auth_enforcement),
            ("Regression Tests", self.test_regression_endpoints),
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))
        
        # Summary
        print("\n" + "=" * 50)
        print("📋 TEST SUMMARY")
        print("=" * 50)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
            if result:
                passed += 1
        
        print(f"\n🎯 Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED - Burnout Tracker backend is working correctly!")
            return True
        else:
            print("⚠️  SOME TESTS FAILED - See details above")
            return False

if __name__ == "__main__":
    tester = BurnoutTrackerTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)