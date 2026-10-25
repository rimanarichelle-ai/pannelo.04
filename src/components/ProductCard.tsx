'use client';

import { useState, useEffect } from 'react';
import type { MenuItem } from '@/lib/menu-data';
import type { Translations } from '@/lib/translations';
import { CATEGORY_IMAGES } from '@/lib/category-images';
import type { AddToOrderPayload } from '@/components/OrderSelectionDrawer';
import { Flame, AlertCircle, Plus, Check } from 'lucide-react';
import Image from '@/components/Image';

interface ProductCardProps {
  item: MenuItem;
  t: Translations;
  priority?: boolean;
  productQuantity?: number;
  resetSignal?: number;
  onAddToOrder?: (payload: AddToOrderPayload) => void;
}

/**
 * Resolves a high-resolution, product-accurate photograph for every menu item.
 * Uses dedicated high-resolution product photos under /images/products/ when available,
 * and falls back to the item's matched category photograph in /images/categories/
 * (avoiding tiny legacy <170px paper-menu cutouts and never showing unrelated photos).
 */
export function resolveProductCardImage(item: MenuItem): {
  src: string;
  focalPosition: string;
} {
  const categoryAsset = CATEGORY_IMAGES[item.category];
  const hasHighResProductImage = Boolean(item.image && item.image.startsWith('/images/'));

  if (hasHighResProductImage && item.image) {
    return {
      src: item.image,
      focalPosition: 'center 50%',
    };
  }

  if (categoryAsset) {
    return {
      src: categoryAsset.src,
      focalPosition: categoryAsset.focalPosition || 'center 50%',
    };
  }

  return {
    src: item.image || '/images/categories/smash-burger.jpg',
    focalPosition: 'center 50%',
  };
}

