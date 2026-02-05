import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
const API = `${BACKEND_URL}/api`;

export default function MetaAPISettings({ user }) {
  const [config, setConfig] = useState({
    phone_number_id: '',
    business_account_id: '',
    access_token: '',
    webhook_verify_token: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/meta/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.configured) {
        setIsConfigured(true);
        setConfig(prev => ({
          ...prev,
          phone_number_id: response.data.phone_number_id || '',
          business_account_id: response.data.business_account_id || ''
        }));
      }
    } catch (error) {
      console.error('Failed to fetch config');
    }
  };

  const saveConfig = async () => {
    if (!config.phone_number_id || !config.business_account_id || !config.access_token) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/meta/config`,
        null,
        {
          params: config,
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Meta API configured successfully');
      setIsConfigured(true);
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="meta-api-settings">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>WhatsApp Cloud API Settings</h2>
        <p className="text-muted-foreground">Configure your Meta WhatsApp Business Cloud API</p>
      </div>

      {isConfigured && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">WhatsApp Cloud API is configured and active</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>
            Enter your Meta WhatsApp Business API credentials. Get them from{' '}
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Facebook Developers
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number ID *</Label>
            <Input
              placeholder="1234567890"
              value={config.phone_number_id}
              onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
              data-testid="phone-number-id-input"
            />
            <p className="text-xs text-muted-foreground">From WhatsApp Business Account → Phone Numbers</p>
          </div>

          <div className="space-y-2">
            <Label>Business Account ID *</Label>
            <Input
              placeholder="9876543210"
              value={config.business_account_id}
              onChange={(e) => setConfig({ ...config, business_account_id: e.target.value })}
              data-testid="business-account-id-input"
            />
            <p className="text-xs text-muted-foreground">From WhatsApp Business Account settings</p>
          </div>

          <div className="space-y-2">
            <Label>Access Token *</Label>
            <Input
              type="password"
              placeholder="EAAxxxxxxxxx"
              value={config.access_token}
              onChange={(e) => setConfig({ ...config, access_token: e.target.value })}
              data-testid="access-token-input"
            />
            <p className="text-xs text-muted-foreground">Permanent access token from your Meta app</p>
          </div>

          <div className="space-y-2">
            <Label>Webhook Verify Token</Label>
            <Input
              placeholder="my_secure_token_123"
              value={config.webhook_verify_token}
              onChange={(e) => setConfig({ ...config, webhook_verify_token: e.target.value })}
              data-testid="webhook-token-input"
            />
            <p className="text-xs text-muted-foreground">Custom token for webhook verification (create your own)</p>
          </div>

          <Button onClick={saveConfig} disabled={loading} className="w-full" data-testid="save-config-btn">
            {loading ? 'Saving...' : 'Save Configuration'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>Configure webhooks in your Meta app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Callback URL:</Label>
            <code className="block mt-1 p-2 bg-muted rounded text-sm">
              {BACKEND_URL}/api/whatsapp/webhook
            </code>
          </div>
          <div>
            <Label className="text-sm font-medium">Verify Token:</Label>
            <code className="block mt-1 p-2 bg-muted rounded text-sm">
              {config.webhook_verify_token || 'Enter token above first'}
            </code>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Setup:</strong> Go to your Meta App → WhatsApp → Configuration → Webhooks → Edit
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}