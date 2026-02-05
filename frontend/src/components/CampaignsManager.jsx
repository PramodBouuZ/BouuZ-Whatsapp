import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Send, Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CampaignsManager({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    message_template: '',
    target_contacts: []
  });

  useEffect(() => {
    fetchCampaigns();
    fetchContacts();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data);
    } catch (error) {
      toast.error('Failed to fetch campaigns');
    }
  };

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(response.data);
    } catch (error) {
      console.error('Failed to fetch contacts');
    }
  };

  const createCampaign = async () => {
    if (!formData.name || !formData.message_template) {
      toast.error('Name and message template are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const contactIds = contacts.map(c => c.id);
      
      const params = new URLSearchParams();
      params.append('name', formData.name);
      params.append('message_template', formData.message_template);
      contactIds.forEach(id => params.append('target_contacts', id));
      
      await axios.post(
        `${API}/campaigns?${params.toString()}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Campaign created successfully');
      setDialogOpen(false);
      setFormData({ name: '', message_template: '', target_contacts: [] });
      fetchCampaigns();
    } catch (error) {
      toast.error('Failed to create campaign');
    }
  };

  return (
    <div data-testid="campaigns-manager">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Campaigns</h2>
          <p className="text-muted-foreground">Manage bulk messaging campaigns</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="create-campaign-btn">
              <Plus className="w-4 h-4" /> Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="create-campaign-dialog">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  placeholder="Monthly Newsletter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="campaign-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Message Template</Label>
                <Textarea
                  placeholder="Hello {{name}}, we have exciting updates..."
                  value={formData.message_template}
                  onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                  rows={6}
                  data-testid="campaign-message-input"
                />
                <p className="text-xs text-muted-foreground">Use {{name}} for contact name personalization</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Target Audience</p>
                <p className="text-sm text-muted-foreground">{contacts.length} contacts will receive this message</p>
              </div>
              <Button onClick={createCampaign} className="w-full" data-testid="save-campaign-btn">
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Send className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No campaigns created yet</p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map(campaign => (
            <Card key={campaign.id} data-testid={`campaign-card-${campaign.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <p className="text-sm text-muted-foreground capitalize">
                        {campaign.status}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Message:</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{campaign.message_template}</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Targets:</span>
                    <span className="font-medium">{campaign.target_contacts?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sent:</span>
                    <span className="font-medium">{campaign.sent_count || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivered:</span>
                    <span className="font-medium">{campaign.delivered_count || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}