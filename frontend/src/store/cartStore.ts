import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique cart entry ID
  gearId: string;
  name: string;
  category: string;
  pricePerDay: number;
  startDate: string;
  endDate: string;
  days: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateCartItemDates: (id: string, startDate: string, endDate: string, days: number) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addToCart: (item) => set((state) => {
        const existingIndex = state.items.findIndex(i => i.gearId === item.gearId);
        if (existingIndex > -1) {
          const newItems = [...state.items];
          newItems[existingIndex].quantity += 1;
          return { items: newItems };
        }
        return { items: [...state.items, { ...item, id: crypto.randomUUID(), quantity: 1 }] };
      }),
      removeFromCart: (id) => set((state) => ({ 
        items: state.items.filter((i) => i.id !== id) 
      })),
      updateCartItemDates: (id, startDate, endDate, days) => set((state) => ({
        items: state.items.map((i) => i.id === id ? { ...i, startDate, endDate, days } : i)
      })),
      updateCartItemQuantity: (id, quantity) => set((state) => ({
        items: state.items.map((i) => i.id === id ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'cart-storage',
    }
  )
);
