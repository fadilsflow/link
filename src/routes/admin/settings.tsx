import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  AtSign,
  CircleCheck,
  CircleX,
  Landmark,
  PencilLine,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { z } from 'zod'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  AppHeader,
  AppHeaderContent,
} from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Form } from '@/components/ui/form'
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/ui/frame'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { toastManager } from '@/components/ui/toast'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { adminAuthQueryKey, useAdminAuthContext } from '@/lib/admin-auth'
import { authClient } from '@/lib/auth-client'
import { BASE_URL } from '@/lib/constans'
import { getReservedUsernameError } from '@/lib/reserved-usernames'

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
})

const BANK_OPTIONS = [
  { value: 'bca', label: 'Bank Central Asia (BCA)' },
  { value: 'bni', label: 'Bank Negara Indonesia (BNI)' },
  { value: 'bri', label: 'Bank Rakyat Indonesia (BRI)' },
  { value: 'mandiri', label: 'Bank Mandiri' },
  { value: 'cimb', label: 'CIMB Niaga' },
  { value: 'permata', label: 'Bank Permata' },
  { value: 'danamon', label: 'Bank Danamon' },
  { value: 'jago', label: 'Bank Jago' },
] as const

const bankAccountSchema = z.object({
  bankCode: z.string().min(1, 'Please select a bank.'),
  accountName: z.string().trim().min(1, 'Account name is required.'),
  accountNumber: z
    .string()
    .trim()
    .min(1, 'Account number is required.')
    .regex(/^[0-9 ]+$/, 'Account number must contain digits only.'),
})

type BankAccountFormValues = z.infer<typeof bankAccountSchema>

type BankAccountFieldErrors = Partial<Record<keyof BankAccountFormValues, string>>

type BankAccountRecord = {
  id: string
  bankCode: string
  bankName: string
  accountName: string
  accountNumber: string
  isPrimary: boolean
}

type TrackingProvider = 'google-analytics' | 'facebook-pixel'

type TrackingIntegration = {
  provider: TrackingProvider
  name: string
  description: string
  placeholder: string
  value: string
}

type UsernameFormValues = {
  username: string
}

type UsernameFieldErrors = Partial<Record<keyof UsernameFormValues, string>>

type DeleteAccountFormValues = {
  token: string
}

type DeleteAccountFieldErrors = Partial<
  Record<keyof DeleteAccountFormValues, string>
>

const DEFAULT_FORM_VALUES: BankAccountFormValues = {
  bankCode: '',
  accountName: '',
  accountNumber: '',
}

const trackingIntegrationSchema = z.object({
  value: z.string().trim().min(1, 'Tracking ID is required.'),
})

type TrackingIntegrationFormValues = z.infer<typeof trackingIntegrationSchema>

type TrackingIntegrationFieldErrors = Partial<
  Record<keyof TrackingIntegrationFormValues, string>
>

const DEFAULT_TRACKING_FORM_VALUES: TrackingIntegrationFormValues = {
  value: '',
}

const DEFAULT_USERNAME_FORM_VALUES: UsernameFormValues = {
  username: '',
}

const DEFAULT_DELETE_ACCOUNT_FORM_VALUES: DeleteAccountFormValues = {
  token: '',
}

const DEFAULT_TRACKING_INTEGRATIONS: Array<TrackingIntegration> = [
  {
    provider: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track visitors, page views, and conversions from Google Analytics.',
    placeholder: 'G-XXXXXXXXXX',
    value: '',
  },
  {
    provider: 'facebook-pixel',
    name: 'Facebook Pixel',
    description: 'Send events to Meta Ads for retargeting and campaign measurement.',
    placeholder: '123456789012345',
    value: '',
  },
]

const PUBLIC_BASE_HOST = new URL(BASE_URL).host

function getBankLabel(bankCode: string): string {
  return BANK_OPTIONS.find((bank) => bank.value === bankCode)?.label ?? bankCode
}

