from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class MetaAPIConfig(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    phone_number_id: str
    business_account_id: str
    access_token: str
    webhook_verify_token: str
    status: str = "active"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MessageTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tenant_id: str
    name: str
    category: str  # MARKETING, UTILITY, AUTHENTICATION
    language: str = "en_US"
    header_type: Optional[str] = None  # TEXT, IMAGE, VIDEO, DOCUMENT
    header_content: Optional[str] = None
    body_text: str
    footer_text: Optional[str] = None
    buttons: List[Dict[str, Any]] = []
    variables: List[str] = []
    status: str = "PENDING"  # PENDING, APPROVED, REJECTED
    meta_template_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Permission(BaseModel):
    resource: str  # conversations, chatbots, contacts, campaigns, analytics, users, settings, templates
    actions: List[str]  # read, create, update, delete, send

class UserPermission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    tenant_id: str
    permissions: List[Permission] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InviteUser(BaseModel):
    email: str
    name: str
    role: str  # tenant_admin, manager, agent, viewer
    permissions: List[Permission] = []