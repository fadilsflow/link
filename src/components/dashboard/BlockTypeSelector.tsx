import {
    ImageIcon,
    Layout,
    Package,
    PlaySquare,
    User as UserIcon,
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

export type BlockType = 'link' | 'text' | 'image' | 'video' | 'product'

export interface BlockTypeOption {
    type: BlockType
    icon: LucideIcon
    title: string
    description: string
}

/**
 * Configuration for available block types.
 * Add new block types here to extend the selector.
 */
export const BLOCK_TYPE_OPTIONS: BlockTypeOption[] = [
    {
        type: 'link',
        icon: Layout,
        title: 'Link Block',
        description: 'Add a link to your website or profile',
    },
    {
        type: 'text',
        icon: UserIcon,
        title: 'Text Block',
        description: 'Write a simple message or bio segment',
    },
    {
        type: 'image',
        icon: ImageIcon,
        title: 'Image Block',
        description: 'Showcase an image with optional click link',
    },
    {
        type: 'video',
        icon: PlaySquare,
        title: 'Video Block',
        description: 'Embed videos from YouTube, TikTok, and more',
    },
    {
        type: 'product',
        icon: Package,
        title: 'Product Block',
        description: 'Feature one product from your existing catalog',
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
            <DialogContent className="overflow-hidden border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="font-heading">Add a Block</DialogTitle>
                </DialogHeader>
                <DialogPanel className="grid grid-cols-2 gap-4">
                    {BLOCK_TYPE_OPTIONS.map((option) => (
                        <div
                            key={option.type}
                            onClick={() => onSelect(option.type)}
                            className="p-6 text-foreground border border-border/50 rounded-xl flex flex-col items-center gap-3 hover:bg-input/80 cursor-pointer group"
                        >
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center">
                                <option.icon className="h-6 w-6" />
                            </div>
                            <span className="text-sm font-bold">{option.title}</span>
                            <p className="text-[10px] text-center leading-tight">
                                {option.description}
                            </p>
                        </div>
                    ))}
                </DialogPanel>
            </DialogContent>
        </Dialog>
    )
}
