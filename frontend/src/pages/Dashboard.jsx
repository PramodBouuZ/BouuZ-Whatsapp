import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Bot, Send, BarChart3, Settings, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import ChatInterface from '@/components/ChatInterface';
import ChatbotManager from '@/components/ChatbotManager';
import ContactsManager from '@/components/ContactsManager';
import CampaignsManager from '@/components/CampaignsManager';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import TenantProfileSettings from '@/components/TenantProfileSettings';
import TemplateManager from '@/components/TemplateManager';
import UserManagement from '@/components/UserManagement';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('conversations');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const menuItems = [
    { id: 'conversations', label: 'Conversations', icon: MessageSquare, roles: ['tenant_admin', 'agent', 'manager'] },
    { id: 'chatbots', label: 'AI Chatbots', icon: Bot, roles: ['tenant_admin', 'manager'] },
    { id: 'contacts', label: 'Contacts', icon: Users, roles: ['tenant_admin', 'manager'] },
    { id: 'campaigns', label: 'Campaigns', icon: Send, roles: ['tenant_admin', 'manager'] },
    { id: 'templates', label: 'Templates', icon: Send, roles: ['tenant_admin', 'manager'] },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['tenant_admin', 'manager'] },
    { id: 'users', label: 'Users', icon: Users, roles: ['tenant_admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['tenant_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-muted/20" data-testid="dashboard">
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-white border-r border-border transition-all duration-300 flex flex-col overflow-hidden`}
        data-testid="dashboard-sidebar"
      >
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>BantConfirm</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2" data-testid="dashboard-nav">
          {filteredMenuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
              data-testid={`nav-${item.id}-btn`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <div className="px-4 py-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout} data-testid="logout-btn">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col">
        <header className="bg-white border-b border-border p-4 flex items-center gap-4" data-testid="dashboard-header">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="sidebar-toggle-btn"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>
            {menuItems.find(item => item.id === activeTab)?.label}
          </h1>
        </header>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'conversations' && <ChatInterface user={user} />}
          {activeTab === 'chatbots' && <ChatbotManager user={user} />}
          {activeTab === 'contacts' && <ContactsManager user={user} />}
          {activeTab === 'campaigns' && <CampaignsManager user={user} />}
          {activeTab === 'templates' && <TemplateManager user={user} />}
          {activeTab === 'analytics' && <AnalyticsDashboard user={user} />}
          {activeTab === 'users' && <UserManagement user={user} />}
          {activeTab === 'settings' && <MetaAPISettings user={user} />}
        </div>
      </main>
    </div>
  );
}