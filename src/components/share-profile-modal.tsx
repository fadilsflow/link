import { CircleCheck, Copy, QrCodeIcon, Share } from 'lucide-react'
import { useState } from 'react'
import {
  Popover,
  PopoverPopup,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'

export function ShareProfileModal({
  url,
  children,
}: {
  url: string
  children?: React.ReactElement
}) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [copyImageStatus, setCopyImageStatus] = useState<'idle' | 'copied'>(
    'idle',
  )

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus('copied')
      setTimeout(() => {
        setCopyStatus('idle')
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(url)}`

  const getQrBlob = async () => {
    const response = await fetch(qrImageUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch QR image')
    }
    return response.blob()
  }

  const handleDownloadQr = async () => {
    try {
      const blob = await getQrBlob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = 'profile-qr.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(qrImageUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCopyQrImage = async () => {
    try {
      const blob = await getQrBlob()
      if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
        throw new Error('Clipboard image API is not supported')
      }

      const blobType = blob.type || 'image/png'
      await navigator.clipboard.write([new ClipboardItem({ [blobType]: blob })])
      setCopyImageStatus('copied')
      setTimeout(() => setCopyImageStatus('idle'), 2000)
    } catch (err) {
      console.error('Failed to copy QR image: ', err)
    }
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          children || (
            <Button
              className="py-6 px-6 font-semibold"
              variant={'outline'}
              size={'lg'}
            />
          )
        }
      >
        {!children && (
          <>
            <span className="truncate max-w-[120px] md:max-w-40">
              {url.replace(/^https?:\/\//, '')}
            </span>
            <Share className="ml-2 h-4 w-4" />
          </>
        )}
      </PopoverTrigger>
      <PopoverPopup
        className="w-80"
        align="end"
      >
        <div className="space-y-4">
          <PopoverTitle >
            Share
          </PopoverTitle>

          <InputGroup className="px-0.5 py-1">
            <InputGroupInput
              readOnly
              value={url.replace(/^https?:\/\//, '')}
              className="text-sm font-medium"
            />

            <InputGroupAddon align="inline-end">
              <Button
                size="icon-sm"
                className="rounded-full"
                variant="link"
                onClick={handleCopyLink}
                aria-label={copyStatus === 'copied' ? 'Copied' : 'Copy link'}
              >
                {copyStatus === 'copied' ? (
                  <CircleCheck className="size-4 fill-emerald-600 text-white dark:fill-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4 " />
                )}
              </Button>
            </InputGroupAddon>
          </InputGroup>

          <div className="space-y-3  ">
            <div className="flex gap-2 justify-start items-center">
              <span className='text-sm font-medium'>QR Code</span>
            </div>
            <div className="flex justify-center aspect-square rounded-lg border bg-white p-3">
              <img
                src={qrImageUrl}
                alt="QR code"
                loading="lazy"
                decoding="async"
                className="size-52 w-full h-full opacity-0"
                onLoad={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleDownloadQr}
              >
                Download PNG
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleCopyQrImage}
              >
                {copyImageStatus === 'copied' ? <CircleCheck className="size-4 fill-emerald-600 text-white dark:fill-emerald-400" /> : 'Copy PNG'}
              </Button>
            </div>
          </div>

        </div>
      </PopoverPopup>
    </Popover>
  )
}
