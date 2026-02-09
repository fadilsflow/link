'use client'

import { Trash2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface VideoBlockProps {
  block: {
    id: string
    title: string
    content?: string
    isEnabled: boolean
    errors?: {
      title?: string
      content?: string
    }
  }
  handleUpdate: (id: string, field: string, value: any) => void
  handleDelete: (id: string) => void
}

export function VideoBlock({
  block,
  handleUpdate,
  handleDelete,
}: VideoBlockProps) {
  const errors = block.errors || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Field className="flex-1">
          <FieldLabel className="sr-only">Title</FieldLabel>
          <Input
            defaultValue={block.title}
            placeholder="Video title"
            type="text"
            onChange={(e) => handleUpdate(block.id, 'title', e.target.value)}
          />
          {errors.title && <FieldError>Title is required</FieldError>}
        </Field>

        <div className="flex items-center gap-4 w-[84px] justify-end shrink-0">
          <Switch
            checked={block.isEnabled}
            onCheckedChange={(checked) =>
              handleUpdate(block.id, 'isEnabled', checked)
            }
          />

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8" />
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </AlertDialogTrigger>
            <AlertDialogPopup>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this block?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this video block.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogClose render={<Button variant="ghost" />}>
                  Cancel
                </AlertDialogClose>
                <AlertDialogClose
                  render={
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(block.id)}
                    />
                  }
                >
                  Delete
                </AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialog>
        </div>
      </div>

      <Field>
        <FieldLabel className="sr-only">Embed URL</FieldLabel>
        <Input
          defaultValue={block.content || ''}
          placeholder="YouTube / TikTok / Vimeo URL"
          type="url"
          onChange={(e) => handleUpdate(block.id, 'content', e.target.value)}
        />
        {errors.content && <FieldError>Video URL must be valid</FieldError>}
      </Field>
    </div>
  )
}
