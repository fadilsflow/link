import { StatusBadge } from './StatusBadge'
import type { SyncStatus } from './StatusBadge';
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { XformerlyTwitter } from '../icon/x';
import { LinkedIn } from '../icon/linkedin';
import { Gmail } from '../icon/gmail';
import { Button } from '../ui/button';
import { PlusIcon } from 'lucide-react';

interface ProfileEditorProps {
  user: {
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
  }
  status?: SyncStatus
  onUpdate: (field: string, value: string) => void
}

export function ProfileEditor({ user, onUpdate, status }: ProfileEditorProps) {
  return (
    <div className="relative flex flex-col  gap-2">
      <div className="flex gap-4">

        <Avatar className="h-22 w-22 ring-4 ring-white shadow-2xl shadow-zinc-200">
          <AvatarImage src={user.image || ''} />
          <AvatarFallback className="bg-zinc-900 text-white text-2xl font-bold">
            {user.name?.slice(0, 2).toUpperCase() || 'US'}
          </AvatarFallback>
        </Avatar>
        <div className=" flex flex-col">
          <span className="font-heading text-xl">{user.name}</span>
          <span className="text-sm text-muted-foreground">{user.title}</span>
          <p className="text-sm text-muted-foreground">{user.bio}</p>
          {/* <Input
            className={"font-heading text-2xl"}
            defaultValue={user.name}
            placeholder="Your Name"
            onChange={(e) => onUpdate('name', e.target.value)}
          /> */}
          {/* <Input
            defaultValue={user.title || ''}
            placeholder="Software Engineer"
            maxLength={30}
            onChange={(e) => onUpdate('title', e.target.value)}
          /> */}
          {/* social */}

        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button size={"icon"} variant={"secondary"}>
          <LinkedIn className='size-4' />
        </Button>
        <Button size={"icon"} variant={"secondary"}>
          <XformerlyTwitter className='size-4 invert' />
        </Button>
        <Button size={"icon"} variant={"secondary"}>
          <Gmail className='size-4' />
        </Button>
        <Button size={"icon"} variant={"secondary"}>
          <PlusIcon size={16} />
        </Button>


      </div>
      {/* <Textarea
        placeholder="Tell us about yourself..."
        defaultValue={user.bio || ''}
        className=''
        onChange={(e) => onUpdate('bio', e.target.value)}
      /> */}
      {/* STATUS PANEL - ABSOLUTE POSITIONING */}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 pointer-events-none">
        <StatusBadge status={status} />
      </div>
    </div>
  )
}


function ProfileEditorModal() {
  return
}