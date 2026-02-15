import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { useFileUpload } from '@/hooks/use-file-upload'
import { uploadFile } from '@/lib/upload-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  folder?: string
  aspectRatio?: 'video' | 'square' | 'wide'
  className?: string
  placeholder?: string
}

export function ImageUploader({
  value,
  onChange,
  folder = 'backgrounds',
  aspectRatio = 'video',
  className,
  placeholder = 'Upload or paste URL',
}: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [
    {},
    {
      openFileDialog,
      getInputProps,
      handleDrop,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
    },
  ] = useFileUpload({
    accept: 'image/*',
    maxFiles: 1,
    multiple: false,
  })

  // Handle file upload
  const processUpload = async (file: File) => {
    setIsUploading(true)
    setError(null)
    try {
      const url = await uploadFile(file, folder)
      onChange(url)
    } catch (err) {
      console.error(err)
      setError('Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Wrap the hook's change handler to trigger our async upload
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUpload(e.target.files[0])
    }
  }

  // We need to bypass the hook's automatic state management effectively for the immediate upload pattern
  // Or we can just use the hook's state to show "Uploading..." preview.
  // Actually, keeping it simple: use the hook for drag/drop props but handle upload manually on change.

  return (
    <div className={cn('space-y-4', className)}>
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'upload' | 'url')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="upload" className="text-xs">
            Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-xs">
            URL
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="upload" className="mt-0 space-y-4">
            {!value ? (
              <div
                className={cn(
                  ' rounded-xl bg-input/50 transition-colors text-center cursor-pointer hover:bg-input/80 hover:border-input flex items-center justify-center',
                  aspectRatio === 'video'
                    ? 'aspect-video w-full'
                    : aspectRatio === 'square'
                      ? 'aspect-square w-full'
                      : 'w-full h-[93px]',
                  isUploading && 'pointer-events-none opacity-50',
                )}
                onClick={openFileDialog}
                onDrop={(e) => {
                  handleDrop(e)
                  if (e.dataTransfer.files?.[0]) {
                    processUpload(e.dataTransfer.files[0])
                  }
                }}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  ref={getInputProps().ref}
                  onChange={onFileChange}
                />

                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 rounded-full">
                    {isUploading ? (
                      <Spinner />
                    ) : (
                      <Upload className="h-4 w-4 " />
                    )}
                  </div>
                  <div className="text-xs">
                    {isUploading ? null : placeholder}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative group rounded-xl overflow-hidden border">
                <div
                  className={cn(
                    'w-full bg-cover bg-center',
                    aspectRatio === 'video'
                      ? 'aspect-video'
                      : aspectRatio === 'square'
                        ? 'aspect-square'
                        : 'w-[712px] h-[93px]',
                  )}
                  style={{ backgroundImage: `url(${value})` }}
                />

                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 rounded-full shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Reuse button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0">
                  <div
                    className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full font-medium pointer-events-auto cursor-pointer z-20 hover:bg-black/70 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      onChange('')
                    }}
                  >
                    Change Image
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}
          </TabsContent>

          <TabsContent value="url" className="mt-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={value || ''}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="https://example.com/image.png"
                />
              </div>
              {value && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => onChange('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {value && (
              <div className="mt-4 rounded-xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-50">
                <img
                  src={value}
                  className="w-full h-full object-cover"
                  alt="Preview"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
