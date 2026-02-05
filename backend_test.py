import requests
import sys
import json
from datetime import datetime

class WhatsAppPlatformTester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.tenant_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                if data:
                    response = requests.post(url, json=data, headers=headers, params=params, timeout=30)
                else:
                    response = requests.post(url, headers=headers, params=params, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code} - {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}

    def test_signup(self):
        """Test user signup with tenant creation"""
        timestamp = datetime.now().strftime('%H%M%S')
        signup_data = {
            "name": f"Test Admin {timestamp}",
            "email": f"admin{timestamp}@testcompany.com",
            "password": "TestPass123!",
            "tenant_name": f"Test Company {timestamp}"
        }
        
        success, response = self.run_test(
            "User Signup with Tenant Creation",
            "POST",
            "auth/signup",
            200,
            data=signup_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response['user']
            self.tenant_id = response['user'].get('tenant_id')
            return True
        return False

    def test_login(self):
        """Test user login"""
        if not self.user_data:
            return False
            
        login_data = {
            "email": self.user_data['email'],
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_conversations(self):
        """Test conversation management"""
        # Get conversations
        success, _ = self.run_test(
            "Get Conversations",
            "GET",
            "conversations",
            200
        )
        
        # Create conversation
        success, conv_response = self.run_test(
            "Create Conversation",
            "POST",
            "conversations",
            200,
            params={
                "contact_phone": "+1234567890",
                "contact_name": "Test Contact"
            }
        )
        
        if success and conv_response.get('id'):
            conv_id = conv_response['id']
            
            # Get messages for conversation
            self.run_test(
                "Get Conversation Messages",
                "GET",
                f"conversations/{conv_id}/messages",
                200
            )
            
            # Send message with AI
            self.run_test(
                "Send Message with AI",
                "POST",
                f"conversations/{conv_id}/messages",
                200,
                data={
                    "conversation_id": conv_id,
                    "content": "Hello, I need help with my order",
                    "use_ai": True
                }
            )
        
        return success

    def test_chatbots(self):
        """Test AI chatbot management"""
        # Get chatbots
        success, _ = self.run_test(
            "Get Chatbots",
            "GET",
            "chatbots",
            200
        )
        
        # Create chatbot
        chatbot_data = {
            "name": "Customer Support Bot",
            "system_prompt": "You are a helpful customer support assistant for a WhatsApp business platform.",
            "keywords": ["help", "support", "question"]
        }
        
        success, _ = self.run_test(
            "Create AI Chatbot",
            "POST",
            "chatbots",
            200,
            data=chatbot_data
        )
        
        return success

    def test_contacts(self):
        """Test contact management"""
        # Get contacts
        success, _ = self.run_test(
            "Get Contacts",
            "GET",
            "contacts",
            200
        )
        
        # Create contact
        success, _ = self.run_test(
            "Create Contact",
            "POST",
            "contacts",
            200,
            params={
                "phone_number": "+1987654321",
                "name": "John Doe",
                "email": "john@example.com"
            }
        )
        
        return success

    def test_campaigns(self):
        """Test campaign management"""
        # Get campaigns
        success, _ = self.run_test(
            "Get Campaigns",
            "GET",
            "campaigns",
            200
        )
        
        # Create campaign (fix parameter format)
        success, _ = self.run_test(
            "Create Campaign",
            "POST",
            "campaigns?name=Test Campaign&message_template=Hello {{name}}, we have exciting updates for you!&target_contacts=",
            200
        )
        
        return success

    def test_templates(self):
        """Test message template management"""
        # Get templates
        success, _ = self.run_test(
            "Get Message Templates",
            "GET",
            "templates",
            200
        )
        
        # Create template
        success, _ = self.run_test(
            "Create Message Template",
            "POST",
            "templates",
            200,
            params={
                "name": "order_confirmation",
                "category": "UTILITY",
                "language": "en_US",
                "body_text": "Hello {{1}}, your order {{2}} has been confirmed and will be delivered soon.",
                "footer_text": "Thank you for your business"
            }
        )
        
        return success

    def test_analytics(self):
        """Test analytics dashboard"""
        success, response = self.run_test(
            "Get Analytics Overview",
            "GET",
            "analytics/overview",
            200
        )
        
        if success:
            required_fields = ['total_conversations', 'total_messages', 'total_contacts', 'total_campaigns']
            for field in required_fields:
                if field not in response:
                    self.log_test(f"Analytics Field Check - {field}", False, f"Missing field: {field}")
                    return False
            self.log_test("Analytics Fields Complete", True)
        
        return success

    def test_user_management(self):
        """Test user management and permissions"""
        # Get tenant users
        success, _ = self.run_test(
            "Get Tenant Users",
            "GET",
            "users/tenant",
            200
        )
        
        # Invite user
        invite_data = {
            "name": "Test Agent",
            "email": f"agent{datetime.now().strftime('%H%M%S')}@testcompany.com",
            "role": "agent",
            "permissions": []
        }
        
        success, invite_response = self.run_test(
            "Invite User",
            "POST",
            "users/invite",
            200,
            data=invite_data
        )
        
        if success and invite_response.get('user', {}).get('id'):
            user_id = invite_response['user']['id']
            
            # Get user permissions
            self.run_test(
                "Get User Permissions",
                "GET",
                f"users/{user_id}/permissions",
                200
            )
            
            # Update user permissions
            permissions_data = [
                {"resource": "conversations", "actions": ["read", "send"]},
                {"resource": "contacts", "actions": ["read"]}
            ]
            
            self.run_test(
                "Update User Permissions",
                "PUT",
                f"users/{user_id}/permissions",
                200,
                data=permissions_data
            )
        
        return success

    def test_meta_api_settings(self):
        """Test Meta WhatsApp API configuration"""
        # Get current config
        success, _ = self.run_test(
            "Get Meta API Config",
            "GET",
            "meta/config",
            200
        )
        
        # Save Meta API config
        success, _ = self.run_test(
            "Save Meta API Config",
            "POST",
            "meta/config",
            200,
            params={
                "phone_number_id": "123456789",
                "business_account_id": "987654321",
                "access_token": "test_access_token_123",
                "webhook_verify_token": "test_webhook_token"
            }
        )
        
        return success

    def test_whatsapp_integration(self):
        """Test WhatsApp message sending (MOCKED)"""
        # This should work with mocked API
        success, _ = self.run_test(
            "Send WhatsApp Message (MOCKED)",
            "POST",
            "whatsapp/send",
            500,  # Expected to fail without proper Meta config, but should not crash
            params={
                "to": "+1234567890",
                "message": "Test message from BantConfirm platform"
            }
        )
        
        # Webhook verification
        success, _ = self.run_test(
            "WhatsApp Webhook Verification",
            "GET",
            "whatsapp/webhook",
            403,  # Expected to fail without proper token
            params={
                "mode": "subscribe",
                "token": "invalid_token",
                "challenge": "12345"
            }
        )
        
        return True  # These are expected to have specific behaviors

    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting WhatsApp Business Platform API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication tests
        if not self.test_signup():
            print("❌ Signup failed, stopping tests")
            return False
        
        # Core functionality tests
        test_methods = [
            self.test_conversations,
            self.test_chatbots,
            self.test_contacts,
            self.test_campaigns,
            self.test_templates,
            self.test_analytics,
            self.test_user_management,
            self.test_meta_api_settings,
            self.test_whatsapp_integration
        ]
        
        for test_method in test_methods:
            try:
                test_method()
            except Exception as e:
                print(f"❌ Test method {test_method.__name__} failed with error: {str(e)}")
        
        # Print final results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if result['status'] == 'FAILED':
                    print(f"  - {result['test']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = WhatsAppPlatformTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())