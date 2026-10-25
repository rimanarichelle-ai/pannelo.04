/**
 * Official PANNELLO Social Media, Delivery Contact & Location Configuration.
 *
 * Centralized verified URLs for Instagram, Facebook, TikTok, delivery phone, and Google Maps.
 * `VITE_TIKTOK_URL` in `.env` can optionally override the default official TikTok URL if needed.
 */
const DEFAULT_OFFICIAL_TIKTOK_URL = 'https://www.tiktok.com/@pannelo8?_r=1';

const envTikTokUrl =
  typeof import.meta !== 'undefined' && typeof import.meta.env?.VITE_TIKTOK_URL === 'string'
    ? import.meta.env.VITE_TIKTOK_URL.trim()
    : '';

export const OFFICIAL_TIKTOK_URL: string = envTikTokUrl || DEFAULT_OFFICIAL_TIKTOK_URL;

export interface VerifiedSocialLink {
  id: 'instagram' | 'facebook' | 'tiktok';
  title: string;
  subtitle: string;
  url: string;
}

export const DELIVERY_CONTACT = {
  phoneDisplay: '0781 27 28 71',
  phoneHref: 'tel:+213781272871',
} as const;

export const RESTAURANT_LOCATION = {
  id: 'google-maps',
  title: 'Google Maps',
  address: 'Rue Belsaadi Abdelkader, Khemis Miliana',
  url: 'https://www.google.com/maps/search/?api=1&query=Pannelo+Rue+Belsaadi+Abdelkader+Khemis+Miliana',
} as const;

export const SOCIAL_MEDIA_URLS = {
  instagram: 'https://www.instagram.com/pannelo__/',
  facebook:
    'https://www.facebook.com/people/Pannelo-%D8%A8%D8%A7%D9%86%D9%8A%D9%84%D9%88/61576165485693/',
  tiktok: OFFICIAL_TIKTOK_URL,
} as const;

/**
 * Validates that a social media URL is a non-empty, well-formed http(s) URL.
 */
export function isValidSocialUrl(url: string | undefined | null): url is string {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.hostname.includes('.')
    );
  } catch {
    return false;
  }
}

/**
 * Returns only verified, valid social media links.
 * TikTok is automatically excluded until a valid official URL is configured.
 */
export function getVerifiedSocialLinks(
  tiktokOverrideUrl: string = SOCIAL_MEDIA_URLS.tiktok
): VerifiedSocialLink[] {
  const links: VerifiedSocialLink[] = [
    {
      id: 'instagram',
      title: 'Instagram',
      subtitle: '@pannelo__',
      url: SOCIAL_MEDIA_URLS.instagram,
    },
    {
      id: 'facebook',
      title: 'Facebook',
      subtitle: 'Pannelo - بانيلو',
      url: SOCIAL_MEDIA_URLS.facebook,
    },
  ];

  if (isValidSocialUrl(tiktokOverrideUrl)) {
    links.push({
      id: 'tiktok',
      title: 'TikTok',
      subtitle: '@pannelo8',
      url: tiktokOverrideUrl.trim(),
    });
  }

  return links;
}
