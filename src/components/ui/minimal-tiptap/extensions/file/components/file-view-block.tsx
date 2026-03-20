import * as React from 'react'
import {  NodeViewWrapper } from '@tiptap/react'
import { Download, File as FileIcon } from 'lucide-react'
import { ImageOverlay } from '../../image/components/image-overlay'
import { blobUrlToBase64, randomId } from '../../../utils'
import type {NodeViewProps} from '@tiptap/react';
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const formatFileSize = (bytes?: number | null) => {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getFileTypeLabel = (name?: string, mime?: string) => {
  if (mime) {
    const last = mime.split('/').pop()
    return last ? last.toUpperCase() : 'FILE'
  }
  if (name?.includes('.')) {
    return name.split('.').pop()?.toUpperCase() ?? 'FILE'
  }
  return 'FILE'
}

export const FileViewBlock: React.FC<NodeViewProps> = ({
  editor,
  node,
  selected,
  updateAttributes,
}) => {
  const { name, type, size, url, description } = node.attrs
  const fileTypeLabel = getFileTypeLabel(name, type)
  const sizeLabel = formatFileSize(size)
  const metaLine = [fileTypeLabel, sizeLabel].filter(Boolean).join(' · ')

  const uploadAttemptedRef = React.useRef(false)
  const [isServerUploading, setIsServerUploading] = React.useState(false)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    const handleFile = async () => {
      if (!url?.startsWith('blob:') || uploadAttemptedRef.current) {
        return
      }

      uploadAttemptedRef.current = true
      const fileExtension = editor.options.extensions.find(
        (ext) => ext.name === 'file',
      )
      const { uploadFn } =
        (fileExtension?.options as Record<string, unknown>) ?? {}

      if (!uploadFn || typeof uploadFn !== 'function') {
        try {
          const base64 = await blobUrlToBase64(url)
          updateAttributes({ url: base64 })
        } catch {
          setError(true)
        }
        return
      }

      try {
        setIsServerUploading(true)
        const response = await fetch(url)
        const blob = await response.blob()
        const file = new globalThis.File([blob], name || 'file', {
          type: blob.type,
        })

        const uploadedUrl = await (
          uploadFn as (f: globalThis.File, e: typeof editor) => Promise<unknown>
        )(file, editor)
        const normalizedData = {
          url:
            typeof uploadedUrl === 'string'
              ? uploadedUrl
              : (uploadedUrl as Record<string, string>).src ||
                (uploadedUrl as Record<string, string>).url,
          id:
            typeof uploadedUrl === 'string'
              ? randomId()
              : (uploadedUrl as Record<string, string>).id,
        }

        setIsServerUploading(false)
        updateAttributes(normalizedData)
      } catch {
        setError(true)
        setIsServerUploading(false)
      }
    }

    handleFile()
  }, [editor, name, url, updateAttributes])

  const handleDownload = React.useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      if (!url || url.startsWith('blob:')) return
      window.open(url, '_blank', 'noopener,noreferrer')
    },
    [url],
  )

  const hasUrl = url && !url.startsWith('blob:')

  return (
    <NodeViewWrapper
      className={cn('not-prose my-3', editor.isEditable && 'cursor-move')}
      data-drag-handle
    >
      <div
        className={cn(
          'relative flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all contain-paint',
          {
            'outline-primary outline-2 outline-offset-1': selected,
          },
        )}
      >
        {/* File icon */}
        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
          <FileIcon className="size-5" />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <span className="truncate text-sm font-medium leading-tight text-foreground">
            {name || 'Untitled file'}
          </span>
          <span className="mt-0.5 truncate text-xs text-muted-foreground">
            {error ? 'Failed to upload' : metaLine}
          </span>
          {description && (
            <span className="mt-1 truncate text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </div>

        {/* Download button inline */}
        {hasUrl && !isServerUploading && !error && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleDownload}
          >
            <Download className="size-3.5" />
            Download
          </Button>
        )}

        {/* Upload overlay */}
        {isServerUploading && <ImageOverlay />}
      </div>
    </NodeViewWrapper>
  )
}

export default FileViewBlock
