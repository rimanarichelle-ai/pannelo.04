'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  MoreVertical,
  X,
  Instagram,
  Facebook,
  MapPin,
  ExternalLink,
  ChevronRight,
  Check,
  UtensilsCrossed,
  ClipboardList,
  PhoneCall,
} from 'lucide-react';
import type { MenuCategory } from '@/lib/menu-data';
import type { Language, Translations } from '@/lib/translations';
import {
  DELIVERY_CONTACT,
  RESTAURANT_LOCATION,
  getVerifiedSocialLinks,
} from '@/lib/restaurant-contact';
import { DeliveryScooterIcon, TikTokIcon } from '@/components/FooterContactSection';

interface ThreeDotMenuProps {
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  activeOrdersCount?: number;
  onOpenOrders?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
}

// Category visual icon map for instant recognition
const CATEGORY_ICONS: Record<string, ReactNode> = {
  'smash-burger': <span className="text-sm">🍔</span>,
  pocket: <span className="text-sm">🌯</span>,
  fries: <span className="text-sm">🍟</span>,
  drinks: <span className="text-sm">🥤</span>,
  sweets: <span className="text-sm">🥞</span>,
  'pizza-sauce-rouge': <span className="text-sm">🍕</span>,
  'pizza-sauce-blanche': <span className="text-sm">🍕</span>,
  tacos: <span className="text-sm">🌮</span>,
  sandwiches: <span className="text-sm">🥪</span>,
  tombik: <span className="text-sm">🥙</span>,
  calzon: <span className="text-sm">🥟</span>,
};

