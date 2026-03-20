import * as React from 'react'
import { ImageIcon } from '@radix-ui/react-icons'
import { ToolbarButton } from '../toolbar-button'
import type { Editor } from '@tiptap/react'
import type { VariantProps } from 'class-variance-authority'
import type { toggleVariants } from '@/components/ui/toggle'

interface ImageEditDialogProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
}

const ImageEditDialog = ({ editor, size, variant }: ImageEditDialogProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = React.useCallback(
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

  return (
    <>
      <ToolbarButton
        isActive={editor.isActive('image')}
        tooltip="Image"
        aria-label="Insert image"
        size={size}
        variant={variant}
        type="button"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon className="size-5" />
      </ToolbarButton>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={handleFile}
      />
    </>
  )
}

export { ImageEditDialog }
