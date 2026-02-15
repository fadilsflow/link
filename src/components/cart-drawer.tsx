import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useCartStore } from '@/store/cart-store'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import Emptys from './empty-state'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } =
    useCartStore()
  const navigate = useNavigate()

  const handleCheckout = () => {
    onClose()
    navigate({ to: '/cart/checkout' })
  }

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Shopping Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>
        <SheetPanel className="mt-5">
          {items.length === 0 ? (
            <div className=" min-h-[500px] flex flex-col items-center justify-center h-full text-center py-12">
              <Emptys
                title="Your cart is empty"
                description="Add products to get started"
                icon={<ShoppingCart />}
              >
                <Button
                  variant="default"
                  size="lg"
                  className="w-full"
                  onClick={onClose}
                >
                  Continue Shopping
                </Button>
              </Emptys>
            </div>
          ) : (
            <div className="space-y-4 text-foreground">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-4 border rounded-lg bg-card"
                >
                  <div className="w-20 h-20 rounded-md bg-muted shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 " />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.title}</h3>
                    <p className="text-sm mt-1">{formatPrice(item.price)}</p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        disabled={
                          item.limitPerCheckout
                            ? item.quantity >= item.limitPerCheckout
                            : false
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Price & Remove */}
                  <div className="flex flex-col items-end justify-between">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeItem(item.productId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <p className="font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SheetPanel>

        {/* Footer */}
        {items.length > 0 && (
          <SheetFooter>
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
