import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import UserButton from './user-button'
import { Button } from './ui/button'
import { CartDrawer } from './cart-drawer'
import { useCartStore } from '@/store/cart-store'


export default function SiteUserProfileHeader() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <>
      <header className="z-50 px-2">
        <div className="mx-auto sm:max-w-2xl md:max-w-3xl">
          <div className="flex h-16 items-center justify-end px-3">
            <div className="ml-auto flex items-center gap-3">
              <UserButton />
              <Button
                variant="outline"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                ) : null}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}