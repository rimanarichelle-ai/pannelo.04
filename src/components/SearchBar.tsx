'use client';

import { Search, X, ClipboardList } from 'lucide-react';
import type { Translations } from '@/lib/translations';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultCount?: number;
  totalCount?: number;
  activeOrdersCount?: number;
  onOpenOrders?: () => void;
  t: Translations;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  resultCount,
  totalCount,
  activeOrdersCount = 0,
  onOpenOrders,
  t,
}: SearchBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2">
      <div className="relative flex-1 min-w-0 flex items-center">
        {/* Search Icon */}
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[var(--text-muted)]">
          <Search className="w-4 h-4" />
        </div>

        {/* Input: text-base (16px) on mobile prevents iOS Safari auto-zoom on focus */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.ui.searchPlaceholder}
          aria-label={t.ui.searchAriaLabel}
          className={`w-full pl-9 sm:pl-10 ${
            searchQuery ? 'pr-10 sm:pr-24' : 'pr-3 sm:pr-24'
          } py-2.5 text-base sm:text-sm bg-[var(--bg-surface)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] rounded-xl shadow-xs focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20 transition-all outline-none`}
        />

        {/* Right side controls with iOS-friendly touch target */}
        {searchQuery ? (
          <div className="absolute right-1.5 flex items-center gap-1">
            {resultCount !== undefined && (
              <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] font-bold">
                {resultCount} {resultCount > 1 ? t.ui.foundDishesPlural : t.ui.foundDishesSingular}
              </span>
            )}
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label={t.ui.clearSearch}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 text-[var(--text-muted)] hover:text-[var(--text-main)] active:scale-90 transition-transform cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          totalCount !== undefined && (
            <div className="absolute right-3.5 hidden sm:flex items-center pointer-events-none">
              <span className="text-xs text-[var(--text-muted)] font-medium">
                {totalCount} {t.ui.recipesCount}
              </span>
            </div>
          )
        )}
      </div>

      {/* Compact Mobile "Commandes" Button (<768px) — Keeps mobile top header uncrowded while immediately visible */}
      {onOpenOrders && (
        <button
          type="button"
          onClick={onOpenOrders}
          aria-label={t.ui.ordersButtonAria}
          data-testid="mobile-orders-btn"
          className="md:hidden inline-flex items-center justify-center gap-1.5 h-[44px] px-2.5 min-[380px]:px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] hover:border-[#C8102E]/50 active:scale-95 transition-all cursor-pointer shadow-xs text-[var(--text-main)] shrink-0"
        >
          <ClipboardList className="w-4 h-4 text-[#C8102E] shrink-0" strokeWidth={2.2} />
          <span className="font-heading font-extrabold text-xs tracking-tight whitespace-nowrap">
            {t.ui.ordersButtonLabel}
          </span>
          {activeOrdersCount > 0 && (
            <span
              data-testid="mobile-orders-badge"
              className="inline-flex items-center justify-center min-w-[19px] h-[19px] px-1 rounded-full bg-[#C8102E] text-white font-heading font-black text-[10px] leading-none tabular-nums"
            >
              {activeOrdersCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
