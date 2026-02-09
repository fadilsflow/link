'use client'

import { Trash2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ProductOption {
  id: string
  title: string
}

interface ProductBlockProps {
  block: {
    id: string
    title: string
    content?: string
    isEnabled: boolean
    errors?: {
      content?: string
    }
  }
  products: Array<ProductOption>
  handleUpdate: (id: string, field: string, value: any) => void
  handleDelete: (id: string) => void
}

export function ProductBlock({
  block,
  products,
  handleUpdate,
  handleDelete,
}: ProductBlockProps) {
  const errors = block.errors || {}

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Field className="flex-1">
          <FieldLabel className="sr-only">Product</FieldLabel>
          <Select
            value={block.content || ''}
            onValueChange={(value) => {
              const selected = products.find((p) => p.id === value)
              handleUpdate(block.id, 'content', value)
              if (selected) {
                handleUpdate(block.id, 'title', selected.title)
              }
            }}
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
          {errors.content && <FieldError>Please select a product</FieldError>}
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
                  this product block.
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
    </div>
  )
}
