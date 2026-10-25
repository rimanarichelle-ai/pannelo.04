import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ClipboardList,
  Trash2,
  X,
  Clock,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { RegisteredOrder } from '@/lib/order-storage';
import type { Language, Translations } from '@/lib/translations';

interface OrdersModalProps {
  orders: RegisteredOrder[];
  language: Language;
  t: Translations;
  onClose: () => void;
  onDeleteOrder: (orderId: string) => boolean;
}

function formatOrderDateTime(isoString: string, language: Language): string {
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return isoString;
    const locale = language === 'en' ? 'en-GB' : 'fr-FR';
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export default function OrdersModal({
  orders,
  language,
  t,
  onClose,
  onDeleteOrder,
}: OrdersModalProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null);

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (pendingDeleteId) {
          setPendingDeleteId(null);
          setDeleteErrorId(null);
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
  }, [onClose, pendingDeleteId]);

  if (typeof document === 'undefined') return null;

  const handleConfirmDelete = (orderId: string) => {
    const ok = onDeleteOrder(orderId);
    if (ok) {
      setPendingDeleteId(null);
      setDeleteErrorId(null);
    } else {
      setDeleteErrorId(orderId);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs safe-top"
      role="dialog"
      aria-modal="true"
      aria-label={t.ui.ordersModalTitle}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-surface)] border-t sm:border border-[var(--border-color)] rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[88dvh] flex flex-col shadow-2xl overflow-hidden animate-modal-in safe-bottom"
      >
        {/* Top Brand Accent Hairline */}
        <div className="h-1 w-full bg-gradient-to-r from-[#C8102E] via-[#FBBF24] to-[#C8102E] shrink-0" />

        {/* Header */}
        <div className="px-4 py-3.5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface-elevated)] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#C8102E] text-white flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-sm uppercase tracking-tight text-[var(--text-main)] truncate">
                  {t.ui.ordersModalTitle}
                </h3>
                {orders.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#C8102E] text-white font-heading font-black text-[10px] tabular-nums shrink-0">
                    {orders.length}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">
                {t.ui.ordersModalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.ui.closeModal}
            className="w-9 h-9 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-[var(--text-main)] flex items-center justify-center cursor-pointer active:scale-95 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Local Storage Notice */}
        <div className="px-4 py-2 bg-[var(--bg-surface-elevated)]/60 border-b border-[var(--border-color)] flex items-start gap-2 text-[11px] text-[var(--text-secondary)] shrink-0">
          <Info className="w-3.5 h-3.5 text-[#C8102E] dark:text-[#FBBF24] shrink-0 mt-0.5" />
          <span className="leading-snug">{t.ui.ordersLocalDisclaimer}</span>
        </div>

        {/* Orders List or Empty State */}
        <div className="p-3.5 sm:p-4 overflow-y-auto overscroll-contain space-y-3 flex-1 no-scrollbar touch-pan-y">
          {orders.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-color)] flex items-center justify-center mx-auto mb-3 text-[var(--text-muted)]">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h4 className="font-heading font-extrabold text-sm sm:text-base text-[var(--text-main)] mb-1">
                {t.ui.ordersEmptyTitle}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
                {t.ui.ordersEmptyDesc}
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const isConfirmingDelete = pendingDeleteId === order.id;
              const hasDeleteError = deleteErrorId === order.id;
              const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

              return (
                <article
                  key={order.id}
                  data-testid={`registered-order-${order.id}`}
                  className={`rounded-2xl bg-[var(--card-bg)] border transition-colors overflow-hidden shadow-xs ${
                    isConfirmingDelete
                      ? 'border-[#C8102E] ring-2 ring-[#C8102E]/20'
                      : 'border-[var(--border-color)]'
                  }`}
                >
                  {/* Order Card Header: Prominent Table + Order ID + Status + Trash Button */}
                  <div className="px-3.5 py-2.5 bg-[var(--bg-surface-elevated)] border-b border-[var(--border-color)] flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      {/* Prominent Table Badge */}
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#C8102E] text-white font-heading font-black text-xs sm:text-sm uppercase tracking-wide shadow-2xs shrink-0">
                        {t.ui.tableOptionPrefix} {order.tableNumber}
                      </span>

                      {/* Order ID */}
                      <span className="font-mono font-bold text-[11px] sm:text-xs text-[var(--text-main)] bg-[var(--bg-surface)] px-2 py-0.5 rounded-md border border-[var(--border-color)] truncate">
                        {order.id}
                      </span>

                      {/* Status Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {order.status}
                      </span>
                    </div>

                    {/* Recognizable Trash Button beside every registered order */}
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteErrorId(null);
                        setPendingDeleteId(isConfirmingDelete ? null : order.id);
                      }}
                      aria-label={`${t.ui.orderDeleteAria} ${order.id}`}
                      data-testid={`delete-order-trigger-${order.id}`}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer active:scale-95 ${
                        isConfirmingDelete
                          ? 'bg-[#C8102E] border-[#C8102E] text-white'
                          : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#C8102E] hover:border-[#C8102E]/50 hover:bg-red-500/10'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Delete Confirmation Prompt (shown when trash button is clicked) */}
                  {isConfirmingDelete && (
                    <div
                      role="alertdialog"
                      aria-label={t.ui.orderDeleteConfirmTitle}
                      className="p-3 bg-red-500/10 border-b border-[#C8102E]/30 space-y-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-heading font-extrabold text-xs text-[var(--text-main)]">
                            {t.ui.orderDeleteConfirmTitle} ({order.id} — {t.ui.tableOptionPrefix}{' '}
                            {order.tableNumber})
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-snug">
                            {t.ui.orderDeleteConfirmDesc}
                          </p>
                          {hasDeleteError && (
                            <p className="text-[11px] font-bold text-[#C8102E] mt-1">
                              {t.ui.orderDeleteStorageError}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPendingDeleteId(null);
                            setDeleteErrorId(null);
                          }}
                          data-testid={`cancel-delete-${order.id}`}
                          className="px-3 py-1.5 min-h-[34px] rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)] text-xs font-bold text-[var(--text-main)] cursor-pointer active:scale-95 transition-colors"
                        >
                          {t.ui.orderDeleteCancel}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(order.id)}
                          data-testid={`confirm-delete-${order.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[34px] rounded-lg bg-[#C8102E] hover:bg-[#a50d25] text-white text-xs font-heading font-extrabold uppercase tracking-wide cursor-pointer active:scale-95 transition-colors shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.ui.orderDeleteConfirmAction}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Creation Timestamp */}
                  <div className="px-3.5 pt-2.5 pb-1 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {t.ui.orderCreatedAtLabel} :{' '}
                      <strong className="font-semibold text-[var(--text-secondary)]">
                        {formatOrderDateTime(order.createdAt, language)}
                      </strong>
                    </span>
                  </div>

                  {/* Ordered Products List */}
                  <div className="px-3.5 py-2 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div
                        key={`${order.id}-${item.productId}-${idx}`}
                        className="flex items-start justify-between gap-2 text-xs py-1 border-b border-[var(--border-color)]/60 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-heading font-black text-[#C8102E] dark:text-[#ff4460] tabular-nums shrink-0">
                              {item.quantity}×
                            </span>
                            <span className="font-heading font-bold text-[var(--text-main)] break-words">
                              {item.name}
                            </span>
                          </div>
                          {item.variantSummary && (
                            <p className="text-[11px] text-[var(--text-secondary)] pl-5 mt-0.5 break-words">
                              {item.variantSummary}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0 font-heading">
                          {item.unitPrice !== null ? (
                            <div>
                              <span className="font-black text-xs text-[var(--text-main)] tabular-nums">
                                {item.unitPrice * item.quantity} {item.currency}
                              </span>
                              {item.quantity > 1 && (
                                <span className="block text-[10px] text-[var(--text-muted)] tabular-nums">
                                  {item.unitPrice} {item.currency} / u
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {t.ui.priceConfirmShort}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total Footer */}
                  <div className="px-3.5 py-2.5 bg-[var(--bg-surface-elevated)]/70 border-t border-[var(--border-color)] flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      {t.ui.orderTotalLabel} ({totalQuantity}{' '}
                      {totalQuantity > 1 ? t.ui.orderBarItemsPlural : t.ui.orderBarItemsSingular})
                    </span>

                    <div className="text-right font-heading">
                      {order.totalAmount > 0 && (
                        <span className="text-sm sm:text-base font-black text-[var(--text-main)] tabular-nums">
                          {order.totalAmount}{' '}
                          <span className="text-xs text-[#C8102E] dark:text-[#ff4460]">
                            {order.currency}
                          </span>
                        </span>
                      )}
                      {order.hasUnconfirmedPrice && (
                        <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {order.totalAmount > 0
                            ? t.ui.orderPlusUnconfirmed
                            : t.ui.priceToConfirmBadge}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Footer Close Button */}
        <div className="p-3.5 border-t border-[var(--border-color)] bg-[var(--bg-surface-elevated)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-[#C8102E] hover:bg-[#C8102E] dark:hover:bg-[#a50d25] text-white font-heading font-extrabold text-xs uppercase tracking-wider shadow-sm transition-colors cursor-pointer active:scale-[0.99]"
          >
            {t.ui.closeModal}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
