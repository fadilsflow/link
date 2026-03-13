import { CircleCheck, Download, Link2Icon, Share } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

import { Group, GroupSeparator } from './ui/group'

export function ShareProfileModal({
  url,
  children,
}: {
  url: string
  children?: React.ReactElement
}) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')

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

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
    url,
  )}`

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

  return (
    <Dialog>

      <DialogTrigger
        render={
          children || (
            <Button
              className="py-6 px-6 font-semibold"
              variant="outline"
              size="lg"
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
      </DialogTrigger>

      <DialogPopup className="w-full max-w-xs">
        <DialogHeader>
          <DialogTitle className={'text-center'} >
            Share
          </DialogTitle>
        </DialogHeader>
        <DialogPanel className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-center">
              <img
                src={qrImageUrl}
                alt="QR code"
                loading="lazy"
                decoding="async"
                className="w-full max-w-[180px] sm:max-w-[220px] aspect-square opacity-0"
                onLoad={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              />
            </div>

            <Group orientation="vertical" className="w-full">
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full justify-between"
                onClick={handleDownloadQr}
              >
                Download PNG
                <Download className="h-5 w-5" />
              </Button>

              <GroupSeparator orientation="horizontal" />

              <Button
                variant="outline"
                className="flex items-center gap-2 w-full justify-between"
                onClick={handleCopyLink}
              >
                Copy Link

                {copyStatus === 'copied' ? (
                  <CircleCheck className="size-5 fill-emerald-600 text-white dark:fill-emerald-400" />
                ) : (
                  <Link2Icon className="h-5 w-5 -rotate-45 text-foreground" />
                )}
              </Button>
            </Group>
          </div>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  )
}