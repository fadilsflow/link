import type { Content } from '@tiptap/react'
import { MainMinimalTiptapEditor } from '@/components/ui/minimal-tiptap'
import { useMinimalTiptapEditor } from '@/components/ui/minimal-tiptap/hooks/use-minimal-tiptap'
import { uploadFile } from '@/lib/upload-client'
import { cn } from '@/lib/utils'

export interface ProductContentEditorProps {
  value?: Content | null
  onChange: (value: Content) => void
  onUploadingChange?: (isUploading: boolean) => void
  className?: string
}

export function ProductContentEditor({
  value,
  onChange,
  onUploadingChange,
  className,
}: ProductContentEditorProps) {
  const editor = useMinimalTiptapEditor({
    value: value ?? undefined,
    output: 'json',
    placeholder: 'Compose the content your buyer will receive after checkout…',
    onUpdate: (content) => onChange(content),
    uploader: async (file) => {
      onUploadingChange?.(true)
      try {
        return await uploadFile(file, 'products/content-images')
      } finally {
        onUploadingChange?.(false)
      }
    },
  })

  if (!editor) return null

  return (
    <div className={cn('space-y-4', className)}>
      <MainMinimalTiptapEditor
        editor={editor}
        className="min-h-[420px]"
        editorContentClassName="p-4"
      />
    </div>
  )
}

export default ProductContentEditor
