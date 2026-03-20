import * as React from 'react'
import {
  CaretDownIcon,
  CodeIcon,
  DividerHorizontalIcon,
  ImageIcon,
  QuoteIcon,
} from '@radix-ui/react-icons'
import { BoxIcon, Plus } from 'lucide-react'
import { LinkEditPopover } from '../link/link-edit-popover'
import { ButtonEditPopover } from '../button/button-edit-popover'
import { FileInsertDialog } from '../file/file-insert-dialog'
import { ToolbarSection } from '../toolbar-section'
import type { VariantProps } from 'class-variance-authority'
import type { toggleVariants } from '@/components/ui/toggle'
import type { FormatAction } from '../../types'
import type { Editor } from '@tiptap/react'
import { Separator } from '@/components/ui/separator'

type InsertElementAction =
  | 'codeBlock'
  | 'blockquote'
  | 'horizontalRule'
  | 'imageBlock'
  | 'buttonBlock'
interface InsertElement extends FormatAction {
  value: InsertElementAction
}

interface SectionFiveProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
  activeActions?: Array<InsertElementAction>
  mainActionCount?: number
  allowImageUpload?: boolean
  allowFileUpload?: boolean
}

export const SectionFive: React.FC<SectionFiveProps> = ({
  editor,
  activeActions,
  mainActionCount = 0,
  allowImageUpload = true,
  allowFileUpload = true,
  size,
  variant,
}) => {
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const [buttonPopoverOpen, setButtonPopoverOpen] = React.useState(false)

  const handleImageFiles = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files?.length) return

      const contentBucket = []
      const filesArray = Array.from(files)

      for (const file of filesArray) {
        contentBucket.push({ src: file })
      }

      editor.commands.setImages(contentBucket)
      e.target.value = ''
    },
    [editor],
  )

  const formatActions: Array<InsertElement> = [
    ...(allowImageUpload
      ? [
          {
            value: 'imageBlock',
            label: 'Image',
            icon: <ImageIcon className="size-5" />,
            action: () => imageInputRef.current?.click(),
            isActive: (editorInstance) => editorInstance.isActive('image'),
            canExecute: () => true,
            shortcuts: [],
          } satisfies InsertElement,
        ]
      : []),
    {
      value: 'buttonBlock',
      label: 'Button',
      icon: <BoxIcon className="size-5" />,
      action: () => setButtonPopoverOpen(true),
      isActive: (editorInstance) => editorInstance.isActive('button'),
      canExecute: (editorInstance) => !editorInstance.isActive('codeBlock'),
      shortcuts: [],
    },
    {
      value: 'codeBlock',
      label: 'Code block',
      icon: <CodeIcon className="size-5" />,
      action: (editorInstance) =>
        editorInstance.chain().focus().toggleCodeBlock().run(),
      isActive: (editorInstance) => editorInstance.isActive('codeBlock'),
      canExecute: (editorInstance) =>
        editorInstance.can().chain().focus().toggleCodeBlock().run(),
      shortcuts: ['mod', 'alt', 'C'],
    },
    {
      value: 'blockquote',
      label: 'Blockquote',
      icon: <QuoteIcon className="size-5" />,
      action: (editorInstance) =>
        editorInstance.chain().focus().toggleBlockquote().run(),
      isActive: (editorInstance) => editorInstance.isActive('blockquote'),
      canExecute: (editorInstance) =>
        editorInstance.can().chain().focus().toggleBlockquote().run(),
      shortcuts: ['mod', 'shift', 'B'],
    },
    {
      value: 'horizontalRule',
      label: 'Divider',
      icon: <DividerHorizontalIcon className="size-5" />,
      action: (editorInstance) =>
        editorInstance.chain().focus().setHorizontalRule().run(),
      isActive: () => false,
      canExecute: (editorInstance) =>
        editorInstance.can().chain().focus().setHorizontalRule().run(),
      shortcuts: ['mod', 'alt', '-'],
    },
  ]

  const resolvedActiveActions =
    activeActions ?? formatActions.map((action) => action.value)

  return (
    <>
      <LinkEditPopover editor={editor} size={size} variant={variant} />
      {allowFileUpload ? (
        <FileInsertDialog editor={editor} size={size} variant={variant} />
      ) : null}
      <Separator orientation="vertical" className="mx-2" />
      <ToolbarSection
        editor={editor}
        actions={formatActions}
        activeActions={resolvedActiveActions}
        mainActionCount={mainActionCount}
        dropdownIcon={
          <>
            <Plus className="size-5" />
            <CaretDownIcon className="size-5" />
          </>
        }
        dropdownTooltip="Insert elements"
        size={size}
        variant={variant}
      />
      {allowImageUpload ? (
        <input
          type="file"
          ref={imageInputRef}
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleImageFiles}
        />
      ) : null}
    </>
  )
}

SectionFive.displayName = 'SectionFive'

export default SectionFive
