
import React, { createContext, useContext, useState } from "react";

const CART_STORAGE_KEY = "shopease_cart_v1";
const WISHLIST_STORAGE_KEY = "shopease_wishlist_v1";
const MAX_CART_LINES = 10;

const StoreContext = createContext(null);

const readStorage = (key) => {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStorage = (key, value) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${key} to localStorage:`, error);
  }
};

const cleanCartItems = (items) =>
  items
    .filter((item) => item?.productId && item?.variantId)
    .map((item) => ({
      ...item,
      quantity: Math.max(1, Number(item.quantity) || 1),
      stock: Math.max(0, Number(item.stock) || 0),
      unitPrice: Math.max(0, Number(item.unitPrice) || 0),
    }))
    .slice(0, MAX_CART_LINES);

const cleanWishlistItems = (items) =>
  items
    .filter((item) => item?.productId)
    .filter(
      (item, index, allItems) =>
        allItems.findIndex((candidate) => candidate.productId === item.productId) ===
        index
    );

export const StoreProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() =>
    cleanCartItems(readStorage(CART_STORAGE_KEY))
  );

  const [wishlistItems, setWishlistItems] = useState(() =>
    cleanWishlistItems(readStorage(WISHLIST_STORAGE_KEY))
  );

  const commitCart = (updater) => {
    setCartItems((current) => {
      const next = cleanCartItems(
        typeof updater === "function" ? updater(current) : updater
      );
      writeStorage(CART_STORAGE_KEY, next);
      return next;
    });
  };

  const commitWishlist = (updater) => {
    setWishlistItems((current) => {
      const next = cleanWishlistItems(
        typeof updater === "function" ? updater(current) : updater
      );
      writeStorage(WISHLIST_STORAGE_KEY, next);
      return next;
    });
  };

  const addToCart = (item) => {
    if (!item?.productId || !item?.variantId) {
      return { ok: false, message: "Choose a valid product variant first." };
    }

    const requestedQuantity = Math.max(1, Number(item.quantity) || 1);
    const stock = Math.max(0, Number(item.stock) || 0);

    if (stock < 1) {
      return { ok: false, message: "This variant is currently out of stock." };
    }

    let result = {
      ok: true,
      message: "Added to cart.",
    };

    commitCart((current) => {
      const existingIndex = current.findIndex(
        (cartItem) => cartItem.variantId === item.variantId
      );

      if (existingIndex === -1 && current.length >= MAX_CART_LINES) {
        result = {
          ok: false,
          message: `Your cart can contain up to ${MAX_CART_LINES} different items.`,
        };
        return current;
      }

      if (existingIndex >= 0) {
        const existing = current[existingIndex];
        const nextQuantity = Math.min(
          stock,
          Math.max(1, Number(existing.quantity) || 1) + requestedQuantity
        );

        const next = [...current];
        next[existingIndex] = {
          ...existing,
          ...item,
          quantity: nextQuantity,
          addedAt: existing.addedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        result = {
          ok: true,
          message:
            nextQuantity < (Number(existing.quantity) || 1) + requestedQuantity
              ? `Cart quantity adjusted to the available stock (${stock}).`
              : "Cart quantity updated.",
        };

        return next;
      }

      return [
        ...current,
        {
          ...item,
          quantity: Math.min(stock, requestedQuantity),
          stock,
          addedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    });

    return result;
  };

  const updateCartQuantity = (variantId, quantity) => {
    commitCart((current) =>
      current.map((item) => {
        if (item.variantId !== variantId) return item;

        const stock = Math.max(0, Number(item.stock) || 0);
        const safeQuantity = Math.min(
          Math.max(1, Math.floor(Number(quantity) || 1)),
          Math.max(stock, 1)
        );

        return {
          ...item,
          quantity: safeQuantity,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  const removeFromCart = (variantId) => {
    commitCart((current) =>
      current.filter((item) => item.variantId !== variantId)
    );
  };

  const clearCart = () => commitCart([]);

  const isWishlisted = (productId) =>
    wishlistItems.some((item) => item.productId === productId);

  const addToWishlist = (item) => {
    if (!item?.productId) return;

    commitWishlist((current) => {
      const existing = current.find(
        (wishlistItem) => wishlistItem.productId === item.productId
      );

      if (existing) {
        return current.map((wishlistItem) =>
          wishlistItem.productId === item.productId
            ? {
                ...wishlistItem,
                ...item,
                addedAt: wishlistItem.addedAt || new Date().toISOString(),
              }
            : wishlistItem
        );
      }

      return [
        ...current,
        {
          ...item,
          addedAt: new Date().toISOString(),
        },
      ];
    });
  };

  const removeFromWishlist = (productId) => {
    commitWishlist((current) =>
      current.filter((item) => item.productId !== productId)
    );
  };

  const toggleWishlist = (item) => {
    if (!item?.productId) return false;

    const alreadySaved = isWishlisted(item.productId);

    if (alreadySaved) {
      removeFromWishlist(item.productId);
      return false;
    }

    addToWishlist(item);
    return true;
  };

  const clearWishlist = () => commitWishlist([]);

  const value = {
    cartItems,
    wishlistItems,
    cartCount: cartItems.reduce(
      (sum, item) => sum + Math.max(1, Number(item.quantity) || 1),
      0
    ),
    wishlistCount: wishlistItems.length,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

// This hook intentionally lives beside its provider so consumers keep one stable import path.
// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return context;
};
