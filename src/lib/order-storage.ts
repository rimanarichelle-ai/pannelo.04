export type OrderStatus = 'Nouveau';

export interface OrderedItemSupplement {
  name: string;
  price: number;
}

export interface OrderedProductItem {
  productId: string;
  name: string;
  unitPrice: number | null;
  currency: 'DA';
  quantity: number;
  options?: string[];
  supplements?: OrderedItemSupplement[];
  variantSummary?: string;
}

export interface RegisteredOrder {
  id: string;
  tableNumber: string;
  createdAt: string;
  items: OrderedProductItem[];
  totalAmount: number;
  hasUnconfirmedPrice?: boolean;
  currency: 'DA';
  status: OrderStatus;
}

export type SaveOrderErrorReason = 'missing_table' | 'empty_cart' | 'storage_error';

export type SaveOrderResult =
  | {
      ok: true;
      order: RegisteredOrder;
      orders: RegisteredOrder[];
    }
  | {
      ok: false;
      reason: SaveOrderErrorReason;
    };

/**
 * Simple configurable table list for PANNELLO.
 * Adjust DEFAULT_TABLE_COUNT or replace entries if physical table numbering changes.
 */
export const DEFAULT_TABLE_COUNT = 20;
export const RESTAURANT_TABLES: readonly string[] = Array.from(
  { length: DEFAULT_TABLE_COUNT },
  (_, index) => String(index + 1)
);

export const ORDERS_STORAGE_KEY = 'pannello_local_orders_v1';
export const ORDERS_CHANGE_EVENT = 'pannello-orders-change';

function isValidSupplement(raw: unknown): raw is OrderedItemSupplement {
  if (!raw || typeof raw !== 'object') return false;
  const candidate = raw as Record<string, unknown>;
  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.price === 'number' &&
    Number.isFinite(candidate.price) &&
    candidate.price >= 0
  );
}

function isValidOrderedProductItem(raw: unknown): raw is OrderedProductItem {
  if (!raw || typeof raw !== 'object') return false;
  const item = raw as Record<string, unknown>;

  if (typeof item.productId !== 'string' || item.productId.trim().length === 0) {
    return false;
  }
  if (typeof item.name !== 'string' || item.name.trim().length === 0) {
    return false;
  }
  if (
    item.unitPrice !== null &&
    (typeof item.unitPrice !== 'number' || !Number.isFinite(item.unitPrice) || item.unitPrice < 0)
  ) {
    return false;
  }
  if (
    typeof item.quantity !== 'number' ||
    !Number.isInteger(item.quantity) ||
    item.quantity < 1
  ) {
    return false;
  }
  if (
    item.options !== undefined &&
    (!Array.isArray(item.options) || !item.options.every((opt) => typeof opt === 'string'))
  ) {
    return false;
  }
  if (
    item.supplements !== undefined &&
    (!Array.isArray(item.supplements) || !item.supplements.every(isValidSupplement))
  ) {
    return false;
  }

  return true;
}

function normalizeRegisteredOrder(raw: unknown): RegisteredOrder | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (typeof obj.id !== 'string' || obj.id.trim().length === 0) return null;

  const tableNumber =
    typeof obj.tableNumber === 'string'
      ? obj.tableNumber.trim()
      : typeof obj.tableNumber === 'number' && Number.isFinite(obj.tableNumber)
        ? String(obj.tableNumber)
        : '';

  if (!tableNumber) return null;

  if (typeof obj.createdAt !== 'string' || Number.isNaN(Date.parse(obj.createdAt))) {
    return null;
  }

  if (!Array.isArray(obj.items) || obj.items.length === 0) return null;
  const validItems = obj.items.filter(isValidOrderedProductItem).map((item) => ({
    productId: item.productId,
    name: item.name,
    unitPrice: item.unitPrice,
    currency: 'DA' as const,
    quantity: item.quantity,
    options: item.options && item.options.length > 0 ? item.options : undefined,
    supplements: item.supplements && item.supplements.length > 0 ? item.supplements : undefined,
    variantSummary:
      typeof item.variantSummary === 'string' && item.variantSummary.trim().length > 0
        ? item.variantSummary.trim()
        : undefined,
  }));

  if (validItems.length === 0) return null;

  const calculatedTotal = validItems.reduce(
    (sum, item) => sum + (item.unitPrice !== null ? item.unitPrice * item.quantity : 0),
    0
  );
  const totalAmount =
    typeof obj.totalAmount === 'number' && Number.isFinite(obj.totalAmount) && obj.totalAmount >= 0
      ? obj.totalAmount
      : calculatedTotal;

  const hasUnconfirmedPrice = validItems.some((item) => item.unitPrice === null);

  return {
    id: obj.id.trim(),
    tableNumber,
    createdAt: obj.createdAt,
    items: validItems,
    totalAmount,
    hasUnconfirmedPrice: hasUnconfirmedPrice || Boolean(obj.hasUnconfirmedPrice),
    currency: 'DA',
    status: 'Nouveau',
  };
}

