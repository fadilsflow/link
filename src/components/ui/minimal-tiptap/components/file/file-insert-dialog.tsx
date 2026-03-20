import * as React from 'react'
import { Upload } from 'lucide-react'
import { ToolbarButton } from '../toolbar-button'
import type { Editor } from '@tiptap/react'
import type { VariantProps } from 'class-variance-authority'
import type { toggleVariants } from '@/components/ui/toggle'

interface FileInsertDialogProps extends VariantProps<typeof toggleVariants> {
  editor: Editor
}

const FileInsertDialog = ({ editor, size, variant }: FileInsertDialogProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFile = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files?.length) return

      for (const file of Array.from(files)) {
        const blobUrl = URL.createObjectURL(file)
        editor
          .chain()
          .focus()
          .insertContent({
            type: 'file',
            attrs: {
              url: blobUrl,
              name: file.name,
              type: file.type || file.name.split('.').pop() || '',
              size: file.size,
            },
          })
          .run()
      }

      e.target.value = ''
    },
    [editor],
  )

  return (
    <>
      <ToolbarButton
        isActive={editor.isActive('file')}
        tooltip="Upload File"
        aria-label="Upload File"
        size={size}
        variant={variant}
        type="button"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="size-5" />
        Upload files
      </ToolbarButton>
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={handleFile}
      />
    </>
  )
}

export { FileInsertDialog }
