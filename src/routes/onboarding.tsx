import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CircleUserRound,
  PartyPopper,
  UserRound,
} from 'lucide-react'
import { z } from 'zod'
import type { AdminAuthContextData } from '@/lib/admin-auth'
import { adminAuthQueryKey } from '@/lib/admin-auth'
import { LogoStudioSidebar } from '@/components/kreasi-logo'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { cn } from '@/lib/utils'

const onboardingPages = ['username', 'role', 'details', 'finish'] as const

type OnboardingPage = (typeof onboardingPages)[number]

type OnboardingState = {
  username: string | null
  title: string | null
  name: string
  bio: string | null
  image: string | null
}

const onboardingSearchSchema = z.object({
  page: z.enum(onboardingPages).optional(),
})

const stepItems: Array<{
  page: OnboardingPage
  label: string
  icon: React.ReactNode
}> = [
  {
    page: 'username',
    label: 'Username',
    icon: <UserRound className="size-4" />,
  },
  {
    page: 'role',
    label: 'Role',
    icon: <BriefcaseBusiness className="size-4" />,
  },
  {
    page: 'details',
    label: 'Details',
    icon: <CircleUserRound className="size-4" />,
  },
  {
    page: 'finish',
    label: 'Finish',
    icon: <PartyPopper className="size-4" />,
  },
]

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function getFirstIncompletePage(state: OnboardingState): OnboardingPage {
  if (!hasValue(state.username)) return 'username'
  if (!hasValue(state.title)) return 'role'
  if (!hasValue(state.name)) return 'details'
  return 'finish'
}

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
  validateSearch: (search) => {
    const parsed = onboardingSearchSchema.safeParse(search)
    if (!parsed.success) return {}
    return parsed.data
  },
  beforeLoad: async () => {
    const status = await checkOnboardingStatus()

    if (!status.isLoggedIn) {
      throw redirect({ to: '/' })
    }
  },
})

