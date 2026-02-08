import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useCartStore } from '@/store/cart-store'
import { Button } from '@/components/ui/button'
import { CartDrawer } from '@/components/cart-drawer'
import { cn } from '@/lib/utils'

export function FloatingCartButton() {
  const [isOpen, setIsOpen] = useState(false)
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const totalItems = getTotalItems()

  if (totalItems === 0) return null

  return (
    <>
      <Button
        size="lg"
        className={cn(
          'fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg',
          'hover:scale-110 transition-transform',
        )}
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
            {totalItems > 99 ? '99+' : totalItems}
          </span>
        )}
      </Button>

      <CartDrawer open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
