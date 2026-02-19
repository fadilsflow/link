import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type ContactInformationCardProps = {
  email: string
  name: string
  note: string
  onEmailChange: (value: string) => void
  onNameChange: (value: string) => void
  onNoteChange: (value: string) => void
  additionalFields?: React.ReactNode
}

export function ContactInformationCard({
  email,
  name,
  note,
  onEmailChange,
  onNameChange,
  onNoteChange,
  additionalFields,
}: ContactInformationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium text-slate-600">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium text-slate-600">
              Full name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
        </div>

        {additionalFields}

        <div className="space-y-2 pt-2">
          <Label htmlFor="note" className="text-xs font-medium text-slate-600">
            Note to seller <span className="text-slate-400">(optional)</span>
          </Label>
          <Textarea
            id="note"
            rows={2}
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="Any special requests..."
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  )
}
