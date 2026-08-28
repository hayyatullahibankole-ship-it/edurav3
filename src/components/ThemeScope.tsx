import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from 'next-themes';

// Dark mode is allowed everywhere inside the signed-in app.
// Only public / marketing & Akboy pages are forced to light mode.
const PUBLIC_LIGHT_PREFIXES = [
  '/akboy',
  '/campus-hub',
  '/blog',
  '/privacy',
  '/terms',
  '/delete-account',
  '/schools',
  '/school-landing',
  '/campus-landing',
  '/install-app',
  '/mock',
  '/mock-registration',
  '/mock-login',
  '/mock-exam',
  '/mock-submitted',
  '/mock-results',
  '/reprint-admit-slip',
  '/tutorials',
  '/register',
  '/tutorial-registration',
  '/events',
  '/portfolio',
  '/contact',
  '/about',
];

const matches = (pathname: string, list: string[]) =>
  list.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const isDashboardPath = (pathname: string) =>
  pathname !== '/' && !matches(pathname, PUBLIC_LIGHT_PREFIXES);

export const ThemeScope = () => {
  const { pathname } = useLocation();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const allowDark = isDashboardPath(pathname);
    root.classList.toggle('dark', allowDark && resolvedTheme === 'dark');
  }, [pathname, resolvedTheme]);

  return null;
};

export default ThemeScope;
