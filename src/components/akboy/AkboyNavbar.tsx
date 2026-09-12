import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import akboyLogo from "@/assets/akboy-logo.png";
import { useDomainDetection } from "@/hooks/useDomainDetection";

type NavChild = { name: string; path: string; external?: boolean };
type NavGroup = { name: string; path?: string; children: NavChild[]; cta?: NavChild };

export function AkboyNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileGroup, setMobileGroup] = useState<string | null>(null);
  const location = useLocation();
  const { isAkboy, isCampusHub } = useDomainDetection();

  const basePath = isCampusHub ? "" : isAkboy ? "" : "/akboy";

  const groups: NavGroup[] = [
    {
      name: "Services",
      children: [
        { name: "Graphics Design", path: `${basePath}/services#graphics` },
        { name: "Web Design", path: `${basePath}/services#web` },
        { name: "Branding & Identity", path: `${basePath}/services#branding` },
      ],
      cta: { name: "Request a Service", path: `${basePath}/contact` },
    },
    {
      name: "Products",
      path: `${basePath}/products`,
      children: [
        { name: "All Products", path: `${basePath}/products` },
        { name: "Edura", path: `${basePath}/products/edura` },
        { name: "School OS", path: `${basePath}/products/school-os` },
      ],
      cta: { name: "Explore Products", path: `${basePath}/products` },
    },
    {
      name: "Learn",
      children: [
        { name: "Akboy Exam Prep Academy", path: `${basePath}/register` },
        { name: "Mock Exams", path: `${basePath}/mock` },
        { name: "Online Classes", path: `${basePath}/register` },
        { name: "Events & Workshops", path: `${basePath}/events` },
        { name: "Ebook Library", path: `${basePath}/ebooks` },
      ],
      cta: { name: "Start Learning", path: `${basePath}/register` },
    },

    {
      name: "Campus Hub",
      children: [
        { name: "Admission News", path: `${basePath}/campus-hub?category=Admission List` },
        { name: "Exam Tips", path: `${basePath}/campus-hub?category=Exam Tips` },
        { name: "Student Opportunities", path: `${basePath}/campus-hub?category=Opportunities` },
        { name: "School Updates", path: `${basePath}/campus-hub?category=School Updates` },
      ],
      cta: { name: "Explore Campus Hub", path: `${basePath}/campus-hub` },
    },
    {
      name: "Community",
      path: `${basePath}/community`,
      children: [
        { name: "Community Overview", path: `${basePath}/community` },
        { name: "Student Ambassadors", path: `${basePath}/community/ambassadors` },
        { name: "Partner Schools", path: `${basePath}/community/partners` },
        { name: "Events & Workshops", path: `${basePath}/learn/events` },
      ],
      cta: { name: "Join the Community", path: `${basePath}/community` },
    },
    {
      name: "About",
      children: [
        { name: "About AKBOY", path: `${basePath}/about` },
        { name: "Portfolio", path: `${basePath}/portfolio` },
        { name: "Contact", path: `${basePath}/contact` },
      ],
    },
  ];

  const isActive = (p: string) => location.pathname === p.split("?")[0].split("#")[0];

  const renderLink = (c: NavChild, className = "") =>
    c.external ? (
      <a href={c.path} target="_blank" rel="noopener noreferrer" className={className}>
        {c.name}
      </a>
    ) : (
      <Link to={c.path} className={className} onClick={() => { setIsOpen(false); setMobileGroup(null); setOpenGroup(null); }}>
        {c.name}
      </Link>
    );

  if (isCampusHub) {
    return (
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-akboy-line bg-akboy-paper/95 backdrop-blur">
        <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
          <div className="flex h-16 items-center justify-between gap-4 sm:h-20">
            <Link to="/" className="flex min-w-0 items-center gap-3 text-akboy-forest">
              <img src={akboyLogo} alt="AKBOY Creative Hub" className="h-9 w-auto sm:h-11" />
              <span className="hidden h-7 border-l border-akboy-line sm:block" />
              <span className="truncate font-editorial text-lg font-semibold sm:text-xl">Campus Hub</span>
            </Link>
            <div className="flex items-center gap-1 text-sm text-akboy-muted sm:gap-3">
              <Link to="/" className="rounded-md px-3 py-2 font-semibold hover:bg-akboy-mist hover:text-akboy-forest">Stories</Link>
              <a href="#newsletter" className="rounded-md bg-akboy-forest px-3 py-2 font-semibold text-akboy-paper hover:bg-akboy-moss sm:px-4">Get alerts</a>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-akboy-line shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo */}
          <Link to={basePath || "/"} className="flex items-center flex-shrink-0">
            <img src={akboyLogo} alt="AKBOY Creative Hub" className="h-10 sm:h-12 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-0.5">
            {groups.map((g) => (
              <div
                key={g.name}
                className="relative group"
                onMouseEnter={() => setOpenGroup(g.name)}
                onMouseLeave={() => setOpenGroup(null)}
              >
                <button
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-akboy-forest hover:text-akboy-moss hover:bg-akboy-bone transition-colors duration-200"
                >
                  {g.name}
                  <ChevronDown className="h-4 w-4 text-akboy-muted group-hover:text-akboy-forest transition-colors" />
                </button>
                {openGroup === g.name && (
                  <div className="absolute left-0 top-full pt-2 w-56">
                    <div className="bg-white border border-akboy-line rounded-lg shadow-lg overflow-hidden">
                      <div className="py-1">
                        {g.children.map((c) =>
                          renderLink(
                            c,
                            "block px-4 py-2 text-sm font-medium text-akboy-forest hover:bg-akboy-bone hover:text-akboy-moss transition-colors"
                          )
                        )}
                      </div>
                      {g.cta && (
                        <div className="border-t border-akboy-line p-2 bg-akboy-bone">
                          {renderLink(
                            g.cta,
                            "block text-center px-4 py-2 text-sm font-semibold text-white bg-akboy-forest hover:bg-akboy-moss rounded-md transition-colors"
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Button (desktop) */}
          <div className="hidden lg:flex items-center">
            <Button asChild className="bg-akboy-forest hover:bg-akboy-moss text-white font-semibold rounded-lg px-6 py-2 shadow-sm transition-colors h-10">
              <Link to={`${basePath}/contact`}>Get Started</Link>
            </Button>
          </div>

          {/* Mobile CTA + Menu */}
          <div className="lg:hidden flex items-center gap-2">
            <Button asChild size="sm" className="bg-akboy-forest hover:bg-akboy-moss text-white font-semibold rounded-lg">
              <Link to={`${basePath}/contact`}>Get Started</Link>
            </Button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-akboy-forest hover:bg-akboy-bone transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-akboy-line">
            <div className="flex flex-col">
              {groups.map((g) => {
                const expanded = mobileGroup === g.name;
                return (
                  <div key={g.name} className="border-b border-akboy-line/60">
                    <button
                      onClick={() => setMobileGroup(expanded ? null : g.name)}
                      className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-akboy-forest hover:bg-akboy-bone transition-colors"
                    >
                      {g.name}
                      <ChevronDown className={`h-5 w-5 text-akboy-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {expanded && (
                      <div className="pb-3 pl-4 space-y-1 bg-akboy-bone">
                        {g.children.map((c) => (
                          <div key={c.name} className="py-1">
                            {renderLink(c, "block px-2 py-2 text-sm font-medium text-akboy-forest hover:text-akboy-forest hover:bg-white rounded transition-colors")}
                          </div>
                        ))}
                        {g.cta && (
                          <div className="mt-2 pt-2 border-t border-akboy-line">
                            {renderLink(
                              g.cta,
                              "block text-center px-4 py-2 text-sm font-semibold text-white bg-akboy-forest hover:bg-akboy-moss rounded transition-colors"
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
