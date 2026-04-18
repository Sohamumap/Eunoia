#!/usr/bin/env python3
"""
Prescription-Seeking Moderation Guardrail Testing for Eunoia
Tests the new seeking_prescription status in check_moderation() function.
"""

import requests
import json
import sys
from datetime import datetime, timezone

# Configuration
BASE_URL = "https://app-preview-mobile-19.preview.emergentagent.com/api"
DEMO_EMAIL = "demo@eunoia.app"

class PrescriptionModerationTester:
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
    
    def test_moderation_check_endpoint(self):
        """Test POST /api/moderation/check with prescription-seeking patterns"""
        self.log("Testing moderation check endpoint for prescription-seeking patterns...")
        
        test_cases = [
            # Prescription-seeking cases (should trigger seeking_prescription)
            {
                "text": "What medicine should I take for my anxiety?",
                "expected_status": "seeking_prescription",
                "description": "Direct medicine request"
            },
            {
                "text": "Can someone prescribe me xanax please?",
                "expected_status": "seeking_prescription", 
                "description": "Prescription request"
            },
            {
                "text": "Is 50mg of zoloft safe for me?",
                "expected_status": "seeking_prescription",
                "description": "Dosage safety question"
            },
            {
                "text": "Diagnose me please",
                "expected_status": "seeking_prescription",
                "description": "Diagnosis request"
            },
            {
                "text": "How many mg of ambien should I take?",
                "expected_status": "seeking_prescription",
                "description": "Dosage question"
            },
            {
                "text": "Recommend me an antidepressant",
                "expected_status": "seeking_prescription",
                "description": "Medication recommendation request"
            },
            {
                "text": "Do I have depression?",
                "expected_status": "seeking_prescription",
                "description": "Self-diagnosis question"
            },
            
            # Crisis cases (should still trigger paused_crisis - highest priority)
            {
                "text": "I want to end my life",
                "expected_status": "paused_crisis",
                "description": "Crisis content (should remain highest priority)"
            },
            
            # Normal cases (should be approved)
            {
                "text": "Work has been overwhelming this week and I feel exhausted",
                "expected_status": "approved",
                "description": "Normal sharing (no false positive)"
            },
            
            # Peer medication advice (should be needs_rewrite, not seeking_prescription)
            {
                "text": "I take 50mg zoloft daily, it helps me sleep better",
                "expected_status": "needs_rewrite",
                "description": "Peer medication advice (unchanged flow)"
            }
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            self.log(f"  Testing: {test_case['description']}")
            try:
                response = self.session.post(f"{BASE_URL}/moderation/check", 
                                           json={"text": test_case["text"]})
                
                if response.status_code == 200:
                    data = response.json()
                    status = data.get("status")
                    flags = data.get("flags", [])
                    message = data.get("message")
                    
                    if status == test_case["expected_status"]:
                        self.log(f"    ✅ Status correct: {status}")
                        
                        # Additional checks for seeking_prescription
                        if status == "seeking_prescription":
                            # Should have message field
                            if not message:
                                self.log(f"    ❌ Missing message field for seeking_prescription", "ERROR")
                                all_passed = False
                            else:
                                self.log(f"    ✅ Message present: {message[:50]}...")
                            
                            # Should have at least one seeking_prescription flag
                            seeking_flags = [f for f in flags if f.get("type") == "seeking_prescription"]
                            if not seeking_flags:
                                self.log(f"    ❌ Missing seeking_prescription flag", "ERROR")
                                all_passed = False
                            else:
                                self.log(f"    ✅ Found {len(seeking_flags)} seeking_prescription flag(s)")
                        
                        # Crisis should still work
                        elif status == "paused_crisis":
                            crisis_flags = [f for f in flags if f.get("type") == "crisis"]
                            if not crisis_flags:
                                self.log(f"    ❌ Missing crisis flag", "ERROR")
                                all_passed = False
                            else:
                                self.log(f"    ✅ Crisis detection still working")
                    else:
                        self.log(f"    ❌ Status mismatch: got {status}, expected {test_case['expected_status']}", "ERROR")
                        all_passed = False
                else:
                    self.log(f"    ❌ Request failed: {response.status_code} - {response.text}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"    ❌ Error: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def test_reflections_endpoint(self):
        """Test POST /api/reflections with prescription-seeking content"""
        self.log("Testing reflections endpoint with prescription-seeking content...")
        
        # Get initial reflection count
        try:
            response = self.session.get(f"{BASE_URL}/reflections/me")
            if response.status_code == 200:
                initial_count = len(response.json().get("reflections", []))
            else:
                initial_count = 0
        except:
            initial_count = 0
        
        test_cases = [
            {
                "body": "What medicine should I take for my anxiety?",
                "should_save": False,
                "expected_referral": "physician",
                "description": "Prescription-seeking reflection"
            },
            {
                "body": "Work has been really stressful lately and I'm feeling burned out",
                "should_save": True,
                "description": "Normal reflection"
            }
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            self.log(f"  Testing: {test_case['description']}")
            try:
                response = self.session.post(f"{BASE_URL}/reflections", 
                                           json={
                                               "body": test_case["body"],
                                               "is_private": True
                                           })
                
                if response.status_code == 200:
                    data = response.json()
                    saved = data.get("saved")
                    moderation = data.get("moderation", {})
                    referral = data.get("referral")
                    
                    if saved == test_case["should_save"]:
                        self.log(f"    ✅ Save status correct: {saved}")
                        
                        if not test_case["should_save"]:
                            # Should not be saved and should have physician referral
                            if moderation.get("status") != "seeking_prescription":
                                self.log(f"    ❌ Expected seeking_prescription status, got {moderation.get('status')}", "ERROR")
                                all_passed = False
                            
                            if referral != test_case.get("expected_referral"):
                                self.log(f"    ❌ Expected referral {test_case.get('expected_referral')}, got {referral}", "ERROR")
                                all_passed = False
                            else:
                                self.log(f"    ✅ Correct referral: {referral}")
                    else:
                        self.log(f"    ❌ Save status mismatch: got {saved}, expected {test_case['should_save']}", "ERROR")
                        all_passed = False
                else:
                    self.log(f"    ❌ Request failed: {response.status_code} - {response.text}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"    ❌ Error: {str(e)}", "ERROR")
                all_passed = False
        
        # Verify reflection count didn't increase for blocked content
        try:
            response = self.session.get(f"{BASE_URL}/reflections/me")
            if response.status_code == 200:
                final_count = len(response.json().get("reflections", []))
                expected_count = initial_count + 1  # Only one should have been saved
                if final_count == expected_count:
                    self.log(f"    ✅ Reflection count correct: {final_count} (increased by 1)")
                else:
                    self.log(f"    ❌ Reflection count mismatch: {final_count}, expected {expected_count}", "ERROR")
                    all_passed = False
        except Exception as e:
            self.log(f"    ❌ Error checking reflection count: {str(e)}", "ERROR")
            all_passed = False
        
        return all_passed
    
    def test_forum_posts_endpoint(self):
        """Test POST /api/forums/{forum_id}/posts with prescription-seeking content"""
        self.log("Testing forum posts endpoint with prescription-seeking content...")
        
        # Get a valid forum_id first
        try:
            response = self.session.get(f"{BASE_URL}/forums")
            if response.status_code == 200:
                forums = response.json().get("forums", [])
                if forums:
                    forum_id = forums[0]["id"]
                    self.log(f"  Using forum: {forums[0].get('name', 'Unknown')}")
                else:
                    self.log("❌ No forums available for testing", "ERROR")
                    return False
            else:
                self.log(f"❌ Failed to get forums: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Error getting forums: {str(e)}", "ERROR")
            return False
        
        test_cases = [
            {
                "body": "Can someone prescribe me xanax?",
                "should_post": False,
                "expected_referral": "physician",
                "description": "Prescription-seeking forum post"
            },
            {
                "body": "I want to end my life",
                "should_post": False,
                "expected_crisis": True,
                "description": "Crisis content (regression test)"
            },
            {
                "body": "Having a tough day at work, could use some support",
                "should_post": True,
                "description": "Normal forum post"
            }
        ]
        
        all_passed = True
        
        for test_case in test_cases:
            self.log(f"  Testing: {test_case['description']}")
            try:
                response = self.session.post(f"{BASE_URL}/forums/{forum_id}/posts", 
                                           json={
                                               "body": test_case["body"],
                                               "is_private": False
                                           })
                
                if response.status_code == 200:
                    data = response.json()
                    posted = data.get("posted")
                    moderation = data.get("moderation", {})
                    referral = data.get("referral")
                    crisis_blocked = data.get("crisis_blocked")
                    
                    if posted == test_case["should_post"]:
                        self.log(f"    ✅ Post status correct: {posted}")
                        
                        if not test_case["should_post"]:
                            if test_case.get("expected_crisis"):
                                # Crisis test
                                if crisis_blocked and moderation.get("status") == "paused_crisis":
                                    self.log(f"    ✅ Crisis blocking still works")
                                else:
                                    self.log(f"    ❌ Crisis blocking failed", "ERROR")
                                    all_passed = False
                            else:
                                # Prescription-seeking test
                                if moderation.get("status") == "seeking_prescription" and referral == "physician":
                                    self.log(f"    ✅ Prescription-seeking blocking works")
                                else:
                                    self.log(f"    ❌ Prescription-seeking blocking failed", "ERROR")
                                    all_passed = False
                    else:
                        self.log(f"    ❌ Post status mismatch: got {posted}, expected {test_case['should_post']}", "ERROR")
                        all_passed = False
                else:
                    self.log(f"    ❌ Request failed: {response.status_code} - {response.text}", "ERROR")
                    all_passed = False
                    
            except Exception as e:
                self.log(f"    ❌ Error: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def test_regression_endpoints(self):
        """Test that existing endpoints still work correctly"""
        self.log("Testing regression on mood/dashboard endpoints...")
        
        endpoints = [
            "/mood/today",
            "/dashboard/summary", 
            "/mood/calendar?days=30"
        ]
        
        all_passed = True
        
        for endpoint in endpoints:
            self.log(f"  Testing {endpoint}")
            try:
                response = self.session.get(f"{BASE_URL}{endpoint}")
                
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
        """Run all prescription moderation tests"""
        self.log("=" * 70)
        self.log("Starting Prescription-Seeking Moderation Guardrail Tests")
        self.log("=" * 70)
        
        results = {}
        
        # Login first
        if not self.login_demo_user():
            self.log("❌ Cannot proceed without login", "ERROR")
            return False
        
        # Run all tests
        test_methods = [
            ("Moderation Check Endpoint", self.test_moderation_check_endpoint),
            ("Reflections Endpoint", self.test_reflections_endpoint),
            ("Forum Posts Endpoint", self.test_forum_posts_endpoint),
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
        self.log("\n" + "=" * 70)
        self.log("TEST SUMMARY")
        self.log("=" * 70)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL PRESCRIPTION MODERATION TESTS PASSED!")
            return True
        else:
            self.log(f"⚠️  {total - passed} tests failed")
            return False

if __name__ == "__main__":
    tester = PrescriptionModerationTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)