import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
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
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Edura's educational platform, you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Edura provides an online educational platform for exam preparation including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Practice tests for JAMB, WAEC, NECO, and Post-UTME</li>
                <li>Study resources and materials</li>
                <li>Performance analytics and tracking</li>
                <li>Educational consultation services</li>
                <li>Premium subscription features</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To access certain features of our service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide accurate and complete information during registration</li>
                <li>Keep your account credentials secure and confidential</li>
                <li>Not share your account with others</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Take responsibility for all activities under your account</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Share, distribute, or resell our content without permission</li>
                <li>Use automated means to access the service</li>
                <li>Interfere with or disrupt the service or servers</li>
                <li>Impersonate others or provide false information</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Subscription and Payment</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For premium features:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Subscription fees are charged in advance on a recurring basis</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change subscription fees with 30 days notice</li>
                <li>You can cancel your subscription at any time</li>
                <li>Access to premium features ends when subscription expires</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content on Edura, including but not limited to text, graphics, logos, images, and software, 
                is the property of Edura or its content suppliers and is protected by copyright and other intellectual 
                property laws. You may not reproduce, distribute, or create derivative works without explicit permission.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data Protection</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your privacy is important to us. Our collection and use of personal information is governed by our 
                Privacy Policy, which is incorporated into these Terms by reference. By using our service, you consent 
                to the collection and use of your information as outlined in our Privacy Policy.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Disclaimers and Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Edura provides the service "as is" without warranties of any kind. We do not guarantee:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Uninterrupted or error-free operation</li>
                <li>Accuracy or completeness of content</li>
                <li>Specific exam results or academic outcomes</li>
                <li>Compatibility with all devices or browsers</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To the maximum extent permitted by law, Edura shall not be liable for any indirect, incidental, 
                special, or consequential damages arising from your use of the service.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the service immediately, without prior notice, 
                for any reason, including breach of these Terms. Upon termination, your right to use the service 
                ceases immediately, but sections regarding intellectual property, disclaimers, and limitation of 
                liability shall survive termination.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of significant changes 
                via email or through the service. Your continued use of the service after changes constitutes 
                acceptance of the new Terms.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Nigeria, without 
                regard to conflict of law principles. Any disputes arising under these Terms shall be subject 
                to the exclusive jurisdiction of the courts of Nigeria.
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Email:</strong> support@edura.com.ng<br />
                  <strong>Phone:</strong> 0705 075 7085<br />
                  <strong>Address:</strong> Lagos, Nigeria<br />
                  <strong>Website:</strong> www.edura.com.ng
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;