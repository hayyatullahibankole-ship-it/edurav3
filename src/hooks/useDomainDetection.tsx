import { useMemo } from 'react';

export type Platform = 'edura' | 'akboy';

interface DomainConfig {
  platform: Platform;
  isAkboy: boolean;
  isEdura: boolean;
  isCampusHub: boolean;
}

// Configure your domains here
const AKBOY_DOMAINS = [
  'akboy.space',
  'www.akboy.space',
  'akboy.lovable.app',
];

const CAMPUS_HUB_DOMAINS = [
  'campushub.akboy.space',
  'www.campushub.akboy.space',
  'campushub.akboy.com.ng',
  'www.campushub.akboy.com.ng',
];

const EDURA_DOMAINS = [
  'edura.com.ng',
  'www.edura.com.ng',
  'edura.lovable.app',
  // Add your Edura domain when connected
];

export function useDomainDetection(): DomainConfig {
  return useMemo(() => {
    const hostname = window.location.hostname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const normalizedHash = hash.replace(/^#!/, '#');

    const isCampusHubDomain = CAMPUS_HUB_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    const isAkboyDomain = !isCampusHubDomain && AKBOY_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    const isEduraDomain = EDURA_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    const isAkboyPath = window.location.pathname.startsWith('/akboy') || normalizedHash.startsWith('#/akboy');

    let platform: Platform = 'edura'; // Default to Edura

    if (isCampusHubDomain || isAkboyDomain) {
      platform = 'akboy';
    } else if (isEduraDomain) {
      platform = 'edura';
    } else if (isAkboyPath) {
      // Fallback for development/preview - detect via path/hash
      platform = 'akboy';
    }

    return {
      platform,
      isAkboy: platform === 'akboy',
      isEdura: platform === 'edura',
      isCampusHub: isCampusHubDomain,
    };
  }, []);
}

// Utility function for non-React contexts
export function detectPlatform(): Platform {
  const hostname = window.location.hostname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const normalizedHash = hash.replace(/^#!/, '#');

  const isCampusHubDomain = CAMPUS_HUB_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  );

  const isAkboyDomain = !isCampusHubDomain && AKBOY_DOMAINS.some(domain =>
    hostname === domain || hostname.endsWith('.' + domain)
  );

  if (isCampusHubDomain || isAkboyDomain) {
    return 'akboy';
  }

  if (window.location.pathname.startsWith('/akboy') || normalizedHash.startsWith('#/akboy')) {
    return 'akboy';
  }

  return 'edura';
}
