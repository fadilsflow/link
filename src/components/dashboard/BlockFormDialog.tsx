'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  BlockFieldErrors,
  BlockFormValues,
  BlockType,
} from '@/lib/block-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { getBlockFieldErrors } from '@/lib/block-form'
import { uploadFile } from '@/lib/upload-client'

interface ProductOption {
  id: string
  title: string
}

interface BlockFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  values: BlockFormValues
  products: Array<ProductOption>
  submitting?: boolean
  deleting?: boolean
  onSubmit: (values: BlockFormValues) => Promise<void> | void
  onDelete?: () => Promise<void> | void
}

function normalizeTelegramUsername(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('https://t.me/')) {
    return trimmed.replace('https://t.me/', '').split('/')[0] || ''
  }
  if (trimmed.startsWith('t.me/')) {
    return trimmed.replace('t.me/', '').split('/')[0] || ''
  }
  return trimmed.replace(/^@+/, '').split('/')[0] || ''
}

function normalizeSocialUsername(
  value: string,
  platform: 'threads' | 'instagram' | 'tiktok' | 'twitter',
): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  const fromPath = (pathname: string) => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 0) return ''
    if (platform === 'threads') {
      return (parts[0] || '').replace(/^@+/, '')
    }
    if (platform === 'tiktok') {
      const withAt = parts.find((part) => part.startsWith('@'))
      return (withAt || parts[0] || '').replace(/^@+/, '')
    }
    return (parts[0] || '').replace(/^@+/, '')
  }

  try {
    if (
      trimmed.includes('://') ||
      (trimmed.includes('.') && trimmed.includes('/'))
    ) {
      const url = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
      return fromPath(new URL(url).pathname)
    }
  } catch {
    // fallback to raw input
  }

  return trimmed.replace(/^@+/, '').split('/')[0] || ''
}

function getDialogTitle(mode: 'create' | 'edit', type: BlockType): string {
  const action = mode === 'create' ? 'Add' : 'Edit'
  const names: Record<BlockType, string> = {
    link: 'Link',
    text: 'Text',
    image: 'Image',
    video: 'Video',
    product: 'Product',
    discord: 'Discord',
    telegram: 'Telegram',
    threads: 'Threads',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitter: 'X / Twitter',
  }
  return `${action} ${names[type]} Block`
}

