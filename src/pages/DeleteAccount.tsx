import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail } from "lucide-react";

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-background py-10">
      <Helmet>
        <title>Delete Your Edura Account | Data Deletion Request</title>
        <meta
          name="description"
          content="How to request permanent deletion of your Edura account and what data is removed or retained."
        />
        <link rel="canonical" href="https://edura.com.ng/delete-account" />
      </Helmet>
      <div className="container mx-auto px-4 max-w-3xl">
        <Button asChild variant="outline" className="mb-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Mail className="w-7 h-7" /> Request account deletion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">How to request</h2>
              <p>
                Email{" "}
                <a className="underline" href="mailto:support@edura.com.ng">support@edura.com.ng</a> from the
                address registered on your Edura account, using the subject{" "}
                <strong>"Delete my account"</strong>. Our support team verifies the request and confirms by
                email once the deletion is complete. Verified requests are completed within 30 days.
              </p>
              <Button asChild className="mt-4">
                <a href="mailto:support@edura.com.ng?subject=Delete%20my%20account">Email support</a>
              </Button>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">What gets deleted</h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Profile details (name, email, phone, photo)</li>
                <li>Test results, practice history and study plans</li>
                <li>Wallet balance, transaction history and service requests</li>
                <li>Uploaded files, ebook access records and forum activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">What we keep</h2>
              <p>
                Anonymised payment and invoice records are retained for up to 6 years where Nigerian tax and
                accounting law requires it. They can no longer be linked back to your profile.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">Contact</h2>
              <p>support@edura.com.ng · privacy@edura.com.ng · 0705 075 7085</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