/**
 * Safely reads and validates locally stored orders from localStorage.
 * Never throws even if browser storage is blocked, missing, or corrupted.
 */
export function loadRegisteredOrders(): RegisteredOrder[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validated: RegisteredOrder[] = [];
    const seenIds = new Set<string>();

    for (const item of parsed) {
      const normalized = normalizeRegisteredOrder(item);
      if (normalized && !seenIds.has(normalized.id)) {
        seenIds.add(normalized.id);
        validated.push(normalized);
      }
    }

    return validated;
  } catch {
    return [];
  }
}

/**
 * Generates a compact, readable, collision-resistant local Order ID.
 */
export function generateUniqueOrderId(existingOrders: RegisteredOrder[] = []): string {
  const existingIds = new Set(existingOrders.map((order) => order.id));
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 25; attempt++) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    let randomSuffix = '';
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const randomBytes = new Uint8Array(4);
      crypto.getRandomValues(randomBytes);
      for (let i = 0; i < 4; i++) {
        randomSuffix += alphabet[randomBytes[i] % alphabet.length];
      }
    } else {
      for (let i = 0; i < 4; i++) {
        randomSuffix += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }

    const candidate = `CMD-${hh}${mm}-${randomSuffix}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  return `CMD-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

function persistOrdersList(orders: RegisteredOrder[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const serialized = JSON.stringify(orders);
    window.localStorage.setItem(ORDERS_STORAGE_KEY, serialized);
    const verify = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    if (verify !== serialized) {
      return false;
    }
    window.dispatchEvent(new Event(ORDERS_CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates and persists a new local order without overwriting previous orders.
 */
export function registerLocalOrder(
  params: {
    tableNumber: string;
    items: OrderedProductItem[];
  },
  fallbackCurrentOrders: RegisteredOrder[] = []
): SaveOrderResult {
  const cleanTable = params.tableNumber.trim();
  if (!cleanTable) {
    return { ok: false, reason: 'missing_table' };
  }

  const validItems = params.items.filter(isValidOrderedProductItem);
  if (validItems.length === 0) {
    return { ok: false, reason: 'empty_cart' };
  }

  // Merge stored orders with in-memory orders by ID so no existing order is ever lost
  const storedOrders = loadRegisteredOrders();
  const mergedExisting: RegisteredOrder[] = [...storedOrders];
  const seenIds = new Set(storedOrders.map((o) => o.id));
  for (const memOrder of fallbackCurrentOrders) {
    if (!seenIds.has(memOrder.id)) {
      seenIds.add(memOrder.id);
      mergedExisting.push(memOrder);
    }
  }

  const totalAmount = validItems.reduce(
    (sum, item) => sum + (item.unitPrice !== null ? item.unitPrice * item.quantity : 0),
    0
  );
  const hasUnconfirmedPrice = validItems.some((item) => item.unitPrice === null);

  const newOrder: RegisteredOrder = {
    id: generateUniqueOrderId(mergedExisting),
    tableNumber: cleanTable,
    createdAt: new Date().toISOString(),
    items: validItems,
    totalAmount,
    hasUnconfirmedPrice,
    currency: 'DA',
    status: 'Nouveau',
  };

  const nextOrders = [newOrder, ...mergedExisting];
  const saved = persistOrdersList(nextOrders);

  if (!saved) {
    return { ok: false, reason: 'storage_error' };
  }

  return {
    ok: true,
    order: newOrder,
    orders: nextOrders,
  };
}

/**
 * Deletes only the specified order ID from localStorage and returns the updated list.
 */
export function deleteLocalOrder(
  orderId: string,
  fallbackCurrentOrders: RegisteredOrder[] = []
): { ok: boolean; orders: RegisteredOrder[] } {
  const storedOrders = loadRegisteredOrders();
  const baseOrders = storedOrders.length > 0 ? storedOrders : fallbackCurrentOrders;
  const nextOrders = baseOrders.filter((order) => order.id !== orderId);

  const saved = persistOrdersList(nextOrders);
  if (!saved) {
    return { ok: false, orders: baseOrders };
  }

  return { ok: true, orders: nextOrders };
}