function OnboardingPage() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const queryClient = useQueryClient()

  const [username, setUsername] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [bio, setBio] = React.useState('')
  const [avatarUrl, setAvatarUrl] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const currentPage = search.page ?? 'username'

  const { data: onboardingState, isLoading } = useQuery({
    queryKey: ['onboarding-state'],
    queryFn: () => trpcClient.onboarding.getState.query(),
    refetchOnWindowFocus: false,
  })

  React.useEffect(() => {
    if (!onboardingState) return
    setUsername((prev) => prev || onboardingState.username || '')
    setTitle((prev) => prev || onboardingState.title || '')
    setDisplayName((prev) => prev || onboardingState.name || '')
    setBio((prev) => prev || onboardingState.bio || '')
    setAvatarUrl((prev) => prev || onboardingState.image || '')
  }, [onboardingState])

  const saveStepMutation = useMutation({
    mutationFn: (
      payload:
        | { step: 'username'; username: string }
        | { step: 'role'; title: string }
        | {
            step: 'details'
            details: {
              displayName: string
              bio?: string
              avatarUrl?: string
            }
          }
        | { step: 'finish' },
    ) => trpcClient.onboarding.saveStep.mutate(payload),
    onSuccess: (nextState, variables) => {
      queryClient.setQueryData(['onboarding-state'], nextState)

      // Keep sidebar auth context in sync without requiring a full refresh.
      queryClient.setQueryData(
        adminAuthQueryKey(),
        (previous: AdminAuthContextData | undefined) => {
          if (!previous) return previous

          if (variables.step === 'username') {
            return { ...previous, username: variables.username }
          }

        if (variables.step === 'details') {
          return {
            ...previous,
            name: variables.details.displayName,
            image: variables.details.avatarUrl || null,
          }
        }

          return previous
        },
      )
    },
  })

  const normalizedState: OnboardingState = {
    username: onboardingState?.username ?? null,
    title: onboardingState?.title ?? null,
    name: onboardingState?.name ?? '',
    bio: onboardingState?.bio ?? null,
    image: onboardingState?.image ?? null,
  }

  const firstIncompletePage = getFirstIncompletePage(normalizedState)
  const currentPageIndex = onboardingPages.indexOf(currentPage)
  const maxAllowedPageIndex = onboardingPages.indexOf(firstIncompletePage)

  React.useEffect(() => {
    if (isLoading || !onboardingState) return
    if (currentPageIndex <= maxAllowedPageIndex) return

    navigate({
      search: { page: firstIncompletePage },
      replace: true,
    })
  }, [
    currentPageIndex,
    firstIncompletePage,
    isLoading,
    maxAllowedPageIndex,
    navigate,
    onboardingState,
  ])

  const goToPage = (page: OnboardingPage, replace = false) => {
    navigate({ search: { page }, replace })
  }

  const nextPage =
    onboardingPages[Math.min(currentPageIndex + 1, onboardingPages.length - 1)]
  const previousPage = onboardingPages[Math.max(currentPageIndex - 1, 0)]

  const validateUsername = (value: string): string | null => {
    if (!value) return 'Username wajib diisi'
    if (value.length < 3) return 'Username minimal 3 karakter'
    if (value.length > 30) return 'Username maksimal 30 karakter'
    if (!/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/.test(value)) {
      return 'Gunakan huruf kecil, angka, underscore, atau dash'
    }
    return null
  }

  const handleNext = async () => {
    setErrorMessage(null)

    try {
      if (currentPage === 'username') {
        const normalizedUsername = username.trim().toLowerCase()
        const validationError = validateUsername(normalizedUsername)
        if (validationError) {
          setErrorMessage(validationError)
          return
        }

        await saveStepMutation.mutateAsync({
          step: 'username',
          username: normalizedUsername,
        })
        goToPage(nextPage)
        return
      }

      if (currentPage === 'role') {
        const nextTitle = title.trim()
        if (!nextTitle) {
          setErrorMessage('Role wajib diisi')
          return
        }

        await saveStepMutation.mutateAsync({
          step: 'role',
          title: nextTitle,
        })
        goToPage(nextPage)
        return
      }

      if (currentPage === 'details') {
        const nextDisplayName = displayName.trim()
        if (!nextDisplayName) {
          setErrorMessage('Display name wajib diisi')
          return
        }

        await saveStepMutation.mutateAsync({
          step: 'details',
          details: {
            displayName: nextDisplayName,
            bio: bio.trim(),
            avatarUrl: avatarUrl.trim(),
          },
        })
        goToPage(nextPage)
        return
      }

      await saveStepMutation.mutateAsync({ step: 'finish' })
      await queryClient.invalidateQueries({ queryKey: adminAuthQueryKey() })
      navigate({ to: '/admin/editor/profiles' })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      )
    }
  }

  const canGoBack = currentPage !== 'username'
  const previewUsername = username.trim().toLowerCase()
  const profileUrl =
    previewUsername.length > 0
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/@${previewUsername}`
      : '/@username'

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-5">
          <LogoStudioSidebar className="justify-start" />
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/admin/editor/profiles' })}
          >
            Skip
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-col px-6 py-8 md:py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          {stepItems.map((step, index) => {
            const stepIndex = onboardingPages.indexOf(step.page)
            const isActive = step.page === currentPage
            const isCompleted = stepIndex < currentPageIndex

            return (
              <div
                key={step.page}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
                  isActive && 'bg-muted',
                  isCompleted && 'bg-background',
                  !isActive && !isCompleted && 'bg-background',
                )}
              >
                <span
                  className={cn(
                    'inline-flex size-4 items-center justify-center rounded-full',
                    isActive && 'bg-foreground text-background',
                    isCompleted && 'bg-foreground text-background',
                    !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="size-3" /> : step.icon}
                </span>
                <span>{step.label}</span>
                {index < stepItems.length - 1 && <span className="sr-only">step</span>}
              </div>
            )
          })}
        </div>

        <section className="w-full rounded-xl border bg-card p-6 sm:p-8">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">
              {currentPage === 'username' && 'Choose your username'}
              {currentPage === 'role' && 'What do you do?'}
              {currentPage === 'details' && 'Complete your profile'}
              {currentPage === 'finish' && 'You are ready to go'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              {currentPage === 'username' &&
                'Buat handle unik untuk link publik kamu.'}
              {currentPage === 'role' &&
                'Tambahkan title supaya pengunjung langsung paham keahlianmu.'}
              {currentPage === 'details' &&
                'Isi informasi penting agar profile terlihat profesional.'}
              {currentPage === 'finish' &&
                'Profil kamu sudah siap. Lanjutkan ke dashboard untuk mulai setup halaman.'}
            </p>
          </div>

          <div className="mt-8 max-w-xl space-y-4">
            {currentPage === 'username' && (
              <Field>
                <FieldLabel>Username</FieldLabel>
                <Input
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                    if (errorMessage) setErrorMessage(null)
                  }}
                  placeholder="yourname"
                  autoFocus
                  disabled={saveStepMutation.isPending}
                  aria-invalid={!!errorMessage}
                />
                <FieldDescription>Gunakan 3-30 karakter.</FieldDescription>
                <FieldDescription>Preview: {profileUrl}</FieldDescription>
              </Field>
            )}

            {currentPage === 'role' && (
              <Field>
                <FieldLabel>Title / Role</FieldLabel>
                <Input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  placeholder="Designer, Creator, Product Manager"
                  autoFocus
                  disabled={saveStepMutation.isPending}
                  aria-invalid={!!errorMessage}
                />
              </Field>
            )}

            {currentPage === 'details' && (
              <>
                <Field>
                  <FieldLabel>Avatar URL</FieldLabel>
                  <Input
                    value={avatarUrl}
                    onChange={(event) => {
                      setAvatarUrl(event.target.value)
                      if (errorMessage) setErrorMessage(null)
                    }}
                    placeholder="https://..."
                    disabled={saveStepMutation.isPending}
                    aria-invalid={!!errorMessage}
                  />
                </Field>

                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 border bg-background">
                      {avatarUrl.trim().length > 0 && <AvatarImage src={avatarUrl.trim()} />}
                      <AvatarFallback>
                        {displayName.trim().slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">
                        {displayName.trim() || 'Your Name'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {title.trim() || 'Your role'}
                      </p>
                    </div>
                  </div>
                </div>

                <Field>
                  <FieldLabel>Display Name</FieldLabel>
                  <Input
                    value={displayName}
                    onChange={(event) => {
                      setDisplayName(event.target.value)
                      if (errorMessage) setErrorMessage(null)
                    }}
                    placeholder="Nama yang akan tampil di profil"
                    autoFocus
                    disabled={saveStepMutation.isPending}
                    aria-invalid={!!errorMessage}
                  />
                </Field>

                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={bio}
                    onChange={(event) => {
                      setBio(event.target.value)
                      if (errorMessage) setErrorMessage(null)
                    }}
                    placeholder="Ceritakan secara singkat tentang kamu"
                    disabled={saveStepMutation.isPending}
                    aria-invalid={!!errorMessage}
                    maxLength={300}
                  />
                  <FieldDescription>{bio.length}/300 karakter</FieldDescription>
                </Field>
              </>
            )}

            {currentPage === 'finish' && (
              <div className="rounded-lg border bg-muted/50 p-5 text-left">
                <p className="text-sm font-semibold">
                  Selamat, profil kamu berhasil dibuat.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Username: @{normalizedState.username ?? (previewUsername || 'username')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Public URL: {profileUrl}
                </p>
              </div>
            )}

            {errorMessage && <FieldError>{errorMessage}</FieldError>}
          </div>

          <div className="mt-10 flex max-w-xl flex-col gap-3">
            <Button
              className="h-11 w-full"
              onClick={handleNext}
              loading={saveStepMutation.isPending}
            >
              {currentPage === 'finish' ? 'Go to dashboard' : 'Next'}
              {currentPage !== 'finish' && <ArrowRight className="size-4" />}
            </Button>

            {canGoBack && (
              <Button
                variant="secondary"
                className="h-11 w-full"
                onClick={() => goToPage(previousPage)}
                disabled={saveStepMutation.isPending}
              >
                Back
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
