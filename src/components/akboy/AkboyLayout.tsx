import { ReactNode } from "react";
import { Helmet } from "react-helmet";
import { AkboyNavbar } from "./AkboyNavbar";
import { AkboyFooter } from "./AkboyFooter";

interface AkboyLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  /** Absolute path for canonical/og:url, e.g. "/" or "/campus-hub" */
  path?: string;
}

const AKBOY_ORIGIN = "https://akboy.space";
const AKBOY_LOGO_URL = `${AKBOY_ORIGIN}/akboy-logo.png`;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AKBOY Creative Hub",
  url: AKBOY_ORIGIN,
  logo: AKBOY_LOGO_URL,
  description:
    "AKBOY Creative Hub is an education and technology company providing campus news, tutorials, mock exams, ebooks, events and digital services for Nigerian students.",
};

export function AkboyLayout({ children, title, description, path = "/" }: AkboyLayoutProps) {
  const pageTitle = title
    ? `${title} | AKBOY Creative Hub`
    : "AKBOY Creative Hub — Education & Technology Solutions";
  const pageDescription =
    description ||
    "AKBOY Creative Hub — campus news, exam preparation, ebooks, tutorials, events and technology services for Nigerian students.";
  const pageUrl = `${AKBOY_ORIGIN}${path}`;

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="author" content="AKBOY Creative Hub" />
        <link rel="icon" href="/akboy-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/akboy-logo.png" />
        <link rel="canonical" href={pageUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AKBOY Creative Hub" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={AKBOY_LOGO_URL} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={AKBOY_LOGO_URL} />

        {/* Structured data: tells Google the brand name + logo for this site */}
        <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
      </Helmet>
      <AkboyNavbar />
      <main className="flex-1 pt-16 sm:pt-20">{children}</main>
      <AkboyFooter />
    </div>
  );
}
