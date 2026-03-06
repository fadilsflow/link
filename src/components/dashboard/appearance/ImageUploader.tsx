import { useState } from 'react'
import { ArrowLeft, Upload, X, ZoomIn, ZoomOut } from 'lucide-react'
import { useFileUpload } from '@/hooks/use-file-upload'
import { uploadFile } from '@/lib/upload-client'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from '@/components/ui/cropper'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'

type CropArea = { x: number; y: number; width: number; height: number }

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: CropArea,
  outputWidth: number,
  outputHeight: number,
): Promise<Blob | null> {
  try {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return null

    canvas.width = outputWidth
    canvas.height = outputHeight

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputWidth,
      outputHeight,
    )

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95)
    })
  } catch (error) {
    console.error('Failed to crop image:', error)
    return null
  }
}

interface ImageUploaderProps {
  value?: string
  backgroundPreviewUrl?: string
  onChange: (url: string) => void
  folder?: string
  aspectRatio?: 'video' | 'square' | 'wide'
  className?: string
  placeholder?: string
  cropEnabled?: boolean
  cropAspect?: number
  cropOutputWidth?: number
  cropOutputHeight?: number
  cropTitle?: string
  roundedClassName?: string
}

export function ImageUploader({
  value,
  backgroundPreviewUrl,
  onChange,
  folder = 'backgrounds',
  aspectRatio = 'video',
  className,
  placeholder,
  cropEnabled = false,
  cropAspect,
  cropOutputWidth,
  cropOutputHeight,
  cropTitle = 'Crop image',
  roundedClassName = 'rounded-xl',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCropOpen, setIsCropOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [cropSource, setCropSource] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null,
  )
  const [zoom, setZoom] = useState(1)

  const [, { openFileDialog, getInputProps, handleDrop, handleDragOver, handleDragEnter, handleDragLeave }] = useFileUpload({
    accept: 'image/*',
    maxFiles: 1,
    multiple: false,
  })

  const resolvedCropAspect =
    cropAspect ??
    (aspectRatio === 'video' ? 16 / 9 : aspectRatio === 'square' ? 1 : 1440 / 190)

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

  const resetCropState = () => {
    if (cropSource?.startsWith('blob:')) {
      URL.revokeObjectURL(cropSource)
    }
    setCropSource(null)
    setPendingFile(null)
    setCroppedAreaPixels(null)
    setZoom(1)
    setIsCropOpen(false)
  }

  const beginFileFlow = (file?: File) => {
    if (!file) return

    if (!cropEnabled) {
      void processUpload(file)
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPendingFile(file)
    setCropSource(objectUrl)
    setCroppedAreaPixels(null)
    setZoom(1)
    setIsCropOpen(true)
  }

  const applyCrop = async () => {
    if (!cropEnabled || !cropSource || !pendingFile || !croppedAreaPixels) {
      resetCropState()
      return
    }

    const targetWidth = cropOutputWidth ?? Math.max(1, Math.round(croppedAreaPixels.width))
    const targetHeight = cropOutputHeight ?? Math.max(1, Math.round(croppedAreaPixels.height))

    const blob = await getCroppedImageBlob(
      cropSource,
      croppedAreaPixels,
      targetWidth,
      targetHeight,
    )

    if (!blob) {
      setError('Failed to crop image. Please try again.')
      resetCropState()
      return
    }

    const croppedFile = new File(
      [blob],
      pendingFile.name.replace(/\.[^.]+$/, '') + '.jpg',
      { type: 'image/jpeg' },
    )

    resetCropState()
    await processUpload(croppedFile)
  }

  // Wrap the hook's change handler to trigger our async upload
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      beginFileFlow(e.target.files[0])
    }
    e.currentTarget.value = ''
  }

  // We need to bypass the hook's automatic state management effectively for the immediate upload pattern
  // Or we can just use the hook's state to show "Uploading..." preview.
  // Actually, keeping it simple: use the hook for drag/drop props but handle upload manually on change.

  return (
    <div className={cn('space-y-4', className)}>
      <input
        type="file"
        className="hidden"
        accept="image/*"
        ref={getInputProps().ref}
        onChange={onFileChange}
      />

      <div
        className={cn(
          'relative group overflow-hidden border bg-input/50 transition-colors text-center cursor-pointer hover:bg-input/80 hover:border-input flex items-center justify-center',
          roundedClassName,
          aspectRatio === 'video'
            ? 'aspect-video w-full'
            : aspectRatio === 'square'
              ? 'aspect-square w-full'
              : 'w-full h-[93px]',
          isUploading && 'pointer-events-none opacity-50',
        )}
        style={
          value || backgroundPreviewUrl
            ? {
              backgroundImage: `url(${value || backgroundPreviewUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
            : undefined
        }
        onClick={openFileDialog}
        onDrop={(e) => {
          handleDrop(e)
          beginFileFlow(e.dataTransfer.files[0])
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {value || backgroundPreviewUrl ? (
          <div className="absolute inset-0 bg-black/20" />
        ) : null}

        <div
          className={cn(
            'relative z-10 flex flex-col items-center gap-2',
            (value || backgroundPreviewUrl) && 'text-white',
          )}
        >
          <div className="p-2 rounded-full">
            {isUploading ? (
              <Spinner />
            ) : (
              <Upload className="h-4 w-4 " />
            )}
          </div>
          {placeholder && !isUploading ? (
            <div className="text-xs">{placeholder}</div>
          ) : null}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Dialog open={isCropOpen} onOpenChange={(open) => !open && resetCropState()}>
        <DialogPopup className="p-0 sm:max-w-2xl" showCloseButton={false}>
          <DialogDescription className="sr-only">
            Crop uploaded image before applying
          </DialogDescription>
          <DialogHeader className="border-b p-4">
            <DialogTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Button
                  aria-label="Cancel crop"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={resetCropState}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span>{cropTitle}</span>
              </div>
              <Button
                type="button"
                onClick={() => void applyCrop()}
                disabled={!cropSource || !croppedAreaPixels || isUploading}
              >
                Apply
              </Button>
            </DialogTitle>
          </DialogHeader>

          {cropSource ? (
            <Cropper
              className="h-80 sm:h-[28rem]"
              image={cropSource}
              aspectRatio={resolvedCropAspect}
              zoom={zoom}
              onZoomChange={setZoom}
              onCropChange={(pixels) => setCroppedAreaPixels(pixels as CropArea | null)}
            >
              <CropperDescription />
              <CropperImage />
              <CropperCropArea />
            </Cropper>
          ) : null}

          <DialogFooter className="border-t px-4 py-5">
            <div className="mx-auto flex w-full max-w-80 items-center gap-4">
              <ZoomOut className="h-4 w-4 shrink-0 opacity-60" />
              <Slider
                aria-label="Crop zoom"
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={(value) =>
                  setZoom((Array.isArray(value) ? value[0] : value) ?? 1)
                }
              />
              <ZoomIn className="h-4 w-4 shrink-0 opacity-60" />
            </div>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
