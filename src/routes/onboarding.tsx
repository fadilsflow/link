import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
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

// Direction context so child knows which way to animate
const DirectionContext = React.createContext<'forward' | 'backward'>('forward')

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
    <div className="flex items-center justify-center gap-5">
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

// Variants that respond to direction
const slideVariants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 40 : -40,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? -40 : 40,
    opacity: 0,
    scale: 0.98,
  }),
}

const slideTransition = {
  duration: 0.22,
  ease: [0.32, 0.72, 0, 1] as const, // custom ease: fast out, smooth
}

// Stagger children inside each card
const contentVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.055 + 0.05, duration: 0.2, ease: 'easeOut' as const },
  }),
}

function AnimatedField({
  index,
  children,
}: {
  index: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      custom={index}
      variants={contentVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  )
}

// Shake animation for errors
const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -4, 4, 0],
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
}

function OnboardingPage() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const queryClient = useQueryClient()
  const shouldReduceMotion = useReducedMotion()

  const [username, setUsername] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [bio, setBio] = React.useState('')
  const [avatarUrl, setAvatarUrl] = React.useState('')
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false)

  // Track direction for animation
  const [direction, setDirection] = React.useState<'forward' | 'backward'>('forward')

  const currentPage = search.page ?? 'welcome'
  const currentStep = stepItems.find((step) => step.page === currentPage) ?? stepItems[0]
  const currentPageIndex = onboardingPages.indexOf(currentPage)

  const { data: onboardingState } = useQuery({
    queryKey: ['onboarding-state'],
    queryFn: () => trpcClient.onboarding.getState.query(),
    refetchOnWindowFocus: false,
    // Use stale data immediately — no loading spinner needed
    staleTime: Infinity,
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
    const targetIndex = onboardingPages.indexOf(page)
    setDirection(targetIndex > currentPageIndex ? 'forward' : 'backward')
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

        // Navigate immediately (optimistic), save in background
        goToPage(nextPage)
        await saveStepMutation.mutateAsync({
          step: 'username',
          username: normalizedUsername,
        })
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

        // Navigate immediately (optimistic), save in background
        goToPage(nextPage)
        await saveStepMutation.mutateAsync({
          step: 'role',
          title: nextTitle,
        })
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

        // Navigate immediately (optimistic), save in background
        goToPage(nextPage)
        await saveStepMutation.mutateAsync({
          step: 'details',
          details: {
            displayName: nextDisplayName,
            bio: bio.trim(),
            avatarUrl: nextAvatarUrl,
          },
        })
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
    <DirectionContext.Provider value={direction}>
      <div className="bg-background text-foreground flex flex-col">
        <main className="min-h-screen flex-1 flex flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-md relative overflow-hidden">
            <AnimatePresence
              mode="wait"
              initial={false}
              custom={direction}
            >
              <motion.div
                key={currentPage}
                custom={direction}
                variants={shouldReduceMotion ? {} : slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={slideTransition}
                className="rounded-xl p-6 sm:p-8 bg-background"
              >
                <div>
                  {currentPage === 'welcome' && (
                    <AnimatedField index={0}>
                      <div className="flex justify-center mb-4">
                        <motion.div
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.05, duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
                        >
                          <LogoMark size={104} />
                        </motion.div>
                      </div>
                    </AnimatedField>
                  )}
                  <AnimatedField index={currentPage === 'welcome' ? 1 : 0}>
                    <h1 className="text-2xl font-semibold sm:text-3xl text-center">{currentStep.title}</h1>
                  </AnimatedField>
                  <AnimatedField index={currentPage === 'welcome' ? 2 : 1}>
                    <p className="mt-2 text-sm text-muted-foreground sm:text-base text-center">
                      {currentStep.description}
                    </p>
                  </AnimatedField>
                </div>

                <div className="mt-8 space-y-4">
                  {currentPage === 'username' && (
                    <AnimatedField index={2}>
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
                    </AnimatedField>
                  )}

                  {currentPage === 'role' && (
                    <AnimatedField index={2}>
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
                    </AnimatedField>
                  )}

                  {currentPage === 'details' && (
                    <>
                      <AnimatedField index={2}>
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
                      </AnimatedField>

                      <AnimatedField index={3}>
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
                      </AnimatedField>

                      <AnimatedField index={4}>
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
                      </AnimatedField>
                    </>
                  )}

                  {currentPage === 'finish' && (
                    <AnimatedField index={2}>
                      <div className="rounded-lg border bg-muted/50 p-5 text-left">
                        <p className="text-sm font-semibold">Selamat, profil kamu berhasil dibuat.</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Username: @{localState.username ?? (previewUsername || 'username')}
                        </p>
                        <p className="text-sm text-muted-foreground">Public URL: {profileUrl}</p>
                      </div>
                    </AnimatedField>
                  )}

                  <AnimatePresence mode="wait">
                    {errorMessage && (
                      <motion.div
                        key={errorMessage}
                        variants={shakeVariants}
                        initial="idle"
                        animate="shake"
                      >
                        <FieldError>{errorMessage}</FieldError>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <AnimatedField index={currentPage === 'details' ? 5 : 3}>
                  <div className="mt-10">
                    <motion.div
                      whileTap={isBusy ? {} : { scale: 0.97 }}
                      transition={{ duration: 0.1 }}
                    >
                      <Button
                        onClick={handleNext}
                        disabled={isBusy}
                        className='w-full text-xl py-6 opacity-90'
                        loading={isBusy}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={currentPage + (isBusy ? '-busy' : '')}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                          >
                            {isBusy
                              ? '...'
                              : currentPage === 'welcome'
                                ? 'Get started'
                                : currentPage === 'finish'
                                  ? 'Go to dashboard'
                                  : 'Continue'}
                          </motion.span>
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </div>
                </AnimatedField>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper - no animation, unchanged */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <Stepper
              currentPage={currentPage}
              onBackToStep={(page) => goToPage(page)}
              disabled={isBusy}
            />
          </div>
        </main>
      </div>
    </DirectionContext.Provider>
  )
}