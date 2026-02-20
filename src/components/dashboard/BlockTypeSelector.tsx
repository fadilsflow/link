import type { SVGProps } from 'react'
import {
  ImageIcon,
  Link2Icon,
  Package2,
  TypeIcon,
  type LucideIcon,
} from 'lucide-react'
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
import { Discord } from '@/components/icon/discord'
import { Telegram } from '@/components/icon/telegram'
import { YouTube } from '../icon/youtube'

export type BlockType =
  | 'link'
  | 'text'
  | 'image'
  | 'video'
  | 'product'
  | 'discord'
  | 'telegram'

type IconComponent = (props: SVGProps<SVGSVGElement>) => React.ReactNode

export interface BlockTypeOption {
  type: BlockType
  icon: LucideIcon | IconComponent
  title: string
  description: string
  iconColor?: string
  bgColor?: string
}

/**
 * Configuration for available block types.
 * Add new block types here to extend the selector.
 */
export const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
  {
    type: 'link',
    icon: Link2Icon,
    title: 'Custom Link',
    iconColor: 'text-yellow-500 -rotate-45',
    bgColor: 'bg-yellow-100/20',
    description: 'Add any links of your website, campaign or content.',
  },
  {
    type: 'product',
    icon: Package2,
    iconColor: 'text-indigo-500',
    bgColor: 'bg-indigo-100/20',
    title: 'Product',
    description: 'Feature one product from your existing catalog',
  },
  {
    type: 'text',
    icon: TypeIcon,
    title: 'Title & Description',
    iconColor: 'text-sky-500',
    bgColor: 'bg-sky-100/20',
    description: 'Organize your links with a title and description',
  },
  {
    type: 'image',
    icon: ImageIcon,
    title: 'Image',
    iconColor: 'text-lime-500',
    bgColor: 'bg-lime-100/20',

    description: 'Upload and display custom image.',
  },
  {
    type: 'video',
    icon: YouTube,
    bgColor: 'bg-rose-100/20',
    title: 'Youtube',
    description: 'Share your channel and showcase videos.',
  },

  {
    type: 'discord',
    icon: Discord,
    iconColor: '',
    bgColor: 'bg-violet-100/20',
    title: 'Discord',
    description: 'Share your Discord community invite.',
  },
  {
    type: 'telegram',
    icon: Telegram,
    bgColor: 'bg-sky-100/20',
    title: 'Telegram',
    description: 'Share your Telegram username.',
  },
]

interface BlockTypeSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (type: BlockType) => void
}

/**
 * A dialog component for selecting block types to add.
 * Renders a grid of available block types from BLOCK_TYPE_OPTIONS.
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
            className="w-full rounded-full flex active:scale-[0.98]"
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
          {BLOCK_TYPE_OPTIONS.map((option) => (
            <div
              key={option.type}
              onClick={() => onSelect(option.type)}
              className={`p-3 ${option.bgColor}  text-foreground border border-input rounded-xl flex gap-4 items-center  cursor-pointer group`}
            >
              <div
                className={`p-1 border-2 group-hover:opacity-80 bg-muted-50 border-white ring-1 ring-border rounded-md flex items-center justify-center`}
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
