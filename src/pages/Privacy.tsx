import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Lock, Database } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Shield className="w-8 h-8" />
              Privacy Policy
            </CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Our Commitment to Your Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                At Edura, we are committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                educational platform and services.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Database className="w-6 h-6" />
                Information We Collect
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                  <p className="text-muted-foreground mb-2">We collect information you provide directly to us:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Name, email address, and phone number</li>
                    <li>Date of birth and educational background</li>
                    <li>Profile picture and personal preferences</li>
                    <li>Payment information for premium subscriptions</li>
                    <li>Communications and support requests</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Academic and Usage Data</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Test scores, answers, and performance analytics</li>
                    <li>Study progress and learning patterns</li>
                    <li>Time spent on different subjects and topics</li>
                    <li>Exam attempt history and results</li>
                    <li>Resource usage and download history</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Device information and browser type</li>
                    <li>IP address and location data</li>
                    <li>Log files and usage statistics</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6" />
                How We Use Your Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Educational Services</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Provide personalized learning experiences</li>
                    <li>Track your academic progress and performance</li>
                    <li>Generate analytics and recommendations</li>
                    <li>Deliver study materials and resources</li>
                    <li>Facilitate online consultations and support</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Platform Operations</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Maintain and improve our services</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Send important notifications and updates</li>
                    <li>Provide customer support and assistance</li>
                    <li>Ensure platform security and prevent fraud</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Communications</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Send educational content and study tips</li>
                    <li>Notify you about new features and updates</li>
                    <li>Respond to your inquiries and requests</li>
                    <li>Share promotional offers (with your consent)</li>
                  </ul>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Information Sharing and Disclosure</h2>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We do not sell, trade, or rent your personal information to third parties. We may share your 
                  information only in the following circumstances:
                </p>

                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Service Providers</h4>
                    <p className="text-sm text-muted-foreground">
                      We may share information with trusted third-party service providers who assist us in 
                      operating our platform, processing payments, or providing analytics.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Legal Requirements</h4>
                    <p className="text-sm text-muted-foreground">
                      We may disclose information when required by law, court order, or to protect our rights, 
                      property, or safety, or that of others.
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Business Transfers</h4>
                    <p className="text-sm text-muted-foreground">
                      In the event of a merger, acquisition, or sale of assets, your information may be 
                      transferred as part of the transaction.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6" />
                Data Security
              </h2>
              
              <p className="text-muted-foreground mb-4">
                We implement appropriate technical and organizational measures to protect your personal information:
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Encryption</h4>
                  <p className="text-sm text-muted-foreground">
                    All data in transit is encrypted using industry-standard SSL/TLS protocols.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Access Controls</h4>
                  <p className="text-sm text-muted-foreground">
                    Strict access controls ensure only authorized personnel can access your data.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Regular Audits</h4>
                  <p className="text-sm text-muted-foreground">
                    We conduct regular security audits and vulnerability assessments.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Data Backup</h4>
                  <p className="text-sm text-muted-foreground">
                    Your data is regularly backed up to prevent loss and ensure availability.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Your Rights and Choices</h2>
              
              <div className="space-y-4">
                <p className="text-muted-foreground">You have the following rights regarding your personal information:</p>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Access and Portability</h4>
                      <p className="text-sm text-muted-foreground">Request a copy of your personal information and export your data.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Correction</h4>
                      <p className="text-sm text-muted-foreground">Update or correct inaccurate personal information.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Deletion</h4>
                      <p className="text-sm text-muted-foreground">Request deletion of your account and associated data.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <h4 className="font-medium">Opt-out</h4>
                      <p className="text-sm text-muted-foreground">Unsubscribe from marketing communications at any time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Cookies and Tracking</h2>
              <p className="text-muted-foreground mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>
              
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded">
                  <strong className="text-sm">Essential Cookies:</strong>
                  <span className="text-sm text-muted-foreground ml-2">Required for platform functionality</span>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <strong className="text-sm">Analytics Cookies:</strong>
                  <span className="text-sm text-muted-foreground ml-2">Help us understand how you use our platform</span>
                </div>
                <div className="p-3 bg-muted/50 rounded">
                  <strong className="text-sm">Preference Cookies:</strong>
                  <span className="text-sm text-muted-foreground ml-2">Remember your settings and preferences</span>
                </div>
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information for as long as necessary to provide our services and fulfill 
                the purposes outlined in this policy. Academic records and test results may be retained longer 
                for educational continuity. You can request deletion of your account at any time.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
              <p className="text-muted-foreground">
                Our services are intended for users aged 13 and older. We do not knowingly collect personal 
                information from children under 13. If we become aware of such collection, we will take steps 
                to delete the information as soon as possible.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place to protect your information during such transfers.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Camera and Microphone (Exam Proctoring)</h2>
              <p className="text-muted-foreground mb-2">
                Our mobile app requests camera and microphone permission for one purpose only: exam integrity
                during proctored mock and CBT sessions.
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Access is requested only when you start a proctored exam, and you may decline.</li>
                <li>The camera captures periodic still snapshots and the microphone detects ambient noise levels.</li>
                <li>No continuous video or audio recording is streamed or stored.</li>
                <li>Proctoring data is used solely to flag possible malpractice and is deleted after result review.</li>
                <li>We never use camera or microphone data for advertising, profiling, or sharing with third parties.</li>
              </ul>
              <p className="text-muted-foreground mt-2">
                We also request storage/photo access so you can upload a profile photo or required documents,
                and notification permission to send exam reminders and result alerts.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Account and Data Deletion</h2>
              <p className="text-muted-foreground mb-2">
                You can permanently delete your account at any time from <strong>Settings → Account → Delete
                account</strong> in the app or on the web. Deletion removes your profile, test history, study
                plans, wallet balance, service requests, ebook access and uploaded files.
              </p>
              <p className="text-muted-foreground">
                Full instructions are on our{" "}
                <Link to="/delete-account" className="underline">account deletion page</Link>, or email
                support@edura.com.ng. Anonymised payment and invoice records may be retained for up to 6 years
                where tax and accounting law requires it.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes 
                by email or through our platform. Your continued use of our services after such modifications 
                constitutes acceptance of the updated policy.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> privacy@edura.com.ng<br />
                  <strong>Support:</strong> support@edura.com.ng<br />
                  <strong>Phone:</strong> 0705 075 7085<br />
                  <strong>Address:</strong> Lagos, Nigeria<br />
                  <strong>Website:</strong> www.edura.com.ng<br />
                  <strong>Data Protection Officer:</strong> dpo@edura.com.ng
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;