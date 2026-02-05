import { useState } from 'react'
import { StatusBadge } from './StatusBadge'
import type { SyncStatus } from './StatusBadge'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'

import { Field, FieldLabel } from '@/components/ui/field'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { XformerlyTwitter } from '../icon/x'
import { LinkedIn } from '../icon/linkedin'
import { Gmail } from '../icon/gmail'
import { PlusIcon } from 'lucide-react'

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
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex gap-4">
        <Avatar className="h-24 w-24 ring-4 ring-white shadow-2xl shadow-zinc-200">
          <AvatarImage src={user.image || ''} />
          <AvatarFallback className="bg-zinc-900 text-white text-2xl font-bold">
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <span
            onClick={() => setDialogOpen(true)}
            className="font-heading text-xl cursor-pointer hover:underline"
          >
            {user.name}
          </span>

          {user.title && (
            <span
              onClick={() => setDialogOpen(true)}
              className="text-sm text-muted-foreground cursor-pointer hover:underline"
            >
              {user.title}
            </span>
          )}

          {user.bio && (
            <p
              onClick={() => setDialogOpen(true)}
              className="text-sm text-muted-foreground cursor-pointer hover:underline"
            >
              {user.bio}
            </p>
          )}
        </div>
      </div>


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogPopup className="sm:max-w-sm">
          <Form className="contents">
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>

            <DialogPanel className="grid gap-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  className="font-heading text-2xl"
                  defaultValue={user.name}
                  onChange={(e) => onUpdate('name', e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                  defaultValue={user.title || ''}
                  maxLength={30}
                  placeholder="Software Engineer"
                  onChange={(e) => onUpdate('title', e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Bio</FieldLabel>
                <Textarea
                  defaultValue={user.bio || ''}
                  placeholder="Tell us about yourself..."
                  onChange={(e) => onUpdate('bio', e.target.value)}
                />
              </Field>
            </DialogPanel>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog >

      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 pointer-events-none">
        <StatusBadge status={status} />
      </div>
    </div >
  )
}
