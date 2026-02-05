import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RESOURCES = [
  { id: 'conversations', label: 'Conversations', actions: ['read', 'create', 'update', 'delete', 'send'] },
  { id: 'chatbots', label: 'AI Chatbots', actions: ['read', 'create', 'update', 'delete'] },
  { id: 'contacts', label: 'Contacts', actions: ['read', 'create', 'update', 'delete'] },
  { id: 'campaigns', label: 'Campaigns', actions: ['read', 'create', 'update', 'delete', 'send'] },
  { id: 'analytics', label: 'Analytics', actions: ['read'] },
  { id: 'users', label: 'Users', actions: ['read', 'create', 'update', 'delete'] },
  { id: 'settings', label: 'Settings', actions: ['read', 'update'] },
  { id: 'templates', label: 'Templates', actions: ['read', 'create', 'update', 'delete'] },
];

export default function UserManagement({ user }) {
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tempPassword, setTempPassword] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'agent'
  });
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/tenant`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    }
  };

  const inviteUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/users/invite`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTempPassword(response.data.temporary_password);
      toast.success('User invited successfully');
      fetchUsers();
      setTimeout(() => {
        setDialogOpen(false);
        setTempPassword('');
        setFormData({ name: '', email: '', role: 'agent' });
      }, 5000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to invite user');
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const openPermissions = async (usr) => {
    setSelectedUser(usr);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/${usr.id}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const permMap = {};
      response.data.permissions.forEach(perm => {
        permMap[perm.resource] = perm.actions;
      });
      setPermissions(permMap);
      setPermDialogOpen(true);
    } catch (error) {
      toast.error('Failed to load permissions');
    }
  };

  const togglePermission = (resource, action) => {
    setPermissions(prev => {
      const current = prev[resource] || [];
      const updated = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      return { ...prev, [resource]: updated };
    });
  };

  const savePermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const permsArray = Object.entries(permissions)
        .filter(([_, actions]) => actions.length > 0)
        .map(([resource, actions]) => ({ resource, actions }));
      
      await axios.put(
        `${API}/users/${selectedUser.id}/permissions`,
        permsArray,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Permissions updated successfully');
      setPermDialogOpen(false);
    } catch (error) {
      toast.error('Failed to update permissions');
    }
  };

  return (
    <div data-testid="user-management">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>User Management</h2>
          <p className="text-muted-foreground">Manage users and their permissions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="invite-user-btn">
              <Plus className="w-4 h-4" /> Invite User
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="invite-user-dialog">
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="invite-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="invite-email-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger data-testid="invite-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant_admin">Tenant Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {tempPassword && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-700 mb-2">User created successfully!</p>
                  <p className="text-sm text-green-600 mb-1">Temporary Password:</p>
                  <code className="block p-2 bg-white rounded text-sm font-mono">{tempPassword}</code>
                  <p className="text-xs text-green-600 mt-2">Share this with the user. They should change it on first login.</p>
                </div>
              )}
              <Button onClick={inviteUser} disabled={!!tempPassword} className="w-full" data-testid="send-invite-btn">
                Send Invite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map(usr => (
                <div
                  key={usr.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  data-testid={`user-${usr.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{usr.name}</p>
                      <p className="text-sm text-muted-foreground">{usr.email}</p>
                      <span className="text-xs px-2 py-1 bg-muted rounded mt-1 inline-block capitalize">
                        {usr.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermissions(usr)}
                      data-testid={`permissions-btn-${usr.id}`}
                    >
                      <Shield className="w-4 h-4 mr-1" />
                      Permissions
                    </Button>
                    {usr.id !== user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUser(usr.id)}
                        data-testid={`delete-user-btn-${usr.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={permDialogOpen} onOpenChange={setPermDialogOpen}>
        <DialogContent className="max-w-3xl" data-testid="permissions-dialog">
          <DialogHeader>
            <DialogTitle>Manage Permissions: {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[500px] overflow-y-auto space-y-4">
            {RESOURCES.map((resource, ridx) => (
              <Card key={ridx}>
                <CardHeader>
                  <CardTitle className="text-base">{resource.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Available actions for this resource:</p>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={permissions[resource.id]?.includes('read') || false}
                          onCheckedChange={() => togglePermission(resource.id, 'read')}
                        />
                        <span className="text-sm">Read</span>
                      </label>
                      {resource.actions.includes('create') && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={permissions[resource.id]?.includes('create') || false}
                            onCheckedChange={() => togglePermission(resource.id, 'create')}
                          />
                          <span className="text-sm">Create</span>
                        </label>
                      )}
                      {resource.actions.includes('update') && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={permissions[resource.id]?.includes('update') || false}
                            onCheckedChange={() => togglePermission(resource.id, 'update')}
                          />
                          <span className="text-sm">Update</span>
                        </label>
                      )}
                      {resource.actions.includes('delete') && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={permissions[resource.id]?.includes('delete') || false}
                            onCheckedChange={() => togglePermission(resource.id, 'delete')}
                          />
                          <span className="text-sm">Delete</span>
                        </label>
                      )}
                      {resource.actions.includes('send') && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={permissions[resource.id]?.includes('send') || false}
                            onCheckedChange={() => togglePermission(resource.id, 'send')}
                          />
                          <span className="text-sm">Send</span>
                        </label>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={savePermissions} className="w-full" data-testid="save-permissions-btn">
            Save Permissions
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}