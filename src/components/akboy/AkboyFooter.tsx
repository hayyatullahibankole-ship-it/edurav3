import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";
import akboyLogo from "@/assets/akboy-logo.png";
import { useDomainDetection } from "@/hooks/useDomainDetection";

export function AkboyFooter() {
  const currentYear = new Date().getFullYear();
  const { isAkboy, isCampusHub } = useDomainDetection();
  const basePath = isCampusHub ? "" : isAkboy ? "" : "/akboy";

  if (isCampusHub) {
    return (
      <footer className="bg-akboy-deep text-akboy-paper">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={akboyLogo} alt="Campus Hub" className="h-12 w-auto" />
               <span className="font-editorial text-xl font-semibold text-akboy-paper">Campus Hub</span>
            </div>
             <p className="max-w-xl text-sm leading-relaxed text-akboy-paper/65">
              Fresh admission news, scholarship updates and campus headlines for Nigerian students.
            </p>
          </div>
           <div className="flex flex-wrap items-center gap-5 text-sm text-akboy-paper/70">
             <Link to="/" className="hover:text-akboy-lime">Stories</Link>
             <a href="#newsletter" className="hover:text-akboy-lime">Alerts</a>
             <a href="mailto:akboycreativehub@gmail.com" className="hover:text-akboy-lime">Contact</a>
          </div>
        </div>
         <div className="border-t border-akboy-paper/10 py-4 text-center text-xs text-akboy-paper/50">
           © {currentYear} AKBOY Campus Hub. Credible education updates for Nigerian students.
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-akboy-forest text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="space-y-6 lg:col-span-2">
            <div className="inline-block bg-white px-4 py-3 rounded-lg">
              <img src={akboyLogo} alt="AKBOY Creative Hub" className="h-12 w-auto" />
            </div>
            <p className="text-white/60 text-sm leading-relaxed">
              Empowering students and businesses through design, education, and digital solutions.
            </p>
            <div className="flex space-x-3">
              {[
                { Icon: Facebook, href: "https://facebook.com/akboycreativehub" },
                { Icon: Instagram, href: "https://instagram.com/akboycreativehub" },
                { Icon: Linkedin, href: "https://linkedin.com/company/akboycreativehub" },
                { Icon: Twitter, href: "https://twitter.com/akboycreative" },
              ].map(({ Icon, href }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 hover:bg-emerald-600 text-white/70 hover:text-white rounded-lg flex items-center justify-center transition-colors duration-200"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Learn */}
          <div>
            <h4 className="text-gray-50 font-semibold text-base mb-5">Learn</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={`${basePath}/register`} className="text-white/60 hover:text-gray-50 transition-colors">Exam Prep Academy</Link></li>
              <li><Link to={`${basePath}/mock`} className="text-white/60 hover:text-gray-50 transition-colors">Mock Exams</Link></li>
              <li><Link to={`${basePath}/register`} className="text-white/60 hover:text-gray-50 transition-colors">Online Classes</Link></li>
            </ul>
          </div>

          {/* Campus Hub & Services */}
          <div>
            <h4 className="text-gray-50 font-semibold text-base mb-5">Explore</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={`${basePath}/campus-hub`} className="text-white/60 hover:text-gray-50 transition-colors">Campus Hub</Link></li>
              <li><Link to={`${basePath}/services`} className="text-white/60 hover:text-gray-50 transition-colors">Services</Link></li>
              <li><Link to={`${basePath}/portfolio`} className="text-white/60 hover:text-gray-50 transition-colors">Portfolio</Link></li>
              <li><Link to={`${basePath}/about`} className="text-white/60 hover:text-gray-50 transition-colors">About</Link></li>
              <li><Link to="/blog" className="text-white/60 hover:text-gray-50 transition-colors">Blog</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-gray-50 font-semibold text-base mb-5">Get In Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-akboy-butter mt-0.5 flex-shrink-0" />
                <a href="mailto:akboycreativehub@gmail.com" className="text-white/60 hover:text-gray-50 break-all transition-colors">akboycreativehub@gmail.com</a>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-akboy-butter mt-0.5 flex-shrink-0" />
                <a href="tel:+2348101466977" className="text-white/60 hover:text-gray-50 transition-colors">+234 810 146 6977</a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-akboy-butter mt-0.5 flex-shrink-0" />
                <span className="text-white/60">Lagos, Nigeria</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">© {currentYear} AKBOY Creative Hub. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-white/50 hover:text-gray-50 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-white/50 hover:text-gray-50 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
