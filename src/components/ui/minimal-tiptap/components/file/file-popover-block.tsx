import * as React from 'react'
import { DownloadIcon, TrashIcon } from '@radix-ui/react-icons'
import { ToolbarButton } from '../toolbar-button'
import { Separator } from '@/components/ui/separator'

interface FilePopoverBlockProps {
  url?: string | null
  onRemove: () => void
}

export const FilePopoverBlock: React.FC<FilePopoverBlockProps> = ({
  url,
  onRemove,
}) => {
  const handleDownload = React.useCallback(() => {
    if (!url) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [url])

  return (
    <div className="bg-background flex overflow-hidden rounded p-2 shadow-lg">
      <div className="inline-flex items-center gap-1">
        <ToolbarButton tooltip="Download" onClick={handleDownload}>
          <DownloadIcon />
        </ToolbarButton>
        <Separator orientation="vertical" />
        <ToolbarButton tooltip="Remove" onClick={onRemove}>
          <TrashIcon />
        </ToolbarButton>
      </div>
    </div>
  )
}

export default FilePopoverBlock
