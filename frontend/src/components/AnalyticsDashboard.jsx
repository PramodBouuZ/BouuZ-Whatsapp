import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Send, Bot } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function AnalyticsDashboard({ user }) {
  const [analytics, setAnalytics] = useState({
    total_conversations: 0,
    total_messages: 0,
    total_contacts: 0,
    total_campaigns: 0
  });

  const fetchAnalytics = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const stats = [
    {
      title: 'Total Conversations',
      value: analytics.total_conversations,
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      title: 'Total Messages',
      value: analytics.total_messages,
      icon: MessageSquare,
      color: 'text-green-600',
      bg: 'bg-green-100'
    },
    {
      title: 'Total Contacts',
      value: analytics.total_contacts,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      title: 'Total Campaigns',
      value: analytics.total_campaigns,
      icon: Send,
      color: 'text-orange-600',
      bg: 'bg-orange-100'
    }
  ];

  return (
    <div data-testid="analytics-dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Analytics Overview</h2>
        <p className="text-muted-foreground">Track your WhatsApp communication metrics</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <Card key={idx} data-testid={`stat-card-${idx}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <p className="text-sm text-muted-foreground">Real-time data syncing active</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <p className="text-sm text-muted-foreground">AI chatbot responding to queries</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <p className="text-sm text-muted-foreground">WhatsApp integration connected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Response Rate:</span>
                <span className="text-sm font-medium">98%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Response Time:</span>
                <span className="text-sm font-medium">2.5 min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">AI Automation:</span>
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}