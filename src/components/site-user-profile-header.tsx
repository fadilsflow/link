import { Link } from '@tanstack/react-router'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { LogoType } from './kreasi-logo'
import UserButton from './user-button'
import { Button } from './ui/button'
import { CartDrawer } from './cart-drawer'
import { useCartStore } from '@/store/cart-store'

type SiteUserProfileHeaderProps = {
  logoColor?: string
}

export default function SiteUserProfileHeader({
  logoColor,
}: SiteUserProfileHeaderProps) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const totalItems = useCartStore((state) => state.getTotalItems())

  return (
    <>
      <header className="absolute left-0 right-0 top-0 z-50 px-2">
        <div className="mx-auto sm:max-w-7xl">
          <div className="flex h-16 items-center justify-between px-3 md:px-6">
            <Link
              to="/"
            >
              <LogoType style={{ color: logoColor }} />
            </Link>

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
