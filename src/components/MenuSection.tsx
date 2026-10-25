'use client';

import { useRef, useState, useEffect } from 'react';
import { MENU_CATEGORIES, type MenuCategory, type MenuItem } from '@/lib/menu-data';
import type { Translations } from '@/lib/translations';
import { ProductCard } from '@/components/ProductCard';
import type { AddToOrderPayload } from '@/components/OrderSelectionDrawer';
import { AlertCircle } from 'lucide-react';

interface MenuSectionProps {
  category: MenuCategory;
  items: MenuItem[];
  t: Translations;
  sectionIndex?: number;
  priority?: boolean;
  productQuantities?: Record<string, number>;
  resetSignal?: number;
  onAddToOrder?: (payload: AddToOrderPayload) => void;
}

export function MenuSection({
  category,
  items,
  t,
  sectionIndex,
  priority = false,
  productQuantities,
  resetSignal = 0,
  onAddToOrder,
}: MenuSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isInView, setIsInView] = useState<boolean>(priority);

  // Viewport entrance detection via IntersectionObserver
  useEffect(() => {
    if (priority) return;
    const el = sectionRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.06,
        rootMargin: '0px 0px -32px 0px',
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  if (items.length === 0) return null;

  const resolvedIndex =
    sectionIndex !== undefined
      ? sectionIndex
      : Math.max(
          0,
          MENU_CATEGORIES.findIndex((c) => c.id === category.id)
        );

  const editorialNumber = String(resolvedIndex + 1).padStart(2, '0');
  const isAlternateContour = resolvedIndex % 2 === 1;

  const categoryName = t.categories[category.id]?.name || category.name;
  const categoryDesc = t.categories[category.id]?.description || category.description;
  const [leadWord, ...restWords] = categoryName.trim().split(/\s+/);
  const accentText = restWords.join(' ');

  // Subcategories (e.g. Drinks: Standard drinks / Jus naturels / Mojito; Sweets: Crêpes / Pancakes)
  const subcategories = Array.from(
    new Set(items.map((i) => i.subcategory).filter(Boolean))
  ) as string[];

  return (
    <section
      ref={sectionRef}
      id={`section-${category.id}`}
      className="scroll-mt-36 py-3 sm:py-4"
      aria-labelledby={`heading-${category.id}`}
    >
      <div
        className={`pannello-red-cloud ${
          isAlternateContour ? 'pannello-red-cloud-alt' : ''
        } transition-[opacity,transform] duration-700 ease-out will-change-transform motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100 ${
          isInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.99]'
        }`}
      >
        {/* Subtle organic cloud contour swells (layered behind main body, leaving outer tiled page background untouched) */}
        <div className="pannello-red-cloud-crest-tl" aria-hidden="true" />
        <div className="pannello-red-cloud-crest-tr" aria-hidden="true" />
        <div className="pannello-red-cloud-crest-br" aria-hidden="true" />
        <div className="pannello-red-cloud-crest-bl" aria-hidden="true" />

        <div className="pannello-red-cloud-body px-3 pt-4 pb-3.5 min-[380px]:px-4 min-[380px]:pt-5 min-[380px]:pb-4 sm:px-5 sm:pt-6 sm:pb-5 md:px-6 md:pt-7 md:pb-6 lg:px-8 lg:pt-8 lg:pb-8">
          <div className="pannello-red-cloud-glow" aria-hidden="true" />

          <div className="relative z-10 w-full min-w-0">
            {/* 1. Category Heading Inside Cloud (Light mode: white + gold on red cloud; Dark mode: high-contrast --text-main + brand red on white cloud) */}
            <div className="pannello-red-cloud-header px-0.5 sm:px-1 min-w-0">
              <div className="flex items-baseline gap-2 min-[380px]:gap-2.5 sm:gap-3.5 min-w-0">
                <span
                  className="font-serif italic text-[#FCD34D] dark:text-[#C8102E] text-base min-[380px]:text-lg sm:text-2xl leading-none select-none shrink-0 tabular-nums"
                  aria-hidden="true"
                >
                  {editorialNumber}
                </span>
                <h2
                  id={`heading-${category.id}`}
                  className="min-w-0 text-[21px] min-[380px]:text-2xl sm:text-3xl font-heading font-black tracking-tight text-white dark:text-[var(--text-main)] leading-tight text-balance break-words"
                >
                  <span>{leadWord}</span>
                  {accentText && (
                    <span className="font-serif italic font-semibold text-[#FCD34D] dark:text-[#C8102E] ml-1.5 tracking-normal">
                      {accentText}
                    </span>
                  )}
                </h2>
              </div>

              {categoryDesc && (
                <p className="mt-1.5 text-xs sm:text-sm text-rose-50/85 dark:text-[var(--text-secondary)] leading-relaxed max-w-2xl break-words">
                  {categoryDesc}
                </p>
              )}

              <div className="mt-3 mb-3.5 min-[380px]:mt-3.5 min-[380px]:mb-4 sm:mt-4 sm:mb-5 h-px w-full bg-white/15 dark:bg-zinc-900/12" />
            </div>

            {/* 2. Category Context Notes (Harmonized for legibility on red Light Mode cloud & white Dark Mode cloud) */}
            {category.id === 'sweets' && (
              <div className="pannello-red-cloud-note mb-3.5 min-[380px]:mb-4 sm:mb-5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-black/20 dark:bg-zinc-900/[0.05] border border-[#FCD34D]/30 dark:border-[#C8102E]/25 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 min-w-0">
                <span className="min-w-0 text-xs sm:text-sm font-bold text-white dark:text-[var(--text-main)] break-words">
                  {t.ui.nutellaBannerTitle}
                </span>
                <span className="text-xs font-black font-heading text-[#FCD34D] dark:text-[#C8102E] shrink-0 tabular-nums">
                  {t.ui.nutellaBannerBadge}
                </span>
              </div>
            )}

            {category.id === 'sandwiches' && (
              <div className="pannello-red-cloud-note mb-3.5 min-[380px]:mb-4 sm:mb-5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-black/20 dark:bg-zinc-900/[0.05] border border-white/15 dark:border-zinc-900/12 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 min-w-0 text-xs text-rose-50/90 dark:text-[var(--text-secondary)]">
                <span className="min-w-0 font-semibold text-white dark:text-[var(--text-main)] break-words">{t.ui.sandwichBreadBanner}</span>
                <span className="min-w-0 text-[11px] text-rose-100/80 dark:text-[var(--text-secondary)] break-words">{t.ui.sandwichSupplementsBanner}</span>
              </div>
            )}

            {category.id === 'tacos' && (
              <div className="pannello-red-cloud-note mb-3.5 min-[380px]:mb-4 sm:mb-5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-black/20 dark:bg-zinc-900/[0.05] border border-white/15 dark:border-zinc-900/12 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 min-w-0 text-xs text-rose-50/90 dark:text-[var(--text-secondary)]">
                <span className="min-w-0 font-semibold text-white dark:text-[var(--text-main)] break-words">{t.ui.tacosSizesBanner}</span>
                <span className="min-w-0 text-[11px] text-rose-100/80 dark:text-[var(--text-secondary)] break-words">{t.ui.tacosSupplementsBanner}</span>
              </div>
            )}

            {(category.id === 'pizza-sauce-rouge' || category.id === 'pizza-sauce-blanche') && (
              <div className="pannello-red-cloud-note mb-3.5 min-[380px]:mb-4 sm:mb-5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-black/20 dark:bg-zinc-900/[0.05] border border-white/15 dark:border-zinc-900/12 flex items-center justify-between gap-2 min-w-0 text-xs text-rose-50/90 dark:text-[var(--text-secondary)]">
                <span className="min-w-0 break-words">{t.ui.pizzaSizesBanner}</span>
              </div>
            )}

            {category.id === 'calzon' && (
              <div className="pannello-red-cloud-note mb-3.5 min-[380px]:mb-4 sm:mb-5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-black/25 dark:bg-zinc-900/[0.05] border border-[#FCD34D]/30 dark:border-[#C8102E]/25 flex items-start gap-2.5 min-w-0 text-xs text-rose-50/90 dark:text-[var(--text-secondary)]">
                <AlertCircle className="w-4 h-4 text-[#FCD34D] dark:text-[#C8102E] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white dark:text-[var(--text-main)] break-words">{t.ui.calzonBannerFillings}</p>
                  <p className="text-[11px] text-rose-100/80 dark:text-[var(--text-secondary)] mt-0.5 break-words">{t.ui.calzonBannerNote}</p>
                </div>
              </div>
            )}

            {/* 3. Category Product Grids (Balanced 2/3/4-column density across 320px–1440px) */}
            {subcategories.length > 0 ? (
              <div className="space-y-5 min-[380px]:space-y-6 sm:space-y-7 w-full min-w-0">
                {subcategories.map((subcat) => {
                  const subcatItems = items.filter((i) => i.subcategory === subcat);
                  const translatedSubcatTitle = t.subcategories[subcat] || subcat;

                  return (
                    <div key={subcat} className="space-y-2.5 min-[380px]:space-y-3 sm:space-y-3.5 w-full min-w-0">
                      <div className="pannello-red-cloud-subhead flex items-baseline justify-between gap-2.5 px-0.5 pb-2 border-b border-white/15 dark:border-zinc-900/12 min-w-0">
                        <h3 className="min-w-0 text-xs min-[380px]:text-sm sm:text-base font-extrabold uppercase tracking-wider text-white dark:text-[var(--text-main)] font-heading break-words">
                          {translatedSubcatTitle}
                        </h3>
                        <span className="text-[11px] sm:text-xs text-[#FCD34D]/90 dark:text-[#C8102E] font-semibold tabular-nums shrink-0">
                          {subcatItems.length}{' '}
                          {subcatItems.length > 1 ? t.ui.optionsCountPlural : t.ui.optionsCount}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6 w-full min-w-0">
                        {subcatItems.map((item) => (
                          <ProductCard
                            key={item.id}
                            item={item}
                            t={t}
                            productQuantity={productQuantities?.[item.id] ?? 0}
                            resetSignal={resetSignal}
                            onAddToOrder={onAddToOrder}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6 w-full min-w-0">
                {items.map((item, idx) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    t={t}
                    priority={priority && idx < 4}
                    productQuantity={productQuantities?.[item.id] ?? 0}
                    resetSignal={resetSignal}
                    onAddToOrder={onAddToOrder}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
