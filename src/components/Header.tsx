'use client';

import { Sun, Moon, ClipboardList } from 'lucide-react';
import type { Theme } from '@/hooks/use-theme';
import type { Language, Translations } from '@/lib/translations';
import type { MenuCategory } from '@/lib/menu-data';
import { ThreeDotMenu } from '@/components/ThreeDotMenu';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  mounted: boolean;
  categories: MenuCategory[];
  activeCategoryId: string;
  onSelectCategory: (id: string) => void;
  activeOrdersCount?: number;
  onOpenOrders?: () => void;
  onMenuOpenChange?: (open: boolean) => void;
}

export function Header({
  theme,
  toggleTheme,
  language,
  setLanguage,
  t,
  mounted,
  categories,
  activeCategoryId,
  onSelectCategory,
  activeOrdersCount = 0,
  onOpenOrders,
  onMenuOpenChange,
}: HeaderProps) {
  return (
    <header className="w-full bg-[var(--header-bg)] backdrop-blur-md border-b border-[var(--border-color)] transition-colors duration-200 safe-top">
      {/* 
        Symmetrical 3-Column Grid:
        - Mobile (<768px): 44px/48px/56px side columns so the header stays uncrowded and logo stays centered
        - Tablet/Desktop (>=768px): 200px side columns holding Three-Dot Menu left & Commandes + Theme Toggle right
      */}
      <div className="max-w-6xl mx-auto px-2 xs:px-3 sm:px-6 h-16 sm:h-20 grid grid-cols-[44px_1fr_44px] xs:grid-cols-[48px_1fr_48px] sm:grid-cols-[56px_1fr_56px] md:grid-cols-[200px_1fr_200px] items-center">
        {/* 1. TOP-LEFT: Consolidated Three-Dot Menu Button (⋮) */}
        <div className="flex items-center justify-start">
          <ThreeDotMenu
            categories={categories}
            activeCategoryId={activeCategoryId}
            onSelectCategory={onSelectCategory}
            language={language}
            setLanguage={setLanguage}
            t={t}
            activeOrdersCount={activeOrdersCount}
            onOpenOrders={onOpenOrders}
            onOpenChange={onMenuOpenChange}
          />
        </div>

        {/* 2. CENTER: Prominent PANNELLO Logo with 220ms Instant Theme Crossfade */}
        <div className="flex items-center justify-center text-center px-1">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="group relative flex flex-col items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-yellow)] rounded-lg px-1 py-0.5"
            aria-label="PANNELLO - Taste The Best"
          >
            {/* Ambient Red Glow Layer directly behind the centerpiece logo */}
            <div
              className="absolute inset-0 -inset-x-4 bg-[radial-gradient(ellipse_at_center,rgba(200,16,46,0.35)_0%,rgba(200,16,46,0.12)_55%,transparent_75%)] blur-lg -z-10 opacity-80 group-hover:opacity-100 transition-opacity animate-glow-pulse pointer-events-none"
              aria-hidden="true"
            />

            {/* High-Resolution Cropped Logo (Retina-optimized, zero empty margins, scaled safely for 320px–1440px) */}
            <div className="header-logo-container relative w-[clamp(160px,46vw,240px)] sm:w-[250px] md:w-[270px] aspect-[290/74] flex items-center justify-center">
              {/* 1. Light Mode Red Logo — Preloaded & permanently mounted in DOM */}
              <img
                src="/assets/pannello_logo_red.png"
                alt="PANNELLO - TASTE THE BEST"
                width={291}
                height={74}
                loading="eager"
                decoding="sync"
                fetchPriority="high"
                className={`header-logo-image header-logo-light absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.12)] group-hover:scale-[1.02] transition-transform duration-150 ${
                  theme === 'light' ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* 2. Dark Mode White Logo — Permanently mounted in DOM for instant theme crossfade */}
              <img
                src="/assets/pannello_logo_hero.png"
                alt="PANNELLO - TASTE THE BEST"
                width={580}
                height={148}
                loading="eager"
                decoding="async"
                fetchPriority="low"
                className={`header-logo-image header-logo-dark absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_2px_10px_rgba(200,16,46,0.45)] group-hover:scale-[1.02] transition-transform duration-150 ${
                  theme === 'dark' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </a>
        </div>

        {/* 3. TOP-RIGHT: Commandes Button (md+) & Dark/Light Theme Toggle */}
        <div className="flex items-center justify-end gap-2">
          {onOpenOrders && (
            <button
              type="button"
              onClick={onOpenOrders}
              aria-label={t.ui.ordersButtonAria}
              data-testid="header-orders-btn"
              className="hidden md:inline-flex items-center gap-1.5 h-11 px-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:border-[#C8102E]/50 active:scale-95 transition-all cursor-pointer shadow-xs text-[var(--text-main)] shrink-0"
            >
              <ClipboardList className="w-4 h-4 text-[#C8102E] shrink-0" strokeWidth={2.2} />
              <span className="font-heading font-extrabold text-xs tracking-tight">
                {t.ui.ordersButtonLabel}
              </span>
              {activeOrdersCount > 0 && (
                <span
                  data-testid="header-orders-badge"
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#C8102E] text-white font-heading font-black text-[10px] leading-none tabular-nums"
                >
                  {activeOrdersCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t.ui.toggleThemeAria}
            className="flex items-center justify-center w-11 h-11 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] active:scale-95 transition-all cursor-pointer shadow-xs shrink-0"
          >
            {mounted ? (
              theme === 'dark' ? (
                <Sun className="w-5 h-5 text-[#FBBF24] transition-transform hover:rotate-45" strokeWidth={2.2} />
              ) : (
                <Moon className="w-5 h-5 text-[#C8102E] transition-transform hover:-rotate-12" strokeWidth={2.2} />
              )
            ) : (
              <div className="w-5 h-5 rounded-full bg-zinc-700/30 animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
