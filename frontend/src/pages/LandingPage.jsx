import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Bot, Users, Zap, Shield, BarChart3, ChevronRight, Check } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: Users,
      title: 'Multi-Tenant Architecture',
      description: 'Separate workspaces for each business with complete data isolation and custom branding.'
    },
    {
      icon: Bot,
      title: 'AI-Powered Chatbot',
      description: 'Smart automation with GPT-5.2 for instant customer responses and intelligent routing.'
    },
    {
      icon: MessageSquare,
      title: 'Bulk Messaging',
      description: 'Send template-based campaigns to thousands of contacts with delivery tracking.'
    },
    {
      icon: Zap,
      title: 'Smart Agent Routing',
      description: 'Keyword and department-based assignment with round-robin distribution.'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Track conversations, response times, and campaign performance in real-time.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Role-based access control, data encryption, and Meta policy compliance.'
    }
  ];

  const useCases = [
    { industry: 'Real Estate', example: 'Property inquiries, viewings, lead nurturing' },
    { industry: 'Healthcare', example: 'Appointment booking, prescription reminders, patient support' },
    { industry: 'Education', example: 'Admission queries, course info, student engagement' },
    { industry: 'E-commerce', example: 'Order updates, product recommendations, customer support' },
    { industry: 'Finance', example: 'Account queries, loan applications, payment reminders' },
    { industry: 'IT Services', example: 'Ticket management, client updates, service delivery' }
  ];

  const faqs = [
    {
      q: 'Is this compliant with WhatsApp Business policies?',
      a: 'Yes, we only use WhatsApp Cloud API with template-based messaging for bulk campaigns, ensuring full Meta compliance.'
    },
    {
      q: 'How does the AI chatbot work?',
      a: 'Our AI chatbot uses GPT-5.2 to understand queries, provide instant responses, and seamlessly hand over to human agents when needed.'
    },
    {
      q: 'Can multiple businesses use separate accounts?',
      a: 'Absolutely! Each tenant gets their own dashboard, WhatsApp numbers, contacts, chatbots, and analytics with complete data isolation.'
    },
    {
      q: 'What are the different user roles?',
      a: 'We support Super Admin, Tenant Admin, Manager, Agent, and Viewer roles with granular permission controls.'
    },
    {
      q: 'How secure is customer data?',
      a: 'All data is encrypted, stored separately per tenant, and accessible only through role-based authentication with audit logs.'
    },
    {
      q: 'Can I send bulk promotional messages?',
      a: 'Yes, but only using pre-approved WhatsApp templates. We ensure compliance with opt-in requirements and Meta policies.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-border sticky top-0 bg-white/95 backdrop-blur-md z-50" data-testid="landing-nav">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>BantConfirm</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" onClick={() => navigate('/login')} data-testid="nav-login-btn">Login</Button>
            <Button onClick={() => navigate('/signup')} data-testid="nav-signup-btn">Get Started</Button>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden py-20 md:py-32" data-testid="hero-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight" style={{ fontFamily: 'Manrope, sans-serif' }} data-testid="hero-heading">
                Smarter WhatsApp Business Automation for Growing Companies
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground" data-testid="hero-description">
                Multi-tenant SaaS platform with AI chatbots, bulk messaging, and intelligent agent routing. Scale customer communication effortlessly.
              </p>
              <div className="flex gap-4">
                <Button size="lg" className="gap-2" onClick={() => navigate('/signup')} data-testid="hero-cta-btn">
                  Start Free Trial <ChevronRight className="w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" data-testid="hero-demo-btn">Book Demo</Button>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1758691736975-9f7f643d178e?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Team collaboration"
                className="rounded-xl shadow-2xl"
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Powerful Features for Modern Businesses</h2>
            <p className="text-lg text-muted-foreground">Everything you need to manage WhatsApp communication at scale</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow duration-200" data-testid={`feature-card-${idx}`}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="use-cases-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Built for Every Industry</h2>
            <p className="text-lg text-muted-foreground">Trusted by businesses across sectors</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((useCase, idx) => (
              <Card key={idx} data-testid={`use-case-card-${idx}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{useCase.industry}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{useCase.example}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="multi-tenant-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1758873268663-5a362616b5a7?crop=entropy&cs=srgb&fm=jpg&q=85"
                alt="Team collaboration"
                className="rounded-xl shadow-xl"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>Complete Tenant Isolation</h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Each business tenant gets dedicated login, dashboard, WhatsApp numbers, contacts, chatbots, and analytics. No cross-tenant visibility.
              </p>
              <div className="space-y-4">
                {['Custom branding (logo & colors)', 'Role-based permissions', 'Separate data storage', 'Independent analytics'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="security-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Security & Compliance First</h2>
            <p className="text-lg text-muted-foreground">Enterprise-grade security for your business communication</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Meta Verified</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">WhatsApp Cloud API compliant with official business policies</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Data Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Complete data isolation per tenant with encryption at rest and in transit</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Granular role-based permissions with audit logs for all actions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="faq-section">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4" style={{ fontFamily: 'Manrope, sans-serif' }}>Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <Card key={idx} data-testid={`faq-card-${idx}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground" data-testid="final-cta-section">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Manrope, sans-serif' }}>Ready to Transform Your WhatsApp Communication?</h2>
          <p className="text-lg mb-8 opacity-90">Join hundreds of businesses automating customer conversations</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="gap-2" onClick={() => navigate('/signup')} data-testid="final-cta-btn">
              Start Free Trial <ChevronRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10" data-testid="final-contact-btn">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-foreground text-background py-12" data-testid="footer">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-6 h-6" />
                <span className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>BantConfirm</span>
              </div>
              <p className="text-sm opacity-80">Smarter WhatsApp automation for modern businesses</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Features</li>
                <li>Pricing</li>
                <li>Use Cases</li>
                <li>API Docs</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li>About Us</li>
                <li>Careers</li>
                <li>Contact</li>
                <li>Blog</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
                <li>GDPR</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm opacity-80">
            <p>© 2026 BantConfirm. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}