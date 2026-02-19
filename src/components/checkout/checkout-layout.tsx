import * as React from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CheckoutLayoutProps = {
  left: React.ReactNode
  right: React.ReactNode
}

export function CheckoutLayout({ left, right }: CheckoutLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background ">
        <div className="relative max-w-6xl mx-auto px-4 py-3 flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-3 text-xs text-slate-600 -ml-2 hover:bg-slate-100"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
          </Button>
          <h2 className="text-2xl font-heading">Checkout</h2>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="space-y-6">{left}</div>
          <div className="space-y-6 lg:sticky lg:top-20">{right}</div>
        </div>
      </div>
    </div>
  )
}
