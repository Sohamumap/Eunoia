#!/usr/bin/env python3
"""
Backend API Testing for Eunoia Mood Check-in and Dashboard Features
Tests the newly added endpoints for mood tracking and dashboard summary.
"""

import requests
import json
import sys
from datetime import datetime, timezone, timedelta

# Configuration
BASE_URL = "https://proto-feature-fix.preview.emergentagent.com/api"
DEMO_EMAIL = "demo@eunoia.app"

class EunoiaAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.user = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def login_demo_user(self):
        """Login with demo user credentials"""
        self.log("Attempting to login with demo user...")
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", 
                                       json={"email": DEMO_EMAIL})
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.user = data.get("user")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
                self.log(f"✅ Login successful - User: {self.user.get('display_name', 'Unknown')}")
                return True
            else:
                self.log(f"❌ Login failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Login error: {str(e)}", "ERROR")
            return False
    
    def test_mood_meta(self):
        """Test GET /api/mood/meta endpoint"""
        self.log("Testing mood metadata endpoint...")
        try:
            # This endpoint should not require auth
            response = requests.get(f"{BASE_URL}/mood/meta")
            
            if response.status_code == 200:
                data = response.json()
                moods = data.get("moods", {})
                
                # Check all 5 expected moods
                expected_moods = ["radiant", "steady", "tender", "heavy", "depleted"]
                missing_moods = []
                
                for mood in expected_moods:
                    if mood not in moods:
                        missing_moods.append(mood)
                    else:
                        mood_data = moods[mood]
                        required_fields = ["label", "value", "color", "description"]
                        for field in required_fields:
                            if field not in mood_data:
                                self.log(f"❌ Mood '{mood}' missing field: {field}", "ERROR")
                
                if missing_moods:
                    self.log(f"❌ Missing moods: {missing_moods}", "ERROR")
                    return False
                
                # Verify value range (1-5)
                for mood, data in moods.items():
                    value = data.get("value")
                    if not isinstance(value, int) or value < 1 or value > 5:
                        self.log(f"❌ Mood '{mood}' has invalid value: {value}", "ERROR")
                        return False
                
                self.log(f"✅ Mood metadata valid - Found {len(moods)} moods")
                return True
            else:
                self.log(f"❌ Mood meta failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Mood meta error: {str(e)}", "ERROR")
            return False
    
    def test_mood_checkin(self):
        """Test POST /api/mood/checkin endpoint"""
        self.log("Testing mood check-in endpoint...")
        
        # Test valid mood check-in
        test_cases = [
            {
                "name": "Valid mood checkin",
                "payload": {"mood": "steady", "intensity": 3, "note": "Testing mood checkin"},
                "should_succeed": True
            },
            {
                "name": "Invalid mood",
                "payload": {"mood": "happy", "intensity": 3, "note": "Invalid mood"},
                "should_succeed": False
            },
            {
                "name": "Intensity clamping (high)",
                "payload": {"mood": "radiant", "intensity": 99, "note": "High intensity"},
                "should_succeed": True,
                "expected_intensity": 5
            },
            {
                "name": "Intensity clamping (low)",
                "payload": {"mood": "depleted", "intensity": -3, "note": "Low intensity"},
                "should_succeed": True,
                "expected_intensity": 1
            },
            {
                "name": "Note truncation",
                "payload": {"mood": "tender", "intensity": 2, "note": "x" * 600},
                "should_succeed": True,
                "expected_note_length": 500
            }
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            self.log(f"  Testing: {test_case['name']}")
            try:
                response = self.session.post(f"{BASE_URL}/mood/checkin", 
                                           json=test_case["payload"])
                
                if test_case["should_succeed"]:
                    if response.status_code == 200:
                        data = response.json()
                        entry = data.get("entry", {})
                        created = data.get("created")
                        
                        # Verify entry structure
                        required_fields = ["date", "user_id", "mood", "intensity", "note"]
                        for field in required_fields:
                            if field not in entry:
                                self.log(f"    ❌ Missing field in entry: {field}", "ERROR")
                                all_passed = False
                        
                        # Check date is today
                        today = datetime.now(timezone.utc).date().isoformat()
                        if entry.get("date") != today:
                            self.log(f"    ❌ Entry date mismatch: {entry.get('date')} != {today}", "ERROR")
                            all_passed = False
                        
                        # Check intensity clamping
                        if "expected_intensity" in test_case:
                            if entry.get("intensity") != test_case["expected_intensity"]:
                                self.log(f"    ❌ Intensity not clamped: {entry.get('intensity')} != {test_case['expected_intensity']}", "ERROR")
                                all_passed = False
                        
                        # Check note truncation
                        if "expected_note_length" in test_case:
                            note_length = len(entry.get("note", ""))
                            if note_length != test_case["expected_note_length"]:
                                self.log(f"    ❌ Note not truncated: {note_length} != {test_case['expected_note_length']}", "ERROR")
                                all_passed = False
                        
                        self.log(f"    ✅ {test_case['name']} passed")
                    else:
                        self.log(f"    ❌ {test_case['name']} failed: {response.status_code} - {response.text}", "ERROR")
                        all_passed = False
                else:
                    if response.status_code == 400:
                        self.log(f"    ✅ {test_case['name']} correctly rejected")
                    else:
                        self.log(f"    ❌ {test_case['name']} should have been rejected but got: {response.status_code}", "ERROR")
                        all_passed = False
                        
            except Exception as e:
                self.log(f"    ❌ {test_case['name']} error: {str(e)}", "ERROR")
                all_passed = False
        
        # Test idempotency (second call same day should update, not create)
        self.log("  Testing idempotency...")
        try:
            response = self.session.post(f"{BASE_URL}/mood/checkin", 
                                       json={"mood": "steady", "intensity": 4, "note": "Updated note"})
            if response.status_code == 200:
                data = response.json()
                if data.get("created") == False:
                    self.log("    ✅ Idempotency test passed (updated existing entry)")
                else:
                    self.log("    ❌ Idempotency failed - created new entry instead of updating", "ERROR")
                    all_passed = False
            else:
                self.log(f"    ❌ Idempotency test failed: {response.status_code}", "ERROR")
                all_passed = False
        except Exception as e:
            self.log(f"    ❌ Idempotency test error: {str(e)}", "ERROR")
            all_passed = False
        
        return all_passed
    
    def test_mood_today(self):
        """Test GET /api/mood/today endpoint"""
        self.log("Testing mood today endpoint...")
        try:
            response = self.session.get(f"{BASE_URL}/mood/today")
            
            if response.status_code == 200:
                data = response.json()
                entry = data.get("entry")
                
                if entry is not None:
                    # Should have today's entry from previous test
                    today = datetime.now(timezone.utc).date().isoformat()
                    if entry.get("date") != today:
                        self.log(f"❌ Today's entry has wrong date: {entry.get('date')} != {today}", "ERROR")
                        return False
                    
                    required_fields = ["date", "user_id", "mood", "intensity"]
                    for field in required_fields:
                        if field not in entry:
                            self.log(f"❌ Missing field in today's entry: {field}", "ERROR")
                            return False
                    
                    self.log("✅ Today's mood entry retrieved successfully")
                else:
                    self.log("✅ No mood entry for today (valid response)")
                
                return True
            else:
                self.log(f"❌ Mood today failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Mood today error: {str(e)}", "ERROR")
            return False
    
    def test_mood_calendar(self):
        """Test GET /api/mood/calendar endpoint"""
        self.log("Testing mood calendar endpoint...")
        
        test_cases = [
            {"days": None, "expected_days": 90},  # Default
            {"days": 5, "expected_days": 7},     # Clamped to minimum
            {"days": 500, "expected_days": 180}, # Clamped to maximum
            {"days": 30, "expected_days": 30},   # Valid range
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            days_param = test_case["days"]
            expected_days = test_case["expected_days"]
            
            url = f"{BASE_URL}/mood/calendar"
            if days_param is not None:
                url += f"?days={days_param}"
            
            self.log(f"  Testing calendar with days={days_param}")
            
            try:
                response = self.session.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check required fields
                    required_fields = ["days", "logged_count", "avg_value", "streak", "total_days"]
                    for field in required_fields:
                        if field not in data:
                            self.log(f"    ❌ Missing field: {field}", "ERROR")
                            all_passed = False
                    
                    # Check days array length
                    days_array = data.get("days", [])
                    if len(days_array) != expected_days:
                        self.log(f"    ❌ Days array length mismatch: {len(days_array)} != {expected_days}", "ERROR")
                        all_passed = False
                    
                    # Check total_days matches
                    if data.get("total_days") != expected_days:
                        self.log(f"    ❌ total_days mismatch: {data.get('total_days')} != {expected_days}", "ERROR")
                        all_passed = False
                    
                    # Verify days are ordered oldest to newest
                    if len(days_array) > 1:
                        for i in range(1, len(days_array)):
                            if days_array[i]["date"] <= days_array[i-1]["date"]:
                                self.log(f"    ❌ Days not ordered correctly", "ERROR")
                                all_passed = False
                                break
                    
                    # Check demo user should have logged entries
                    logged_count = data.get("logged_count", 0)
                    if logged_count < 38 or logged_count > 42:
                        self.log(f"    ⚠️  Demo user logged_count unexpected: {logged_count} (expected ~40)", "WARN")
                    
                    self.log(f"    ✅ Calendar test passed - {logged_count} logged days")
                else:
                    self.log(f"    ❌ Calendar failed: {response.status_code} - {response.text}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"    ❌ Calendar error: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def test_dashboard_summary(self):
        """Test GET /api/dashboard/summary endpoint"""
        self.log("Testing dashboard summary endpoint...")
        try:
            response = self.session.get(f"{BASE_URL}/dashboard/summary")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["user", "profile", "assessment_count", "reflection_count", 
                                 "qualifying_count", "mood_today", "streak", "recent_posts"]
                for field in required_fields:
                    if field not in data:
                        self.log(f"❌ Missing field in dashboard: {field}", "ERROR")
                        return False
                
                # Check demo user specific data
                profile = data.get("profile")
                if not profile:
                    self.log("❌ Demo user should have a profile", "ERROR")
                    return False
                
                if profile.get("archetype") != "The Over-Committed Healer":
                    self.log(f"❌ Demo user archetype mismatch: {profile.get('archetype')} != 'The Over-Committed Healer'", "ERROR")
                    return False
                
                assessment_count = data.get("assessment_count", 0)
                if assessment_count != 6:
                    self.log(f"❌ Demo user assessment_count mismatch: {assessment_count} != 6", "ERROR")
                    return False
                
                reflection_count = data.get("reflection_count", 0)
                if reflection_count != 5:
                    self.log(f"❌ Demo user reflection_count mismatch: {reflection_count} != 5", "ERROR")
                    return False
                
                qualifying_count = data.get("qualifying_count", 0)
                # Demo user reflections are short, so qualifying_count should be 0
                if qualifying_count != 0:
                    self.log(f"⚠️  Demo user qualifying_count unexpected: {qualifying_count} (expected 0 due to short reflections)", "WARN")
                
                streak = data.get("streak", 0)
                if streak < 1:
                    self.log(f"❌ Demo user streak too low: {streak}", "ERROR")
                    return False
                
                # Check recent_posts structure
                recent_posts = data.get("recent_posts", [])
                if len(recent_posts) > 3:
                    self.log(f"❌ Too many recent posts: {len(recent_posts)} > 3", "ERROR")
                    return False
                
                for post in recent_posts:
                    if "forum_name" not in post:
                        self.log("❌ Recent post missing forum_name", "ERROR")
                        return False
                
                self.log("✅ Dashboard summary valid for demo user")
                self.log(f"  Profile: {profile.get('archetype')}")
                self.log(f"  Assessments: {assessment_count}, Reflections: {reflection_count}")
                self.log(f"  Qualifying: {qualifying_count}, Streak: {streak}")
                return True
                
            else:
                self.log(f"❌ Dashboard summary failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Dashboard summary error: {str(e)}", "ERROR")
            return False
    
    def test_auth_enforcement(self):
        """Test that protected endpoints require authentication"""
        self.log("Testing auth enforcement...")
        
        protected_endpoints = [
            "/mood/checkin",
            "/mood/today", 
            "/mood/calendar",
            "/dashboard/summary"
        ]
        
        # Create session without auth
        unauth_session = requests.Session()
        all_passed = True
        
        for endpoint in protected_endpoints:
            self.log(f"  Testing auth on {endpoint}")
            try:
                if endpoint == "/mood/checkin":
                    response = unauth_session.post(f"{BASE_URL}{endpoint}", 
                                                 json={"mood": "steady", "intensity": 3})
                else:
                    response = unauth_session.get(f"{BASE_URL}{endpoint}")
                
                if response.status_code in [401, 403]:
                    self.log(f"    ✅ {endpoint} correctly requires auth")
                else:
                    self.log(f"    ❌ {endpoint} should require auth but got: {response.status_code}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"    ❌ Auth test error for {endpoint}: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def test_regression_endpoints(self):
        """Quick smoke test of pre-existing endpoints"""
        self.log("Testing regression on pre-existing endpoints...")
        
        endpoints = [
            "/forums",
            "/hub/practices"
        ]
        
        all_passed = True
        
        for endpoint in endpoints:
            self.log(f"  Testing {endpoint}")
            try:
                response = requests.get(f"{BASE_URL}{endpoint}")
                
                if response.status_code == 200:
                    data = response.json()
                    if data:  # Should return some data
                        self.log(f"    ✅ {endpoint} working")
                    else:
                        self.log(f"    ⚠️  {endpoint} returned empty data", "WARN")
                else:
                    self.log(f"    ❌ {endpoint} failed: {response.status_code}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"    ❌ {endpoint} error: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def run_all_tests(self):
        """Run all tests and return summary"""
        self.log("=" * 60)
        self.log("Starting Eunoia Backend API Tests")
        self.log("=" * 60)
        
        results = {}
        
        # Login first
        if not self.login_demo_user():
            self.log("❌ Cannot proceed without login", "ERROR")
            return False
        
        # Run all tests
        test_methods = [
            ("Mood Meta", self.test_mood_meta),
            ("Mood Check-in", self.test_mood_checkin),
            ("Mood Today", self.test_mood_today),
            ("Mood Calendar", self.test_mood_calendar),
            ("Dashboard Summary", self.test_dashboard_summary),
            ("Auth Enforcement", self.test_auth_enforcement),
            ("Regression Check", self.test_regression_endpoints),
        ]
        
        passed = 0
        total = len(test_methods)
        
        for test_name, test_method in test_methods:
            self.log(f"\n--- {test_name} ---")
            try:
                result = test_method()
                results[test_name] = result
                if result:
                    passed += 1
                    self.log(f"✅ {test_name} PASSED")
                else:
                    self.log(f"❌ {test_name} FAILED")
            except Exception as e:
                self.log(f"❌ {test_name} ERROR: {str(e)}", "ERROR")
                results[test_name] = False
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log(f"⚠️  {total - passed} tests failed")
            return False

if __name__ == "__main__":
    tester = EunoiaAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)