import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Bot, Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ChatbotManager({ user }) {
  const [chatbots, setChatbots] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    system_prompt: '',
    keywords: ''
  });

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/chatbots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatbots(response.data);
    } catch (error) {
      toast.error('Failed to fetch chatbots');
    }
  };

  const createChatbot = async () => {
    if (!formData.name || !formData.system_prompt) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      
      await axios.post(
        `${API}/chatbots`,
        {
          name: formData.name,
          system_prompt: formData.system_prompt,
          keywords
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Chatbot created successfully');
      setDialogOpen(false);
      setFormData({ name: '', system_prompt: '', keywords: '' });
      fetchChatbots();
    } catch (error) {
      toast.error('Failed to create chatbot');
    }
  };

  return (
    <div data-testid="chatbot-manager">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: 'Manrope, sans-serif' }}>AI Chatbots</h2>
          <p className="text-muted-foreground">Configure automated responses powered by AI</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="create-chatbot-btn">
              <Plus className="w-4 h-4" /> Create Chatbot
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="create-chatbot-dialog">
            <DialogHeader>
              <DialogTitle>Create AI Chatbot</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chatbot Name</Label>
                <Input
                  placeholder="Customer Support Bot"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  data-testid="chatbot-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>System Prompt</Label>
                <Textarea
                  placeholder="You are a helpful customer support assistant..."
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  rows={6}
                  data-testid="chatbot-prompt-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Keywords (comma separated)</Label>
                <Input
                  placeholder="support, help, question"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  data-testid="chatbot-keywords-input"
                />
              </div>
              <Button onClick={createChatbot} className="w-full" data-testid="save-chatbot-btn">
                Create Chatbot
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chatbots.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bot className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No chatbots configured yet</p>
            </CardContent>
          </Card>
        ) : (
          chatbots.map(bot => (
            <Card key={bot.id} data-testid={`chatbot-card-${bot.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{bot.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {bot.enabled ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">System Prompt:</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{bot.system_prompt}</p>
                  </div>
                  {bot.keywords && bot.keywords.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {bot.keywords.map((keyword, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-muted rounded">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}