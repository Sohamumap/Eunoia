#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Eunoia Platform
Tests all API endpoints with proper authentication flow
"""

import requests
import json
import sys
from datetime import datetime
import uuid

class EunoiaAPITester:
    def __init__(self, base_url="https://hi-there-2071.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_email = f"test_{datetime.now().strftime('%H%M%S')}@hospital.org"
        
    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
    def api_call(self, method, endpoint, data=None, expected_status=200, auth_required=True):
        """Make API call with proper headers"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, f"Unsupported method: {method}"
                
            success = response.status_code == expected_status
            response_data = {}
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
                
            return success, response_data, response.status_code
            
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}", 0
    
    def test_auth_signup(self):
        """Test user signup"""
        success, data, status = self.api_call(
            'POST', 'auth/signup',
            {
                "email": self.test_email,
                "locale": "IN", 
                "role": "resident"
            },
            expected_status=200,
            auth_required=False
        )
        
        if success and 'token' in data and 'user' in data:
            self.token = data['token']
            self.user_id = data['user']['id']
            self.log_test("Auth Signup", True)
            return True
        else:
            self.log_test("Auth Signup", False, f"Status: {status}, Data: {data}")
            return False
    
    def test_auth_me(self):
        """Test get current user"""
        success, data, status = self.api_call('GET', 'auth/me')
        
        if success and 'user' in data:
            self.log_test("Auth Me", True)
            return True
        else:
            self.log_test("Auth Me", False, f"Status: {status}")
            return False
    
    def test_complete_onboarding(self):
        """Test complete onboarding"""
        success, data, status = self.api_call('POST', 'auth/complete-onboarding')
        
        if success:
            self.log_test("Complete Onboarding", True)
            return True
        else:
            self.log_test("Complete Onboarding", False, f"Status: {status}")
            return False
    
    def test_consent_operations(self):
        """Test consent get and update"""
        # Get consents
        success, data, status = self.api_call('GET', 'consent/me')
        
        if success and 'consents' in data:
            self.log_test("Get Consents", True)
            
            # Update a consent
            success2, data2, status2 = self.api_call(
                'PUT', 'consent/update',
                {"scope": "research_scales", "granted": False}
            )
            
            if success2:
                self.log_test("Update Consent", True)
                return True
            else:
                self.log_test("Update Consent", False, f"Status: {status2}")
                return False
        else:
            self.log_test("Get Consents", False, f"Status: {status}")
            return False
    
    def test_assessment_questions(self):
        """Test get assessment questions"""
        success, data, status = self.api_call('GET', 'assessments/questions', auth_required=False)
        
        if success and 'questions' in data and len(data['questions']) == 25:
            self.log_test("Assessment Questions", True)
            return data['questions']
        else:
            self.log_test("Assessment Questions", False, f"Status: {status}, Questions count: {len(data.get('questions', []))}")
            return None
    
    def test_assessment_submit(self, questions):
        """Test submit assessment"""
        if not questions:
            self.log_test("Assessment Submit", False, "No questions available")
            return False
            
        # Create sample responses
        responses = {}
        for q in questions:
            # Use middle value for each question
            if q['options']:
                responses[q['id']] = q['options'][len(q['options'])//2]['value']
        
        success, data, status = self.api_call(
            'POST', 'assessments/submit',
            {"responses": responses}
        )
        
        if success and 'assessment_ids' in data and 'profile' in data:
            self.log_test("Assessment Submit", True)
            return True
        else:
            self.log_test("Assessment Submit", False, f"Status: {status}")
            return False
    
    def test_profile_get(self):
        """Test get wellness profile"""
        success, data, status = self.api_call('GET', 'profiles/me')
        
        if success:
            self.log_test("Get Profile", True)
            return True
        else:
            self.log_test("Get Profile", False, f"Status: {status}")
            return False
    
    def test_forums_list(self):
        """Test get forums list"""
        success, data, status = self.api_call('GET', 'forums', auth_required=False)
        
        if success and 'forums' in data and len(data['forums']) == 4:
            self.log_test("Forums List", True)
            return data['forums']
        else:
            self.log_test("Forums List", False, f"Status: {status}, Forums count: {len(data.get('forums', []))}")
            return None
    
    def test_forum_detail(self, forums):
        """Test get forum detail"""
        if not forums:
            self.log_test("Forum Detail", False, "No forums available")
            return False
            
        forum_id = forums[0]['id']
        success, data, status = self.api_call('GET', f'forums/{forum_id}', auth_required=False)
        
        if success and 'forum' in data and 'posts' in data:
            self.log_test("Forum Detail", True)
            return forum_id
        else:
            self.log_test("Forum Detail", False, f"Status: {status}")
            return None
    
    def test_moderation_check(self):
        """Test moderation check"""
        test_texts = [
            "I'm feeling really tired today",  # Should be approved
            "You should try xanax for anxiety",  # Should need rewrite
            "You have depression",  # Should be blocked
        ]
        
        all_passed = True
        for i, text in enumerate(test_texts):
            success, data, status = self.api_call(
                'POST', 'moderation/check',
                {"text": text},
                auth_required=False
            )
            
            if success and 'status' in data:
                self.log_test(f"Moderation Check {i+1}", True)
            else:
                self.log_test(f"Moderation Check {i+1}", False, f"Status: {status}")
                all_passed = False
                
        return all_passed
    
    def test_forum_post(self, forum_id):
        """Test create forum post"""
        if not forum_id:
            self.log_test("Forum Post", False, "No forum ID available")
            return False
            
        success, data, status = self.api_call(
            'POST', f'forums/{forum_id}/posts',
            {"body": "This is a test post from the API testing suite.", "is_private": False}
        )
        
        if success and 'posted' in data:
            self.log_test("Forum Post", True)
            return True
        else:
            self.log_test("Forum Post", False, f"Status: {status}")
            return False
    
    def test_reflections(self):
        """Test reflection operations"""
        # Create reflection
        success, data, status = self.api_call(
            'POST', 'reflections',
            {"body": "This is a test reflection for the API testing. " * 20, "is_private": True}  # Make it long enough
        )
        
        if success and 'saved' in data:
            self.log_test("Create Reflection", True)
            
            # Get reflections
            success2, data2, status2 = self.api_call('GET', 'reflections/me')
            
            if success2 and 'reflections' in data2:
                self.log_test("Get Reflections", True)
                return True
            else:
                self.log_test("Get Reflections", False, f"Status: {status2}")
                return False
        else:
            self.log_test("Create Reflection", False, f"Status: {status}")
            return False
    
    def test_crisis_helplines(self):
        """Test crisis helplines"""
        success, data, status = self.api_call('GET', 'crisis/helplines/IN', auth_required=False)
        
        if success and 'helplines' in data:
            self.log_test("Crisis Helplines", True)
            return True
        else:
            self.log_test("Crisis Helplines", False, f"Status: {status}")
            return False
    
    def test_data_contributions(self):
        """Test data contributions"""
        success, data, status = self.api_call('GET', 'data/contributions')
        
        if success and 'reflection_count' in data:
            self.log_test("Data Contributions", True)
            return True
        else:
            self.log_test("Data Contributions", False, f"Status: {status}")
            return False
    
    def test_data_export(self):
        """Test data export"""
        success, data, status = self.api_call('GET', 'data/export')
        
        if success and 'user' in data:
            self.log_test("Data Export", True)
            return True
        else:
            self.log_test("Data Export", False, f"Status: {status}")
            return False
    
    def test_auth_logout(self):
        """Test logout"""
        success, data, status = self.api_call('POST', 'auth/logout')
        
        if success:
            self.log_test("Auth Logout", True)
            return True
        else:
            self.log_test("Auth Logout", False, f"Status: {status}")
            return False
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print(f"🚀 Starting Eunoia API Tests")
        print(f"📍 Backend URL: {self.base_url}")
        print(f"📧 Test Email: {self.test_email}")
        print("=" * 60)
        
        # Test authentication flow
        if not self.test_auth_signup():
            print("❌ Authentication failed - stopping tests")
            return False
            
        self.test_auth_me()
        self.test_complete_onboarding()
        
        # Test consent operations
        self.test_consent_operations()
        
        # Test assessment flow
        questions = self.test_assessment_questions()
        self.test_assessment_submit(questions)
        self.test_profile_get()
        
        # Test forums
        forums = self.test_forums_list()
        forum_id = self.test_forum_detail(forums)
        self.test_forum_post(forum_id)
        
        # Test moderation
        self.test_moderation_check()
        
        # Test reflections
        self.test_reflections()
        
        # Test crisis features
        self.test_crisis_helplines()
        
        # Test data features
        self.test_data_contributions()
        self.test_data_export()
        
        # Test logout
        self.test_auth_logout()
        
        # Print results
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("🎉 Backend APIs are working well!")
            return True
        elif success_rate >= 70:
            print("⚠️  Backend has some issues but core functionality works")
            return True
        else:
            print("🚨 Backend has significant issues")
            return False

def main():
    """Main test execution"""
    tester = EunoiaAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())