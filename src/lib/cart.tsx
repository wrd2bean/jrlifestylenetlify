import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
  isPreorder: boolean;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  taxes: number;
  shipping: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity" | "id"> & { quantity?: number }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "jr-lifestyle-cart";
const CartContext = createContext<CartContextValue | null>(null);

function createCartItemId(productId: string, selectedSize: string, selectedColor: string, isPreorder: boolean) {
  return [productId, selectedSize, selectedColor, isPreorder ? "preorder" : "instock"].join("::");
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxes = 0;
    const shipping = 0;

    return {
      items,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      taxes,
      shipping,
      total: subtotal + taxes + shipping,
      addItem(item) {
        const nextId = createCartItemId(
          item.productId,
          item.selectedSize,
          item.selectedColor,
          item.isPreorder,
        );

        setItems((current) => {
          const existing = current.find((entry) => entry.id === nextId);
          if (existing) {
            return current.map((entry) =>
              entry.id === nextId
                ? { ...entry, quantity: entry.quantity + (item.quantity ?? 1) }
                : entry,
            );
          }

          return [
            ...current,
            {
              ...item,
              id: nextId,
              quantity: item.quantity ?? 1,
            },
          ];
        });
      },
      updateQuantity(id, quantity) {
        setItems((current) =>
          current
            .map((item) => (item.id === id ? { ...item, quantity } : item))
            .filter((item) => item.quantity > 0),
        );
      },
      removeItem(id) {
        setItems((current) => current.filter((item) => item.id !== id));
      },
      clearCart() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
