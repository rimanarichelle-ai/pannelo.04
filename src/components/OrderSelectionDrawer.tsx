import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Check,
} from 'lucide-react';
import { MENU_ITEMS, type Supplement } from '@/lib/menu-data';
import {
  RESTAURANT_TABLES,
  type RegisteredOrder,
  type SaveOrderResult,
} from '@/lib/order-storage';
import type { Translations } from '@/lib/translations';

export interface OrderSelectionEntry {
  key: string;
  productId: string;
  name: string;
  categoryLabel: string;
  imageSrc: string;
  baseUnitPrice: number | null;
  unitPrice: number | null;
  currency: 'DA';
  selectedOptions?: string[];
  selectedSupplements?: Supplement[];
  variantSummary?: string;
  quantity: number;
}

export interface AddToOrderPayload {
  key: string;
  productId: string;
  name: string;
  categoryLabel: string;
  imageSrc: string;
  unitPrice: number | null;
  currency: 'DA';
  selectedOptions?: string[];
  variantSummary?: string;
}

interface OrderSelectionDrawerProps {
  entries: OrderSelectionEntry[];
  isOpen: boolean;
  confirmedOrder: RegisteredOrder | null;
  onOpen: () => void;
  onClose: () => void;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onRemove: (key: string) => void;
  onToggleSupplement: (key: string, supplement: Supplement) => void;
  onClear: () => void;
  onConfirmOrder: (tableNumber: string) => SaveOrderResult;
  onDismissConfirmation: () => void;
  onViewOrders: () => void;
  t: Translations;
}

