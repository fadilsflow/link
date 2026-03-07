import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  AtSign,
  CircleCheck,
  CircleX,
  Landmark,
  Plus,
  SearchIcon,
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
import { AppHeader, AppHeaderContent } from '@/components/app-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox'
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
import { Tabs, TabsList, TabsPanel, TabsTab } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { toastManager } from '@/components/ui/toast'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { adminAuthQueryKey, useAdminAuthContext } from '@/lib/admin-auth'
import { BASE_URL } from '@/lib/constans'
import { getReservedUsernameError } from '@/lib/reserved-usernames'

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
})

type BankOption = {
  value: string
  label: string
}

const BANK_OPTIONS: BankOption[] = [
  { value: 'bca', label: 'Bank Central Asia (BCA)' },
  { value: 'bni', label: 'Bank Negara Indonesia (BNI)' },
  { value: 'bri', label: 'Bank Rakyat Indonesia (BRI)' },
  { value: 'mandiri', label: 'Bank Mandiri' },
  { value: 'cimb', label: 'CIMB Niaga' },
  { value: 'permata', label: 'Bank Permata' },
  { value: 'danamon', label: 'Bank Danamon' },
  { value: 'jago', label: 'Bank Jago' },
]

const bankAccountSchema = z.object({
  bankCode: z.string().min(1, 'Please select a bank.'),
  bankName: z.string().trim().min(1, 'Please select a bank.'),
  accountName: z.string().trim().min(1, 'Account name is required.'),
  accountNumber: z
    .string()
    .trim()
    .min(1, 'Account number is required.')
    .regex(/^[0-9 ]+$/, 'Account number must contain digits only.'),
})

type BankAccountFormValues = z.infer<typeof bankAccountSchema>

type BankAccountFieldErrors = Partial<
  Record<keyof BankAccountFormValues, string>
>

type BankAccountRecord = {
  id: string
  bankCode: string
  bankName: string
  accountName: string
  accountNumber: string
}

type UsernameFormValues = {
  username: string
}

type UsernameFieldErrors = Partial<Record<keyof UsernameFormValues, string>>

const DEFAULT_FORM_VALUES: BankAccountFormValues = {
  bankCode: '',
  bankName: '',
  accountName: '',
  accountNumber: '',
}

const trackingIntegrationSchema = z.object({
  pixelId: z.string().trim().min(1, 'Pixel ID is required.'),
  accessToken: z.string().trim().min(1, 'Pixel Access Token is required.'),
})

type TrackingIntegrationFormValues = z.infer<typeof trackingIntegrationSchema>

type TrackingIntegrationFieldErrors = Partial<
  Record<keyof TrackingIntegrationFormValues, string>
>

const DEFAULT_TRACKING_FORM_VALUES: TrackingIntegrationFormValues = {
  pixelId: '',
  accessToken: '',
}

const DEFAULT_USERNAME_FORM_VALUES: UsernameFormValues = {
  username: '',
}

