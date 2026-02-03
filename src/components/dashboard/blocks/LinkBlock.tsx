'use client'

import { useState } from 'react'
import { Link2, Trash2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
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

interface LinkBlockProps {
  block: {
    id: string
    title: string
    url: string
    isEnabled: boolean
    errors?: {
      title?: string
      url?: string
    }
  }
  handleUpdate: (id: string, field: string, value: any) => void
  handleDelete: (id: string) => void
}

export function LinkBlock({
  block,
  handleUpdate,
  handleDelete,
}: LinkBlockProps) {
  const errors = block.errors || {}

  const TITLE_MAX = 50
  const [title, setTitle] = useState(block.title ?? '')

  return (
    <div className="space-y-4">
      {/* TITLE FIELD */}
      <div className="flex items-center gap-3">
        <Field className="flex-1">
          <FieldLabel className="sr-only">Title</FieldLabel>

          <InputGroup>
            <InputGroupInput
              value={title}
              maxLength={TITLE_MAX}
              placeholder="What's the title?"
              type="text"
              onChange={(e) => {
                setTitle(e.target.value)
                handleUpdate(block.id, 'title', e.target.value)
              }}
            />

            <InputGroupAddon align="inline-end">
              <InputGroupText
                aria-live="polite"
                role="status"
                className="text-xs tabular-nums text-zinc-400"
              >
                {title.length}/{TITLE_MAX}
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>

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
                <AlertDialogTitle>Delete this link?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this link block.
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

      {/* URL FIELD */}
      <Field>
        <FieldLabel className="sr-only">URL</FieldLabel>

        <div className="relative">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-300">
            <Link2 className="h-3.5 w-3.5" />
          </div>

          <Input
            defaultValue={block.url}
            placeholder="Paste your link here..."
            type="url"
            onChange={(e) => handleUpdate(block.id, 'url', e.target.value)}
          />
        </div>

        <FieldError>Invalid URL</FieldError>
      </Field>
    </div>
  )
}
