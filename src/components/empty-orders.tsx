import { ShoppingBag } from 'lucide-react'

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function EmptyOrders() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShoppingBag />
        </EmptyMedia>
        <EmptyTitle>No orders yet</EmptyTitle>
        <EmptyDescription>
          You haven't received any orders yet. Start make a sale by promoting
          your products.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
