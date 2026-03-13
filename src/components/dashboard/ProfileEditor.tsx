import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { ImageUploader } from '@/components/dashboard/appearance/ImageUploader'

import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { SquarePen } from 'lucide-react'

interface ProfileData {
  name: string
  title?: string | null
  bio?: string | null
  image?: string | null
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
    image: user.image || '',
  })

  // State to track if we are uploading
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when user data changes or dialog opens
  useEffect(() => {
    if (dialogOpen) {
      setFormData({
        name: user.name,
        title: user.title || '',
        bio: user.bio || '',
        image: user.image || '',
      })
      // Note: we don't reset file upload hook here easily, assuming dialog isn't reused across different users without unmount
    }
  }, [dialogOpen, user.name, user.title, user.bio, user.image])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check for changes
    // Normalize values for comparison
    const currentName = user.name || ''
    const currentTitle = user.title || ''
    const currentBio = user.bio || ''
    const currentImage = user.image || ''
    const newName = formData.name || ''
    const newTitle = formData.title || ''
    const newBio = formData.bio || ''
    const newImage = formData.image || ''

    const hasChanged =
      newName !== currentName ||
      newTitle !== currentTitle ||
      newBio !== currentBio ||
      newImage !== currentImage

    if (!hasChanged) {
      setDialogOpen(false)
      return
    }

    setIsSaving(true)

    try {
      await onSave({ ...formData, image: newImage || null })
      // Close dialog only after save completes successfully
      setDialogOpen(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
      // Keep dialog open on error so user can retry
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="relative flex flex-col gap-2">
      <div className="flex gap-4">
        <Avatar
          className="h-16 w-16 border"
        >
          <AvatarImage src={user.image || ''} />
          <AvatarFallback className="text-2xl font-bold">
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <span
            className="font-heading text-foreground text-xl"
          >
            {user.name}
          </span>

          {user.title && (
            <span
              className="text-sm text-muted-foreground"
            >
              {user.title}
            </span>
          )}

          {user.bio && (
            <p
              className="text-sm text-foreground line-clamp-2"
            >
              {user.bio}
            </p>
          )}
        </div>
        <Button className='absolute right-0 top-0' variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
          <span className='hidden sm:block'>Edit Profile</span><SquarePen className='block sm:hidden  ' />
        </Button>

      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogPopup className="sm:max-w-sm">
          <Form className="contents" onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
            </DialogHeader>

            <DialogPanel className="grid gap-4">
              {/* Avatar Upload in Dialog */}
              <div className="flex justify-center">
                <div className="w-24">
                  <ImageUploader
                    value={formData.image || undefined}
                    onChange={(url) => handleFieldChange('image', url)}
                    folder="avatars"
                    aspectRatio="square"
                    roundedClassName="rounded-full"
                    className="space-y-0"
                    // placeholder="Upload avatar"
                    cropEnabled
                    cropAspect={1}
                    cropOutputWidth={512}
                    cropOutputHeight={512}
                    cropTitle="Crop avatar"
                  />
                </div>
              </div>

              <Field>
                <FieldLabel>Display Name</FieldLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  required
                />
                <FieldError />
              </Field>

              <Field>
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={formData.title || ''}
                  maxLength={30}
                  placeholder="Software Engineer"
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                />
                <FieldError />
              </Field>

              <Field>
                <FieldLabel>Bio</FieldLabel>
                <Textarea
                  value={formData.bio || ''}
                  placeholder="Tell us about yourself..."
                  onChange={(e) => handleFieldChange('bio', e.target.value)}
                />
                <FieldError />
              </Field>
            </DialogPanel>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button type="submit" loading={isSaving}>
                Save
              </Button>
            </DialogFooter>
          </Form >
        </DialogPopup >
      </Dialog >
    </div >
  )
}