export function ThreeDotMenu({
  categories,
  activeCategoryId,
  onSelectCategory,
  language,
  setLanguage,
  t,
  activeOrdersCount = 0,
  onOpenOrders,
  onOpenChange,
}: ThreeDotMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Client-side hydration mount check for React Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Standard iOS Safari fixed-body scroll lock & scroll restoration
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalLeft = document.body.style.left;
    const originalRight = document.body.style.right;
    const originalWidth = document.body.style.width;
    const originalOverflow = document.body.style.overflow;

    // Lock page background firmly on iOS without shifting
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        onOpenChange?.(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.left = originalLeft;
      document.body.style.right = originalRight;
      document.body.style.width = originalWidth;
      document.body.style.overflow = originalOverflow;
      // Flawlessly restore exact scroll position
      window.scrollTo(0, scrollY);
    };
  }, [isOpen, onOpenChange]);

  const toggleMenu = () => {
    const next = !isOpen;
    setIsOpen(next);
    onOpenChange?.(next);
  };

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
    triggerRef.current?.focus();
  };

  const handleCategoryClick = (categoryId: string) => {
    setIsOpen(false);
    onOpenChange?.(false);
    // Smooth scroll to category section on the next frame after body scroll lock is released
    requestAnimationFrame(() => {
      onSelectCategory(categoryId);
    });
  };

  return (
    <>
      {/* 1. Header Trigger: Three-Dot Button (iOS 44x44px minimum touch target) */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-label={isOpen ? t.ui.quickLinksCloseAria : t.ui.threeDotMenuAria}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`relative flex items-center justify-center w-11 h-11 rounded-lg border transition-all cursor-pointer shadow-xs active:scale-95 ${
          isOpen
            ? 'border-[#C8102E] bg-[var(--bg-surface-elevated)] text-[#C8102E] ring-2 ring-[#C8102E]/25'
            : 'border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] hover:border-[var(--text-muted)]'
        }`}
      >
        <MoreVertical
          className={`w-5 h-5 transition-transform duration-200 ${
            isOpen ? 'rotate-90 text-[#C8102E]' : 'text-[var(--text-main)]'
          }`}
          strokeWidth={2.4}
        />
        {activeOrdersCount > 0 && (
          <span className="md:hidden absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#C8102E] text-white font-heading font-black text-[9.5px] leading-none flex items-center justify-center shadow-xs tabular-nums pointer-events-none">
            {activeOrdersCount}
          </span>
        )}
      </button>

      {/* 2. Portal Modal Overlay & Drawer
          CRITICAL FIX: Portaled directly to document.body at root level (z-[70])
          This guarantees it is NEVER trapped inside sticky or transformed ancestors like smart-nav-wrapper,
          eliminating any horizontal tabs slicing through or overlapping the menu.
      */}
      {mounted && isOpen && createPortal(
        <div
          className="fixed inset-0 z-[1100] flex items-stretch md:items-start justify-start"
          role="presentation"
        >
          {/* Backdrop: Dark translucent backdrop separating drawer from underlying page */}
          <div
            className="fixed inset-0 z-[1100] bg-black/70 backdrop-blur-xs transition-opacity duration-200"
            aria-hidden="true"
            onClick={handleClose}
          />

          {/* Drawer / Modal Container (z-[1200])
              - Mobile (<768px): Anchored full-height slide-over drawer (100dvh) with safe-area insets
              - Tablet / Desktop (>=768px): Proportioned floating card (max-w-[380px], max-h-[min(90vh,calc(100dvh-2.5rem))])
          */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.ui.threeDotMenuAria}
            onClick={(e) => e.stopPropagation()}
            className="relative z-[1200] w-full max-w-[340px] xs:max-w-[360px] md:max-w-[380px] h-[100dvh] md:h-auto md:max-h-[min(90vh,calc(100dvh-2.5rem))] md:top-4 md:left-6 md:my-0 flex flex-col bg-[var(--bg-surface)] text-[var(--text-main)] border-r md:border border-[var(--border-color)] shadow-2xl shadow-black/80 overflow-hidden md:rounded-2xl animate-drawer-in"
          >
            {/* Top Brand Accent Hairline (PANNELLO Red & Gold Gradient) */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#C8102E] via-[#FBBF24] to-[#C8102E] shrink-0" />

            {/* Menu Header with Safe-Area Top Inset for iPhone Notch / Dynamic Island */}
            <div className="pt-[max(env(safe-area-inset-top,0px),0.75rem)] px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-surface-elevated)] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="header-logo-container relative w-24 h-6.5 flex items-center justify-center">
                  <img
                    src="/assets/pannello_logo_red.png"
                    alt="PANNELLO"
                    width={291}
                    height={74}
                    loading="eager"
                    decoding="async"
                    className="header-logo-image header-logo-light absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                  <img
                    src="/assets/pannello_logo_hero.png"
                    alt="PANNELLO"
                    width={580}
                    height={148}
                    loading="eager"
                    decoding="async"
                    className="header-logo-image header-logo-dark absolute inset-0 w-full h-full object-contain pointer-events-none"
                  />
                </div>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#C8102E]/10 text-[#C8102E] border border-[#C8102E]/20">
                  Menu
                </span>
              </div>

              {/* Close Button: 40x40px comfortable touch target, clearly placed */}
              <button
                type="button"
                onClick={handleClose}
                aria-label={t.ui.closeMenu}
                className="w-10 h-10 rounded-lg border border-[var(--border-color)] flex items-center justify-center bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] active:scale-95 text-[var(--text-main)] hover:text-[#C8102E] transition-colors cursor-pointer shadow-2xs"
              >
                <X className="w-5 h-5" strokeWidth={2.4} />
              </button>
            </div>

            {/* Scrollable Container (Holding Categories, Language, Socials, Location)
                Equipped with momentum scrolling and overscroll isolation
            */}
            <div className="p-3.5 space-y-4 overflow-y-auto overscroll-contain flex-1 no-scrollbar touch-pan-y">
              {/* SECTION 0: Quick Access to Local Registered Orders ("Commandes") */}
              {onOpenOrders && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenChange?.(false);
                    requestAnimationFrame(() => {
                      onOpenOrders();
                    });
                  }}
                  data-testid="drawer-orders-btn"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-[#C8102E]/35 bg-[#C8102E]/[0.06] hover:bg-[#C8102E]/12 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#C8102E] text-white flex items-center justify-center shrink-0">
                      <ClipboardList className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block font-heading font-black text-xs uppercase tracking-wide text-[var(--text-main)]">
                        {t.ui.ordersButtonLabel}
                      </span>
                      <span className="block text-[10px] text-[var(--text-secondary)] truncate">
                        {t.ui.ordersModalSubtitle}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {activeOrdersCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#C8102E] text-white font-heading font-black text-[10px] tabular-nums">
                        {activeOrdersCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#C8102E]" />
                  </div>
                </button>
              )}

              {/* SECTION 1: Language Selector (FR / EN Segmented Toggle) */}
              <div className="p-2 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-heading">
                    {t.ui.languageSection}
                  </span>
                  <span className="text-[10px] font-semibold text-[#FBBF24]">
                    {language === 'fr' ? 'Français' : 'English'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]/70">
                  {/* French Button */}
                  <button
                    type="button"
                    onClick={() => setLanguage('fr')}
                    className={`min-h-[42px] flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      language === 'fr'
                        ? 'bg-[#C8102E] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
                    }`}
                  >
                    <span>🇫🇷</span>
                    <span>Français</span>
                    {language === 'fr' && <Check className="w-3.5 h-3.5 ml-auto" strokeWidth={3} />}
                  </button>

                  {/* English Button */}
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`min-h-[42px] flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      language === 'en'
                        ? 'bg-[#C8102E] text-white shadow-xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-elevated)]'
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                    {language === 'en' && <Check className="w-3.5 h-3.5 ml-auto" strokeWidth={3} />}
                  </button>
                </div>
              </div>

              {/* SECTION 2: Menu Categories (All 11 Categories with smooth scroll navigation) */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-heading">
                    {t.ui.categoriesMenuTitle}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] text-[var(--text-muted)]">
                    {categories.length}
                  </span>
                </div>

                <div className="space-y-1">
                  {categories.map((cat, idx) => {
                    const isActive = activeCategoryId === cat.id;
                    const catName = t.categories[cat.id]?.name || cat.name;
                    const iconElement = CATEGORY_ICONS[cat.id] || <UtensilsCrossed className="w-4 h-4" />;

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.98] min-h-[46px] ${
                          isActive
                            ? 'bg-[#C8102E]/10 border-[#C8102E] text-[#C8102E] font-bold shadow-xs'
                            : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] border-[var(--border-color)] text-[var(--text-main)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Numerical Index Badge */}
                          <span
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                              isActive
                                ? 'bg-[#C8102E] text-white'
                                : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border-color)]'
                            }`}
                          >
                            {idx + 1}
                          </span>

                          {/* Food Emoji Icon */}
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            {iconElement}
                          </div>

                          {/* Category Name */}
                          <span className="text-xs font-heading font-extrabold truncate">
                            {catName}
                          </span>
                        </div>

                        {/* Active Indicator or Arrow */}
                        <div className="shrink-0 pl-2">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#C8102E] uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C8102E] animate-pulse" />
                            </span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: Verified Social Media Links (TikTok hidden until official URL is configured) */}
              <div className="pt-1 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-heading">
                    {t.ui.socialMenuTitle}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {getVerifiedSocialLinks().map((link) => {
                    const isInstagram = link.id === 'instagram';
                    const isFacebook = link.id === 'facebook';
                    const hoverBorder = isInstagram
                      ? 'hover:border-[#E1306C]/60 hover:bg-[#E1306C]/10'
                      : isFacebook
                        ? 'hover:border-[#1877F2]/60 hover:bg-[#1877F2]/10'
                        : 'hover:border-[#00f2fe]/60 hover:bg-[#00f2fe]/10';
                    const ariaLabel = isInstagram
                      ? t.ui.socialInstagramAria
                      : isFacebook
                        ? t.ui.socialFacebookAria
                        : t.ui.socialTiktokAria;

                    return (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={ariaLabel}
                        data-testid={`drawer-social-${link.id}`}
                        onClick={handleClose}
                        className={`group flex items-center justify-between p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] transition-all cursor-pointer active:scale-[0.98] min-h-[46px] ${hoverBorder}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-elevated)] shrink-0 group-hover:scale-105 transition-transform">
                            {isInstagram && (
                              <Instagram
                                className="w-4 h-4 text-[#E1306C] transition-colors"
                                strokeWidth={2.2}
                                aria-hidden="true"
                              />
                            )}
                            {isFacebook && (
                              <Facebook
                                className="w-4 h-4 text-[#1877F2] transition-colors"
                                strokeWidth={2.2}
                                aria-hidden="true"
                              />
                            )}
                            {link.id === 'tiktok' && (
                              <TikTokIcon className="w-4 h-4 text-[var(--text-main)] transition-colors" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <span className="block font-heading font-black text-xs text-[var(--text-main)] group-hover:text-[#C8102E] transition-colors truncate">
                              {link.title}
                            </span>
                            <span className="block text-[10px] text-[var(--text-muted)] truncate">
                              {link.subtitle}
                            </span>
                          </div>
                        </div>

                        <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[#C8102E] group-hover:translate-x-0.5 transition-all shrink-0 pl-1" />
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: Delivery Telephone Contact & Restaurant Location */}
              <div className="pt-1 border-t border-[var(--border-color)] space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] font-heading">
                    {t.ui.locationMenuTitle}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    GPS
                  </span>
                </div>

                {/* Delivery Phone Quick-Call Card */}
                <a
                  href={DELIVERY_CONTACT.phoneHref}
                  aria-label={t.ui.deliveryCallButtonAria}
                  data-testid="drawer-delivery-call"
                  onClick={handleClose}
                  className="group flex items-center justify-between p-3 rounded-xl border border-[#C8102E]/35 bg-[#C8102E]/[0.06] hover:bg-[#C8102E]/12 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#C8102E] text-white flex items-center justify-center shrink-0">
                      <DeliveryScooterIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#C8102E] dark:text-[#FBBF24] truncate">
                        {t.ui.deliveryAvailableLabel}
                      </span>
                      <span className="block font-heading font-black text-xs text-[var(--text-main)] tabular-nums">
                        {DELIVERY_CONTACT.phoneDisplay}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C8102E] text-white text-[10px] font-heading font-extrabold uppercase tracking-wide shrink-0">
                    <PhoneCall className="w-3 h-3" strokeWidth={2.3} />
                  </span>
                </a>

                <a
                  href={RESTAURANT_LOCATION.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  className="group flex flex-col p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[#C8102E]/10 hover:border-[#C8102E]/60 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#C8102E]/15 border border-[#C8102E]/30 text-[#C8102E]">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="font-heading font-black text-xs text-[var(--text-main)] group-hover:text-[#C8102E] transition-colors">
                        {RESTAURANT_LOCATION.title}
                      </span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[#C8102E] transition-colors" />
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] pl-9">
                    {RESTAURANT_LOCATION.address}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[var(--border-color)]/60 flex items-center justify-between text-[11px] font-extrabold text-[#C8102E]">
                    <span>{t.ui.quickLinksGetDirections}</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Menu Footer with Safe-Area Bottom Inset for iPhone Home Indicator */}
            <div className="pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] px-4 py-2.5 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-color)] text-[10px] text-[var(--text-muted)] text-center shrink-0">
              PANNELLO • Khemis Miliana • {new Date().getFullYear()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
