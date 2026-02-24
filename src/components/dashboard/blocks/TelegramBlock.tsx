
import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
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

interface TelegramBlockProps {
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

function normalizeTelegramUsername(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (trimmed.startsWith('https://t.me/')) {
    return trimmed.replace('https://t.me/', '').split('/')[0]
  }

  if (trimmed.startsWith('t.me/')) {
    return trimmed.replace('t.me/', '').split('/')[0]
  }

  return trimmed.replace(/^@+/, '').split('/')[0]
}

export function TelegramBlock({
  block,
  handleUpdate,
  handleDelete,
}: TelegramBlockProps) {
  const errors = block.errors || {}
  const [username, setUsername] = useState(block.content || '')

  useEffect(() => {
    setUsername(block.content || '')
  }, [block.content])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Field className="flex-1">
          <FieldLabel className="sr-only">Title</FieldLabel>
          <Input
            defaultValue={block.title}
            placeholder="Telegram"
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
                  this Telegram block.
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
        <FieldLabel className="sr-only">Telegram username</FieldLabel>
        <InputGroup>
          <InputGroupInput
            value={username}
            aria-label="Set your URL"
            className="*:[input]:ps-1!"
            placeholder="username"
            onChange={(e) => {
              const next = normalizeTelegramUsername(e.target.value)
              setUsername(next)
              handleUpdate(block.id, 'content', next)
            }}
          />
          <InputGroupAddon>https://t.me/</InputGroupAddon>
        </InputGroup>
        {errors.content && (
          <FieldError>
            Username must use letters, numbers, and underscore
          </FieldError>
        )}
      </Field>
    </div>
  )
}
