import requests
import json

# Test AI message functionality
base_url = "https://bant-business-hub.preview.emergentagent.com/api"

# 1. Signup and get token
signup_data = {
    "name": "AI Test User",
    "email": f"aitest{__import__('time').time()}@test.com",
    "password": "test123",
    "tenant_name": "AI Test Company"
}

response = requests.post(f"{base_url}/auth/signup", json=signup_data)
if response.status_code != 200:
    print(f"Signup failed: {response.text}")
    exit(1)

token = response.json()['token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

print("✅ Signup successful")

# 2. Create conversation
conv_response = requests.post(
    f"{base_url}/conversations",
    headers=headers,
    params={"contact_phone": "+1234567890", "contact_name": "AI Test Contact"}
)

if conv_response.status_code != 200:
    print(f"Conversation creation failed: {conv_response.text}")
    exit(1)

conv_id = conv_response.json()['id']
print("✅ Conversation created")

# 3. Create chatbot first
chatbot_data = {
    "name": "Test AI Bot",
    "system_prompt": "You are a helpful customer service assistant. Keep responses brief and friendly.",
    "keywords": ["help", "support"]
}

bot_response = requests.post(f"{base_url}/chatbots", headers=headers, json=chatbot_data)
if bot_response.status_code != 200:
    print(f"Chatbot creation failed: {bot_response.text}")
    exit(1)

print("✅ Chatbot created")

# 4. Send message with AI
message_data = {
    "conversation_id": conv_id,
    "content": "Hello, I need help with my order",
    "use_ai": True
}

msg_response = requests.post(
    f"{base_url}/conversations/{conv_id}/messages",
    headers=headers,
    json=message_data
)

print(f"Message response status: {msg_response.status_code}")
print(f"Message response: {msg_response.text}")

if msg_response.status_code == 200:
    print("✅ AI message test successful")
else:
    print("❌ AI message test failed")