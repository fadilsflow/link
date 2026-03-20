import * as React from 'react'
import { Pencil2Icon } from '@radix-ui/react-icons'
import { ToolbarButton } from '../toolbar-button'
import { FileEditBlock } from './file-edit-block'
import type { Editor } from '@tiptap/react'
import type { VariantProps } from 'class-variance-authority'
import type { toggleVariants } from '@/components/ui/toggle'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface FileEditPopoverProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
  name?: string
  description?: string
  onSave: (payload: { name: string; description: string }) => void
}

export const FileEditPopover = ({
  editor,
  name,
  description,
  onSave,
  size,
  variant,
}: FileEditPopoverProps) => {
  const [open, setOpen] = React.useState(false)

  if (!editor.isEditable) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton
          tooltip="Edit file"
          aria-label="Edit file"
          size={size}
          variant={variant}
        >
          <Pencil2Icon className="size-4" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom">
        <FileEditBlock
          defaultName={name}
          defaultDescription={description}
          onSave={(payload) => {
            onSave(payload)
            setOpen(false)
          }}
          className="bg-popover text-popover-foreground w-full min-w-80 rounded-md border p-4 shadow-md outline-hidden"
        />
      </PopoverContent>
    </Popover>
  )
}

export default FileEditPopover
