from typing import List, Dict

# Default permission templates by role
ROLE_PERMISSIONS = {
    "super_admin": [
        {"resource": "tenants", "actions": ["read", "create", "update", "delete"]},
        {"resource": "users", "actions": ["read", "create", "update", "delete"]},
        {"resource": "settings", "actions": ["read", "update"]},
    ],
    "tenant_admin": [
        {"resource": "conversations", "actions": ["read", "create", "update", "delete", "send"]},
        {"resource": "chatbots", "actions": ["read", "create", "update", "delete"]},
        {"resource": "contacts", "actions": ["read", "create", "update", "delete"]},
        {"resource": "campaigns", "actions": ["read", "create", "update", "delete", "send"]},
        {"resource": "analytics", "actions": ["read"]},
        {"resource": "users", "actions": ["read", "create", "update", "delete"]},
        {"resource": "settings", "actions": ["read", "update"]},
        {"resource": "templates", "actions": ["read", "create", "update", "delete"]},
    ],
    "manager": [
        {"resource": "conversations", "actions": ["read", "create", "send"]},
        {"resource": "chatbots", "actions": ["read", "update"]},
        {"resource": "contacts", "actions": ["read", "create", "update"]},
        {"resource": "campaigns", "actions": ["read", "create", "send"]},
        {"resource": "analytics", "actions": ["read"]},
        {"resource": "users", "actions": ["read"]},
        {"resource": "templates", "actions": ["read"]},
    ],
    "agent": [
        {"resource": "conversations", "actions": ["read", "send"]},
        {"resource": "contacts", "actions": ["read"]},
    ],
    "viewer": [
        {"resource": "conversations", "actions": ["read"]},
        {"resource": "analytics", "actions": ["read"]},
    ]
}

def get_default_permissions(role: str) -> List[Dict]:
    """Get default permissions for a role"""
    return ROLE_PERMISSIONS.get(role, [])

def has_permission(user_permissions: List[Dict], resource: str, action: str) -> bool:
    """Check if user has specific permission"""
    for perm in user_permissions:
        if perm["resource"] == resource and action in perm["actions"]:
            return True
    return False