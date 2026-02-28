import { useEffect, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { uploadFile } from '@/lib/upload-client'
import { useFileUpload } from '@/hooks/use-file-upload'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'

import { Field, FieldLabel } from '@/components/ui/field'

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

  const [
    { files: avatarFiles },
    {
      openFileDialog,
      removeFile,
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
    initialFiles: user.image
      ? [
        {
          id: 'current-avatar',
          name: 'Current Avatar',
          url: user.image,
          size: 0,
          type: 'image/ping',
        },
      ]
      : [],
  })

  // State to track if we are uploading
  const [isUploading, setIsUploading] = useState(false)

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
    const newFile = avatarFiles[0]?.file
    const imageRemoved = avatarFiles.length === 0 && user.image !== null
    const imageChanged = newFile instanceof File || imageRemoved

    // Normalize values for comparison
    const currentName = user.name || ''
    const currentTitle = user.title || ''
    const currentBio = user.bio || ''
    const newName = formData.name || ''
    const newTitle = formData.title || ''
    const newBio = formData.bio || ''

    const hasChanged =
      newName !== currentName ||
      newTitle !== currentTitle ||
      newBio !== currentBio ||
      imageChanged

    if (!hasChanged) {
      setDialogOpen(false)
      return
    }

    setIsUploading(true)

    try {
      let imageUrl = formData.image

      // If we have a new file selection (File object), upload it
      if (newFile instanceof File) {
        imageUrl = await uploadFile(newFile, 'avatars')
      } else if (imageRemoved) {
        imageUrl = null
      }

      await onSave({ ...formData, image: imageUrl })
      // Close dialog only after save completes successfully
      setDialogOpen(false)
    } catch (error) {
      console.error('Failed to save profile:', error)
      // Keep dialog open on error so user can retry
    } finally {
      setIsUploading(false)
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
          Edit Profile
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
                <div className="relative group">
                  <div
                    className="relative h-24 w-24 rounded-full overflow-hidden border cursor-pointer"
                    onClick={openFileDialog}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                  >
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={avatarFiles[0]?.preview || formData.image || ''}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-2xl font-bold">
                        {formData.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {avatarFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const id = avatarFiles[0].id
                        removeFile(id)
                      }}
                      className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-zinc-200 hover:bg-zinc-100"
                    >
                      <X className="h-4 w-4 text-zinc-500" />
                    </button>
                  )}

                  <input {...getInputProps()} className="hidden" />
                </div>
              </div>

              <Field>
                <FieldLabel>Display Name</FieldLabel>
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
              <Button type="submit" loading={isUploading}>
                Save
              </Button>
            </DialogFooter>
          </Form >
        </DialogPopup >
      </Dialog >
    </div >
  )
}
