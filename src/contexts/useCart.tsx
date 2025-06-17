import React, { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = {
  name: string;
  price: number;
  quantity: number;
  note?: string;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // تحميل السلة من localStorage عند أول تحميل
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("cart");
    return stored ? JSON.parse(stored) : [];
  });

  // حفظ السلة في localStorage عند كل تغيير
  React.useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.name === item.name && i.price === item.price && i.note === item.note
      );
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].quantity += item.quantity || 1;
        return updated;
      }
      return [
        ...prev,
        { ...item, quantity: item.quantity || 1 },
      ];
    });
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
};
