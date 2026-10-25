import { useState, useEffect, useLayoutEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useLanguage } from '@/hooks/use-language';
import { useOrders } from '@/hooks/use-orders';
import { Header } from '@/components/Header';
import { CategoryNavigation } from '@/components/CategoryNavigation';
import { SearchBar } from '@/components/SearchBar';
import { MenuSection } from '@/components/MenuSection';
import { ProductCard } from '@/components/ProductCard';
import type {
  OrderSelectionEntry,
  AddToOrderPayload,
} from '@/components/OrderSelectionDrawer';
import type {
  OrderedProductItem,
  RegisteredOrder,
  SaveOrderResult,
} from '@/lib/order-storage';
import { AmbientBackground } from '@/components/AmbientBackground';
import { CinematicIntro } from '@/components/CinematicIntro';
import { FooterContactSection } from '@/components/FooterContactSection';
import { MENU_CATEGORIES, MENU_ITEMS, type Supplement } from '@/lib/menu-data';
import { ArrowUp, Utensils, FileText, RotateCcw } from 'lucide-react';
import { MenuSectionSkeleton } from '@/components/Skeletons';

const OrderSelectionDrawer = lazy(() => import('@/components/OrderSelectionDrawer'));
const OrdersModal = lazy(() => import('@/components/OrdersModal'));
const DataAuditModal = lazy(() => import('@/components/DataAuditModal'));

