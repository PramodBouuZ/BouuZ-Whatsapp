import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, CheckCircle, AlertCircle, Globe, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import MetaAPISettings from './MetaAPISettings';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TenantProfileSettings({ user }) {
  const [tenant, setTenant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    primary_color: '#0B5ED7',
    business_phone: '',
    business_email: '',
    business_address: '',
    business_website: '',
    industry: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/tenants/${user.tenant_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTenant(response.data);
      setFormData({
        name: response.data.name || '',
        logo_url: response.data.logo_url || '',
        primary_color: response.data.primary_color || '#0B5ED7',
        business_phone: response.data.business_phone || '',
        business_email: response.data.business_email || '',
        business_address: response.data.business_address || '',
        business_website: response.data.business_website || '',
        industry: response.data.industry || ''
      });
    } catch (error) {
      toast.error('Failed to fetch tenant details');
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      await axios.put(
        `${API}/tenants/${user.tenant_id}/profile?${params.toString()}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Business profile updated successfully');
      fetchTenant();
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="tenant-profile-settings" className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>Business Profile & Settings</h2>
        <p className="text-muted-foreground">Manage your business profile and WhatsApp API configuration</p>
      </div>

      {tenant && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tenant Status</p>
                  <p className="font-medium capitalize">{tenant.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                {tenant.meta_verified ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <AlertCircle className="w-12 h-12 text-yellow-600" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Meta Verification</p>
                  <p className="font-medium">{tenant.meta_verified ? 'Verified' : 'Pending'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full" style={{ backgroundColor: tenant.primary_color }}></div>
                <div>
                  <p className="text-sm text-muted-foreground">Brand Color</p>
                  <p className="font-medium text-xs">{tenant.primary_color}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Update your business profile details for WhatsApp Business API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Name *</Label>
              <Input
                placeholder="Acme Corporation"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="business-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                <SelectTrigger data-testid="industry-select">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="it_services">IT Services</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Business Phone
              </Label>
              <Input
                placeholder="+1 (555) 123-4567"
                value={formData.business_phone}
                onChange={(e) => setFormData({ ...formData, business_phone: e.target.value })}
                data-testid="business-phone-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Business Email
              </Label>
              <Input
                type="email"
                placeholder="contact@acme.com"
                value={formData.business_email}
                onChange={(e) => setFormData({ ...formData, business_email: e.target.value })}
                data-testid="business-email-input"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Business Address
            </Label>
            <Textarea
              placeholder="123 Business St, Suite 100, City, State, ZIP"
              value={formData.business_address}
              onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
              rows={2}
              data-testid="business-address-input"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website
            </Label>
            <Input
              placeholder="https://www.acme.com"
              value={formData.business_website}
              onChange={(e) => setFormData({ ...formData, business_website: e.target.value })}
              data-testid="business-website-input"
            />
          </div>

          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              placeholder="https://example.com/logo.png"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              data-testid="logo-url-input"
            />
            <p className="text-xs text-muted-foreground">URL to your business logo image</p>
          </div>

          <div className="space-y-2">
            <Label>Brand Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-20 h-10"
                data-testid="primary-color-input"
              />
              <Input
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                placeholder="#0B5ED7"
                className="flex-1"
              />
            </div>
          </div>

          <Button onClick={updateProfile} disabled={loading} className="w-full" data-testid="save-profile-btn">
            {loading ? 'Saving...' : 'Save Business Profile'}
          </Button>
        </CardContent>
      </Card>

      <MetaAPISettings user={user} />
    </div>
  );
}