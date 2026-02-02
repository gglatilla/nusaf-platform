'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Generate a simple session ID for guest tracking
function generateSessionId(): string {
  return `guest-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export interface GuestQuoteItem {
  productId: string;
  nusafSku: string;
  description: string;
  quantity: number;
}

interface GuestQuoteState {
  items: GuestQuoteItem[];
  sessionId: string;
}

interface GuestQuoteActions {
  addItem: (item: Omit<GuestQuoteItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearBasket: () => void;
  getItemCount: () => number;
  getTotalQuantity: () => number;
}

type GuestQuoteStore = GuestQuoteState & GuestQuoteActions;

const initialState: GuestQuoteState = {
  items: [],
  sessionId: '',
};

export const useGuestQuoteStore = create<GuestQuoteStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      sessionId: generateSessionId(),

      addItem: (item, quantity = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.productId === item.productId);

        if (existingIndex >= 0) {
          // Update quantity if item exists
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + quantity,
          };
          set({ items: updatedItems });
        } else {
          // Add new item
          set({
            items: [
              ...items,
              {
                ...item,
                quantity,
              },
            ],
          });
        }
      },

      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter((i) => i.productId !== productId) });
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          set({ items: items.filter((i) => i.productId !== productId) });
        } else {
          const updatedItems = items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          );
          set({ items: updatedItems });
        }
      },

      clearBasket: () => {
        set({ items: [], sessionId: generateSessionId() });
      },

      getItemCount: () => {
        return get().items.length;
      },

      getTotalQuantity: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'nusaf-guest-quote',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        sessionId: state.sessionId,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Guest quote store hydration error:', error);
          }
          // Generate new session ID if not present after hydration
          if (state && !state.sessionId) {
            state.sessionId = generateSessionId();
          }
        };
      },
    }
  )
);

// Helper hook to check hydration status
export const useGuestQuoteHydrated = () => {
  if (typeof window === 'undefined') return false;
  return useGuestQuoteStore.persist?.hasHydrated() ?? false;
};