export default function App() {
  const { theme, toggleTheme, mounted } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { orders, activeOrdersCount, createOrder, removeOrder } = useOrders();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('smash-burger');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [introReplayKey, setIntroReplayKey] = useState<number>(0);
  const [orderEntries, setOrderEntries] = useState<OrderSelectionEntry[]>([]);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<RegisteredOrder | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectionResetSignal, setSelectionResetSignal] = useState<number>(0);
  const isUserClickingRef = useRef(false);


  // Dynamic header height tracking for the fixed header spacer & scroll offset
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(112); // Fallback: mobile ~110px, desktop ~126px

  // Keep spacer height mathematically synchronized with fixed header
  useLayoutEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setHeaderHeight(Math.round(height));
        }
      }
    };

    updateHeaderHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      resizeObserver.observe(headerRef.current);
    }

    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [mounted]);

  // Normalize search helper (removes accents and punctuation)
  const normalizeText = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  // Filter products based on search query (searches names, descriptions, and both FR/EN categories)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = normalizeText(searchQuery.trim());
    return MENU_ITEMS.filter((item) => {
      const matchName = normalizeText(item.name).includes(query);
      const matchDesc = item.description ? normalizeText(item.description).includes(query) : false;
      const matchSub = item.subcategory ? normalizeText(item.subcategory).includes(query) : false;
      const matchCat = normalizeText(item.category).includes(query);

      // Also match translated category & subcategory names in active language
      const translatedCat = t.categories[item.category]?.name;
      const matchTranslatedCat = translatedCat ? normalizeText(translatedCat).includes(query) : false;
      const translatedSub = item.subcategory ? t.subcategories[item.subcategory] : undefined;
      const matchTranslatedSub = translatedSub ? normalizeText(translatedSub).includes(query) : false;

      return matchName || matchDesc || matchSub || matchCat || matchTranslatedCat || matchTranslatedSub;
    });
  }, [searchQuery, t]);

  // IntersectionObserver to update active category tab as user scrolls
  useEffect(() => {
    if (searchQuery.trim()) return; // Don't track sections during active search

    const sectionElements = MENU_CATEGORIES.map((cat) =>
      document.getElementById(`section-${cat.id}`)
    ).filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isUserClickingRef.current) return;
        // Find the topmost visible section relative to the fixed header bottom
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          visibleEntries.sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top - headerHeight) -
              Math.abs(b.boundingClientRect.top - headerHeight)
          );
          const activeSectionId = visibleEntries[0].target.id.replace('section-', '');
          setActiveCategoryId(activeSectionId);
        }
      },
      {
        rootMargin: `-${headerHeight}px 0px -40% 0px`,
        threshold: [0, 0.25, 0.5],
      }
    );

    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [searchQuery, headerHeight]);

  // Handle category tab click with smooth scroll, accounting for permanently fixed header
  const handleSelectCategory = (categoryId: string) => {
    setActiveCategoryId(categoryId);
    setSearchQuery(''); // Clear search to show full section
    isUserClickingRef.current = true;

    const targetEl = document.getElementById(`section-${categoryId}`);
    if (targetEl) {
      // Calculate scroll position accounting for the exact height of the fixed header
      const y = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight - 8;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }

    setTimeout(() => {
      isUserClickingRef.current = false;
    }, 600);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Order selection handlers for ProductCard action buttons
  const handleAddToOrder = (payload: AddToOrderPayload) => {
    setConfirmedOrder(null);
    setOrderEntries((prev) => {
      const existingIdx = prev.findIndex((entry) => entry.key === payload.key);
      if (existingIdx >= 0) {
        return prev.map((entry, idx) =>
          idx === existingIdx ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [
        ...prev,
        {
          ...payload,
          baseUnitPrice: payload.unitPrice,
          selectedSupplements: [],
          quantity: 1,
        },
      ];
    });
  };

  const handleIncrementOrder = (key: string) => {
    setOrderEntries((prev) =>
      prev.map((entry) =>
        entry.key === key ? { ...entry, quantity: entry.quantity + 1 } : entry
      )
    );
  };

  const handleDecrementOrder = (key: string) => {
    setOrderEntries((prev) => {
      const next = prev
        .map((entry) =>
          entry.key === key ? { ...entry, quantity: entry.quantity - 1 } : entry
        )
        .filter((entry) => entry.quantity > 0);
      if (next.length === 0) {
        setIsOrderDrawerOpen(false);
      }
      return next;
    });
  };

  const handleRemoveOrder = (key: string) => {
    setOrderEntries((prev) => {
      const next = prev.filter((entry) => entry.key !== key);
      if (next.length === 0) {
        setIsOrderDrawerOpen(false);
      }
      return next;
    });
  };

  const handleToggleSupplement = (entryKey: string, supplement: Supplement) => {
    setOrderEntries((prev) => {
      const targetIndex = prev.findIndex((entry) => entry.key === entryKey);
      if (targetIndex === -1) return prev;

      const target = prev[targetIndex];
      const currentSups = target.selectedSupplements ?? [];
      const exists = currentSups.some((s) => s.name === supplement.name);
      const menuItem = MENU_ITEMS.find((item) => item.id === target.productId);
      const orderLookup = new Map(
        (menuItem?.supplements ?? []).map((s, idx) => [s.name, idx])
      );

      const nextSups = (
        exists
          ? currentSups.filter((s) => s.name !== supplement.name)
          : [...currentSups, supplement]
      ).sort((a, b) => (orderLookup.get(a.name) ?? 99) - (orderLookup.get(b.name) ?? 99));

      const supsTotal = nextSups.reduce((sum, s) => sum + s.price, 0);
      const nextUnitPrice =
        target.baseUnitPrice !== null ? target.baseUnitPrice + supsTotal : null;

      const optionParts = target.selectedOptions ?? [];
      const allParts = [...optionParts, ...nextSups.map((s) => `+ ${s.name}`)];
      const nextVariantSummary = allParts.length > 0 ? allParts.join(' • ') : undefined;
      const nextKey = [
        target.productId,
        ...optionParts,
        ...nextSups.map((s) => `sup:${s.name}`),
      ].join('::');

      const duplicateIndex = prev.findIndex(
        (entry, idx) => idx !== targetIndex && entry.key === nextKey
      );

      if (duplicateIndex >= 0) {
        return prev
          .map((entry, idx) =>
            idx === duplicateIndex
              ? { ...entry, quantity: entry.quantity + target.quantity }
              : entry
          )
          .filter((_, idx) => idx !== targetIndex);
      }

      return prev.map((entry, idx) =>
        idx === targetIndex
          ? {
              ...entry,
              key: nextKey,
              unitPrice: nextUnitPrice,
              selectedSupplements: nextSups,
              variantSummary: nextVariantSummary,
            }
          : entry
      );
    });
  };

  const handleClearOrder = () => {
    setOrderEntries([]);
    setConfirmedOrder(null);
    setIsOrderDrawerOpen(false);
  };

  const handleConfirmOrder = (tableNumber: string): SaveOrderResult => {
    const orderedItems: OrderedProductItem[] = orderEntries.map((entry) => ({
      productId: entry.productId,
      name: entry.name,
      unitPrice: entry.unitPrice,
      currency: entry.currency,
      quantity: entry.quantity,
      options:
        entry.selectedOptions && entry.selectedOptions.length > 0
          ? entry.selectedOptions
          : undefined,
      supplements:
        entry.selectedSupplements && entry.selectedSupplements.length > 0
          ? entry.selectedSupplements
          : undefined,
      variantSummary: entry.variantSummary,
    }));

    const result = createOrder(tableNumber, orderedItems);

    if (result.ok) {
      setOrderEntries([]);
      setSelectionResetSignal((prev) => prev + 1);
      setConfirmedOrder(result.order);
      setIsOrderDrawerOpen(true);
    }

    return result;
  };

  const handleDismissConfirmation = () => {
    setConfirmedOrder(null);
    setIsOrderDrawerOpen(false);
  };

  const handleViewOrdersFromConfirmation = () => {
    setConfirmedOrder(null);
    setIsOrderDrawerOpen(false);
    setIsOrdersModalOpen(true);
  };

  const productQuantities = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of orderEntries) {
      counts[entry.productId] = (counts[entry.productId] ?? 0) + entry.quantity;
    }
    return counts;
  }, [orderEntries]);

  return (
    <div className="relative min-h-[100dvh] flex flex-col pannello-grid-pattern selection:bg-[#C8102E] selection:text-white overflow-x-clip">

      {/* 0. FULL-SCREEN 3-SECOND CINEMATIC RED INTRO OVERLAY (Portaled above all elements at z-[10000], unmounts cleanly when finished) */}
      {showIntro && (
        <CinematicIntro
          key={introReplayKey}
          onComplete={() => setShowIntro(false)}
          skipLabel={t.ui.skipIntro}
          forceFullMotion={introReplayKey > 0}
        />
      )}

      {/* 1. Subtle Red Floating Bubbles & Ambient Glow Layer (Background behind content) */}
      <AmbientBackground />

      {/* 2. PERMANENTLY FIXED HEADER & CATEGORY NAVIGATION CONTAINER
          - Strict position: fixed across all devices (Desktop, Tablet, Mobile, iPhone)
          - z-index: 1000
          - Never moves, slides away, fades out, or collapses
          - Opaque background with backdrop blur so content scrolling behind never bleeds through
      */}
      <div
        ref={headerRef}
        id="pannello-fixed-header-container"
        className="fixed top-0 left-0 right-0 w-full z-[1000] bg-[var(--header-bg)] backdrop-blur-md shadow-xs"
      >
        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          language={language}
          setLanguage={setLanguage}
          t={t}
          mounted={mounted}
          categories={MENU_CATEGORIES}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
          activeOrdersCount={activeOrdersCount}
          onOpenOrders={() => setIsOrdersModalOpen(true)}
        />
        <CategoryNavigation
          categories={MENU_CATEGORIES}
          activeCategoryId={activeCategoryId}
          onSelectCategory={handleSelectCategory}
          t={t}
        />
      </div>

      {/* 3. Dedicated Layout Spacer:
          Because position: fixed removes the header from document flow, this spacer
          guarantees the search bar and first category content start immediately below the header
          with 0px covered and 0px unwanted blank space.
      */}
      <div
        id="pannello-header-spacer"
        style={{ height: `${headerHeight}px` }}
        className="w-full shrink-0"
        aria-hidden="true"
      />

      {/* 4. Main Page Content (Scrolls normally underneath the permanently fixed header) */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Search Bar */}
        <div className="w-full bg-[var(--bg-main)]/85 backdrop-blur-md border-b border-[var(--border-color)]">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            resultCount={filteredItems ? filteredItems.length : undefined}
            totalCount={MENU_ITEMS.length}
            activeOrdersCount={activeOrdersCount}
            onOpenOrders={() => setIsOrdersModalOpen(true)}
            t={t}
          />
        </div>

        {/* Main Menu Body */}
        <main className="flex-1 max-w-6xl w-full min-w-0 mx-auto px-2.5 min-[380px]:px-3.5 sm:px-6 py-4">
          {!mounted ? (
            /* Shimmer Skeleton Placeholder while initial theme and data hydrate */
            <div className="space-y-4">
              <MenuSectionSkeleton cardCount={4} />
              <MenuSectionSkeleton cardCount={2} />
            </div>
          ) : filteredItems !== null ? (
            /* Search Results View */
            <div className="py-6 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-6 pb-2 border-b border-[var(--border-color)] min-w-0">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[var(--text-main)] font-heading break-words">
                    {t.ui.searchResultsHeading}
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] break-words">
                    {t.ui.forQuery} « <span className="font-bold text-[var(--brand-yellow)]">{searchQuery}</span> » ({filteredItems.length} {filteredItems.length > 1 ? t.ui.foundDishesPlural : t.ui.foundDishesSingular})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="shrink-0 whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] active:scale-95 transition-all text-[var(--text-main)] cursor-pointer"
                >
                  {t.ui.resetSearch}
                </button>
              </div>

              {filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 min-[380px]:gap-3 sm:gap-3.5 md:gap-4 lg:gap-5 w-full min-w-0">
                  {filteredItems.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      t={t}
                      productQuantity={productQuantities[item.id] ?? 0}
                      resetSignal={selectionResetSignal}
                      onAddToOrder={handleAddToOrder}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 px-4 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl my-6 shadow-xs">
                  <Utensils className="w-12 h-12 mx-auto text-[var(--text-muted)] mb-3 opacity-50" />
                  <h2 className="text-lg font-bold text-[var(--text-main)] mb-1">
                    {t.ui.noResultsTitle}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                    {t.ui.noResultsDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="px-5 py-2.5 rounded-lg bg-[#C8102E] hover:bg-[#a50d25] text-white font-bold text-sm shadow transition-all cursor-pointer font-heading active:scale-95"
                  >
                    {t.ui.viewAllMenu}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Normal Category Sections View */
            <div className="space-y-4 sm:space-y-6">
              {MENU_CATEGORIES.map((category, index) => {
                const categoryItems = MENU_ITEMS.filter((item) => item.category === category.id);
                return (
                  <MenuSection
                    key={category.id}
                    category={category}
                    items={categoryItems}
                    t={t}
                    sectionIndex={index}
                    priority={index === 0}
                    productQuantities={productQuantities}
                    resetSignal={selectionResetSignal}
                    onAddToOrder={handleAddToOrder}
                  />
                );
              })}
            </div>
          )}
        </main>

        {/* Order Selection Floating Pill, Checkout & Confirmation Drawer */}
        {(orderEntries.length > 0 || confirmedOrder !== null) && (
          <Suspense fallback={null}>
            <OrderSelectionDrawer
              entries={orderEntries}
              isOpen={isOrderDrawerOpen}
              confirmedOrder={confirmedOrder}
              onOpen={() => setIsOrderDrawerOpen(true)}
              onClose={() => setIsOrderDrawerOpen(false)}
              onIncrement={handleIncrementOrder}
              onDecrement={handleDecrementOrder}
              onRemove={handleRemoveOrder}
              onToggleSupplement={handleToggleSupplement}
              onClear={handleClearOrder}
              onConfirmOrder={handleConfirmOrder}
              onDismissConfirmation={handleDismissConfirmation}
              onViewOrders={handleViewOrdersFromConfirmation}
              t={t}
            />
          </Suspense>
        )}

        {/* Development-Only Replay Intro Control (Stripped automatically in production builds) */}
        {import.meta.env.DEV && !showIntro && (
          <button
            type="button"
            onClick={() => {
              setIntroReplayKey((prev) => prev + 1);
              setShowIntro(true);
            }}
            data-testid="dev-replay-intro"
            aria-label={t.ui.replayIntro}
            className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-4 z-[1050] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#C8102E]/60 bg-[var(--bg-surface)]/95 backdrop-blur-md text-[var(--text-main)] hover:bg-[#C8102E] hover:text-white hover:border-[#FBBF24] active:scale-95 shadow-lg text-xs font-bold font-heading transition-all cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>{t.ui.replayIntro}</span>
          </button>
        )}

        {/* Mobile Quick Scroll To Top Floating Button (with iPhone Safe Area Insets) */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={t.ui.backToTop}
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-5 z-[500] flex items-center justify-center w-12 h-12 rounded-full bg-[#C8102E] text-white shadow-xl hover:bg-[#a50d25] active:scale-90 transition-all cursor-pointer focus:outline-none border border-white/20"
        >
          <ArrowUp className="w-5 h-5" />
        </button>

        {/* Footer with Brand Identity, Delivery Contact, Official Socials & iPhone Safe Area */}
        <footer className="mt-14 border-t-2 border-[var(--border-color)] bg-[var(--bg-surface)] pt-10 pb-20 sm:pb-12 px-4 text-center transition-colors safe-bottom">
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-4">
            <div className="header-logo-container relative w-40 h-11 flex items-center justify-center">
              <img
                src="/assets/pannello_logo_red.png"
                alt="PANNELLO"
                width={291}
                height={74}
                loading="lazy"
                decoding="async"
                className={`header-logo-image header-logo-light absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-xs ${
                  theme === 'light' ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <img
                src="/assets/pannello_logo_hero.png"
                alt="PANNELLO"
                width={580}
                height={148}
                loading="lazy"
                decoding="async"
                className={`header-logo-image header-logo-dark absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-xs ${
                  theme === 'dark' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>

            <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-yellow)] font-heading">
              {t.ui.footerSlogan}
            </p>

            <p className="text-xs text-[var(--text-secondary)] max-w-md leading-relaxed">
              {t.ui.footerDesc}
            </p>

            {/* Delivery Contact Card & Verified Official Social Media Links */}
            <FooterContactSection t={t} />

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowReviewModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] underline underline-offset-4 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                {t.ui.viewAuditDoc}
              </button>
            </div>

            <div className="text-[11px] text-[var(--text-muted)] pt-4 border-t border-[var(--border-color)] w-full">
              © {new Date().getFullYear()} PANNELLO. {t.ui.allRightsReserved}
            </div>
          </div>
        </footer>

        {/* Local Registered Orders Panel ("Commandes") */}
        {isOrdersModalOpen && (
          <Suspense fallback={null}>
            <OrdersModal
              orders={orders}
              language={language}
              t={t}
              onClose={() => setIsOrdersModalOpen(false)}
              onDeleteOrder={removeOrder}
            />
          </Suspense>
        )}

        {/* Data Audit & Review Modal (Lazy-loaded & portaled to document.body at z-[1300]) */}
        {showReviewModal && (
          <Suspense fallback={null}>
            <DataAuditModal onClose={() => setShowReviewModal(false)} t={t} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
