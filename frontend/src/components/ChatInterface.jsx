import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ChatInterface({ user }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [newConvPhone, setNewConvPhone] = useState('');
  const [newConvName, setNewConvName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(response.data);
      if (response.data.length > 0 && !selectedConv) {
        setSelectedConv(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch conversations');
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      toast.error('Failed to fetch messages');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedConv) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/conversations/${selectedConv.id}/messages`,
        { conversation_id: selectedConv.id, content: input, use_ai: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setInput('');
      fetchMessages(selectedConv.id);
      toast.success('Message sent');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    if (!newConvPhone || !newConvName) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/conversations`,
        null,
        {
          params: { contact_phone: newConvPhone, contact_name: newConvName },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      toast.success('Conversation created');
      setDialogOpen(false);
      setNewConvPhone('');
      setNewConvName('');
      fetchConversations();
    } catch (error) {
      toast.error('Failed to create conversation');
    }
  };

  return (
    <div className="grid md:grid-cols-12 gap-6 h-full" data-testid="chat-interface">
      <Card className="md:col-span-4 flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Conversations</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="new-conversation-btn">
                <Plus className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="new-conversation-dialog">
              <DialogHeader>
                <DialogTitle>New Conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    placeholder="+1234567890"
                    value={newConvPhone}
                    onChange={(e) => setNewConvPhone(e.target.value)}
                    data-testid="new-conv-phone-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={newConvName}
                    onChange={(e) => setNewConvName(e.target.value)}
                    data-testid="new-conv-name-input"
                  />
                </div>
                <Button onClick={createConversation} className="w-full" data-testid="create-conv-btn">
                  Create Conversation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConv?.id === conv.id ? 'bg-primary/10' : 'hover:bg-muted'
                  }`}
                  data-testid={`conversation-${conv.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{conv.contact_name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground truncate">{conv.contact_phone}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className="md:col-span-8 flex flex-col">
        {selectedConv ? (
          <>
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">{selectedConv.contact_name}</h3>
              <p className="text-sm text-muted-foreground">{selectedConv.contact_phone}</p>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4" data-testid="messages-container">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No messages yet</p>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${msg.id}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  disabled={loading}
                  data-testid="message-input"
                />
                <Button onClick={sendMessage} disabled={loading} data-testid="send-message-btn">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a conversation to start</p>
          </div>
        )}
      </Card>
    </div>
  );
}