export function BlockFormDialog({
  open,
  onOpenChange,
  mode,
  values,
  products,
  submitting,
  deleting,
  onSubmit,
  onDelete,
}: BlockFormDialogProps) {
  const [formValues, setFormValues] = useState<BlockFormValues>(values)
  const [errors, setErrors] = useState<BlockFieldErrors>({})
  const [isUploading, setIsUploading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Lock mode and type when dialog opens to prevent title flash during close
  const lockedRef = useRef<{ mode: 'create' | 'edit'; type: BlockType } | null>(
    null,
  )

  useEffect(() => {
    if (!open) return
    setFormValues(values)
    setErrors({})
    setIsUploading(false)
    setDeleteDialogOpen(false)
    lockedRef.current = { mode, type: values.type }
  }, [values, open, mode])

  const type = formValues.type

  // Use locked values for title to prevent flash during close animation
  const titleMode = lockedRef.current?.mode ?? mode
  const titleType = lockedRef.current?.type ?? type

  const setField = (field: keyof BlockFormValues, value: string | boolean) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (field !== 'title' && field !== 'url' && field !== 'content')
        return prev
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleImageUpload = async (file?: File) => {
    if (!file) return
    try {
      setIsUploading(true)
      const uploadedUrl = await uploadFile(file, 'blocks/images')
      setField('content', uploadedUrl)
    } catch {
      setField('content', '')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    const nextErrors = getBlockFieldErrors(formValues)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    await onSubmit(formValues)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle(titleMode, titleType)}</DialogTitle>
        </DialogHeader>
        <Form errors={errors} onSubmit={handleSubmit}>
          <DialogPanel className="space-y-4">
          {(type === 'link' ||
            type === 'text' ||
            type === 'video' ||
            type === 'discord' ||
            type === 'telegram' ||
            type === 'threads' ||
            type === 'instagram' ||
            type === 'tiktok' ||
            type === 'twitter') && (
              <Field name="title">
                <FieldLabel>Title</FieldLabel>
                <Input
                  value={formValues.title}
                  onChange={(e) => setField('title', e.target.value)}
                  placeholder={type === 'text' ? "What's the heading?" : 'Title'}
                />
                <FieldError />
              </Field>
            )}

          {type === 'link' && (
            <Field name="url">
              <FieldLabel>URL</FieldLabel>
              <Input
                value={formValues.url}
                onChange={(e) => setField('url', e.target.value)}
                type="url"
                placeholder="https://example.com"
              />
              <FieldError />
            </Field>
          )}

          {type === 'text' && (
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={formValues.content || ''}
                onChange={(e) => setField('content', e.target.value)}
                placeholder="Add some details..."
              />
            </Field>
          )}

          {type === 'image' && (
            <>
              <Field name="content">
                <FieldLabel>Image</FieldLabel>
                <div className="space-y-3">
                  {formValues.content ? (
                    <div className="relative w-full overflow-hidden rounded-lg border bg-muted aspect-video">
                      <img
                        src={formValues.content}
                        alt="Uploaded image"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
                      No image uploaded.
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => handleImageUpload(e.target.files?.[0])}
                    />
                    {isUploading ? <Spinner className="h-4 w-4" /> : null}
                  </div>
                </div>
                <FieldError />
              </Field>
              <Field name="url">
                <FieldLabel>Optional Link</FieldLabel>
                <Input
                  value={formValues.url}
                  onChange={(e) => setField('url', e.target.value)}
                  type="url"
                  placeholder="https://example.com"
                />
                <FieldError />
              </Field>
            </>
          )}

          {type === 'video' && (
            <Field name="content">
              <FieldLabel>Video URL</FieldLabel>
              <Input
                value={formValues.content || ''}
                onChange={(e) => setField('content', e.target.value)}
                type="url"
                placeholder="https://youtube.com/watch?v=..."
              />
              <FieldError />
            </Field>
          )}

          {type === 'product' && (
            <Field name="content">
              <FieldLabel>Product</FieldLabel>
              <Select
                value={formValues.content || ''}
                onValueChange={(value) => setField('content', value || '')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an existing product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError />
            </Field>
          )}

          {type === 'discord' && (
            <Field name="url">
              <FieldLabel>Discord Invite URL</FieldLabel>
              <Input
                value={formValues.url}
                onChange={(e) => setField('url', e.target.value)}
                type="url"
                placeholder="https://discord.gg/..."
              />
              <FieldError />
            </Field>
          )}

          {type === 'telegram' && (
            <Field name="content">
              <FieldLabel>Telegram Username</FieldLabel>
              <Input
                value={formValues.content || ''}
                onChange={(e) =>
                  setField('content', normalizeTelegramUsername(e.target.value))
                }
                placeholder="username"
              />
              <FieldError />
            </Field>
          )}

          {(type === 'threads' ||
            type === 'instagram' ||
            type === 'tiktok' ||
            type === 'twitter') && (
              <Field name="content">
                <FieldLabel>Username</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    value={formValues.content || ''}
                    onChange={(e) =>
                      setField(
                        'content',
                        normalizeSocialUsername(e.target.value, type),
                      )
                    }
                    onBlur={(e) =>
                      setField(
                        'content',
                        normalizeSocialUsername(e.target.value, type),
                      )
                    }
                    placeholder={
                      type === 'threads' || type === 'instagram'
                        ? 'username'
                        : type === 'twitter'
                          ? 'x_username'
                          : 'tiktok_username'
                    }
                  />
                  <InputGroupAddon>
                    {type === 'threads'
                      ? 'threads.net/@'
                      : type === 'instagram'
                        ? 'instagram.com/'
                        : type === 'twitter'
                      ? 'x.com/'
                      : 'tiktok.com/@'}
                  </InputGroupAddon>
                </InputGroup>
                <FieldError />
              </Field>
            )}
          </DialogPanel>
          <DialogFooter variant="bare">
          {mode === 'edit' ? (
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    className="sm:mr-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={submitting || deleting || isUploading}
                  />
                }
              >
                Delete
              </AlertDialogTrigger>
              <AlertDialogPopup>
                <div className="p-6 text-center sm:text-left">
                  <AlertDialogTitle>Delete Block</AlertDialogTitle>
                  <AlertDialogDescription className="mt-2">
                    Are you sure you want to delete this block? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </div>
                <AlertDialogFooter>
                  <AlertDialogClose render={<Button variant="ghost" />}>
                    Cancel
                  </AlertDialogClose>
                  <Button
                    type="button"
                    onClick={() => onDelete?.()}
                    variant="destructive"
                    loading={!!deleting}
                  >
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogPopup>
            </AlertDialog>
          ) : null}
          <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
          <Button
            type="submit"
            disabled={submitting || deleting || isUploading}
            loading={!!submitting}
          >
            {titleMode === 'create' ? 'Add Block' : 'Save Changes'}
          </Button>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  )
}
