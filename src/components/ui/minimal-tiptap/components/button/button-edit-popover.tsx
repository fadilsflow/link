import * as React from 'react'
import { BoxIcon } from 'lucide-react'
import { ToolbarButton } from '../toolbar-button'
import { ButtonEditBlock } from './button-edit-block'
import type { Editor } from '@tiptap/react'
import type { VariantProps } from 'class-variance-authority'
import type { toggleVariants } from '@/components/ui/toggle'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface ButtonEditPopoverProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerClassName?: string
}

const ButtonEditPopover = ({
  editor,
  size,
  variant,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  triggerClassName,
}: ButtonEditPopoverProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen

  const { from, to } = editor.state.selection
  const text = editor.state.doc.textBetween(from, to, ' ')

  const onSetButton = React.useCallback(
    (payload: {
      text: string
      url: string
      variant: string
      size: string
      alignment: string
    }) => {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'button',
          attrs: payload,
        })
        .run()

      setOpen(false)
    },
    [editor],
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton
          isActive={editor.isActive('button')}
          tooltip="Button"
          aria-label="Insert button"
          disabled={editor.isActive('codeBlock')}
          className={triggerClassName}
          size={size}
          variant={variant}
        >
          <BoxIcon className="size-5" />
        </ToolbarButton>
      </PopoverTrigger>
      <PopoverContent align="end" side="bottom" className="w-80">
        <ButtonEditBlock
          onSave={onSetButton}
          defaultText={text || 'Click Me'}
        />
      </PopoverContent>
    </Popover>
  )
}

export { ButtonEditPopover }
