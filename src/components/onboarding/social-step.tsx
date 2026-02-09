import { Globe, Instagram, Linkedin, Twitter } from 'lucide-react'
import type { OnboardingSocialForm } from './types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface OnboardingSocialStepProps {
  value: OnboardingSocialForm
  onChange: (value: OnboardingSocialForm) => void
}

function SocialInput({
  icon,
  label,
  placeholder,
  value,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  placeholder: string
  value: string
  onChange: (nextValue: string) => void
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pl-9"
          placeholder={placeholder}
        />
      </div>
    </Field>
  )
}

export function OnboardingSocialStep({
  value,
  onChange,
}: OnboardingSocialStepProps) {
  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Social links</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <SocialInput
          icon={<Twitter className="size-4" />}
          label="X / Twitter"
          placeholder="https://x.com/username"
          value={value.twitter}
          onChange={(twitter) => onChange({ ...value, twitter })}
        />
        <SocialInput
          icon={<Instagram className="size-4" />}
          label="Instagram"
          placeholder="https://instagram.com/username"
          value={value.instagram}
          onChange={(instagram) => onChange({ ...value, instagram })}
        />
        <SocialInput
          icon={<Linkedin className="size-4" />}
          label="LinkedIn"
          placeholder="https://linkedin.com/in/username"
          value={value.linkedin}
          onChange={(linkedin) => onChange({ ...value, linkedin })}
        />
        <SocialInput
          icon={<Globe className="size-4" />}
          label="Website"
          placeholder="https://yourstudio.com"
          value={value.website}
          onChange={(website) => onChange({ ...value, website })}
        />
      </CardContent>
    </Card>
  )
}
