import { Bookmark, Trash2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import Emptys from './empty-state'
import { useSavedStore } from '@/store/saved-store'
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

interface SavedDrawerProps {
  open: boolean
  onClose: () => void
}

export function SavedDrawer({ open, onClose }: SavedDrawerProps) {
  const { items, removeItem, clearSaved } = useSavedStore()

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Saved
          </SheetTitle>
        </SheetHeader>

        <SheetPanel className="mt-5">
          {items.length === 0 ? (
            <div className="flex min-h-[500px] h-full flex-col items-center justify-center py-12 text-center">
              <Emptys
                title="No saved products yet"
                description="Save products to find them quickly later"
                icon={<Bookmark />}
              >
                <Button variant="default" size="lg" className="w-full" onClick={onClose}>
                  Explore products
                </Button>
              </Emptys>
            </div>
          ) : (
            <div className="space-y-4 text-foreground">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 rounded-lg border bg-card p-4"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Bookmark className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm">{formatPrice(item.price)}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        render={
                          <Link
                            to="/$username/products/$productId"
                            params={{
                              username: item.username,
                              productId: item.productId,
                            }}
                          />
                        }
                        onClick={onClose}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        render={
                          <Link
                            to="/$username/products/$productId/checkout"
                            params={{
                              username: item.username,
                              productId: item.productId,
                            }}
                            search={{
                              name: '',
                              email: '',
                            }}
                          />
                        }
                        onClick={onClose}
                      >
                        Beli
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SheetPanel>

        {items.length > 0 && (
          <SheetFooter>
            <div className="space-y-4 pt-4">
              <Button variant="outline" className="w-full" size="lg" onClick={clearSaved}>
                Clear saved
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
