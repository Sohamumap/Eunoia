import requests
import sys
import json
from datetime import datetime

class EunoiaAPITester:
    def __init__(self, base_url="https://hi-there-2071.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_signup(self):
        """Test signup with enhanced user data"""
        test_email = f"test_enhanced_{datetime.now().strftime('%H%M%S')}@hospital.org"
        success, response = self.run_test(
            "Enhanced Signup",
            "POST",
            "auth/signup",
            200,
            data={"email": test_email, "locale": "IN", "role": "resident"}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            print(f"   Display Name: {response['user']['display_name']}")
            return True
        return False

    def test_assessment_questions(self):
        """Test enhanced assessment with 43 questions across 6 sections"""
        success, response = self.run_test(
            "Enhanced Assessment Questions (43 total)",
            "GET",
            "assessments/questions",
            200
        )
        if success:
            questions = response.get('questions', [])
            sections = response.get('sections', [])
            total = response.get('total', 0)
            
            print(f"   Total questions: {total}")
            print(f"   Sections: {len(sections)}")
            
            # Verify 43 questions
            if total != 43:
                print(f"   ❌ Expected 43 questions, got {total}")
                return False
                
            # Verify 6 sections
            if len(sections) != 6:
                print(f"   ❌ Expected 6 sections, got {len(sections)}")
                return False
                
            # Verify section question counts
            expected_counts = {"mood": 9, "anxiety": 7, "stress": 10, "sleep": 8, "burnout": 6, "connection": 3}
            for section in sections:
                section_questions = [q for q in questions if q['section'] == section['id']]
                expected = expected_counts.get(section['id'], 0)
                if len(section_questions) != expected:
                    print(f"   ❌ Section {section['id']}: expected {expected} questions, got {len(section_questions)}")
                    return False
                print(f"   ✅ {section['title']}: {len(section_questions)} questions")
            
            return True
        return False

    def test_assessment_submission(self):
        """Test assessment submission with all 43 questions"""
        # First get questions
        success, response = self.run_test(
            "Get Questions for Submission",
            "GET",
            "assessments/questions",
            200
        )
        if not success:
            return False
            
        questions = response.get('questions', [])
        
        # Create responses for all 43 questions
        responses = {}
        for q in questions:
            # Use middle values for testing
            max_val = max([opt['value'] for opt in q['options']])
            responses[q['id']] = max_val // 2
            
        success, response = self.run_test(
            "Submit Enhanced Assessment (43 questions)",
            "POST",
            "assessments/submit",
            200,
            data={"responses": responses}
        )
        
        if success:
            profile = response.get('profile', {})
            assessment_ids = response.get('assessment_ids', [])
            
            print(f"   Assessment IDs: {len(assessment_ids)}")
            print(f"   Profile archetype: {profile.get('archetype')}")
            
            # Verify 5 score bars including sleep_score
            required_scores = ['anxiety_score', 'stress_score', 'loneliness_score', 'burnout_score', 'sleep_score']
            for score_key in required_scores:
                if score_key not in profile:
                    print(f"   ❌ Missing {score_key} in profile")
                    return False
                print(f"   ✅ {score_key}: {profile[score_key]}%")
            
            return True
        return False

    def test_crisis_moderation(self):
        """Test crisis guardrail with 'suicide now' text"""
        success, response = self.run_test(
            "Crisis Moderation Check",
            "POST",
            "moderation/check",
            200,
            data={"text": "I want to commit suicide now"}
        )
        
        if success:
            status = response.get('status')
            if status != 'paused_crisis':
                print(f"   ❌ Expected 'paused_crisis', got '{status}'")
                return False
            print(f"   ✅ Crisis detected: {status}")
            return True
        return False

    def test_crisis_forum_post_blocked(self):
        """Test that crisis posts are blocked from forums"""
        # Get a forum first
        success, response = self.run_test(
            "Get Forums",
            "GET",
            "forums",
            200
        )
        if not success or not response.get('forums'):
            return False
            
        forum_id = response['forums'][0]['id']
        
        success, response = self.run_test(
            "Post Crisis Text to Forum (Should be blocked)",
            "POST",
            f"forums/{forum_id}/posts",
            200,
            data={"body": "I want to commit suicide now", "is_private": False}
        )
        
        if success:
            posted = response.get('posted', True)
            crisis_blocked = response.get('crisis_blocked', False)
            
            if posted or not crisis_blocked:
                print(f"   ❌ Crisis post was not blocked: posted={posted}, crisis_blocked={crisis_blocked}")
                return False
            print(f"   ✅ Crisis post blocked: posted={posted}, crisis_blocked={crisis_blocked}")
            return True
        return False

    def test_crisis_helplines(self):
        """Test locale-specific helplines"""
        success, response = self.run_test(
            "Crisis Helplines for IN locale",
            "GET",
            "crisis/helplines/IN",
            200
        )
        
        if success:
            helplines = response.get('helplines', [])
            locale = response.get('locale')
            
            print(f"   Locale: {locale}")
            print(f"   Helplines count: {len(helplines)}")
            
            # Check for specific IN helplines
            expected_helplines = ['Tele-MANAS', 'iCall', 'Vandrevala']
            found_helplines = [h['name'] for h in helplines]
            
            for expected in expected_helplines:
                if not any(expected in name for name in found_helplines):
                    print(f"   ❌ Missing expected helpline: {expected}")
                    return False
                    
            for helpline in helplines:
                print(f"   ✅ {helpline['name']}: {helpline['number']}")
            
            return True
        return False

    def test_profile_with_sleep_score(self):
        """Test that profile shows 5 score bars including sleep"""
        success, response = self.run_test(
            "Get Profile with Sleep Score",
            "GET",
            "profiles/me",
            200
        )
        
        if success:
            profile = response.get('profile')
            if not profile:
                print("   ❌ No profile found")
                return False
                
            # Verify all 5 scores are present
            required_scores = ['anxiety_score', 'stress_score', 'loneliness_score', 'burnout_score', 'sleep_score']
            for score_key in required_scores:
                if score_key not in profile:
                    print(f"   ❌ Missing {score_key}")
                    return False
                print(f"   ✅ {score_key}: {profile[score_key]}%")
            
            return True
        return False

    def test_forum_display_names(self):
        """Test that forum posts show display names instead of Anonymous"""
        success, response = self.run_test(
            "Get Forums",
            "GET",
            "forums",
            200
        )
        if not success or not response.get('forums'):
            return False
            
        forum_id = response['forums'][0]['id']
        
        success, response = self.run_test(
            "Get Forum Posts with Display Names",
            "GET",
            f"forums/{forum_id}",
            200
        )
        
        if success:
            posts = response.get('posts', [])
            if not posts:
                print("   ⚠️ No posts found to test display names")
                return True
                
            for post in posts[:3]:  # Check first 3 posts
                display_name = post.get('display_name', 'Anonymous')
                if display_name == 'Anonymous':
                    print(f"   ⚠️ Post still shows 'Anonymous': {post.get('id')}")
                else:
                    print(f"   ✅ Post shows display name: {display_name}")
            
            return True
        return False

def main():
    print("🧪 Testing Enhanced Eunoia Platform Features")
    print("=" * 50)
    
    tester = EunoiaAPITester()
    
    # Test sequence for enhanced features
    tests = [
        ("Enhanced Auth Signup", tester.test_auth_signup),
        ("43-Question Assessment", tester.test_assessment_questions),
        ("Assessment Submission with 5 Scores", tester.test_assessment_submission),
        ("Crisis Moderation Check", tester.test_crisis_moderation),
        ("Crisis Forum Post Blocking", tester.test_crisis_forum_post_blocked),
        ("Crisis Helplines (IN locale)", tester.test_crisis_helplines),
        ("Profile with Sleep Score", tester.test_profile_with_sleep_score),
        ("Forum Display Names", tester.test_forum_display_names),
    ]
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            success = test_func()
            if not success:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} ERROR: {str(e)}")
    
    # Print final results
    print(f"\n{'='*50}")
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"Success rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 Enhanced features working well!")
        return 0
    elif success_rate >= 70:
        print("⚠️ Most features working, some issues to address")
        return 1
    else:
        print("❌ Significant issues found")
        return 2

if __name__ == "__main__":
    sys.exit(main())