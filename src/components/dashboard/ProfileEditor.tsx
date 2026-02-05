import { useState, useEffect } from 'react'

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

interface ProfileData {
  name: string
  title?: string | null
  bio?: string | null
}

interface ProfileEditorProps {
  user: {
    name: string
    title?: string | null
    bio?: string | null
    image?: string | null
  }
  onSave: (data: ProfileData) => Promise<unknown>
}

export function ProfileEditor({ user, onSave }: ProfileEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Local form state
  const [formData, setFormData] = useState<ProfileData>({
    name: user.name,
    title: user.title || '',
    bio: user.bio || '',
  })

  // Reset form when user data changes or dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setFormData({
        name: user.name,
        title: user.title || '',
        bio: user.bio || '',
      })
    }
  }, [dialogOpen, user.name, user.title, user.bio])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setDialogOpen(false)
    onSave(formData)
  }

  const handleFieldChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
          <Form className="contents" onSubmit={handleSubmit}>
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
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={formData.title || ''}
                  maxLength={30}
                  placeholder="Software Engineer"
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel>Bio</FieldLabel>
                <Textarea
                  value={formData.bio || ''}
                  placeholder="Tell us about yourself..."
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
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
      </Dialog>
    </div>
  )
}
