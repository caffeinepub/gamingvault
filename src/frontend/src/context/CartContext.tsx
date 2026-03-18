import { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { getBuyerQuestion } from "../utils/buyerQuestions";

export interface CartItem {
  productId: bigint;
  title: string;
  price: bigint;
  buyerQuestion?: string;
  isGiftCard?: boolean;
}

interface CartContextValue {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: bigint) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "hfst_cart";

function serializeCart(items: CartItem[]): string {
  return JSON.stringify(
    items.map((i) => ({
      ...i,
      productId: i.productId.toString(),
      price: i.price.toString(),
    })),
  );
}

function deserializeCart(raw: string): CartItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((i: any) => ({
      productId: BigInt(i.productId),
      title: i.title,
      price: BigInt(i.price),
      buyerQuestion: i.buyerQuestion,
      isGiftCard: i.isGiftCard ?? false,
    }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return deserializeCart(stored);
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, serializeCart(cartItems));
  }, [cartItems]);

  const addToCart = (item: CartItem) => {
    const buyerQuestion = getBuyerQuestion(item.productId);
    const enriched: CartItem = {
      ...item,
      buyerQuestion: buyerQuestion || item.buyerQuestion || undefined,
    };
    setCartItems((prev) => {
      const exists = prev.some((i) => i.productId === item.productId);
      if (exists) {
        toast.info("Already in cart");
        return prev;
      }
      toast.success("Added to cart!");
      return [...prev, enriched];
    });
  };

  const removeFromCart = (productId: bigint) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
