import { createFileRoute, redirect } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import type {
  OnboardingAppearanceForm,
  OnboardingProfileForm,
  OnboardingSocialForm,
} from '@/components/onboarding/types'
import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { authClient } from '@/lib/auth-client'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import { OnboardingAppearanceStep } from '@/components/onboarding/appearance-step'
import { OnboardingProfileStep } from '@/components/onboarding/profile-step'
import { OnboardingSocialStep } from '@/components/onboarding/social-step'
import { APPEARANCE_PRESETS } from '@/components/onboarding/types'

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
  beforeLoad: async () => {
    const status = await checkOnboardingStatus()

    if (!status.isLoggedIn) {
      throw redirect({ to: '/' })
    }

    if (status.hasUsername && status.user.username) {
      throw redirect({
        to: '/$username/admin/editor/profiles',
        params: { username: status.user.username },
      })
    }
  },
})

function OnboardingPage() {
  const navigate = Route.useNavigate()

  const [profile, setProfile] = useState<OnboardingProfileForm>({
    username: '',
    name: '',
    title: '',
    bio: '',
  })
  const [social, setSocial] = useState<OnboardingSocialForm>({
    twitter: '',
    instagram: '',
    linkedin: '',
    website: '',
  })
  const [appearance, setAppearance] = useState<OnboardingAppearanceForm>({
    palette: 'sand',
    blockStyle: 'flat',
    blockRadius: 'rounded',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [formError, setFormError] = useState('')

  const profileUrlPreview = useMemo(() => {
    if (!profile.username) return ''
    return `/${profile.username}`
  }, [profile.username])

  const validateUsername = (value: string): string | null => {
    if (!value) return 'Username is required.'
    if (value.length < 3) return 'Username must have at least 3 characters.'
    if (value.length > 30) return 'Username must be less than 30 characters.'
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Use letters, numbers, underscore, or dash only.'
    }
    return null
  }

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return ''
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    setUsernameError('')
    setFormError('')

    const validationError = validateUsername(profile.username)
    if (validationError) {
      setUsernameError(validationError)
      return
    }

    if (!profile.name.trim()) {
      setFormError('Display name is required.')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: session } = await authClient.getSession()
      const userId = session?.user.id

      if (!userId) {
        throw new Error('User session not found.')
      }

      await trpcClient.user.updateUsername.mutate({
        userId,
        username: profile.username,
      })

      const selectedPreset = APPEARANCE_PRESETS[appearance.palette]
      await trpcClient.user.updateProfile.mutate({
        userId,
        name: profile.name.trim(),
        title: profile.title.trim(),
        bio: profile.bio.trim(),
        appearanceBgType: 'banner',
        appearanceBgColor: selectedPreset.bgColor,
        appearanceBlockColor: selectedPreset.blockColor,
        appearanceBlockStyle: appearance.blockStyle,
        appearanceBlockRadius: appearance.blockRadius,
      })

      const links = [
        { platform: 'twitter', url: normalizeUrl(social.twitter) },
        { platform: 'instagram', url: normalizeUrl(social.instagram) },
        { platform: 'linkedin', url: normalizeUrl(social.linkedin) },
        { platform: 'website', url: normalizeUrl(social.website) },
      ].filter((item) => item.url)

      await Promise.all(
        links.map((item) =>
          trpcClient.socialLink.create.mutate({
            userId,
            platform: item.platform,
            url: item.url,
          }),
        ),
      )

      navigate({
        to: '/$username/admin/editor/profiles',
        params: { username: profile.username },
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F7F4] px-4 py-8 sm:px-6 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 max-w-2xl space-y-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            Welcome
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Build your profile in a few thoughtful steps.
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Start with your profile, connect your socials, and choose an understated
            visual style.
          </p>
          {profileUrlPreview ? (
            <p className="text-sm text-foreground">
              Your page preview: <span className="font-medium">{profileUrlPreview}</span>
            </p>
          ) : null}
        </div>

        <Form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <OnboardingProfileStep
              value={profile}
              onChange={setProfile}
              usernameError={usernameError}
            />
            <OnboardingSocialStep value={social} onChange={setSocial} />
          </section>

          <section className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <OnboardingAppearanceStep
              value={appearance}
              profile={profile}
              onChange={setAppearance}
            />

            <div className="rounded-xl border border-border/70 bg-card/90 p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">
                You can change all of these details later from the editor.
              </p>
              <Separator className="my-4" />
              {formError ? (
                <p className="mb-3 text-sm text-red-600">{formError}</p>
              ) : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Creating your page...' : 'Continue to editor'}
              </Button>
            </div>
          </section>
        </Form>
      </div>
    </main>
  )
}
