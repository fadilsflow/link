import { AtSign } from 'lucide-react'
import type { OnboardingProfileForm } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface OnboardingProfileStepProps {
  value: OnboardingProfileForm
  onChange: (value: OnboardingProfileForm) => void
  usernameError?: string
}

export function OnboardingProfileStep({
  value,
  onChange,
  usernameError,
}: OnboardingProfileStepProps) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Field>
          <FieldLabel>Username</FieldLabel>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value.username}
              onChange={(event) =>
                onChange({
                  ...value,
                  username: event.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9_-]/g, ''),
                })
              }
              placeholder="jane-studio"
              className="pl-9"
            />
          </div>
          {usernameError ? <FieldError>{usernameError}</FieldError> : null}
        </Field>

        <Field>
          <FieldLabel>Display name</FieldLabel>
          <Input
            value={value.name}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            placeholder="Jane Studio"
          />
        </Field>

        <Field>
          <FieldLabel>Title</FieldLabel>
          <Input
            value={value.title}
            onChange={(event) =>
              onChange({ ...value, title: event.target.value.slice(0, 80) })
            }
            placeholder="Independent designer"
          />
        </Field>

        <Field>
          <FieldLabel>Bio</FieldLabel>
          <Textarea
            value={value.bio}
            onChange={(event) =>
              onChange({ ...value, bio: event.target.value.slice(0, 160) })
            }
            placeholder="A short introduction that appears on your page."
            className="min-h-24"
          />
        </Field>
      </CardContent>
    </Card>
  )
}
