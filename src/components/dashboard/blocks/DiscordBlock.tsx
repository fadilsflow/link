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

interface DiscordBlockProps {
  block: {
    id: string
    title: string
    url?: string
    isEnabled: boolean
    errors?: {
      title?: string
      url?: string
    }
  }
  handleUpdate: (id: string, field: string, value: any) => void
  handleDelete: (id: string) => void
}

export function DiscordBlock({
  block,
  handleUpdate,
  handleDelete,
}: DiscordBlockProps) {
  const errors = block.errors || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Field className="flex-1">
          <FieldLabel className="sr-only">Title</FieldLabel>
          <Input
            defaultValue={block.title}
            placeholder="Discord"
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
                  this Discord block.
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

      <Field className="flex-1">
        <FieldLabel className="sr-only">Discord invite link</FieldLabel>
        <Input
          defaultValue={block.url || ''}
          placeholder="https://discord.gg/..."
          type="url"
          onChange={(e) => handleUpdate(block.id, 'url', e.target.value)}
        />
        {errors.url && <FieldError>Invite link must be a valid URL</FieldError>}
      </Field>
    </div>
  )
}
