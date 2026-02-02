import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    loadCart();
    // Check for expired items every time component mounts
    const interval = setInterval(removeExpiredItems, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Filter out expired items
        const validCart = parsedCart.filter(item => {
          const addedAt = item.addedAt || Date.now();
          const daysSinceAdded = (Date.now() - addedAt) / (1000 * 60 * 60 * 24);
          return daysSinceAdded < 7;
        });
        setCart(validCart);
        if (validCart.length !== parsedCart.length) {
          // Some items were expired, save the filtered cart
          localStorage.setItem('cart', JSON.stringify(validCart));
          console.log('Removed', parsedCart.length - validCart.length, 'expired items from cart');
        }
      } catch (error) {
        console.error('Error loading cart:', error);
        setCart([]);
      }
    }
  };

  const removeExpiredItems = () => {
    setCart(prevCart => {
      const validCart = prevCart.filter(item => {
        const addedAt = item.addedAt || Date.now();
        const daysSinceAdded = (Date.now() - addedAt) / (1000 * 60 * 60 * 24);
        return daysSinceAdded < 7;
      });
      
      if (validCart.length !== prevCart.length) {
        localStorage.setItem('cart', JSON.stringify(validCart));
        console.log('Auto-removed', prevCart.length - validCart.length, 'expired items');
      }
      
      return validCart;
    });
  };

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item, restaurantInfo) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1, addedAt: cartItem.addedAt || Date.now() }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1, restaurantInfo, addedAt: Date.now() }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getItemDaysInCart = (item) => {
    const addedAt = item.addedAt || Date.now();
    return Math.floor((Date.now() - addedAt) / (1000 * 60 * 60 * 24));
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getItemDaysInCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