export function ProductCard({
  item,
  t,
  priority = false,
  productQuantity = 0,
  resetSignal = 0,
  onAddToOrder,
}: ProductCardProps) {
  // Multi-size option state (e.g. Mini | Normal | Mega or M | L | XL)
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number>(() => {
    if (item.options && item.options.length > 1) {
      return 1; // Default to Normal / L
    }
    return 0;
  });

  // Bread choice state for Sandwiches (Brioche | Matlou3)
  const [selectedBread, setSelectedBread] = useState<string | null>(
    item.breadOptions && item.breadOptions.length > 0 ? item.breadOptions[0] : null
  );

  // Filling choice state for Calzon
  const [selectedFilling, setSelectedFilling] = useState<string | null>(
    item.fillingChoices && item.fillingChoices.length > 0 ? item.fillingChoices[0] : null
  );

  // Tactile micro-feedback when tapping Add button
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 750);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  // Reset temporary card option selections after order registration
  useEffect(() => {
    if (resetSignal === 0) return;
    setSelectedOptionIndex(item.options && item.options.length > 1 ? 1 : 0);
    setSelectedBread(
      item.breadOptions && item.breadOptions.length > 0 ? item.breadOptions[0] : null
    );
    setSelectedFilling(
      item.fillingChoices && item.fillingChoices.length > 0 ? item.fillingChoices[0] : null
    );
  }, [resetSignal, item.options, item.breadOptions, item.fillingChoices]);

  const selectedOption =
    item.options && item.options.length > 0 ? item.options[selectedOptionIndex] : null;

  const currentPrice = selectedOption ? selectedOption.price : (item.price ?? null);

  const categoryLabel =
    t.categories[item.category]?.tabLabel || item.category.replace(/-/g, ' ').toUpperCase();

  const { src: imageSrc, focalPosition } = resolveProductCardImage(item);

  const handleAddClick = () => {
    const variantParts: string[] = [];
    if (selectedOption) variantParts.push(selectedOption.label);
    if (selectedBread) variantParts.push(selectedBread);
    if (selectedFilling) variantParts.push(selectedFilling);

    const variantSummary = variantParts.length > 0 ? variantParts.join(' • ') : undefined;
    const selectionKey = [item.id, ...variantParts].join('::');

    onAddToOrder?.({
      key: selectionKey,
      productId: item.id,
      name: item.name,
      categoryLabel,
      imageSrc,
      unitPrice: currentPrice,
      currency: item.currency,
      selectedOptions: variantParts.length > 0 ? variantParts : undefined,
      variantSummary,
    });

    setJustAdded(true);
  };

  return (
    <article
      id={`item-${item.id}`}
      className="group relative flex flex-col h-full w-full min-w-0 p-1.5 min-[380px]:p-2 sm:p-2.5 rounded-[16px] min-[380px]:rounded-[18px] sm:rounded-[20px] bg-[var(--card-bg)] border border-[var(--border-color)] hover:border-[#C8102E]/40 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out hover:-translate-y-0.5 select-none touch-manipulation"
    >
      {/* A. Product Image — Prominent inset rounded photograph at top of card */}
      <div className="relative w-full aspect-[1/0.94] sm:aspect-square rounded-[11px] min-[380px]:rounded-[13px] sm:rounded-[14px] overflow-hidden bg-zinc-900 shrink-0">
        <Image
          src={imageSrc}
          alt={item.name}
          fill
          priority={priority}
          sizes="(max-width: 767px) 48vw, (max-width: 1023px) 32vw, 260px"
          style={{ objectPosition: focalPosition }}
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Subtle top rim gradient only where badges sit so food stays vibrant and clear */}
        {(item.popular || item.vegetarian || item.spicy) && (
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/35 to-transparent pointer-events-none" />
        )}

        {/* POPULAIRE Badge — Strictly preserved ONLY on items with item.popular === true */}
        {item.popular && (
          <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 max-w-[calc(100%-12px)] pointer-events-none">
            <span className="inline-flex items-center gap-1 max-w-full px-1.5 min-[380px]:px-2 py-0.5 rounded-full bg-[#C8102E]/95 backdrop-blur-xs text-white text-[8.5px] min-[380px]:text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-sm border border-white/15">
              <Flame className="w-2.5 h-2.5 fill-current shrink-0" />
              <span className="truncate">{t.ui.popularShort}</span>
            </span>
          </div>
        )}

        {/* Compact Dietary Badges (Végé / Piquant) when applicable */}
        {(item.vegetarian || item.spicy) && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 flex items-center gap-1 pointer-events-none">
            {item.vegetarian && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-600/95 backdrop-blur-xs text-white text-[8.5px] min-[380px]:text-[9px] font-bold shadow-xs">
                {t.ui.vegeShort}
              </span>
            )}
            {item.spicy && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-600/95 backdrop-blur-xs text-white text-[8.5px] min-[380px]:text-[9px] font-bold shadow-xs">
                {t.ui.spicyBadge}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="px-0.5 min-[380px]:px-1 sm:px-1.5 pt-2 min-[380px]:pt-2.5 pb-0.5 flex-1 flex flex-col min-w-0">
        {/* B. Product Category — Small uppercase PANNELLO red label beneath image */}
        <span className="block text-[9.5px] min-[380px]:text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#C8102E] dark:text-[#ff4460] leading-none truncate">
          {categoryLabel}
        </span>

        {/* C. Product Name — Bold modern font directly below category */}
        <h3 className="mt-1.5 font-heading font-extrabold text-[13.5px] min-[380px]:text-[14px] sm:text-[16px] leading-[1.22] tracking-tight text-[var(--text-main)] group-hover:text-[#C8102E] dark:group-hover:text-[#ff4460] transition-colors duration-150 break-words">
          {item.name}
        </h3>

        {/* D. Product Description — Smaller muted text limited to 2-3 lines */}
        {item.description && (
          <p
            title={item.description}
            className="mt-1 text-[11px] sm:text-xs text-[var(--text-secondary)] leading-[1.38] line-clamp-2 sm:line-clamp-3"
          >
            {item.description}
          </p>
        )}

        {/* Compact Existing Product Options (Sizes: Mini/Normal/Mega or M/L/XL) */}
        {item.options && item.options.length > 0 && (
          <div
            className="mt-2 flex items-stretch gap-0.5 p-0.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] min-w-0"
            role="group"
            aria-label={t.ui.formatSizeLabel}
          >
            {item.options.map((opt, idx) => {
              const isSelected = selectedOptionIndex === idx;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSelectedOptionIndex(idx)}
                  className={`grow basis-auto min-w-0 min-h-[26px] sm:min-h-[28px] px-0.5 min-[380px]:px-1 py-0.5 rounded-md text-[8.5px] min-[380px]:text-[9.5px] sm:text-[10.5px] font-extrabold uppercase tracking-tighter min-[380px]:tracking-tight text-center whitespace-nowrap truncate transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#C8102E] text-white shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Compact Bread Choice Selector (Sandwiches: Brioche / Matlou3) */}
        {item.breadOptions && item.breadOptions.length > 0 && (
          <div
            className="mt-2 grid grid-cols-2 gap-0.5 p-0.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] min-w-0"
            role="group"
            aria-label={t.ui.breadChoiceLabel}
          >
            {item.breadOptions.map((bread) => {
              const isSelected = selectedBread === bread;
              return (
                <button
                  key={bread}
                  type="button"
                  onClick={() => setSelectedBread(bread)}
                  className={`min-w-0 min-h-[26px] sm:min-h-[28px] px-1 min-[380px]:px-1.5 py-0.5 rounded-md text-[9.5px] min-[380px]:text-[10px] sm:text-[10.5px] font-bold transition-all cursor-pointer active:scale-95 truncate ${
                    isSelected
                      ? 'bg-zinc-900 dark:bg-[#C8102E] text-white shadow-2xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {bread}
                </button>
              );
            })}
          </div>
        )}

        {/* Compact Filling Choices (Calzon: 6 fillings) */}
        {item.fillingChoices && item.fillingChoices.length > 0 && (
          <div
            className="mt-2 flex flex-wrap gap-1 min-w-0"
            role="group"
            aria-label={t.ui.fillingChoiceLabel}
          >
            {item.fillingChoices.map((filling) => {
              const isSelected = selectedFilling === filling;
              return (
                <button
                  key={filling}
                  type="button"
                  onClick={() => setSelectedFilling(filling)}
                  className={`max-w-full truncate px-1.5 min-[380px]:px-2 py-0.5 rounded-md text-[9px] min-[380px]:text-[9.5px] sm:text-[10px] font-semibold border transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#C8102E]/10 border-[#C8102E] text-[#C8102E] dark:text-[#ff4460] font-bold'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-color)] text-[var(--text-secondary)]'
                  }`}
                >
                  {filling}
                </button>
              );
            })}
          </div>
        )}

        {/* E. Price & Add-to-Order Button — Bottom row with DA price left and compact dark/brand action button right */}
        <div className="mt-auto pt-2.5 sm:pt-3 flex items-center justify-between gap-1 min-[380px]:gap-1.5 min-w-0">
          <div className="min-w-0 flex-1">
            {currentPrice !== null && currentPrice !== undefined ? (
              <div className="flex items-baseline gap-1 min-w-0">
                <span className="font-heading font-black text-[14px] min-[380px]:text-[15px] sm:text-[17px] tracking-tight tabular-nums text-[var(--text-main)] leading-none whitespace-nowrap">
                  {currentPrice}
                </span>
                <span className="font-heading font-extrabold text-[10px] min-[380px]:text-[10.5px] sm:text-xs uppercase text-[#C8102E] dark:text-[#ff4460] leading-none shrink-0">
                  {t.ui.currency}
                </span>
              </div>
            ) : (
              <span
                title={item.reviewNote || t.ui.priceToConfirmBadge}
                className="flex items-center gap-1 max-w-full min-w-0 text-[9.5px] min-[380px]:text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 leading-tight"
              >
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span className="truncate">{t.ui.priceConfirmShort}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddClick}
            aria-label={`${t.ui.addToOrderAria} — ${item.name}`}
            className={`relative w-8 h-8 min-[380px]:w-9 min-[380px]:h-9 sm:w-9.5 sm:h-9.5 rounded-[10px] min-[380px]:rounded-[11px] shrink-0 flex items-center justify-center cursor-pointer active:scale-90 transition-all duration-150 ${
              justAdded || productQuantity > 0
                ? 'bg-[#C8102E] hover:bg-[#a50d25] text-white shadow-sm shadow-[#C8102E]/30'
                : 'bg-zinc-900 hover:bg-[#C8102E] text-white dark:bg-zinc-800 dark:border dark:border-white/15 dark:hover:bg-[#C8102E] dark:hover:border-[#C8102E]'
            }`}
          >
            {justAdded ? (
              <Check className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 stroke-[2.75]" />
            ) : (
              <Plus className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 stroke-[2.5]" />
            )}

            {productQuantity > 0 && (
              <span className="absolute -top-1 -right-1 min-[380px]:-top-1.5 min-[380px]:-right-1.5 min-w-[16px] h-[16px] min-[380px]:min-w-[17px] min-[380px]:h-[17px] px-1 rounded-full bg-[#FBBF24] text-zinc-950 font-heading font-black text-[9.5px] min-[380px]:text-[10px] leading-none flex items-center justify-center shadow-xs tabular-nums">
                {productQuantity}
              </span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
