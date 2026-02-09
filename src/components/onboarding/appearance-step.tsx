import { Check } from 'lucide-react'
import { APPEARANCE_PRESETS } from './types'
import type { OnboardingAppearanceForm, OnboardingProfileForm } from './types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface OnboardingAppearanceStepProps {
  value: OnboardingAppearanceForm
  profile: OnboardingProfileForm
  onChange: (value: OnboardingAppearanceForm) => void
}

export function OnboardingAppearanceStep({
  value,
  profile,
  onChange,
}: OnboardingAppearanceStepProps) {
  const selectedPreset = APPEARANCE_PRESETS[value.palette]

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Color palette</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(APPEARANCE_PRESETS).map(([key, preset]) => {
              const isActive = value.palette === key
              return (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  onClick={() =>
                    onChange({ ...value, palette: key as OnboardingAppearanceForm['palette'] })
                  }
                  className="h-auto flex-col items-start gap-3 p-3 text-left"
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex gap-1">
                      <span
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: preset.bgColor }}
                      />
                      <span
                        className="h-5 w-5 rounded-full border"
                        style={{ backgroundColor: preset.blockColor }}
                      />
                    </div>
                    {isActive ? <Check className="size-4" /> : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.label}</p>
                  </div>
                </Button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
          <div>
            <Label htmlFor="shadow-style" className="text-sm font-medium">
              Elevated cards
            </Label>
            <p className="text-xs text-muted-foreground">
              Toggle subtle shadows for depth.
            </p>
          </div>
          <Switch
            id="shadow-style"
            checked={value.blockStyle === 'shadow'}
            onCheckedChange={(checked) =>
              onChange({
                ...value,
                blockStyle: checked ? 'shadow' : 'flat',
              })
            }
          />
        </div>

        <div
          className="rounded-xl border p-5"
          style={{ backgroundColor: selectedPreset.bgColor }}
        >
          <div
            className="mx-auto max-w-sm rounded-xl border p-4"
            style={{
              backgroundColor: selectedPreset.blockColor,
              borderRadius: value.blockRadius === 'rounded' ? '16px' : '4px',
              boxShadow:
                value.blockStyle === 'shadow'
                  ? '0 12px 32px rgba(15, 23, 42, 0.12)'
                  : 'none',
            }}
          >
            <p className="text-sm font-semibold text-foreground">
              {profile.name || 'Your name'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.title || 'Your title'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
