import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  Upload,
  X,
} from 'lucide-react'
import { z } from 'zod'
import type { AdminAuthContextData } from '@/lib/admin-auth'
import { adminAuthQueryKey } from '@/lib/admin-auth'
import { LogoMark } from '@/components/kreasi-logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { checkOnboardingStatus } from '@/lib/onboarding-server'
import { uploadFile } from '@/lib/upload-client'
import { cn } from '@/lib/utils'

const onboardingPages = ['welcome', 'username', 'role', 'details', 'finish'] as const

type OnboardingPage = (typeof onboardingPages)[number]

type SaveStepPayload =
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
  | { step: 'finish' }

type OnboardingState = {
  username: string | null
  title: string | null
  name: string
  bio: string | null
  image: string | null
}

type StepMeta = {
  page: OnboardingPage
  title: string
  description: string
}

const onboardingSearchSchema = z.object({
  page: z.enum(onboardingPages).optional(),
})

const stepItems: Array<StepMeta> = [
  {
    page: 'welcome',
    title: 'Welcome to Kreasi',
    description: 'Setup profilmu dalam beberapa langkah singkat.',
  },
  {
    page: 'username',
    title: 'Choose your username',
    description: 'Buat handle unik untuk link publik kamu.',
  },
  {
    page: 'role',
    title: 'What do you do?',
    description: 'Tambahkan title supaya pengunjung langsung paham keahlianmu.',
  },
  {
    page: 'details',
    title: 'Complete your profile',
    description: 'Upload avatar, isi display name, dan deskripsi singkat.',
  },
  {
    page: 'finish',
    title: 'You are ready to go',
    description: 'Profil kamu sudah siap. Lanjutkan ke dashboard.',
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

function validateUsername(value: string): string | null {
  if (!value) return 'Username wajib diisi'
  if (value.length < 3) return 'Username minimal 3 karakter'
  if (value.length > 30) return 'Username maksimal 30 karakter'
  if (!/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/.test(value)) {
    return 'Gunakan huruf kecil, angka, underscore, atau dash'
  }
  return null
}

function Stepper({
  currentPage,
  onBackToStep,
  disabled,
}: {
  currentPage: OnboardingPage
  onBackToStep: (page: OnboardingPage) => void
  disabled: boolean
}) {
  const currentPageIndex = onboardingPages.indexOf(currentPage)

  return (
    <div className="mt-10 flex items-center justify-center gap-5">
      {stepItems.map((step) => {
        const stepIndex = onboardingPages.indexOf(step.page)
        const isCompleted = stepIndex < currentPageIndex
        const isCurrent = stepIndex === currentPageIndex
        const canGoBack = isCompleted && !disabled

        return (
          <button
            type="button"
            key={step.page}
            onClick={() => canGoBack && onBackToStep(step.page)}
            disabled={!canGoBack}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              isCurrent
                ? 'bg-foreground'
                : isCompleted
                  ? 'bg-foreground'
                  : 'bg-muted-foreground/30',
              canGoBack ? 'cursor-pointer hover:bg-foreground/80' : 'cursor-not-allowed',
            )}
            aria-current={stepIndex === currentPageIndex ? 'step' : undefined}
            aria-label={isCurrent ? `Current step: ${step.title}` : `Go back to ${step.title}`}
          />
        )
      })}
    </div>
  )
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
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)
  const [transitionDirection, setTransitionDirection] = React.useState<1 | -1>(1)

  const currentPage = search.page ?? 'welcome'
  const currentStep = stepItems.find((step) => step.page === currentPage) ?? stepItems[0]
  const currentPageIndex = onboardingPages.indexOf(currentPage)

  const { data: onboardingState } = useQuery({
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

  React.useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl)
      }
    }
  }, [avatarPreviewUrl])

  const saveStepMutation = useMutation({
    mutationFn: (payload: SaveStepPayload) =>
      trpcClient.onboarding.saveStep.mutate(payload),
    onSuccess: (nextState, variables) => {
      queryClient.setQueryData(['onboarding-state'], nextState)

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

  const localState: OnboardingState = {
    username: username.trim() || normalizedState.username,
    title: title.trim() || normalizedState.title,
    name: displayName.trim() || normalizedState.name,
    bio: bio.trim() || normalizedState.bio,
    image: avatarUrl.trim() || normalizedState.image,
  }

  const firstIncompletePage = getFirstIncompletePage(localState)
  const maxAllowedPageIndex = onboardingPages.indexOf(firstIncompletePage)

  React.useEffect(() => {
    if (currentPageIndex <= maxAllowedPageIndex) return

    navigate({
      search: { page: firstIncompletePage },
      replace: true,
    })
  }, [
    currentPageIndex,
    firstIncompletePage,
    maxAllowedPageIndex,
    navigate,
  ])

  const goToPage = (page: OnboardingPage, replace = false) => {
    const nextIndex = onboardingPages.indexOf(page)
    setTransitionDirection(nextIndex >= currentPageIndex ? 1 : -1)
    navigate({ search: { page }, replace })
  }

  const nextPage =
    onboardingPages[Math.min(currentPageIndex + 1, onboardingPages.length - 1)]
  const isBusy = saveStepMutation.isPending || isUploadingAvatar

  const previewUsername = username.trim().toLowerCase()
  const profileUrl =
    previewUsername.length > 0
      ? `${typeof window !== 'undefined' ? window.location.origin : ''}/@${previewUsername}`
      : '/@username'
  const resolvedAvatarPreview = avatarPreviewUrl || avatarUrl || ''

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('File avatar harus berupa gambar')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Ukuran avatar maksimal 5MB')
      return
    }

    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl)
    }

    setAvatarFile(file)
    setAvatarPreviewUrl(URL.createObjectURL(file))
    setErrorMessage(null)
  }

  const clearAvatarSelection = () => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl)
    }
    setAvatarFile(null)
    setAvatarPreviewUrl('')
    setAvatarUrl('')
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

      if (currentPage === 'welcome') {
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

        let nextAvatarUrl = avatarUrl.trim()
        if (avatarFile) {
          setIsUploadingAvatar(true)
          nextAvatarUrl = await uploadFile(avatarFile, 'avatars')
          setAvatarUrl(nextAvatarUrl)
          setAvatarFile(null)
          if (avatarPreviewUrl) {
            URL.revokeObjectURL(avatarPreviewUrl)
          }
          setAvatarPreviewUrl('')
          setIsUploadingAvatar(false)
        }

        await saveStepMutation.mutateAsync({
          step: 'details',
          details: {
            displayName: nextDisplayName,
            bio: bio.trim(),
            avatarUrl: nextAvatarUrl,
          },
        })
        goToPage(nextPage)
        return
      }

      await saveStepMutation.mutateAsync({ step: 'finish' })
      await queryClient.invalidateQueries({ queryKey: adminAuthQueryKey() })
      navigate({ to: '/admin/editor/profiles' })
    } catch (error) {
      setIsUploadingAvatar(false)
      setErrorMessage(
        error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.',
      )
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">


      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10">
        {/* <div className="flex justify-center"><LogoMark size={35} className=" mb-10" /></div> */}

        <div className="w-full max-w-md">

          <section className="rounded-xl p-6 sm:p-8">

            <div>
              {currentPage === 'welcome' && (
                <div className="flex justify-center mb-4">
                  <LogoMark size={44} />
                </div>
              )}
              <h1 className="text-2xl font-semibold sm:text-3xl text-center">{currentStep.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base text-center">
                {currentStep.description}
              </p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentPage}
                className="mt-8 space-y-4"
                initial={{ opacity: 0, x: transitionDirection > 0 ? 28 : -28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: transitionDirection > 0 ? -28 : 28 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
                {currentPage === 'welcome' && (
                  <div className="flex flex-col items-center rounded-lg border bg-muted/30 px-6 py-8 text-center">
                    <LogoMark size={44} className="mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Build halaman link kamu dalam hitungan menit.
                    </p>
                  </div>
                )}

                {currentPage === 'username' && (
                  <Field>
                    <FieldLabel>Username</FieldLabel>
                    <Input
                      value={username}
                      onChange={(event) => {
                        setUsername(
                          event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                        )
                        if (errorMessage) setErrorMessage(null)
                      }}
                      placeholder="yourname"
                      autoFocus
                      disabled={isBusy}
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
                      disabled={isBusy}
                      aria-invalid={!!errorMessage}
                    />
                  </Field>
                )}

                {currentPage === 'details' && (
                  <>
                    <Field>
                      <FieldLabel>Avatar</FieldLabel>
                      <div className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar className="size-12 border bg-background">
                          {resolvedAvatarPreview ? <AvatarImage src={resolvedAvatarPreview} /> : null}
                          <AvatarFallback>
                            {displayName.trim().slice(0, 2).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                            <Upload className="size-4" />
                            Upload Avatar
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleAvatarChange}
                              disabled={isBusy}
                            />
                          </label>

                          {(avatarFile || avatarUrl) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={clearAvatarSelection}
                              disabled={isBusy}
                            >
                              <X className="size-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      <FieldDescription>JPG, PNG, WEBP. Maksimal 5MB.</FieldDescription>
                    </Field>

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
                        disabled={isBusy}
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
                        disabled={isBusy}
                        aria-invalid={!!errorMessage}
                        maxLength={300}
                      />
                      <FieldDescription>{bio.length}/300 karakter</FieldDescription>
                    </Field>
                  </>
                )}

                {currentPage === 'finish' && (
                  <div className="rounded-lg border bg-muted/50 p-5 text-left">
                    <p className="text-sm font-semibold">Selamat, profil kamu berhasil dibuat.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Username: @{localState.username ?? (previewUsername || 'username')}
                    </p>
                    <p className="text-sm text-muted-foreground">Public URL: {profileUrl}</p>
                  </div>
                )}

                {errorMessage && <FieldError>{errorMessage}</FieldError>}
              </motion.div>
            </AnimatePresence>

            <div className="mt-10">
              <Button
                onClick={handleNext}
                disabled={isBusy}
                className='w-full'
                size='lg'
              >
                {currentPage === 'welcome'
                  ? 'Get started'
                  : currentPage === 'finish'
                    ? 'Go to dashboard'
                    : 'Continue'}
              </Button>
            </div>
            <div className="absolute bottom-8 right-0 left-0">
              <Stepper
                currentPage={currentPage}
                onBackToStep={(page) => goToPage(page)}
                disabled={isBusy}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
