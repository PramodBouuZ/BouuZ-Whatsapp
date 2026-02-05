from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.encoders import jsonable_encoder
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
from emergentintegrations.llm.chat import LlmChat
import json
import httpx
from models import MetaAPIConfig, MessageTemplate, Permission, UserPermission, InviteUser
from permissions import get_default_permissions, has_permission

# Custom JSON encoder for MongoDB ObjectId
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == '_id':
                continue  # Skip MongoDB _id field
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="BantConfirm WhatsApp Platform API")
api_router = APIRouter(prefix="/api")

security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.environ.get("JWT_SECRET", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "sk-emergent-5F41fB7D42d0d17Ae9")

openai_client = None

class Tenant(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    logo_url: Optional[str] = None
    primary_color: str = "#0B5ED7"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "active"

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    tenant_id: Optional[str] = None
    role: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WhatsAppAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    phone_number: str
    display_name: str
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: str
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: Optional[str] = "sent"

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    contact_phone: str
    contact_name: Optional[str] = None
    assigned_agent_id: Optional[str] = None
    status: str = "open"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Chatbot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    name: str
    system_prompt: str
    keywords: List[str] = []
    enabled: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RoutingRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    keyword: str
    agent_id: Optional[str] = None
    department: Optional[str] = None
    priority: int = 1
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Contact(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    phone_number: str
    name: str
    email: Optional[EmailStr] = None
    tags: List[str] = []
    opted_in: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Campaign(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    name: str
    message_template: str
    target_contacts: List[str] = []
    scheduled_at: Optional[datetime] = None
    status: str = "draft"
    sent_count: int = 0
    delivered_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    tenant_name: Optional[str] = None

class MessageRequest(BaseModel):
    conversation_id: str
    content: str
    use_ai: bool = True

class ChatbotRequest(BaseModel):
    name: str
    system_prompt: str
    keywords: List[str] = []

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid authentication")

@api_router.post("/auth/signup")
async def signup(request: SignupRequest):
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    tenant_id = None
    if request.tenant_name:
        tenant = Tenant(name=request.tenant_name)
        tenant_dict = tenant.model_dump()
        tenant_dict['created_at'] = tenant_dict['created_at'].isoformat()
        await db.tenants.insert_one(tenant_dict)
        tenant_id = tenant.id
    
    password_hash = pwd_context.hash(request.password)
    role = "tenant_admin" if tenant_id else "super_admin"
    
    user = User(
        email=request.email,
        name=request.name,
        tenant_id=tenant_id,
        role=role,
        password_hash=password_hash
    )
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    token = create_access_token({"sub": user.id, "role": user.role, "tenant_id": tenant_id})
    return {"token": token, "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "tenant_id": tenant_id}}

@api_router.post("/auth/login")
async def login(request: LoginRequest):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user or not pwd_context.verify(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"], "role": user["role"], "tenant_id": user.get("tenant_id")})
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"], "tenant_id": user.get("tenant_id")}}

@api_router.get("/tenants")
async def get_tenants(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Access denied")
    tenants = await db.tenants.find({}, {"_id": 0}).to_list(1000)
    return tenants

@api_router.get("/tenants/{tenant_id}")
async def get_tenant(tenant_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["super_admin", "tenant_admin"] or (current_user.get("tenant_id") and current_user["tenant_id"] != tenant_id):
        raise HTTPException(status_code=403, detail="Access denied")
    tenant = await db.tenants.find_one({"id": tenant_id}, {"_id": 0})
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@api_router.get("/whatsapp/accounts")
async def get_whatsapp_accounts(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user.get("tenant_id"):
        query["tenant_id"] = current_user["tenant_id"]
    accounts = await db.whatsapp_accounts.find(query, {"_id": 0}).to_list(1000)
    return accounts

@api_router.post("/whatsapp/accounts")
async def create_whatsapp_account(phone_number: str, display_name: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    account = WhatsAppAccount(
        tenant_id=current_user["tenant_id"],
        phone_number=phone_number,
        display_name=display_name
    )
    account_dict = account.model_dump()
    account_dict['created_at'] = account_dict['created_at'].isoformat()
    await db.whatsapp_accounts.insert_one(account_dict)
    return account_dict

@api_router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user.get("tenant_id"):
        query["tenant_id"] = current_user["tenant_id"]
    if current_user["role"] == "agent":
        query["assigned_agent_id"] = current_user["id"]
    
    conversations = await db.conversations.find(query, {"_id": 0}).sort("updated_at", -1).to_list(1000)
    return conversations

@api_router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, current_user: dict = Depends(get_current_user)):
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if current_user.get("tenant_id") and conversation["tenant_id"] != current_user["tenant_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await db.messages.find({"conversation_id": conversation_id}, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    return messages

@api_router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, request: MessageRequest, current_user: dict = Depends(get_current_user)):
    conversation = await db.conversations.find_one({"id": conversation_id}, {"_id": 0})
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if current_user.get("tenant_id") and conversation["tenant_id"] != current_user["tenant_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=request.content
    )
    user_dict = user_message.model_dump()
    user_dict['timestamp'] = user_dict['timestamp'].isoformat()
    await db.messages.insert_one(user_dict)
    
    ai_response = None
    if request.use_ai:
        chatbot = await db.chatbots.find_one({"tenant_id": conversation["tenant_id"], "enabled": True}, {"_id": 0})
        if chatbot:
            try:
                llm_client = LlmChat(
                    api_key=EMERGENT_LLM_KEY,
                    session_id=conversation_id,
                    system_message=chatbot["system_prompt"]
                )
                
                response = llm_client.send_message(
                    message=request.content,
                    model="gpt-5.2"
                )
                ai_response = response
                
                ai_message = Message(
                    conversation_id=conversation_id,
                    role="assistant",
                    content=ai_response
                )
                ai_dict = ai_message.model_dump()
                ai_dict['timestamp'] = ai_dict['timestamp'].isoformat()
                await db.messages.insert_one(ai_dict)
            except Exception as e:
                logger.error(f"AI response error: {str(e)}")
                ai_response = f"AI temporarily unavailable"
    
    await db.conversations.update_one(
        {"id": conversation_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return serialize_doc({"user_message": user_dict, "ai_response": ai_response})

@api_router.post("/conversations")
async def create_conversation(contact_phone: str, contact_name: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    conversation = Conversation(
        tenant_id=current_user["tenant_id"],
        contact_phone=contact_phone,
        contact_name=contact_name
    )
    conv_dict = conversation.model_dump()
    conv_dict['created_at'] = conv_dict['created_at'].isoformat()
    conv_dict['updated_at'] = conv_dict['updated_at'].isoformat()
    await db.conversations.insert_one(conv_dict)
    return serialize_doc(conv_dict)

@api_router.get("/chatbots")
async def get_chatbots(current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    chatbots = await db.chatbots.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return chatbots

@api_router.post("/chatbots")
async def create_chatbot(request: ChatbotRequest, current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    chatbot = Chatbot(
        tenant_id=current_user["tenant_id"],
        name=request.name,
        system_prompt=request.system_prompt,
        keywords=request.keywords
    )
    chatbot_dict = chatbot.model_dump()
    chatbot_dict['created_at'] = chatbot_dict['created_at'].isoformat()
    await db.chatbots.insert_one(chatbot_dict)
    return serialize_doc(chatbot_dict)

@api_router.get("/contacts")
async def get_contacts(current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    contacts = await db.contacts.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return contacts

@api_router.post("/contacts")
async def create_contact(phone_number: str, name: str, email: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    contact = Contact(
        tenant_id=current_user["tenant_id"],
        phone_number=phone_number,
        name=name,
        email=email
    )
    contact_dict = contact.model_dump()
    contact_dict['created_at'] = contact_dict['created_at'].isoformat()
    await db.contacts.insert_one(contact_dict)
    return serialize_doc(contact_dict)

@api_router.get("/campaigns")
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    campaigns = await db.campaigns.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return campaigns

@api_router.post("/campaigns")
async def create_campaign(name: str, message_template: str, target_contacts: List[str] = [], current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    campaign = Campaign(
        tenant_id=current_user["tenant_id"],
        name=name,
        message_template=message_template,
        target_contacts=target_contacts
    )
    campaign_dict = campaign.model_dump()
    campaign_dict['created_at'] = campaign_dict['created_at'].isoformat()
    if campaign_dict.get('scheduled_at'):
        campaign_dict['scheduled_at'] = campaign_dict['scheduled_at'].isoformat()
    await db.campaigns.insert_one(campaign_dict)
    return serialize_doc(campaign_dict)

@api_router.get("/analytics/overview")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        return {"error": "Tenant ID required"}
    
    total_conversations = await db.conversations.count_documents({"tenant_id": current_user["tenant_id"]})
    total_messages = await db.messages.count_documents({"conversation_id": {"$exists": True}})
    total_contacts = await db.contacts.count_documents({"tenant_id": current_user["tenant_id"]})
    total_campaigns = await db.campaigns.count_documents({"tenant_id": current_user["tenant_id"]})
    
    return {
        "total_conversations": total_conversations,
        "total_messages": total_messages,
        "total_contacts": total_contacts,
        "total_campaigns": total_campaigns
    }

# Meta WhatsApp Cloud API Integration
@api_router.post("/meta/config")
async def save_meta_config(phone_number_id: str, business_account_id: str, access_token: str, webhook_verify_token: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id") or current_user["role"] not in ["tenant_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    config = MetaAPIConfig(
        tenant_id=current_user["tenant_id"],
        phone_number_id=phone_number_id,
        business_account_id=business_account_id,
        access_token=access_token,
        webhook_verify_token=webhook_verify_token
    )
    config_dict = config.model_dump()
    config_dict['created_at'] = config_dict['created_at'].isoformat()
    
    await db.meta_configs.update_one(
        {"tenant_id": current_user["tenant_id"]},
        {"$set": config_dict},
        upsert=True
    )
    
    config_dict.pop("access_token")
    return config_dict

@api_router.get("/meta/config")
async def get_meta_config(current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    config = await db.meta_configs.find_one({"tenant_id": current_user["tenant_id"]}, {"_id": 0, "access_token": 0})
    if not config:
        return {"configured": False}
    
    return {"configured": True, **config}

@api_router.post("/whatsapp/send")
async def send_whatsapp_message(to: str, message: str, current_user: dict = Depends(get_current_user)):
    """Send WhatsApp message via Meta Cloud API"""
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    config = await db.meta_configs.find_one({"tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not config:
        raise HTTPException(status_code=400, detail="WhatsApp API not configured")
    
    try:
        url = f"https://graph.facebook.com/v18.0/{config['phone_number_id']}/messages"
        headers = {
            "Authorization": f"Bearer {config['access_token']}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": message}
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

@api_router.post("/whatsapp/webhook")
async def whatsapp_webhook(request: dict):
    """Receive WhatsApp webhooks from Meta"""
    try:
        if request.get("object") == "whatsapp_business_account":
            entries = request.get("entry", [])
            for entry in entries:
                changes = entry.get("changes", [])
                for change in changes:
                    value = change.get("value", {})
                    messages = value.get("messages", [])
                    
                    for message in messages:
                        phone_number = message.get("from")
                        message_type = message.get("type")
                        message_body = ""
                        
                        if message_type == "text":
                            message_body = message.get("text", {}).get("body", "")
                        
                        await db.webhook_messages.insert_one({
                            "phone_number": phone_number,
                            "message_type": message_type,
                            "message_body": message_body,
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "raw_data": message
                        })
        
        return {"status": "received"}
    
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return {"status": "error"}

@api_router.get("/whatsapp/webhook")
async def verify_webhook(mode: str = None, token: str = None, challenge: str = None):
    """Verify webhook for Meta"""
    if mode == "subscribe" and token:
        configs = await db.meta_configs.find({}, {"_id": 0}).to_list(100)
        for config in configs:
            if token == config.get("webhook_verify_token"):
                return int(challenge) if challenge else {"status": "verified"}
    
    raise HTTPException(status_code=403, detail="Verification failed")

# Message Templates Management
@api_router.get("/templates")
async def get_templates(current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    templates = await db.templates.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0}).to_list(1000)
    return templates

@api_router.post("/templates")
async def create_template(
    name: str,
    category: str,
    language: str,
    body_text: str,
    header_type: Optional[str] = None,
    header_content: Optional[str] = None,
    footer_text: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    if current_user["role"] not in ["tenant_admin", "manager"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    template = MessageTemplate(
        tenant_id=current_user["tenant_id"],
        name=name,
        category=category,
        language=language,
        body_text=body_text,
        header_type=header_type,
        header_content=header_content,
        footer_text=footer_text
    )
    
    template_dict = template.model_dump()
    template_dict['created_at'] = template_dict['created_at'].isoformat()
    await db.templates.insert_one(template_dict)
    
    config = await db.meta_configs.find_one({"tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if config:
        try:
            url = f"https://graph.facebook.com/v18.0/{config['business_account_id']}/message_templates"
            headers = {
                "Authorization": f"Bearer {config['access_token']}",
                "Content-Type": "application/json"
            }
            
            components = [{"type": "BODY", "text": body_text}]
            if header_type and header_content:
                components.insert(0, {"type": "HEADER", "format": header_type, "text": header_content})
            if footer_text:
                components.append({"type": "FOOTER", "text": footer_text})
            
            payload = {
                "name": name.lower().replace(" ", "_"),
                "language": language,
                "category": category,
                "components": components
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=30.0)
                if response.status_code == 200:
                    result = response.json()
                    await db.templates.update_one(
                        {"id": template.id},
                        {"$set": {"meta_template_id": result.get("id"), "status": "PENDING"}}
                    )
        
        except Exception as e:
            logger.error(f"Failed to submit template to Meta: {str(e)}")
    
    return serialize_doc(template_dict)

# User & Permission Management
@api_router.get("/users/tenant")
async def get_tenant_users(current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id"):
        raise HTTPException(status_code=400, detail="Tenant ID required")
    
    if current_user["role"] not in ["tenant_admin", "manager"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    users = await db.users.find({"tenant_id": current_user["tenant_id"]}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.post("/users/invite")
async def invite_user(invite: InviteUser, current_user: dict = Depends(get_current_user)):
    if not current_user.get("tenant_id") or current_user["role"] != "tenant_admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    existing = await db.users.find_one({"email": invite.email})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    temp_password = str(uuid.uuid4())[:8]
    password_hash = pwd_context.hash(temp_password)
    
    user = User(
        email=invite.email,
        name=invite.name,
        tenant_id=current_user["tenant_id"],
        role=invite.role,
        password_hash=password_hash
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    permissions = invite.permissions if invite.permissions else get_default_permissions(invite.role)
    user_perm = UserPermission(
        user_id=user.id,
        tenant_id=current_user["tenant_id"],
        permissions=permissions
    )
    perm_dict = user_perm.model_dump()
    perm_dict['created_at'] = perm_dict['created_at'].isoformat()
    await db.user_permissions.insert_one(perm_dict)
    
    return {
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role},
        "temporary_password": temp_password,
        "message": "User invited successfully. Share the temporary password with them."
    }

@api_router.get("/users/{user_id}/permissions")
async def get_user_permissions(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["tenant_admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    perms = await db.user_permissions.find_one({"user_id": user_id}, {"_id": 0})
    if not perms:
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user:
            return {"permissions": get_default_permissions(user["role"])}
    
    return perms or {"permissions": []}

@api_router.put("/users/{user_id}/permissions")
async def update_user_permissions(user_id: str, permissions: List[Permission], current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "tenant_admin" or not current_user.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.users.find_one({"id": user_id, "tenant_id": current_user["tenant_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.user_permissions.update_one(
        {"user_id": user_id, "tenant_id": current_user["tenant_id"]},
        {"$set": {"permissions": [p.model_dump() for p in permissions]}},
        upsert=True
    )
    
    return {"message": "Permissions updated successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "tenant_admin" or not current_user.get("tenant_id"):
        raise HTTPException(status_code=403, detail="Access denied")
    
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id, "tenant_id": current_user["tenant_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.user_permissions.delete_one({"user_id": user_id})
    
    return {"message": "User deleted successfully"}

@api_router.get("/")
async def root():
    return {"message": "BantConfirm WhatsApp Platform API", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.conversations.create_index("tenant_id")
    await db.messages.create_index("conversation_id")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()