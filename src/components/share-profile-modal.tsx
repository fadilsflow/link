import { Share } from 'lucide-react'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { XformerlyTwitter } from './icon/x'
import { Facebook } from './icon/facebook'
import { LinkedIn } from './icon/linkedin'
import { WhatsApp } from './icon/whatsapp'
import { Gmail } from './icon/gmail'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

  const platform = [
    {
      name: 'WhatsApp',
      icon: <WhatsApp className="h-6 w-6" />,
      color: 'bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20',
      url: `https://wa.me/?text=${encodeURIComponent(url)}`,
    },
    {
      name: 'X',
      icon: <XformerlyTwitter className="h-5 w-5 invert" />,
      color: 'bg-black/5 text-black hover:bg-black/10',
      url: `https://x.com/intent/tweet?text=${encodeURIComponent(url)}`,
    },
    {
      name: 'Facebook',
      icon: <Facebook className="h-6 w-6" />,
      color: 'bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: 'LinkedIn',
      icon: <LinkedIn className="h-6 w-6" />,
      color: 'bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/20',
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Gmail',
      icon: <Gmail className="h-6 w-6" />,
      color: 'bg-[#EA4335]/10 text-[#EA4335] hover:bg-[#EA4335]/20',
      url: `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=&su=Check out my profile&body=${encodeURIComponent(url)}`,
    },
  ]

  return (
    <Dialog>
      <DialogTrigger
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
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-none shadow-2xl overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">
            Share
          </DialogTitle>
        </DialogHeader>

        <DialogPanel className="space-y-8">
          {/* Copy Link Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-1.5 rounded-xl border ">
              <span className="flex-1 truncate ml-3 text-sm font-medium">
                {url.replace(/^https?:\/\//, '')}
              </span>
              <Button size="sm" onClick={handleCopyLink}>
                {copyStatus === 'copied' ? 'Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Social Share Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-3">
              {platform.map((p) => (
                <Link
                  key={p.name}
                  to={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group outline-none"
                >
                  <div
                    className={cn(
                      'h-14 w-14 rounded-2xl flex items-center justify-center border',
                    )}
                  >
                    {p.icon}
                  </div>
                  <span className="text-[11px]">{p.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
