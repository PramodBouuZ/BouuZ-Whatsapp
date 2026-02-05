import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Plus, Calendar, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CampaignsManager({ user }) {
  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [approvedTemplates, setApprovedTemplates] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    message_template: '',
    template_id: '',
    target_contacts: []
  });
  const [uploadStats, setUploadStats] = useState(null);

  useEffect(() => {
    fetchCampaigns();
    fetchContacts();
    fetchApprovedTemplates();
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

  const fetchApprovedTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/templates/approved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setApprovedTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch approved templates');
    }
  };

  const handleTemplateSelect = (templateId) => {
    const template = approvedTemplates.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        template_id: templateId,
        message_template: template.body_text
      });
    }
  };

  const createCampaign = async () => {
    if (!formData.name || !formData.message_template) {
      toast.error('Name and message template are required');
      return;
    }

    if (formData.template_id && !approvedTemplates.find(t => t.id === formData.template_id)) {
      toast.error('Please select an approved template');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const contactIds = contacts.map(c => c.id);
      
      const params = new URLSearchParams();
      params.append('name', formData.name);
      params.append('message_template', formData.message_template);
      if (formData.template_id) {
        params.append('template_id', formData.template_id);
      }
      contactIds.forEach(id => params.append('target_contacts', id));
      
      await axios.post(
        `${API}/campaigns?${params.toString()}`,
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Campaign created successfully');
      setDialogOpen(false);
      setFormData({ name: '', message_template: '', template_id: '', target_contacts: [] });
      fetchCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create campaign');
    }
  };

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/contacts/bulk-upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadStats(response.data);
      toast.success(`${response.data.contacts_added} contacts added successfully!`);
      fetchContacts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Upload failed');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const downloadTemplate = () => {
    const csvContent = 'name,phone_number,email\nJohn Doe,+1234567890,john@example.com\nJane Smith,+9876543210,jane@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
  };

  return (
    <div data-testid="campaigns-manager">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Campaigns</h2>
          <p className="text-muted-foreground">Manage bulk messaging campaigns with Meta-approved templates</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="bulk-upload-btn">
                <Upload className="w-4 h-4" /> Bulk Upload
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="bulk-upload-dialog">
              <DialogHeader>
                <DialogTitle>Bulk Upload Contacts</DialogTitle>
                <DialogDescription>Upload CSV or Excel file with contacts for campaigns</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-sm">Drop the file here...</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-2">Drag & drop or click to upload</p>
                      <p className="text-xs text-muted-foreground">CSV or Excel file (max 1 file)</p>
                    </>
                  )}
                </div>

                {uploadStats && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-700 mb-2">Upload Complete!</p>
                    <div className="space-y-1 text-xs text-green-600">
                      <p>✓ Contacts Added: {uploadStats.contacts_added}</p>
                      <p>• Skipped (Duplicates): {uploadStats.contacts_skipped}</p>
                      <p>• Total Processed: {uploadStats.total_processed}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Required Columns:</p>
                  <code className="block p-2 bg-muted rounded text-xs">name, phone_number, email (optional)</code>
                </div>

                <Button onClick={downloadTemplate} variant="outline" className="w-full" data-testid="download-template-btn">
                  Download Sample Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="create-campaign-btn">
                <Plus className="w-4 h-4" /> Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="create-campaign-dialog">
              <DialogHeader>
                <DialogTitle>Create New Campaign</DialogTitle>
                <DialogDescription>Create a bulk messaging campaign with approved templates</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Campaign Name *</Label>
                  <Input
                    placeholder="Summer Promotion 2026"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="campaign-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Select Approved Template *</Label>
                  <Select value={formData.template_id} onValueChange={handleTemplateSelect}>
                    <SelectTrigger data-testid="template-select">
                      <SelectValue placeholder="Choose a Meta-approved template" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedTemplates.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No approved templates available</div>
                      ) : (
                        approvedTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} ({template.category})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {approvedTemplates.length === 0 && (
                    <p className="text-xs text-yellow-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Create and get templates approved in Templates tab first
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Message Preview</Label>
                  <Textarea
                    placeholder="Select a template to preview..."
                    value={formData.message_template}
                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    rows={6}
                    data-testid="campaign-message-input"
                    disabled={!formData.template_id}
                  />
                  {formData.template_id && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Using Meta-approved template (compliant)
                    </p>
                  )}
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Target Audience</p>
                  <p className="text-sm text-muted-foreground">{contacts.length} contacts will receive this message</p>
                  {contacts.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">Use Bulk Upload to add contacts</p>
                  )}
                </div>

                <Button
                  onClick={createCampaign}
                  disabled={!formData.template_id || contacts.length === 0}
                  className="w-full"
                  data-testid="save-campaign-btn"
                >
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Send className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No campaigns created yet</p>
              <p className="text-sm text-muted-foreground mt-2">Upload contacts and create approved templates to start</p>
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
                  {campaign.template_id && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Meta-approved template
                    </div>
                  )}
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