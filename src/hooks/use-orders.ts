import { useState, useEffect, useCallback } from 'react';
import {
  loadRegisteredOrders,
  registerLocalOrder,
  deleteLocalOrder,
  ORDERS_STORAGE_KEY,
  ORDERS_CHANGE_EVENT,
  type OrderedProductItem,
  type RegisteredOrder,
  type SaveOrderResult,
} from '@/lib/order-storage';

export function useOrders() {
  const [orders, setOrders] = useState<RegisteredOrder[]>(() => loadRegisteredOrders());

  // Synchronize React state with localStorage changes (same tab & cross-tab)
  useEffect(() => {
    const syncFromStorage = () => {
      setOrders(loadRegisteredOrders());
    };

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === null || event.key === ORDERS_STORAGE_KEY) {
        syncFromStorage();
      }
    };

    syncFromStorage();
    window.addEventListener(ORDERS_CHANGE_EVENT, syncFromStorage);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(ORDERS_CHANGE_EVENT, syncFromStorage);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  const createOrder = useCallback(
    (tableNumber: string, items: OrderedProductItem[]): SaveOrderResult => {
      const result = registerLocalOrder({ tableNumber, items }, orders);
      if (result.ok) {
        setOrders(result.orders);
      }
      return result;
    },
    [orders]
  );

  const removeOrder = useCallback(
    (orderId: string): boolean => {
      const result = deleteLocalOrder(orderId, orders);
      if (result.ok) {
        setOrders(result.orders);
      }
      return result.ok;
    },
    [orders]
  );

  return {
    orders,
    activeOrdersCount: orders.length,
    createOrder,
    removeOrder,
  };
}
