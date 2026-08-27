import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function DeleteAccount() {
  return (
    <div className="min-h-screen bg-background py-10">
      <Helmet>
        <title>Delete Your Edura Account | Data Deletion Request</title>
        <meta
          name="description"
          content="How to permanently delete your Edura account and what data is removed or retained."
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
              <Trash2 className="w-7 h-7" /> Delete your Edura account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">Delete from inside the app</h2>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open the Edura app and sign in.</li>
                <li>Go to <strong>Settings → Account</strong>.</li>
                <li>Scroll to <strong>Delete account</strong>, type <code>DELETE</code> and confirm.</li>
              </ol>
              <p className="mt-2">Your account is removed immediately and you are signed out.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">Request by email</h2>
              <p>
                If you can no longer sign in, email{" "}
                <a className="underline" href="mailto:support@edura.com.ng">support@edura.com.ng</a> from your
                registered address with the subject "Delete my account". We complete verified requests within
                30 days.
              </p>
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
              <p>support@edura.com.ng · privacy@edura.com.ng</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