function normalizeAccountNumber(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function maskAccountNumber(value: string): string {
  const compact = value.replace(/\s+/g, '')
  if (compact.length <= 4) return compact
  return `**** ${compact.slice(-4)}`
}

function mapZodIssuesToFieldErrors(
  issues: z.ZodIssue[],
): BankAccountFieldErrors {
  const nextErrors: BankAccountFieldErrors = {}

  for (const issue of issues) {
    const field = issue.path[0]
    if (
      typeof field === 'string' &&
      (field === 'bankCode' ||
        field === 'accountName' ||
        field === 'accountNumber') &&
      !nextErrors[field]
    ) {
      nextErrors[field] = issue.message
    }
  }

  return nextErrors
}

function validateUsername(value: string): string | null {
  if (!value) return 'Username wajib diisi'
  if (value.length < 4 || value.length > 25) {
    return 'Username must be 4-25 characters long.'
  }
  if (!/^[a-z0-9._]+$/.test(value)) {
    return 'Username can only contain letters, numbers, periods, and underscores.'
  }
  const reservedError = getReservedUsernameError(value)
  if (reservedError) return reservedError
  return null
}

function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: adminAuth } = useAdminAuthContext()
  const [accounts, setAccounts] = React.useState<Array<BankAccountRecord>>([])
  const [trackingIntegrations, setTrackingIntegrations] = React.useState<
    Array<TrackingIntegration>
  >(DEFAULT_TRACKING_INTEGRATIONS)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null)
  const [editingAccountId, setEditingAccountId] = React.useState<string | null>(
    null,
  )
  const [formValues, setFormValues] = React.useState<BankAccountFormValues>(
    DEFAULT_FORM_VALUES,
  )
  const [formErrors, setFormErrors] = React.useState<BankAccountFieldErrors>({})
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = React.useState(false)
  const [editingTrackingProvider, setEditingTrackingProvider] =
    React.useState<TrackingProvider | null>(null)
  const [trackingFormValues, setTrackingFormValues] =
    React.useState<TrackingIntegrationFormValues>(DEFAULT_TRACKING_FORM_VALUES)
  const [trackingFormErrors, setTrackingFormErrors] =
    React.useState<TrackingIntegrationFieldErrors>({})
  const [isUsernameDialogOpen, setIsUsernameDialogOpen] = React.useState(false)
  const [usernameFormValues, setUsernameFormValues] =
    React.useState<UsernameFormValues>(DEFAULT_USERNAME_FORM_VALUES)
  const [usernameFormErrors, setUsernameFormErrors] =
    React.useState<UsernameFieldErrors>({})
  const [debouncedUsername, setDebouncedUsername] = React.useState('')
  const [isDeleteAccountDialogOpen, setIsDeleteAccountDialogOpen] =
    React.useState(false)
  const [deleteAccountFormValues, setDeleteAccountFormValues] =
    React.useState<DeleteAccountFormValues>(DEFAULT_DELETE_ACCOUNT_FORM_VALUES)
  const [deleteAccountFormErrors, setDeleteAccountFormErrors] =
    React.useState<DeleteAccountFieldErrors>({})
  const usernameInputRef = React.useRef<HTMLInputElement>(null)

  const editingAccount = React.useMemo(
    () => accounts.find((account) => account.id === editingAccountId) ?? null,
    [accounts, editingAccountId],
  )
  const editingTrackingIntegration = React.useMemo(
    () =>
      trackingIntegrations.find(
        (integration) => integration.provider === editingTrackingProvider,
      ) ?? null,
    [editingTrackingProvider, trackingIntegrations],
  )

  const dialogTitle = editingAccount ? 'Edit bank account' : 'Add bank account'
  const dialogDescription = editingAccount
    ? 'Update the account details used for future payouts.'
    : 'Add a payout destination. You can save more than one bank account.'
  const trackingDialogTitle = editingTrackingIntegration
    ? `Setup ${editingTrackingIntegration.name}`
    : 'Setup tracking'
  const trackingDialogDescription = editingTrackingIntegration
    ? editingTrackingIntegration.description
    : 'Connect your analytics and marketing tools.'
  const profileUrl = adminAuth?.username
    ? `${BASE_URL.replace(/\/$/, '')}/${adminAuth.username}`
    : `${BASE_URL.replace(/\/$/, '')}/username`
  const deleteTarget = React.useMemo(
    () => accounts.find((account) => account.id === deleteTargetId) ?? null,
    [accounts, deleteTargetId],
  )
  const normalizedUsername = usernameFormValues.username.trim().toLowerCase()
  const currentSavedUsername = adminAuth?.username?.trim().toLowerCase() ?? ''
  const usernameFormatError =
    normalizedUsername.length > 0 ? validateUsername(normalizedUsername) : null
  const needsUsernameAvailabilityCheck =
    normalizedUsername.length > 0 &&
    !usernameFormatError &&
    normalizedUsername !== currentSavedUsername
  const usernameMutation = useMutation({
    mutationFn: async (username: string) => {
      return await trpcClient.user.setUsername.mutate({ username })
    },
    onSuccess: (_, username) => {
      queryClient.setQueryData(
        adminAuthQueryKey(),
        (previous: typeof adminAuth | undefined) =>
          previous
            ? {
              ...previous,
              username,
            }
            : previous,
      )
      toastManager.add({
        title: 'Username updated',
        description: 'Your public profile username has been saved.',
      })
      setIsUsernameDialogOpen(false)
      setUsernameFormErrors({})
    },
    onError: (error) => {
      const message =
        error instanceof Error && error.message.toLowerCase().includes('taken')
          ? 'Username sudah ada, pakai username lain.'
          : 'Gagal menyimpan username. Coba lagi.'
      setUsernameFormErrors({ username: message })
      toastManager.add({
        title: 'Unable to update username',
        description: message,
        type: 'error',
      })
    },
  })
  const requestDeleteAccountTokenMutation = useMutation({
    mutationFn: async () => {
      await authClient.deleteUser({
        callbackURL: '/',
      })
    },
    onSuccess: () => {
      setDeleteAccountFormErrors({})
      toastManager.add({
        title: 'Delete token sent',
        description: 'Check your email and paste the token below to continue.',
      })
    },
    onError: () => {
      toastManager.add({
        title: 'Unable to send delete token',
        description: 'Please try again in a moment.',
        type: 'error',
      })
    },
  })
  const confirmDeleteAccountMutation = useMutation({
    mutationFn: async (token: string) => {
      await authClient.deleteUser({
        token,
      })
    },
    onSuccess: () => {
      toastManager.add({
        title: 'Account deleted',
        description: 'Your account has been deleted.',
      })
      window.location.href = '/'
    },
    onError: () => {
      setDeleteAccountFormErrors({
        token: 'Invalid token. Check the latest email and try again.',
      })
      toastManager.add({
        title: 'Unable to delete account',
        description: 'The token is invalid or expired.',
        type: 'error',
      })
    },
  })
  const {
    data: usernameAvailability,
    isFetching: isCheckingUsername,
    isError: isUsernameCheckError,
  } = useQuery({
    queryKey: ['username-availability', debouncedUsername],
    queryFn: async () => {
      const existing = await trpcClient.user.getByUsername.query({
        username: debouncedUsername,
      })
      return { isAvailable: !existing }
    },
    enabled:
      needsUsernameAvailabilityCheck &&
      debouncedUsername.length > 0 &&
      debouncedUsername === normalizedUsername,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const resetDialogState = React.useCallback(() => {
    setEditingAccountId(null)
    setFormValues(DEFAULT_FORM_VALUES)
    setFormErrors({})
  }, [])

  const openCreateDialog = React.useCallback(() => {
    resetDialogState()
    setIsDialogOpen(true)
  }, [resetDialogState])

  const openUsernameDialog = React.useCallback(() => {
    setUsernameFormValues({
      username: adminAuth?.username ?? '',
    })
    setDebouncedUsername(adminAuth?.username ?? '')
    setUsernameFormErrors({})
    setIsUsernameDialogOpen(true)
  }, [adminAuth?.username])

  const resetTrackingDialogState = React.useCallback(() => {
    setEditingTrackingProvider(null)
    setTrackingFormValues(DEFAULT_TRACKING_FORM_VALUES)
    setTrackingFormErrors({})
  }, [])

  const openEditDialog = React.useCallback((account: BankAccountRecord) => {
    setEditingAccountId(account.id)
    setFormValues({
      bankCode: account.bankCode,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }, [])

  const openTrackingDialog = React.useCallback(
    (provider: TrackingProvider) => {
      const integration = trackingIntegrations.find(
        (item) => item.provider === provider,
      )
      if (!integration) return

      setEditingTrackingProvider(provider)
      setTrackingFormValues({
        value: integration.value,
      })
      setTrackingFormErrors({})
      setIsTrackingDialogOpen(true)
    },
    [trackingIntegrations],
  )

  const handleDialogChange = React.useCallback(
    (open: boolean) => {
      setIsDialogOpen(open)
      if (!open) resetDialogState()
    },
    [resetDialogState],
  )

  const handleTrackingDialogChange = React.useCallback(
    (open: boolean) => {
      setIsTrackingDialogOpen(open)
      if (!open) resetTrackingDialogState()
    },
    [resetTrackingDialogState],
  )

  const handleUsernameDialogChange = React.useCallback((open: boolean) => {
    setIsUsernameDialogOpen(open)
    if (!open) {
      setUsernameFormErrors({})
    }
  }, [])

  const handleDeleteAccountDialogChange = React.useCallback((open: boolean) => {
    setIsDeleteAccountDialogOpen(open)
    if (!open) {
      setDeleteAccountFormValues(DEFAULT_DELETE_ACCOUNT_FORM_VALUES)
      setDeleteAccountFormErrors({})
    }
  }, [])

  const handleFieldChange = React.useCallback(
    <K extends keyof BankAccountFormValues>(
      field: K,
      value: BankAccountFormValues[K],
    ) => {
      setFormValues((previous) => ({
        ...previous,
        [field]:
          field === 'accountNumber' ? normalizeAccountNumber(value) : value,
      }))
      setFormErrors((previous) => {
        if (!previous[field]) return previous
        const next = { ...previous }
        delete next[field]
        return next
      })
    },
    [],
  )

  const handleSubmitBankAccount = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const parsed = bankAccountSchema.safeParse({
        ...formValues,
        accountNumber: normalizeAccountNumber(formValues.accountNumber),
      })

      if (!parsed.success) {
        setFormErrors(mapZodIssuesToFieldErrors(parsed.error.issues))
        toastManager.add({
          title: 'Check bank account details',
          description: 'Complete all required fields before saving.',
          type: 'error',
        })
        return
      }

      const nextAccount: BankAccountRecord = {
        id: editingAccount?.id ?? crypto.randomUUID(),
        bankCode: parsed.data.bankCode,
        bankName: getBankLabel(parsed.data.bankCode),
        accountName: parsed.data.accountName,
        accountNumber: parsed.data.accountNumber,
        isPrimary: editingAccount?.isPrimary ?? accounts.length === 0,
      }

      setAccounts((previous) => {
        if (editingAccount) {
          return previous.map((account) =>
            account.id === editingAccount.id ? nextAccount : account,
          )
        }

        return [...previous, nextAccount]
      })

      toastManager.add({
        title: editingAccount ? 'Bank account updated' : 'Bank account added',
        description: editingAccount
          ? 'Payout account details have been updated.'
          : 'New payout account is ready to use.',
      })

      handleDialogChange(false)
    },
    [accounts.length, editingAccount, formValues, handleDialogChange],
  )

  const handleSubmitTrackingIntegration = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const parsed = trackingIntegrationSchema.safeParse(trackingFormValues)
      if (!parsed.success) {
        setTrackingFormErrors({
          value: parsed.error.issues[0]?.message ?? 'Tracking ID is required.',
        })
        toastManager.add({
          title: 'Check tracking details',
          description: 'Complete the tracking ID before saving.',
          type: 'error',
        })
        return
      }

      if (!editingTrackingProvider) return

      setTrackingIntegrations((previous) =>
        previous.map((integration) =>
          integration.provider === editingTrackingProvider
            ? {
              ...integration,
              value: parsed.data.value,
            }
            : integration,
        ),
      )

      toastManager.add({
        title: 'Tracking updated',
        description: 'Your tracking integration has been saved.',
      })

      handleTrackingDialogChange(false)
    },
    [
      editingTrackingProvider,
      handleTrackingDialogChange,
      trackingFormValues,
    ],
  )

  const handleDeleteAccount = React.useCallback((accountId: string) => {
    setAccounts((previous) => {
      const target = previous.find((account) => account.id === accountId)
      const remaining = previous.filter((account) => account.id !== accountId)

      if (target?.isPrimary && remaining.length > 0) {
        return remaining.map((account, index) => ({
          ...account,
          isPrimary: index === 0,
        }))
      }

      return remaining
    })

    toastManager.add({
      title: 'Bank account removed',
      description: 'This payout account has been deleted.',
    })
  }, [])

  const handleMakePrimary = React.useCallback((accountId: string) => {
    setAccounts((previous) =>
      previous.map((account) => ({
        ...account,
        isPrimary: account.id === accountId,
      })),
    )

    toastManager.add({
      title: 'Primary account updated',
      description: 'Future payouts will use this bank account by default.',
    })
  }, [])

  const handleTrackingValueChange = React.useCallback((value: string) => {
    setTrackingFormValues({ value })
    setTrackingFormErrors((previous) => {
      if (!previous.value) return previous
      return {}
    })
  }, [])

  const handleUsernameValueChange = React.useCallback((value: string) => {
    setUsernameFormValues({
      username: value.toLowerCase().replace(/[^a-z0-9._]/g, ''),
    })
    setUsernameFormErrors((previous) => {
      if (!previous.username) return previous
      return {}
    })
  }, [])

  const handleDeleteAccountTokenChange = React.useCallback((value: string) => {
    setDeleteAccountFormValues({
      token: value.trim(),
    })
    setDeleteAccountFormErrors((previous) => {
      if (!previous.token) return previous
      return {}
    })
  }, [])

  const handleSubmitUsername = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const usernameError = validateUsername(normalizedUsername)
      const isUsernameAvailable =
        normalizedUsername === currentSavedUsername
          ? true
          : usernameAvailability?.isAvailable === true
      const isUsernameUnavailable = usernameAvailability?.isAvailable === false
      const isUsernameDebouncing =
        needsUsernameAvailabilityCheck &&
        debouncedUsername !== normalizedUsername
      const isUsernameBlocked =
        !!usernameError ||
        normalizedUsername.length === 0 ||
        isUsernameDebouncing ||
        isCheckingUsername ||
        isUsernameCheckError ||
        isUsernameUnavailable ||
        (!isUsernameAvailable && needsUsernameAvailabilityCheck)

      if (isUsernameBlocked) {
        const message =
          usernameError ??
          (isUsernameUnavailable
            ? 'Username sudah ada, pakai username lain.'
            : isUsernameCheckError
              ? 'Gagal mengecek username. Coba lagi.'
              : 'Username belum siap disimpan.')
        setUsernameFormErrors({ username: message })
        toastManager.add({
          title: 'Check username',
          description: message,
          type: 'error',
        })
        return
      }

      if (normalizedUsername === (adminAuth?.username ?? '').trim().toLowerCase()) {
        setIsUsernameDialogOpen(false)
        return
      }

      usernameMutation.mutate(normalizedUsername)
    },
    [
      currentSavedUsername,
      debouncedUsername,
      isCheckingUsername,
      isUsernameCheckError,
      needsUsernameAvailabilityCheck,
      normalizedUsername,
      usernameAvailability?.isAvailable,
      usernameMutation,
    ],
  )

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedUsername(normalizedUsername)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [normalizedUsername])

  const isUsernameAvailable =
    normalizedUsername === currentSavedUsername
      ? true
      : usernameAvailability?.isAvailable === true
  const isUsernameUnavailable = usernameAvailability?.isAvailable === false
  const isUsernameDebouncing =
    needsUsernameAvailabilityCheck &&
    debouncedUsername !== normalizedUsername
  const isUsernameLoading =
    needsUsernameAvailabilityCheck && (isUsernameDebouncing || isCheckingUsername)
  const usernameFailedMessage = usernameFormatError
    ?? (!isUsernameLoading
      ? (isUsernameUnavailable
        ? 'Username sudah ada, pakai username lain.'
        : isUsernameCheckError
          ? 'Gagal mengecek username. Coba lagi.'
          : null)
      : null)
  const usernameStatus: 'idle' | 'loading' | 'success' | 'failed' =
    normalizedUsername.length === 0
      ? 'idle'
      : isUsernameLoading
        ? 'loading'
        : usernameFailedMessage
          ? 'failed'
          : isUsernameAvailable
            ? 'success'
            : 'idle'
  const isUsernameSaveBlocked =
    !!usernameFormatError ||
    normalizedUsername.length === 0 ||
    isUsernameDebouncing ||
    isCheckingUsername ||
    isUsernameCheckError ||
    isUsernameUnavailable ||
    (!isUsernameAvailable && needsUsernameAvailabilityCheck)

  React.useEffect(() => {
    if (!usernameInputRef.current) return
    usernameInputRef.current.setCustomValidity(usernameFailedMessage ?? '')
  }, [usernameFailedMessage])

  const handleSubmitDeleteAccount = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const token = deleteAccountFormValues.token.trim()
      if (!token) {
        setDeleteAccountFormErrors({ token: 'Delete token is required.' })
        toastManager.add({
          title: 'Enter delete token',
          description: 'Paste the token sent to your email before continuing.',
          type: 'error',
        })
        return
      }

      confirmDeleteAccountMutation.mutate(token)
    },
    [confirmDeleteAccountMutation, deleteAccountFormValues.token],
  )

  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-2xl space-y-6">
        <AppHeader>
          <AppHeaderContent title="Settings" />
        </AppHeader>

        <Frame>
          <FrameHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <FrameTitle className="text-lg">Profile</FrameTitle>
              <FrameDescription>
                Manage the username used for your public page.
              </FrameDescription>
            </div>
            <Button size="sm" variant="outline" onClick={openUsernameDialog}>
              <PencilLine />
              Edit username
            </Button>
          </FrameHeader>
          <FramePanel>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg border bg-muted/48 p-2 text-muted-foreground">
                    <AtSign className="size-4" />
                  </div>
                  <p className="font-medium text-sm">
                    @{adminAuth?.username ?? 'username'}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {profileUrl}
                </p>
              </div>
            </div>
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <FrameTitle className="text-lg">Payout Bank Accounts</FrameTitle>
              <FrameDescription>
                Save one or more bank accounts for withdrawals and choose which
                one should be the default payout destination.
              </FrameDescription>
            </div>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus />
              Add account
            </Button>
          </FrameHeader>
          <FramePanel className="space-y-3">
            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/32 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border bg-background p-2 text-muted-foreground">
                    <Landmark className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm">No bank account yet</p>
                    <p className="text-sm text-muted-foreground">
                      Add at least one account so payout setup is ready when you
                      want to withdraw balance.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-xl border bg-muted/28 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm">{account.bankName}</p>
                        {account.isPrimary ? (
                          <Badge size="sm" variant="info">
                            <ShieldCheck className="size-3" />
                            Primary
                          </Badge>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="text-foreground">{account.accountName}</p>
                        <p className="text-muted-foreground">
                          {maskAccountNumber(account.accountNumber)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {!account.isPrimary ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMakePrimary(account.id)}
                        >
                          Set primary
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(account)}
                      >
                        <PencilLine />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTargetId(account.id)}
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader>
            <FrameTitle className="text-lg">Growth & Tracking</FrameTitle>
            <FrameDescription>
              Connect analytics and ads tracking IDs to measure traffic and
              campaign performance.
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="space-y-3">
            {trackingIntegrations.map((integration) => {
              const isConnected = integration.value.trim().length > 0

              return (
                <div
                  key={integration.provider}
                  className="rounded-xl border bg-muted/28 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm">{integration.name}</p>
                        <Badge
                          size="sm"
                          variant={isConnected ? 'success' : 'outline'}
                        >
                          {isConnected ? 'Connected' : 'Not connected'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          {integration.description}
                        </p>
                        <p className="text-sm text-foreground">
                          {isConnected ? integration.value : 'No tracking ID added yet.'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant={isConnected ? 'outline' : 'default'}
                      onClick={() => openTrackingDialog(integration.provider)}
                    >
                      <PencilLine />
                      {isConnected ? 'Edit setup' : 'Setup'}
                    </Button>
                  </div>
                </div>
              )
            })}
          </FramePanel>
        </Frame>

        <Frame>
          <FrameHeader>
            <FrameTitle className="text-lg text-destructive">Danger Zone</FrameTitle>
            <FrameDescription>
              Permanently delete your account after confirming through email.
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-sm">Delete account</p>
              <p className="text-sm text-muted-foreground">
                We will send a delete token to {adminAuth?.email ?? 'your email'}.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteAccountDialogOpen(true)}
            >
              Delete account
            </Button>
          </FramePanel>
        </Frame>
      </div>

      <Dialog
        open={isUsernameDialogOpen}
        onOpenChange={handleUsernameDialogChange}
      >
        <DialogPopup className="sm:max-w-md">
          <Form
            className="contents"
            errors={usernameFormErrors}
            onSubmit={handleSubmitUsername}
          >
            <DialogHeader>
              <DialogTitle>Edit username</DialogTitle>
              <DialogDescription>
                Use the same username rules as onboarding. This updates your
                public profile URL.
              </DialogDescription>
            </DialogHeader>

            <DialogPanel className="space-y-4">
              <Field name="username">
                <FieldLabel className="sr-only">Username</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    ref={usernameInputRef}
                    name="username"
                    value={usernameFormValues.username}
                    onChange={(event) =>
                      handleUsernameValueChange(event.target.value)
                    }
                    required
                    minLength={4}
                    maxLength={25}
                    pattern="^[a-z0-9._]+$"
                    className="*:[input]:ps-0!"
                    placeholder="yourname"
                    autoFocus
                    aria-invalid={usernameFailedMessage ? true : undefined}
                  />
                  <InputGroupAddon>{PUBLIC_BASE_HOST}/</InputGroupAddon>
                  <InputGroupAddon align="inline-end">
                    {usernameStatus === 'loading' ? (
                      <Spinner className="mx-0 h-4 w-4 text-muted-foreground" />
                    ) : null}
                    {usernameStatus === 'success' ? (
                      <CircleCheck className="size-4 fill-emerald-600 text-white dark:fill-emerald-400" />
                    ) : null}
                    {usernameStatus === 'failed' ? (
                      <CircleX className="size-4 fill-red-500 text-white" />
                    ) : null}
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>
                  Preview: {BASE_URL.replace(/\/$/, '')}/{usernameFormValues.username || 'username'}
                </FieldDescription>
                <FieldError>{usernameFailedMessage || usernameFormErrors.username}</FieldError>
              </Field>
            </DialogPanel>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                loading={usernameMutation.isPending}
                disabled={isUsernameSaveBlocked}
              >
                Save username
              </Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogPopup className="sm:max-w-md">
          <Form
            className="contents"
            errors={formErrors}
            onSubmit={handleSubmitBankAccount}
          >
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
              <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>

            <DialogPanel className="space-y-4">
              <Field name="bankCode">
                <FieldLabel>Bank</FieldLabel>
                <Select
                  value={formValues.bankCode}
                  onValueChange={(value) =>
                    handleFieldChange('bankCode', value || '')
                  }
                >
                  <SelectTrigger aria-invalid={formErrors.bankCode ? true : undefined}>
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_OPTIONS.map((bank) => (
                      <SelectItem key={bank.value} value={bank.value}>
                        {bank.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError />
              </Field>

              <Field name="accountName">
                <FieldLabel>Account name</FieldLabel>
                <Input
                  value={formValues.accountName}
                  onChange={(event) =>
                    handleFieldChange('accountName', event.target.value)
                  }
                  placeholder="Name on bank account"
                />
                <FieldError />
              </Field>

              <Field name="accountNumber">
                <FieldLabel>Account number</FieldLabel>
                <Input
                  inputMode="numeric"
                  value={formValues.accountNumber}
                  onChange={(event) =>
                    handleFieldChange('accountNumber', event.target.value)
                  }
                  placeholder="0123456789"
                />
                <FieldDescription>
                  Enter the destination account number for payouts.
                </FieldDescription>
                <FieldError />
              </Field>
            </DialogPanel>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button type="submit">
                {editingAccount ? 'Save changes' : 'Add account'}
              </Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>

      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
      >
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bank account?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will remove ${deleteTarget.bankName} ending in ${maskAccountNumber(deleteTarget.accountNumber)} from your payout settings.`
                : 'This bank account will be removed from your payout settings.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" />}>
              Cancel
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteTargetId) return
                handleDeleteAccount(deleteTargetId)
                setDeleteTargetId(null)
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      <Dialog
        open={isTrackingDialogOpen}
        onOpenChange={handleTrackingDialogChange}
      >
        <DialogPopup className="sm:max-w-md">
          <Form
            className="contents"
            errors={trackingFormErrors}
            onSubmit={handleSubmitTrackingIntegration}
          >
            <DialogHeader>
              <DialogTitle>{trackingDialogTitle}</DialogTitle>
              <DialogDescription>{trackingDialogDescription}</DialogDescription>
            </DialogHeader>

            <DialogPanel className="space-y-4">
              <Field name="value">
                <FieldLabel>Tracking ID</FieldLabel>
                <Input
                  value={trackingFormValues.value}
                  onChange={(event) =>
                    handleTrackingValueChange(event.target.value)
                  }
                  placeholder={
                    editingTrackingIntegration?.placeholder ?? 'Enter tracking ID'
                  }
                />
                <FieldDescription>
                  {editingTrackingIntegration?.provider === 'google-analytics'
                    ? 'Use your Measurement ID from Google Analytics.'
                    : 'Use your Pixel ID from Meta Events Manager.'}
                </FieldDescription>
                <FieldError />
              </Field>
            </DialogPanel>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button type="submit">Save setup</Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>

      <Dialog
        open={isDeleteAccountDialogOpen}
        onOpenChange={handleDeleteAccountDialogChange}
      >
        <DialogPopup className="sm:max-w-md">
          <Form
            className="contents"
            errors={deleteAccountFormErrors}
            onSubmit={handleSubmitDeleteAccount}
          >
            <DialogHeader>
              <DialogTitle>Delete your account</DialogTitle>
              <DialogDescription>
                Send a verification token to {adminAuth?.email ?? 'your email'},
                then paste it here to permanently delete your account.
              </DialogDescription>
            </DialogHeader>

            <DialogPanel className="space-y-4">
              <Field name="token">
                <FieldLabel>Delete token</FieldLabel>
                <Input
                  value={deleteAccountFormValues.token}
                  onChange={(event) =>
                    handleDeleteAccountTokenChange(event.target.value)
                  }
                  placeholder="Paste token from email"
                />
                <FieldDescription>
                  Use the latest token from the delete account email.
                </FieldDescription>
                <FieldError>{deleteAccountFormErrors.token}</FieldError>
              </Field>
            </DialogPanel>

            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="outline"
                loading={requestDeleteAccountTokenMutation.isPending}
                onClick={() => requestDeleteAccountTokenMutation.mutate()}
              >
                Send token
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <DialogClose render={<Button variant="ghost" />}>
                  Cancel
                </DialogClose>
                <Button
                  type="submit"
                  variant="destructive"
                  loading={confirmDeleteAccountMutation.isPending}
                >
                  Delete account
                </Button>
              </div>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
