import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TemplateManager({ user }) {
  const [templates, setTemplates] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'UTILITY',
    language: 'en_US',
    body_text: '',
    header_type: '',
    header_content: '',
    footer_text: ''
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      toast.error('Failed to fetch templates');
    }
  };

  const createTemplate = async () => {
    if (!formData.name || !formData.body_text) {
      toast.error('Name and body text are required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/templates`,
        null,
        {
          params: formData,
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Template created and submitted to Meta for approval');
      setDialogOpen(false);
      setFormData({ name: '', category: 'UTILITY', language: 'en_US', body_text: '', header_type: '', header_content: '', footer_text: '' });
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'REJECTED': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div data-testid="template-manager">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>Message Templates</h2>
          <p className="text-muted-foreground">Create and manage WhatsApp message templates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="create-template-btn">
              <Plus className="w-4 h-4" /> Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" data-testid="create-template-dialog">
            <DialogHeader>
              <DialogTitle>Create Message Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    placeholder="order_confirmation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="template-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger data-testid="template-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTILITY">Utility</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                      <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_US">English (US)</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt_BR">Portuguese (BR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Header Type (optional)</Label>
                <Select value={formData.header_type} onValueChange={(value) => setFormData({ ...formData, header_type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.header_type === 'TEXT' && (
                <div className="space-y-2">
                  <Label>Header Text</Label>
                  <Input
                    placeholder="Welcome to our service"
                    value={formData.header_content}
                    onChange={(e) => setFormData({ ...formData, header_content: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Body Text *</Label>
                <Textarea
                  placeholder="Hello {{1}}, your order {{2}} has been confirmed..."
                  value={formData.body_text}
                  onChange={(e) => setFormData({ ...formData, body_text: e.target.value })}
                  rows={6}
                  data-testid="template-body-input"
                />
                <p className="text-xs text-muted-foreground">Use double curly braces with numbers for variables, e.g. (( 1 )), (( 2 ))</p>
              </div>

              <div className="space-y-2">
                <Label>Footer Text (optional)</Label>
                <Input
                  placeholder="Thank you for your business"
                  value={formData.footer_text}
                  onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                />
              </div>

              <Button onClick={createTemplate} className="w-full" data-testid="save-template-btn">
                Create & Submit for Approval
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No templates created yet</p>
            </CardContent>
          </Card>
        ) : (
          templates.map(template => (
            <Card key={template.id} data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(template.status)} flex items-center gap-1`}>
                        {getStatusIcon(template.status)}
                        {template.status}
                      </span>
                      <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">Body:</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{template.body_text}</p>
                  </div>
                  {template.footer_text && (
                    <div>
                      <p className="text-sm font-medium mb-1">Footer:</p>
                      <p className="text-xs text-muted-foreground">{template.footer_text}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Language: {template.language}
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