const PUBLIC_BASE_HOST = new URL(BASE_URL).host

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
        field === 'bankName' ||
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
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(
    null,
  )
  const [editingAccountId, setEditingAccountId] = React.useState<string | null>(
    null,
  )
  const [formValues, setFormValues] =
    React.useState<BankAccountFormValues>(DEFAULT_FORM_VALUES)
  const [formErrors, setFormErrors] = React.useState<BankAccountFieldErrors>({})
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = React.useState(false)
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
  const usernameInputRef = React.useRef<HTMLInputElement>(null)
  const bankDialogModeRef = React.useRef<'create' | 'edit'>('create')
  const bankAccountsQuery = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      return await trpcClient.bankAccount.list.query()
    },
    staleTime: 1000 * 30,
  })
  const connectedAccountsQuery = useQuery({
    queryKey: ['connected-accounts'],
    queryFn: async () => {
      return await trpcClient.connectedAccount.list.query()
    },
    staleTime: 1000 * 60 * 5,
  })
  const trackingIntegrationsQuery = useQuery({
    queryKey: ['tracking-integrations'],
    queryFn: async () => {
      return await trpcClient.trackingIntegration.list.query()
    },
    staleTime: 1000 * 30,
  })
  const accounts = bankAccountsQuery.data ?? []
  const connectedAccounts = connectedAccountsQuery.data ?? []
  const trackingConfig = trackingIntegrationsQuery.data ?? null

  const editingAccount = React.useMemo(
    () => accounts.find((account) => account.id === editingAccountId) ?? null,
    [accounts, editingAccountId],
  )

  const dialogTitle =
    bankDialogModeRef.current === 'edit'
      ? 'Edit bank account'
      : 'Add bank account'
  const trackingDialogTitle = 'Setup Facebook Pixel'
  const trackingDialogDescription =
    'Send ViewContent, InitiateCheckout, and Purchase events to Meta Ads.'
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
  const createBankAccountMutation = useMutation({
    mutationFn: async (data: BankAccountFormValues) => {
      return await trpcClient.bankAccount.create.mutate(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      toastManager.add({
        title: 'Bank account added',
        description: 'New payout account is ready to use.',
      })
      handleDialogChange(false)
    },
    onError: () => {
      toastManager.add({
        title: 'Unable to add bank account',
        description: 'Please check the details and try again.',
        type: 'error',
      })
    },
  })
  const updateBankAccountMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: BankAccountFormValues
    }) => {
      return await trpcClient.bankAccount.update.mutate({ id, data })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      toastManager.add({
        title: 'Bank account updated',
        description: 'Payout account details have been updated.',
      })
      handleDialogChange(false)
    },
    onError: () => {
      toastManager.add({
        title: 'Unable to update bank account',
        description: 'Please check the details and try again.',
        type: 'error',
      })
    },
  })
  const deleteBankAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      return await trpcClient.bankAccount.remove.mutate({ id })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bank-accounts'] })
      setDeleteTargetId(null)
      toastManager.add({
        title: 'Bank account removed',
        description: 'This payout account has been deleted.',
      })
    },
    onError: () => {
      toastManager.add({
        title: 'Unable to remove bank account',
        description: 'Please try again in a moment.',
        type: 'error',
      })
    },
  })
  const upsertTrackingIntegrationMutation = useMutation({
    mutationFn: async ({
      pixelId,
      accessToken,
    }: {
      pixelId: string
      accessToken: string
    }) => {
      return await trpcClient.trackingIntegration.upsert.mutate({
        pixelId,
        accessToken,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['tracking-integrations'],
      })
      toastManager.add({
        title: 'Tracking updated',
        description: 'Facebook Pixel configuration has been saved.',
      })
      handleTrackingDialogChange(false)
    },
    onError: () => {
      toastManager.add({
        title: 'Unable to save tracking',
        description: 'Please check Pixel ID and Access Token then try again.',
        type: 'error',
      })
    },
  })
  const removeTrackingIntegrationMutation = useMutation({
    mutationFn: async () => {
      return await trpcClient.trackingIntegration.remove.mutate()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['tracking-integrations'],
      })
      toastManager.add({
        title: 'Tracking removed',
        description: 'Facebook Pixel has been disconnected.',
      })
    },
    onError: () => {
      toastManager.add({
        title: 'Unable to remove tracking',
        description: 'Please try again in a moment.',
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
    bankDialogModeRef.current = 'create'
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
    setTrackingFormValues(DEFAULT_TRACKING_FORM_VALUES)
    setTrackingFormErrors({})
  }, [])

  const openEditDialog = React.useCallback((account: BankAccountRecord) => {
    bankDialogModeRef.current = 'edit'
    setEditingAccountId(account.id)
    setFormValues({
      bankCode: account.bankCode,
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
    })
    setFormErrors({})
    setIsDialogOpen(true)
  }, [])

  const openTrackingDialog = React.useCallback(() => {
    setTrackingFormValues({
      pixelId: trackingConfig?.pixelId ?? '',
      accessToken: trackingConfig?.accessToken ?? '',
    })
    setTrackingFormErrors({})
    setIsTrackingDialogOpen(true)
  }, [trackingConfig?.accessToken, trackingConfig?.pixelId])

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

  const selectedBank = React.useMemo<BankOption | null>(
    () =>
      BANK_OPTIONS.find((bank) => bank.value === formValues.bankCode) ?? null,
    [formValues.bankCode],
  )

  const handleBankSelection = React.useCallback((bank: BankOption | null) => {
    setFormValues((previous) => ({
      ...previous,
      bankCode: bank?.value ?? '',
      bankName: bank?.label ?? '',
    }))
    setFormErrors((previous) => {
      if (!previous.bankCode && !previous.bankName) return previous
      const next = { ...previous }
      delete next.bankCode
      delete next.bankName
      return next
    })
  }, [])

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

      if (editingAccount) {
        updateBankAccountMutation.mutate({
          id: editingAccount.id,
          data: parsed.data,
        })
        return
      }

      createBankAccountMutation.mutate(parsed.data)
    },
    [
      createBankAccountMutation,
      editingAccount,
      formValues,
      updateBankAccountMutation,
    ],
  )

  const handleSubmitTrackingIntegration = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const parsed = trackingIntegrationSchema.safeParse(trackingFormValues)
      if (!parsed.success) {
        const issuePath = parsed.error.issues[0]?.path[0]
        const message = parsed.error.issues[0]?.message ?? 'Field is required.'
        setTrackingFormErrors(
          issuePath === 'accessToken'
            ? { accessToken: message }
            : { pixelId: message },
        )
        toastManager.add({
          title: 'Check tracking details',
          description: 'Complete Pixel ID and Access Token before saving.',
          type: 'error',
        })
        return
      }

      upsertTrackingIntegrationMutation.mutate({
        pixelId: parsed.data.pixelId,
        accessToken: parsed.data.accessToken,
      })
    },
    [trackingFormValues, upsertTrackingIntegrationMutation],
  )

  const handleTrackingValueChange = React.useCallback(
    (field: 'pixelId' | 'accessToken', value: string) => {
      setTrackingFormValues((previous) => ({
        ...previous,
        [field]: value,
      }))
      setTrackingFormErrors((previous) => {
        if (!previous[field]) return previous
        const next = { ...previous }
        delete next[field]
        return next
      })
    },
    [],
  )

  const handleUsernameValueChange = React.useCallback((value: string) => {
    setUsernameFormValues({
      username: value.toLowerCase().replace(/[^a-z0-9._]/g, ''),
    })
    setUsernameFormErrors((previous) => {
      if (!previous.username) return previous
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

      if (
        normalizedUsername === (adminAuth?.username ?? '').trim().toLowerCase()
      ) {
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
    needsUsernameAvailabilityCheck && debouncedUsername !== normalizedUsername
  const isUsernameLoading =
    needsUsernameAvailabilityCheck &&
    (isUsernameDebouncing || isCheckingUsername)
  const usernameFailedMessage =
    usernameFormatError ??
    (!isUsernameLoading
      ? isUsernameUnavailable
        ? 'Username sudah ada, pakai username lain.'
        : isUsernameCheckError
          ? 'Gagal mengecek username. Coba lagi.'
          : null
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

  return (
    <div className="p-4 md:p-10 pb-20 pd:mb-0">
      <div className=" space-y-6">
        <AppHeader>
          <AppHeaderContent title="Settings" />
        </AppHeader>
        <Tabs defaultValue="tab-1">
          <TabsList>
            <TabsTab value="tab-1">Accounts</TabsTab>
            <TabsTab value="tab-2">Payment</TabsTab>
            <TabsTab value="tab-3">Integrations</TabsTab>
          </TabsList>
          <TabsPanel value="tab-1" className="space-y-6">
            <Frame>
              <FrameHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <FrameTitle className="text-lg">Profile</FrameTitle>
                  <FrameDescription>
                    Manage the username used for your public page.
                  </FrameDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openUsernameDialog}
                >
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
              <FrameHeader>
                <FrameTitle className="text-lg">Connected Account</FrameTitle>
                <FrameDescription>
                  Your sign-in provider connected to this account.
                </FrameDescription>
              </FrameHeader>
              <FramePanel className="space-y-3 min-h-32">
                {connectedAccountsQuery.isLoading ? (
                  <div className="h-24 w-full rounded-xl bg-muted/32" />
                ) : connectedAccounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-muted/32 p-5">
                    <p className="font-medium text-sm">
                      No connected provider found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This account has no linked sign-in provider record yet.
                    </p>
                  </div>
                ) : (
                  connectedAccounts.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border bg-muted/28 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-sm capitalize">
                              {item.providerId}
                            </p>
                            <Badge size="sm" variant="success">
                              Connected
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              {adminAuth?.email}
                            </p>
                            <p className="text-muted-foreground">
                              Account ID: {item.accountId}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-lg border bg-background px-3 py-2 text-right text-xs text-muted-foreground">
                          Sign in with {item.providerId}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </FramePanel>
            </Frame>
          </TabsPanel>
          <TabsPanel value="tab-2" className="space-y-6">
            <Frame>
              <FrameHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <FrameTitle className="text-lg">
                    Payout Bank Accounts
                  </FrameTitle>
                  <FrameDescription>
                    Save one or more bank accounts for withdrawals.
                  </FrameDescription>
                </div>
                <Button size="sm" onClick={openCreateDialog}>
                  <Plus />
                  Add account
                </Button>
              </FrameHeader>
              <FramePanel className="min-h-40 space-y-3">
                {bankAccountsQuery.isLoading ? (
                  <div className="h-30 w-full rounded-xl bg-muted/32" />
                ) : accounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed bg-muted/32 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg border bg-background p-2 text-muted-foreground">
                        <Landmark className="size-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">
                          No bank account yet
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Add at least one account so payout setup is ready when
                          you want to withdraw balance.
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
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-3">
                          <p className="font-medium text-sm">
                            {account.bankName}
                          </p>
                          <div className="space-y-1 text-sm">
                            <p className="text-foreground">
                              {account.accountName}
                            </p>
                            <p className="text-muted-foreground">
                              {maskAccountNumber(account.accountNumber)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(account)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteTargetId(account.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </FramePanel>
            </Frame>
          </TabsPanel>
          <TabsPanel value="tab-3" className="space-y-6">
            <Frame>
              <FrameHeader>
                <FrameTitle className="text-lg">Growth & Tracking</FrameTitle>
                <FrameDescription>
                  Connect Facebook Pixel to measure product views, checkout
                  starts, and purchases.
                </FrameDescription>
              </FrameHeader>
              <FramePanel className="space-y-3 min-h-40">
                {trackingIntegrationsQuery.isLoading ? (
                  <div className="h-30 w-full rounded-xl bg-muted/32" />
                ) : (
                  (() => {
                    const isConnected = Boolean(
                      trackingConfig?.pixelId && trackingConfig?.accessToken,
                    )

                    return (
                      <div className="rounded-xl border bg-muted/28 p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-sm">
                                Facebook Pixel
                              </p>
                              <Badge
                                size="sm"
                                variant={isConnected ? 'success' : 'outline'}
                              >
                                {isConnected ? 'Connected' : 'Not connected'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>
                                ViewContent and InitiateCheckout events are sent
                                from browser pixel.
                              </p>
                              <p>
                                Purchase is sent from browser + Meta Conversions
                                API with shared event_id.
                              </p>
                            </div>
                            <p className="text-sm text-foreground">
                              {trackingConfig?.pixelId
                                ? `Pixel ID: ${trackingConfig.pixelId}`
                                : 'No Pixel ID configured.'}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {isConnected ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                loading={
                                  removeTrackingIntegrationMutation.isPending
                                }
                                onClick={() =>
                                  removeTrackingIntegrationMutation.mutate()
                                }
                              >
                                Remove
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant={isConnected ? 'outline' : 'default'}
                              onClick={openTrackingDialog}
                            >
                              {isConnected ? 'Edit setup' : 'Setup'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })()
                )}
              </FramePanel>
            </Frame>
          </TabsPanel>
        </Tabs>
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
                  Preview: {BASE_URL.replace(/\/$/, '')}/
                  {usernameFormValues.username || 'username'}
                </FieldDescription>
                <FieldError>
                  {usernameFailedMessage || usernameFormErrors.username}
                </FieldError>
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
            </DialogHeader>

            <DialogPanel className="space-y-4">
              <Field name="bankCode">
                <FieldLabel>Bank</FieldLabel>
                <Combobox
                  autoHighlight
                  items={BANK_OPTIONS}
                  value={selectedBank}
                  onValueChange={(value) =>
                    handleBankSelection((value as BankOption | null) ?? null)
                  }
                >
                  <ComboboxTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-full justify-between font-normal"
                      />
                    }
                  >
                    <ComboboxValue placeholder="Select bank" />
                  </ComboboxTrigger>
                  <ComboboxPopup aria-label="Select bank">
                    <div className="border-b p-2">
                      <ComboboxInput
                        className="rounded-md before:rounded-[calc(var(--radius-md)-1px)]"
                        placeholder="Search bank"
                        showTrigger={false}
                        startAddon={<SearchIcon />}
                      />
                    </div>
                    <ComboboxEmpty>No banks found.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: BankOption) => (
                        <ComboboxItem key={item.value} value={item}>
                          {item.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxPopup>
                </Combobox>
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

                <FieldError />
              </Field>
            </DialogPanel>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                loading={
                  createBankAccountMutation.isPending ||
                  updateBankAccountMutation.isPending
                }
              >
                {bankDialogModeRef.current === 'edit'
                  ? 'Save changes'
                  : 'Add account'}
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
              loading={deleteBankAccountMutation.isPending}
              onClick={() => {
                if (!deleteTargetId) return
                deleteBankAccountMutation.mutate(deleteTargetId)
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
              <Field name="pixelId">
                <FieldLabel>Pixel ID</FieldLabel>
                <Input
                  value={trackingFormValues.pixelId}
                  onChange={(event) =>
                    handleTrackingValueChange('pixelId', event.target.value)
                  }
                  placeholder="123456789012345"
                />
                <FieldDescription>
                  Use your Pixel ID from Meta Events Manager.
                </FieldDescription>
                <FieldError />
              </Field>

              <Field name="accessToken">
                <FieldLabel>Pixel Access Token</FieldLabel>
                <Input
                  value={trackingFormValues.accessToken}
                  onChange={(event) =>
                    handleTrackingValueChange('accessToken', event.target.value)
                  }
                  placeholder="EAA..."
                />
                <FieldDescription>
                  Used for Purchase events sent through Meta Conversions API.
                </FieldDescription>
                <FieldError />
              </Field>
            </DialogPanel>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                loading={upsertTrackingIntegrationMutation.isPending}
              >
                Save setup
              </Button>
            </DialogFooter>
          </Form>
        </DialogPopup>
      </Dialog>
    </div>
  )
}
