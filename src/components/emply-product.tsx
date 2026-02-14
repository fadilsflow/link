import { PackageIcon } from 'lucide-react'

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export default function EmptyProduct({ url }: { url: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <PackageIcon />
        </EmptyMedia>
        <EmptyTitle>Create your first product</EmptyTitle>
        <EmptyDescription>
          Adding products to your store is easy peasy. Create products in
          minutes and start making sales.{' '}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button render={<Link to={url} />}>
          <Plus />
          Create Product
        </Button>
      </EmptyContent>
    </Empty>
  )
}
