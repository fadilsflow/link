import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import {
  BLOCK_TYPE_CONFIG,
  type BlockType,
  type BlockCategory,
} from '@/lib/block-type-config'

export type { BlockType, BlockCategory } from '@/lib/block-type-config'

/** Category metadata for grouping block types */
const CATEGORY_INFO: Record<BlockCategory, { title: string }> = {
  general: {
    title: 'General',
  },
  social: {
    title: 'Social Media',
  },
}

/** Group block types by category for scalable rendering */
function getBlocksByCategory() {
  const grouped: Record<BlockCategory, typeof BLOCK_TYPE_CONFIG> = {
    general: [],
    social: [],
  }

  for (const block of BLOCK_TYPE_CONFIG) {
    if (grouped[block.category]) {
      grouped[block.category].push(block)
    }
  }

  return grouped
}

interface BlockTypeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (type: BlockType) => void
}

/**
 * A dialog component for selecting block types to add.
 * Renders a grid of available block types from BLOCK_TYPE_CONFIG.
 */
export function BlockTypeSelector({
  open,
  onOpenChange,
  onSelect,
}: BlockTypeSelectorProps) {
  const blocksByCategory = getBlocksByCategory()
  const categories = Object.keys(blocksByCategory) as BlockCategory[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            size="lg"
            className="w-full rounded-full flex "
          />
        }
      >
        <Plus className="h-5 w-5" />
        Add
      </DialogTrigger>
      <DialogContent className={'sm:max-w-131.25'}>
        <DialogHeader>
          <DialogTitle className="font-heading">Add a Block</DialogTitle>
        </DialogHeader>
        <DialogPanel className="grid grid-cols-2 gap-2 ">
          {categories.map((category) => (
            <div key={category} className="contents">
              <div className="col-span-2 pt-2 pb-1">
                <h3 className="text-sm font-semibold text-foreground">
                  {CATEGORY_INFO[category].title}
                </h3>
              </div>
              {blocksByCategory[category].map((option) => (
                <div
                  key={option.type}
                  onClick={() => onSelect(option.type)}
                  className={`p-3 text-foreground bg-muted rounded-xl flex gap-4 items-center cursor-pointer group`}
                >
                  <div
                    className={`p-1  group-hover:opacity-80 ${option.iconBgColor || 'bg-muted'}  rounded-md flex items-center justify-center`}
                  >
                    <option.icon className={` ${option.iconColor} h-6 w-6`} />
                  </div>
                  <div className="gap-0 flex group-hover:opacity-70 flex-col">
                    <span className="text-sm font-semibold">{option.title}</span>
                    <p className="text-[10px] leading-tight">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
