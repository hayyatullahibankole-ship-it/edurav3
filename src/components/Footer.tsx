import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDomainDetection } from '@/hooks/useDomainDetection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import eduraLogo from '@/assets/edura-logo.png';

const Footer = () => {
  const { isAkboy } = useDomainDetection();
  const [email, setEmail] = useState('');

  const columns = [
    {
      title: 'Practice',
      links: [
        { label: 'Demo test', href: '/demo' },
        { label: 'Study hub', href: '/study-hub' },
        { label: 'Resources', href: '/resources' },
        { label: 'Challenge arena', href: '/challenge-arena' },
        { label: 'Get the app', href: '/install-app' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'All student services', href: '/services' },
        { label: 'Result checker PINs', href: '/services' },
        { label: 'Admissions & Post-UTME', href: '/admissions' },
        { label: 'Edura Wallet', href: '/wallet' },
        { label: 'Pricing', href: '/payment' },
      ],
    },
    {
      title: 'Schools',
      links: [
        { label: 'Register your school', href: '/school-landing' },
        { label: 'School login', href: '/school-login' },
        { label: 'Mock exams', href: '/school-landing' },
      ],
    },
  ];

  const legalLinks = [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ];

  const handleSubscribe = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('Subscribed — look out for exam tips and product updates.');
    setEmail('');
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="col-span-2 space-y-5">
            <img src={eduraLogo} alt="Edura" className="h-14 w-auto" />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              CBT practice and student services in one place — JAMB and WAEC simulations, result checker PINs,
              admissions processing and a wallet built for Nigerian students.
            </p>
            <div className="flex -ml-2">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <Button key={i} variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <Link
              to={isAkboy ? '/' : '/akboy'}
              className="group inline-flex items-center gap-2.5 rounded-xl border border-border px-3 py-2 transition-colors hover:border-primary/50"
            >
              <div className="w-7 h-7 bg-foreground rounded-lg flex items-center justify-center">
                <span className="text-background font-bold text-xs">A</span>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">A product by</div>
                <div className="text-sm font-semibold text-foreground">AKBOY Creative Hub</div>
              </div>
            </Link>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <div className="space-y-2">
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-8 rounded-2xl border border-border bg-background p-6">
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> support@edura.com.ng
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" /> 0705 075 7085
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> Lagos, Nigeria
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-foreground">Newsletter</h3>
            <p className="text-sm text-muted-foreground">Exam tips and new features, no spam.</p>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1"
              />
              <Button onClick={handleSubscribe} className="font-semibold">Subscribe</Button>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.label} to={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">© {new Date().getFullYear()} Edura. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
