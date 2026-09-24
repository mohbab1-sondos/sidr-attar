"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  price: number;
  saleType: "piece" | "weight";
  image: string;
  quantity: number;
  weight: number; // بالجرام
  totalPrice: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id" | "totalPrice">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateWeight: (id: string, weight: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidr-cart");
    if (saved) {
      try { setCart(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("sidr-cart", JSON.stringify(cart));
  }, [cart, isLoaded]);

  const addToCart = (item: Omit<CartItem, "id" | "totalPrice">) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.weight === item.weight
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQuantity = existing.quantity + item.quantity;
        updated[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          totalPrice: calcPrice(existing.price, existing.saleType, newQuantity, existing.weight),
        };
        return updated;
      }
      return [...prev, {
        ...item,
        id: `${item.productId}-${item.weight}-${Date.now()}`,
        totalPrice: calcPrice(item.price, item.saleType, item.quantity, item.weight),
      }];
    });
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));
  const updateQuantity = (id: string, q: number) => {
    if (q < 1) return;
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, quantity: q, totalPrice: calcPrice(i.price, i.saleType, q, i.weight) } : i));
  };
  const updateWeight = (id: string, w: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, weight: w, totalPrice: calcPrice(i.price, i.saleType, i.quantity, w) } : i));
  };
  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, i) => s + (i.saleType === "weight" ? 1 : i.quantity), 0);
  const cartTotal = cart.reduce((s, i) => s + i.totalPrice, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, updateWeight, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

function calcPrice(price: number, saleType: string, quantity: number, weight: number): number {
  if (saleType === "weight") return (weight / 1000) * price;
  return price * quantity;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}