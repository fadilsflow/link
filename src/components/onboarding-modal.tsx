'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

interface OnboardingDialogProps {
  open: boolean
  onUsernameSubmit: (username: string) => Promise<void>
}

export function OnboardingDialog({
  open,
  onUsernameSubmit,
}: OnboardingDialogProps) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateUsername = (value: string): string | null => {
    if (!value) {
      return 'Username wajib diisi'
    }
    if (value.length < 3) {
      return 'Username minimal 3 karakter'
    }
    if (value.length > 30) {
      return 'Username maksimal 30 karakter'
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username hanya boleh mengandung huruf, angka, underscore (_), dan dash (-)'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateUsername(username)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await onUsernameSubmit(username)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '')
    setUsername(value)
    if (error) {
      setError('')
    }
  }

  return (
    <Dialog open={open}>
      <DialogPopup showCloseButton={false} bottomStickOnMobile={false}>
        <DialogHeader>
          <DialogTitle>Buat Username Anda</DialogTitle>
          <DialogDescription>
            Pilih username unik untuk profile link Anda. Username ini akan
            digunakan sebagai URL publik Anda.
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <Form onSubmit={handleSubmit}>
            <Field>
              <FieldLabel>Username</FieldLabel>
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-muted-foreground text-sm">@</span>
                </div>
                <Input
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="username"
                  className="pl-8"
                  autoFocus
                  disabled={isSubmitting}
                  aria-invalid={!!error}
                />
              </div>
              {error && <FieldError>{error}</FieldError>}
              {username && !error && (
                <p className="text-xs text-muted-foreground">
                  Link Anda: {window.location.origin}/@{username}
                </p>
              )}
            </Field>
          </Form>
        </DialogPanel>

        <DialogFooter variant="bare">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !username}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Menyimpan...' : 'Lanjutkan'}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  )
}
