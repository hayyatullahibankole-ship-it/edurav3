import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { contactSupport } from "@/utils/whatsapp";
import { MessageCircle, Mail, Phone, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";

const SUPPORT_PHONE = "+2347050757085";
const SUPPORT_EMAIL = "support@edura.com.ng";

const Support = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleWhatsApp = () => {
    const fullMessage = subject ? `Subject: ${subject}\n\n${message || "I need help with Edura."}` : message || "Hello, I need support.";
    try {
      contactSupport(subject || "Support request", fullMessage);
    } catch (error) {
      toast.error("Could not open WhatsApp. Please reach us directly.");
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Support | Edura</title>
        <meta name="description" content="Get help with Edura. Chat with support on WhatsApp, email or call us." />
      </Helmet>
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>

          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Support</h1>
          <p className="mt-2 text-muted-foreground">
            Need help? Reach us on WhatsApp, send an email, or call. We typically reply within a few hours.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Card className="sm:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageCircle className="h-5 w-5 text-primary" /> WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Fastest response during work hours.</p>
                <Button variant="outline" className="mt-4 w-full gap-2" onClick={handleWhatsApp}>
                  <MessageCircle className="h-4 w-4" /> Chat now
                </Button>
              </CardContent>
            </Card>

            <Card className="sm:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5 text-primary" /> Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">For detailed enquiries and attachments.</p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <Mail className="mr-2 h-4 w-4" /> {SUPPORT_EMAIL}
                </a>
              </CardContent>
            </Card>

            <Card className="sm:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-5 w-5 text-primary" /> Phone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Call us if it is urgent.</p>
                <a
                  href={`tel:${SUPPORT_PHONE}`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <Phone className="mr-2 h-4 w-4" /> 0705 075 7085
                </a>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Send a message</CardTitle>
              <CardDescription>
                Tell us what is wrong and we will open a WhatsApp chat with your message pre-filled.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="subject" className="mb-1.5 block text-sm font-medium">Subject</label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Wallet payment issue"
                />
              </div>
              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium">Message</label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue..."
                  rows={5}
                />
              </div>
              <Button onClick={handleWhatsApp} className="gap-2">
                <Send className="h-4 w-4" /> Start WhatsApp chat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Support;
