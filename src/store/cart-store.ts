import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  title: string
  price: number // in IDR (Rupiah)
  image?: string | null
  quantity: number
  maxQuantity?: number | null // from product.totalQuantity
  limitPerCheckout?: number | null
}

interface CartStore {
  items: Array<CartItem>
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items
        const existingItem = items.find((i) => i.productId === item.productId)

        if (existingItem) {
          // Increment quantity if item already exists
          const newQuantity = existingItem.quantity + 1
          const maxAllowed =
            item.limitPerCheckout ?? item.maxQuantity ?? Infinity

          if (newQuantity <= maxAllowed) {
            set({
              items: items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: newQuantity }
                  : i,
              ),
            })
          }
        } else {
          // Add new item with quantity 1
          set({
            items: [...items, { ...item, quantity: 1 }],
          })
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((i) => i.productId !== productId),
        })
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }

        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i,
          ),
        })
      },

      clearCart: () => {
        set({ items: [] })
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        )
      },
    }),
    {
      name: 'cart-storage', // localStorage key
    },
  ),
)
