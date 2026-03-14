import type { Content } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'
import '@/components/ui/minimal-tiptap/styles/index.css'
import { useMinimalTiptapEditor } from '@/components/ui/minimal-tiptap/hooks/use-minimal-tiptap'
import { cn } from '@/lib/utils'

export interface ProductContentRendererProps {
  content?: Content | null
  className?: string
}

export function ProductContentRenderer({
  content,
  className,
}: ProductContentRendererProps) {
  const editor = useMinimalTiptapEditor({
    value: content ?? undefined,
    output: 'json',
    editable: false,
  })

  if (!editor) return null

  return (
    <div className={cn('minimal-tiptap-editor', className)}>
      <EditorContent editor={editor} className="minimal-tiptap-editor" />
    </div>
  )
}

export default ProductContentRenderer
