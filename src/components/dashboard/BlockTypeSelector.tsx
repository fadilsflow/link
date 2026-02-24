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
} from '@/lib/block-type-config'

export type { BlockType } from '@/lib/block-type-config'

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
        <DialogPanel className="grid grid-cols-2 gap-4 ">
          {BLOCK_TYPE_CONFIG.map((option) => (
            <div
              key={option.type}
              onClick={() => onSelect(option.type)}
              className={`p-3 text-foreground border border-input rounded-xl flex gap-4 items-center cursor-pointer group`}
            >
              <div
                className={`p-1 border-2 group-hover:opacity-80 ${option.iconBgColor || 'bg-muted'} border-white ring-1 ring-border rounded-md flex items-center justify-center`}
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
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
