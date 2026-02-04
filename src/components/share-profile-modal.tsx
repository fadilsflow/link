import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Ghost, Link2Icon } from 'lucide-react'
import { toastManager } from './ui/toast'
import { XformerlyTwitter } from './icon/x'
import { Facebook } from './icon/facebook'
import { LinkedIn } from './icon/linkedin'
import { WhatsApp } from './icon/whatsapp'
import { Gmail } from './icon/gmail'

export function ShareProfileModal({ url }: { url: string }) {
  const [copyText, setCopyText] = useState('Copy')
  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopyText('Copied!')
    setTimeout(() => {
      setCopyText('Copy')
    }, 2000)
  }

  const platform = [
    {
      name: 'WhatsApp',
      icon: <WhatsApp />,
      url: `https://wa.me/?text=${url}`,
    },
    {
      name: 'X',
      icon: <XformerlyTwitter className="invert" />,
      url: `https://x.com/intent/tweet?text=${url}`,
    },
    {
      name: 'Facebook',
      icon: <Facebook />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    },
    {
      name: 'LinkedIn',
      icon: <LinkedIn />,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${url}`,
    },
    {
      name: 'Gmail',
      icon: <Gmail />,
      url: `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=&su=Check%20out%20my%20profile&body=${url}`,
    },
  ]

  return (
    <Dialog>
      <DialogTrigger
        className={buttonVariants({ variant: 'default', size: 'sm' })}
      >
        Share
      </DialogTrigger>
      <DialogContent className="sm:max-w-[325px]">
        <DialogHeader>
          <DialogTitle className="font-heading">
            Share Your Profile{' '}
          </DialogTitle>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-4 py-4">
          <Button
            onClick={handleCopyLink}
            variant="link"
            size={'lg'}
            className="flex justify-between"
          >
            <span className="truncate">{url}</span>
            <Button size={'sm'}>{copyText}</Button>
          </Button>
          {platform.map((platform) => (
            <Button
              variant="link"
              key={platform.name}
              render={
                <Link
                  to={platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              {platform.icon}
              <span className="flex-1 text-left">
                {' '}
                Share On {platform.name}
              </span>
            </Button>
          ))}
        </DialogPanel>
      </DialogContent>
    </Dialog>
  )
}