export function OrderSelectionDrawer({
  entries,
  isOpen,
  confirmedOrder,
  onOpen,
  onClose,
  onIncrement,
  onDecrement,
  onRemove,
  onToggleSupplement,
  onClear,
  onConfirmOrder,
  onDismissConfirmation,
  onViewOrders,
  t,
}: OrderSelectionDrawerProps) {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableError, setTableError] = useState<boolean>(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  const tableSelectRef = useRef<HTMLSelectElement>(null);

  const totalCount = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  const confirmedTotal = entries.reduce(
    (sum, entry) => sum + (entry.unitPrice !== null ? entry.unitPrice * entry.quantity : 0),
    0
  );
  const hasUnconfirmedPrice = entries.some((entry) => entry.unitPrice === null);

  const hasItems = totalCount > 0;
  const showConfirmationView = !hasItems && confirmedOrder !== null;
  const shouldShowModal = isOpen && (hasItems || showConfirmationView);

  // Reset temporary checkout state whenever cart empties
  useEffect(() => {
    if (!hasItems) {
      setSelectedTable('');
      setTableError(false);
      setStorageError(null);
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [hasItems]);

  // Close drawer automatically if open with neither cart items nor a confirmation screen
  useEffect(() => {
    if (isOpen && !hasItems && !confirmedOrder) {
      onClose();
    }
  }, [isOpen, hasItems, confirmedOrder, onClose]);

  useEffect(() => {
    if (!shouldShowModal) return;

    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmationView) {
          onDismissConfirmation();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [shouldShowModal, showConfirmationView, onDismissConfirmation, onClose]);

  if (!hasItems && !showConfirmationView) return null;

  const handleConfirmClick = () => {
    if (isSubmittingRef.current || !hasItems) return;

    if (!selectedTable.trim()) {
      setTableError(true);
      setStorageError(null);
      tableSelectRef.current?.focus();
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setTableError(false);
    setStorageError(null);

    const result = onConfirmOrder(selectedTable.trim());

    if (!result.ok) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      if (result.reason === 'missing_table') {
        setTableError(true);
        tableSelectRef.current?.focus();
      } else if (result.reason === 'storage_error') {
        setStorageError(t.ui.orderStorageError);
      }
      return;
    }

    // Order succeeded: cart will be cleared by parent and confirmation view will display
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };

  const handleBackdropOrClose = () => {
    if (showConfirmationView) {
      onDismissConfirmation();
    } else {
      onClose();
    }
  };

  return (
    <>
      {/* Compact Floating Order Pill (Shown only while active cart has items) */}
      {hasItems && (
        <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-[600] w-[calc(100vw-1.5rem)] sm:w-auto sm:min-w-[300px] max-w-sm pointer-events-none flex justify-center">
          <button
            type="button"
            onClick={onOpen}
            data-testid="floating-cart-pill"
            className="pointer-events-auto w-full flex items-center justify-between gap-3 pl-3 pr-3.5 py-2.5 rounded-2xl bg-zinc-950/95 dark:bg-[#C8102E] text-white border border-white/15 shadow-xl shadow-black/35 backdrop-blur-md hover:bg-[#C8102E] dark:hover:bg-[#a50d25] active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="inline-flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-lg bg-[#C8102E] dark:bg-zinc-950 text-white text-xs font-black font-heading tabular-nums shrink-0">
                {totalCount}
              </span>
              <span className="text-xs font-bold truncate">{t.ui.orderBarView}</span>
            </div>

            <div className="flex items-baseline gap-1 shrink-0 font-heading">
              {confirmedTotal > 0 ? (
                <>
                  <span className="text-sm font-black tabular-nums">{confirmedTotal}</span>
                  <span className="text-[11px] font-extrabold text-[#FBBF24]">{t.ui.currency}</span>
                </>
              ) : (
                <span className="text-[11px] font-bold text-[#FBBF24]">
                  {t.ui.priceConfirmShort}
                </span>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Slide-Up / Centered Order Summary & Confirmation Modal */}
      {shouldShowModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[1300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs safe-top"
            role="dialog"
            aria-modal="true"
            aria-label={showConfirmationView ? t.ui.orderSuccessTitle : t.ui.orderDrawerTitle}
            onClick={handleBackdropOrClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-surface)] border-t sm:border border-[var(--border-color)] rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden animate-modal-in safe-bottom"
            >
              {showConfirmationView && confirmedOrder ? (
                /* =========================================================
                   POST-REGISTRATION CONFIRMATION VIEW
                   ========================================================= */
                <div className="p-5 sm:p-6 flex flex-col items-center text-center space-y-4 overflow-y-auto">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-8 h-8" strokeWidth={2.2} />
                  </div>

                  <div className="space-y-1">
                    <h3
                      data-testid="order-confirmation-heading"
                      className="font-heading font-black text-base sm:text-lg uppercase tracking-tight text-[var(--text-main)]"
                    >
                      {t.ui.orderSuccessTitle}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
                      {t.ui.orderSuccessLocalNote}
                    </p>
                  </div>

                  {/* New Order ID & Table Summary Card */}
                  <div className="w-full rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] p-3.5 space-y-2.5 text-left">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-color)]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        {t.ui.tableSelectorLabel}
                      </span>
                      <span
                        data-testid="confirmed-order-table"
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#C8102E] text-white font-heading font-black text-xs uppercase tracking-wide"
                      >
                        {t.ui.tableOptionPrefix} {confirmedOrder.tableNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        {t.ui.orderIdLabel}
                      </span>
                      <span
                        data-testid="confirmed-order-id"
                        className="font-mono font-bold text-xs text-[var(--text-main)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-md border border-[var(--border-color)]"
                      >
                        {confirmedOrder.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        {t.ui.orderStatusLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-extrabold uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {confirmedOrder.status}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        {t.ui.orderTotalLabel}
                      </span>
                      <div className="text-right font-heading">
                        {confirmedOrder.totalAmount > 0 && (
                          <span className="text-base font-black text-[var(--text-main)] tabular-nums">
                            {confirmedOrder.totalAmount}{' '}
                            <span className="text-xs text-[#C8102E] dark:text-[#ff4460]">
                              {confirmedOrder.currency}
                            </span>
                          </span>
                        )}
                        {confirmedOrder.hasUnconfirmedPrice && (
                          <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {confirmedOrder.totalAmount > 0
                              ? t.ui.orderPlusUnconfirmed
                              : t.ui.priceToConfirmBadge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onViewOrders}
                      data-testid="confirmation-view-orders-btn"
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-elevated)] hover:border-[#C8102E]/50 text-xs font-heading font-extrabold text-[var(--text-main)] transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <ClipboardList className="w-4 h-4 text-[#C8102E]" />
                      <span>{t.ui.orderViewAllOrders}</span>
                    </button>

                    <button
                      type="button"
                      onClick={onDismissConfirmation}
                      data-testid="confirmation-back-to-menu-btn"
                      className="py-2.5 px-4 rounded-xl bg-[#C8102E] hover:bg-[#a50d25] text-white font-heading font-extrabold text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      {t.ui.orderBackToMenu}
                    </button>
                  </div>
                </div>
              ) : (
                /* =========================================================
                   ACTIVE SHOPPING CART & TABLE CHECKOUT VIEW
                   ========================================================= */
                <>
                  {/* Header */}
                  <div className="px-4 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface-elevated)] shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-[#C8102E] text-white flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading font-black text-sm uppercase tracking-tight text-[var(--text-main)] truncate">
                          {t.ui.orderDrawerTitle}
                        </h3>
                        <p className="text-[11px] text-[var(--text-secondary)] truncate">
                          {t.ui.orderDrawerSubtitle}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label={t.ui.closeModal}
                      className="w-8 h-8 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] flex items-center justify-center cursor-pointer active:scale-95 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 overflow-y-auto overscroll-contain space-y-2.5 flex-1 min-h-[120px] no-scrollbar">
                    {entries.map((entry) => {
                      const menuItem = MENU_ITEMS.find((m) => m.id === entry.productId);
                      const availableSupplements = menuItem?.supplements;

                      return (
                        <div
                          key={entry.key}
                          className="p-2.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-color)] space-y-2"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={entry.imageSrc}
                              alt={entry.name}
                              loading="lazy"
                              decoding="async"
                              className="w-14 h-14 rounded-xl object-cover shrink-0 bg-zinc-900"
                            />

                            <div className="flex-1 min-w-0">
                              <span className="block text-[9.5px] font-extrabold uppercase tracking-wider text-[#C8102E] dark:text-[#ff4460] truncate">
                                {entry.categoryLabel}
                              </span>
                              <h4 className="font-heading font-extrabold text-xs sm:text-sm text-[var(--text-main)] leading-tight truncate">
                                {entry.name}
                              </h4>
                              {entry.variantSummary && (
                                <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                                  {entry.variantSummary}
                                </p>
                              )}
                              <div className="mt-1">
                                {entry.unitPrice !== null ? (
                                  <span className="font-heading font-black text-xs sm:text-sm text-[var(--text-main)] tabular-nums">
                                    {entry.unitPrice * entry.quantity}{' '}
                                    <span className="text-[10px] text-[#C8102E] dark:text-[#ff4460]">
                                      {entry.currency}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="w-3 h-3 shrink-0" />
                                    {t.ui.priceToConfirmBadge}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  entry.quantity === 1
                                    ? onRemove(entry.key)
                                    : onDecrement(entry.key)
                                }
                                aria-label={
                                  entry.quantity === 1
                                    ? t.ui.orderRemoveAria
                                    : t.ui.orderDecreaseAria
                                }
                                className="w-7 h-7 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-elevated)] text-[var(--text-main)] hover:border-[#C8102E] flex items-center justify-center cursor-pointer active:scale-90 transition-colors"
                              >
                                {entry.quantity === 1 ? (
                                  <Trash2 className="w-3.5 h-3.5 text-[#C8102E]" />
                                ) : (
                                  <Minus className="w-3.5 h-3.5" />
                                )}
                              </button>

                              <span className="min-w-[22px] text-center font-heading font-black text-xs text-[var(--text-main)] tabular-nums">
                                {entry.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => onIncrement(entry.key)}
                                aria-label={t.ui.orderIncreaseAria}
                                className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-[#C8102E] text-white hover:bg-[#C8102E] flex items-center justify-center cursor-pointer active:scale-90 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Optional Menu Supplements (only where MENU_ITEMS defines supplements) */}
                          {availableSupplements && availableSupplements.length > 0 && (
                            <div className="pt-1.5 border-t border-[var(--border-color)]/60 flex flex-wrap items-center gap-1">
                              <span className="text-[10px] font-bold text-[var(--text-muted)] mr-0.5">
                                {t.ui.supplementsToggleLabel}
                              </span>
                              {availableSupplements.map((sup) => {
                                const isSelected = Boolean(
                                  entry.selectedSupplements?.some((s) => s.name === sup.name)
                                );
                                return (
                                  <button
                                    key={sup.name}
                                    type="button"
                                    onClick={() => onToggleSupplement(entry.key, sup)}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer active:scale-95 ${
                                      isSelected
                                        ? 'bg-[#C8102E] border-[#C8102E] text-white'
                                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-main)]'
                                    }`}
                                  >
                                    {isSelected ? (
                                      <Check className="w-2.5 h-2.5 shrink-0" strokeWidth={3} />
                                    ) : (
                                      <span>+</span>
                                    )}
                                    <span>
                                      {sup.name} (+{sup.price} {entry.currency})
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Table Selector + Order Summary + Confirm Footer */}
                  <div className="p-3.5 sm:p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface-elevated)] space-y-3 shrink-0">
                    {/* Mandatory Table Number Selector */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <label
                          htmlFor="pannello-table-selector"
                          className="text-xs font-heading font-extrabold uppercase tracking-wide text-[var(--text-main)]"
                        >
                          {t.ui.tableSelectorLabel} <span className="text-[#C8102E]">*</span>
                        </label>
                        {!selectedTable ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25">
                            {t.ui.tableRequiredBadge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-heading font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#C8102E] text-white">
                            {t.ui.tableOptionPrefix} {selectedTable}
                          </span>
                        )}
                      </div>

                      <div className="relative">
                        <select
                          ref={tableSelectRef}
                          id="pannello-table-selector"
                          data-testid="table-number-select"
                          value={selectedTable}
                          onChange={(e) => {
                            setSelectedTable(e.target.value);
                            if (e.target.value) {
                              setTableError(false);
                            }
                            setStorageError(null);
                          }}
                          aria-invalid={tableError}
                          className={`w-full h-11 pl-3.5 pr-9 rounded-xl bg-[var(--bg-surface)] text-base sm:text-sm font-heading font-bold text-[var(--text-main)] border appearance-none cursor-pointer transition-all outline-none ${
                            tableError
                              ? 'border-[#C8102E] ring-2 ring-[#C8102E]/25'
                              : selectedTable
                                ? 'border-[#C8102E]/60 focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20'
                                : 'border-[var(--border-color)] focus:border-[#C8102E] focus:ring-2 focus:ring-[#C8102E]/20'
                          }`}
                        >
                          <option value="">{t.ui.tableSelectorPlaceholder}</option>
                          {RESTAURANT_TABLES.map((tableNum) => (
                            <option key={tableNum} value={tableNum}>
                              {t.ui.tableOptionPrefix} {tableNum}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-[var(--text-muted)] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                      </div>

                      {tableError && (
                        <p
                          role="alert"
                          data-testid="table-validation-error"
                          className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-[#C8102E] dark:text-[#ff4460]"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.ui.tableValidationError}</span>
                        </p>
                      )}
                    </div>

                    {/* Storage Error Alert (if localStorage fails) */}
                    {storageError && (
                      <div
                        role="alert"
                        data-testid="order-storage-error"
                        className="p-2.5 rounded-xl bg-red-500/10 border border-[#C8102E]/40 flex items-start gap-2 text-xs font-bold text-[#C8102E] dark:text-[#ff4460]"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{storageError}</span>
                      </div>
                    )}

                    {/* Order Summary: Selected Table + Total */}
                    <div className="pt-2 border-t border-[var(--border-color)] space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[var(--text-secondary)]">
                          {t.ui.summaryTableLabel}
                        </span>
                        <span
                          data-testid="summary-selected-table"
                          className={`font-heading font-extrabold ${
                            selectedTable
                              ? 'text-[#C8102E] dark:text-[#FBBF24]'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {selectedTable
                            ? `${t.ui.tableOptionPrefix} ${selectedTable}`
                            : t.ui.summaryTableMissing}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          {t.ui.orderTotalLabel} ({totalCount}{' '}
                          {totalCount > 1
                            ? t.ui.orderBarItemsPlural
                            : t.ui.orderBarItemsSingular}
                          )
                        </span>
                        <div className="text-right font-heading">
                          {confirmedTotal > 0 && (
                            <span className="text-lg font-black text-[var(--text-main)] tabular-nums">
                              {confirmedTotal}{' '}
                              <span className="text-xs text-[#C8102E] dark:text-[#ff4460]">
                                {t.ui.currency}
                              </span>
                            </span>
                          )}
                          {hasUnconfirmedPrice && (
                            <span className="block text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              {confirmedTotal > 0
                                ? t.ui.orderPlusUnconfirmed
                                : t.ui.priceToConfirmBadge}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Clear Cart vs Confirm Order */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClear();
                          onClose();
                        }}
                        disabled={isSubmitting}
                        className="px-3 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-red-500/10 hover:border-[#C8102E]/40 text-xs font-bold text-[var(--text-secondary)] hover:text-[#C8102E] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {t.ui.orderClearAll}
                      </button>

                      <button
                        type="button"
                        onClick={handleConfirmClick}
                        disabled={isSubmitting}
                        data-testid="confirm-order-btn"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#C8102E] hover:bg-[#a50d25] text-white font-heading font-extrabold text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? t.ui.confirmingOrderButton : t.ui.confirmOrderButton}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default OrderSelectionDrawer;
