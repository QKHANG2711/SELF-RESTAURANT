import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, RestaurantTable } from '../types';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  selectedTable: RestaurantTable | null;
  setSelectedTable: (table: RestaurantTable | null) => void;
  cartItems: CartItem[];
  addToCart: (item: MenuItem, quantity?: number, notes?: string) => void;
  updateQuantity: (menuItemId: string, delta: number) => void;
  removeFromCart: (menuItemId: string) => void;
  updateItemNotes: (menuItemId: string, notes: string) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(() => {
    const saved = localStorage.getItem('self_rest_table');
    return saved ? JSON.parse(saved) : null;
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('self_rest_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (selectedTable) {
      localStorage.setItem('self_rest_table', JSON.stringify(selectedTable));
    } else {
      localStorage.removeItem('self_rest_table');
    }
  }, [selectedTable]);

  useEffect(() => {
    localStorage.setItem('self_rest_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: MenuItem, quantity = 1, notes = '') => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id
            ? { ...i, quantity: i.quantity + quantity, notes: notes || i.notes }
            : i
        );
      }
      return [...prev, { menuItem: item, quantity, notes }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCartItems((prev) => {
      return prev
        .map((i) => {
          if (i.menuItem.id === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.menuItem.id !== menuItemId));
  };

  const updateItemNotes = (menuItemId: string, notes: string) => {
    setCartItems((prev) =>
      prev.map((i) => (i.menuItem.id === menuItemId ? { ...i, notes } : i))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('self_rest_cart');
  };

  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        selectedTable,
        setSelectedTable,
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        updateItemNotes,
        clearCart,
        totalCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
