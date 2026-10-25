import { Instagram, Facebook, PhoneCall } from 'lucide-react';
import {
  DELIVERY_CONTACT,
  getVerifiedSocialLinks,
  type VerifiedSocialLink,
} from '@/lib/restaurant-contact';
import type { Translations } from '@/lib/translations';

// Official TikTok SVG Brand Icon
export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.313-4.637c.316 0 .62.051.905.144V9.412a6.347 6.347 0 0 0-.905-.065A6.335 6.335 0 0 0 3.15 15.68a6.335 6.335 0 0 0 6.336 6.336 6.335 6.335 0 0 0 6.335-6.336V8.375a8.214 8.214 0 0 0 4.768 1.498V6.428a4.83 4.83 0 0 1-1-.042z" />
    </svg>
  );
}

// Recognizable Delivery Scooter SVG Icon
export function DeliveryScooterIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Rear delivery box */}
      <rect x="2.5" y="7" width="6.5" height="5" rx="1.2" />
      {/* Rear & front scooter wheels */}
      <circle cx="6.5" cy="17.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
      {/* Scooter body, floorboard & front stem/handlebar */}
      <path d="M4 15c1-1.6 2.3-2.5 5.5-2.5h2l1.5 5" />
      <path d="M9 17.5h5.5L16.5 9h-2.5" />
      <path d="M15 9h3" />
      <path d="M15.2 15.2a3.2 3.2 0 0 1 4.3 1.3" />
    </svg>
  );
}

interface FooterContactSectionProps {
  t: Translations;
}

export function FooterContactSection({ t }: FooterContactSectionProps) {
  const verifiedSocialLinks = getVerifiedSocialLinks();

  const getSocialAriaLabel = (id: VerifiedSocialLink['id']) => {
    if (id === 'instagram') return t.ui.socialInstagramAria;
    if (id === 'facebook') return t.ui.socialFacebookAria;
    return t.ui.socialTiktokAria;
  };

  return (
    <div className="w-full max-w-xl mx-auto pt-3 space-y-6">
      {/* 1. Dedicated Delivery Contact Card */}
      <section
        aria-label={t.ui.deliveryAvailableLabel}
        data-testid="delivery-contact-section"
        className="relative overflow-hidden rounded-2xl border border-[#C8102E]/25 dark:border-[#C8102E]/35 bg-[var(--bg-surface-elevated)] p-4 sm:p-5 shadow-sm"
      >
        {/* Subtle top PANNELLO red-gold accent line */}
        <div
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#C8102E] via-[#FBBF24] to-[#C8102E]"
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Scooter Icon + "Livraison disponible" + Tappable Phone Number */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#C8102E] text-white flex items-center justify-center shadow-sm shadow-[#C8102E]/25 shrink-0">
              <DeliveryScooterIcon className="w-6 h-6" />
            </div>

            <div className="flex flex-col items-center sm:items-start">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#C8102E] dark:text-[#FBBF24]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                {t.ui.deliveryAvailableLabel}
              </span>

              <a
                href={DELIVERY_CONTACT.phoneHref}
                aria-label={t.ui.deliveryPhoneAria}
                data-testid="delivery-phone-link"
                className="mt-0.5 font-heading font-black text-xl sm:text-2xl tracking-tight tabular-nums text-[var(--text-main)] hover:text-[#C8102E] dark:hover:text-[#FBBF24] transition-colors underline-offset-4 hover:underline"
              >
                {DELIVERY_CONTACT.phoneDisplay}
              </a>
            </div>
          </div>

          {/* Right: Prominent Call-to-Action Button */}
          <a
            href={DELIVERY_CONTACT.phoneHref}
            aria-label={t.ui.deliveryCallButtonAria}
            data-testid="delivery-call-cta"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#a50d25] text-white font-heading font-extrabold text-xs sm:text-sm uppercase tracking-wide shadow-md shadow-[#C8102E]/25 active:scale-[0.98] transition-all cursor-pointer shrink-0"
          >
            <PhoneCall className="w-4 h-4 shrink-0" strokeWidth={2.3} />
            <span>{t.ui.deliveryCallButton}</span>
          </a>
        </div>
      </section>

      {/* 2. Official Social Media Links */}
      <div
        data-testid="footer-social-section"
        className="flex flex-col items-center space-y-3"
      >
        <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[var(--text-muted)]">
          {t.ui.footerSocialHeading}
        </span>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {verifiedSocialLinks.map((social) => {
            const isInstagram = social.id === 'instagram';
            const isFacebook = social.id === 'facebook';

            return (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={getSocialAriaLabel(social.id)}
                data-testid={`footer-social-${social.id}`}
                className="group inline-flex items-center gap-2.5 min-h-[44px] px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] hover:border-[#C8102E]/50 text-[var(--text-main)] shadow-2xs active:scale-95 transition-all cursor-pointer"
              >
                {isInstagram && (
                  <Instagram
                    className="w-4 h-4 text-[#E1306C] group-hover:scale-110 transition-transform shrink-0"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                )}
                {isFacebook && (
                  <Facebook
                    className="w-4 h-4 text-[#1877F2] group-hover:scale-110 transition-transform shrink-0"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                )}
                {social.id === 'tiktok' && (
                  <TikTokIcon className="w-4 h-4 text-[var(--text-main)] group-hover:scale-110 transition-transform shrink-0" />
                )}

                <span className="font-heading font-extrabold text-xs sm:text-sm text-[var(--text-main)] group-hover:text-[#C8102E] dark:group-hover:text-[#FBBF24] transition-colors">
                  {social.title}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
