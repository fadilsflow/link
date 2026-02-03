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

interface TextBlockProps {
  block: {
    id: string
    title: string
    content?: string
    isEnabled: boolean
    errors?: {
      title?: string
    }
  }
  handleUpdate: (id: string, field: string, value: any) => void
  handleDelete: (id: string) => void
}

export function TextBlock({
  block,
  handleUpdate,
  handleDelete,
}: TextBlockProps) {
  const errors = block.errors || {}

  return (
    <div className="space-y-4">
      {/* TITLE */}
      <div className="flex items-center gap-3">
        <Field className="flex-1">
          <FieldLabel className="sr-only">Title</FieldLabel>

          <Input
            defaultValue={block.title}
            placeholder="What's the heading?"
            type="text"
            onChange={(e) => handleUpdate(block.id, 'title', e.target.value)}
          />

          {errors.title && <FieldError>Heading is required</FieldError>}
        </Field>

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            checked={block.isEnabled}
            onCheckedChange={(checked) =>
              handleUpdate(block.id, 'isEnabled', checked)
            }
          />

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                />
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </AlertDialogTrigger>
            <AlertDialogPopup>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this block?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this text block.
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

      {/* CONTENT */}
      <Field>
        <FieldLabel className="sr-only">Content</FieldLabel>
        <Input
          defaultValue={block.content || ''}
          placeholder="Add some details..."
          type="text"
          onChange={(e) => handleUpdate(block.id, 'content', e.target.value)}
        />
      </Field>
    </div>
  )
}
