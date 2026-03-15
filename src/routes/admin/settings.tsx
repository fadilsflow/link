import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
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
  {
    "value": "aceh",
    "label": "PT. BANK ACEH"
  },
  {
    "value": "aceh_syar",
    "label": "PT. BPD ISTIMEWA ACEH SYARIAH"
  },
  {
    "value": "agris",
    "label": "PT BANK IBK INDONESIA TBK"
  },
  {
    "value": "agroniaga",
    "label": "PT. BANK RAYA INDONESIA, TBK"
  },
  {
    "value": "aladin_syar",
    "label": "PT. BANK ALADIN SYARIAH TBK"
  },
  {
    "value": "allo",
    "label": "PT. ALLO BANK INDONESIA TBK."
  },
  {
    "value": "amar",
    "label": "PT. BANK AMAR INDONESIA"
  },
  {
    "value": "andara",
    "label": "PT. BANK ANDARA"
  },
  {
    "value": "anglomas",
    "label": "PT. BANK AMAR INDONESIA"
  },
  {
    "value": "antar_daerah",
    "label": "PT. BANK ANTAR DAERAH"
  },
  {
    "value": "anz",
    "label": "PT. BANK ANZ INDONESIA"
  },
  {
    "value": "artajasa",
    "label": "PT. ARTAJASA"
  },
  {
    "value": "artha",
    "label": "PT. BANK ARTHA GRAHA INTERNASIONAL TBK."
  },
  {
    "value": "bali",
    "label": "PT. BANK PEMBANGUNAN DAERAH BALI"
  },
  {
    "value": "bangkok",
    "label": "BANGKOK BANK PUBLIC CO.LTD"
  },
  {
    "value": "banten",
    "label": "PT. BANK BANTEN"
  },
  {
    "value": "barclays",
    "label": "PT BANK BARCLAYS INDONESIA"
  },
  {
    "value": "bca",
    "label": "PT. BANK CENTRAL ASIA TBK."
  },
  {
    "value": "bca_va",
    "label": "PT. BANK CENTRAL ASIA TBK. - VIRTUAL ACCOUNT"
  },
  {
    "value": "bcad",
    "label": "PT. BANK DIGITAL BCA"
  },
  {
    "value": "bca_syar",
    "label": "PT. BANK BCA SYARIAH"
  },
  {
    "value": "bengkulu",
    "label": "PT. BPD BENGKULU"
  },
  {
    "value": "bisnis",
    "label": "PT. BANK BISNIS INTERNASIONAL"
  },
  {
    "value": "bjb",
    "label": "PT. BANK PEMBANGUNAN DAERAH JABAR DAN BANTEN"
  },
  {
    "value": "bjb_syar",
    "label": "PT. BANK JABAR BANTEN SYARIAH"
  },
  {
    "value": "bni",
    "label": "PT. BANK NEGARA INDONESIA (PERSERO)"
  },
  {
    "value": "bnp",
    "label": "PT. BANK NUSANTARA PARAHYANGAN"
  },
  {
    "value": "bnp_paribas",
    "label": "PT. BANK BNP PARIBAS INDONESIA"
  },
  {
    "value": "boa",
    "label": "BANK OF AMERICA NA"
  },
  {
    "value": "bri",
    "label": "PT. BANK RAKYAT INDONESIA (PERSERO)"
  },
  {
    "value": "bri_va",
    "label": "PT. BANK RAKYAT INDONESIA (PERSERO) - VIRTUAL ACCOUNT"
  },
  {
    "value": "bsi",
    "label": "PT. BANK SYARIAH INDONESIA TBK."
  },
  {
    "value": "btn",
    "label": "PT. BANK TABUNGAN NEGARA (PERSERO)"
  },
  {
    "value": "btn_syar",
    "label": "PT. BANK TABUNGAN NEGARA (PERSERO) UNIT USAHA SYARIAH"
  },
  {
    "value": "btpn",
    "label": "PT. BANK SMBC Indonesia Tbk"
  },
  {
    "value": "btpn_syar",
    "label": "PT. BANK TABUNGAN PENSIUNAN NASIONAL SYARIAH"
  },
  {
    "value": "bukopin",
    "label": "PT BANK KB BUKOPIN TBK."
  },
  {
    "value": "bukopin_syar",
    "label": "PT. BANK SYARIAH BUKOPIN"
  },
  {
    "value": "bumiputera",
    "label": "PT. BANK BUMIPUTERA"
  },
  {
    "value": "bumi_artha",
    "label": "PT. BANK BUMI ARTA"
  },
  {
    "value": "capital",
    "label": "PT BANK CAPITAL INDONESIA"
  },
  {
    "value": "centratama",
    "label": "PT. CENTRATAMA NASIONAL BANK"
  },
  {
    "value": "chase",
    "label": "JP MORGAN CHASE BANK, N.A"
  },
  {
    "value": "china",
    "label": "BANK OF CHINA"
  },
  {
    "value": "china_cons",
    "label": "CHINA CONSTRUCTION"
  },
  {
    "value": "chinatrust",
    "label": "PT. BANK CTBC INDONESIA"
  },
  {
    "value": "cimb",
    "label": "PT. BANK CIMB NIAGA TBK."
  },
  {
    "value": "cimb_syar",
    "label": "PT. BANK CIMB NIAGA TBK. - UNIT USAHA SYARIAH"
  },
  {
    "value": "cimb_rekening_ponsel",
    "label": "PT. BANK CIMB NIAGA TBK. - REKENING PONSEL"
  },
  {
    "value": "cimb_va",
    "label": "PT. BANK CIMB NIAGA TBK. - VIRTUAL ACCOUNT."
  },
  {
    "value": "citibank",
    "label": "CITIBANK, NA"
  },
  {
    "value": "commonwealth",
    "label": "PT. BANK OCBC NISP, Tbk."
  },
  {
    "value": "danamon",
    "label": "PT. BANK DANAMON INDONESIA TBK."
  },
  {
    "value": "danamon_syar",
    "label": "PT. BANK DANAMON INDONESIA UNIT USAHA SYARIAH"
  },
  {
    "value": "dbs",
    "label": "PT. BANK DBS INDONESIA"
  },
  {
    "value": "deutsche",
    "label": "DEUTSCHE BANK AG."
  },
  {
    "value": "dipo",
    "label": "PT. BANK DIPO INTERNATIONAL"
  },
  {
    "value": "diy",
    "label": "PT. BANK PEMBANGUNAN DAERAH DIY"
  },
  {
    "value": "diy_syar",
    "label": "PT.BANK PEMBANGUNAN DAERAH DIY UNIT USAHA SYARIAH"
  },
  {
    "value": "dki",
    "label": "PT. BANK DKI"
  },
  {
    "value": "dki_syar",
    "label": "PT. BANK DKI UNIT USAHA SYARIAH"
  },
  {
    "value": "ekonomi",
    "label": "PT. BANK EKONOMI RAHARJA"
  },
  {
    "value": "fama",
    "label": "PT. BANK FAMA INTERNATIONAL"
  },
  {
    "value": "ganesha",
    "label": "PT. BANK GANESHA"
  },
  {
    "value": "gopay",
    "label": "GoPay"
  },
  {
    "value": "hana",
    "label": "PT. BANK KEB HANA INDONESIA"
  },
  {
    "value": "hs_1906",
    "label": "PT. BANK WOORI SAUDARA INDONESIA 1906,TBK"
  },
  {
    "value": "hsbc",
    "label": "PT. BANK HSBC INDONESIA"
  },
  {
    "value": "icbc",
    "label": "PT. BANK ICBC INDONESIA"
  },
  {
    "value": "ina_perdana",
    "label": "PT. BANK INA PERDANA"
  },
  {
    "value": "index_selindo",
    "label": "BANK INDEX SELINDO"
  },
  {
    "value": "india",
    "label": "PT. BANK OF INDIA INDONESIA TBK."
  },
  {
    "value": "jago",
    "label": "PT. BANK JAGO TBK."
  },
  {
    "value": "jago_syar",
    "label": "PT. BANK JAGO UNIT USAHA SYARIAH"
  },
  {
    "value": "jambi",
    "label": "PT.BANK PEMBANGUNAN DAERAH JAMBI"
  },
  {
    "value": "jasa_jakarta",
    "label": "PT. BANK JASA JAKARTA"
  },
  {
    "value": "jateng",
    "label": "PT. BANK PEMBANGUNAN DAERAH JAWA TENGAH"
  },
  {
    "value": "jateng_syar",
    "label": "PT. BANK PEMBANGUNAN DAERAH JAWA TENGAH"
  },
  {
    "value": "jatim",
    "label": "PT. BANK PEMBANGUNAN DAERAH JATIM"
  },
  {
    "value": "jatim_syar",
    "label": "PT.BANK PEMBANGUNAN DAERAH JATIM - UNIT USAHA SYARIAH"
  },
  {
    "value": "jtrust",
    "label": "PT. BANK JTRUST INDONESIA TBK."
  },
  {
    "value": "kalbar",
    "label": "PT.BANK PEMBANGUNAN DAERAH KALBAR"
  },
  {
    "value": "kalbar_syar",
    "label": "PT.BANK PEMBANGUNAN DAERAH KALBAR UUS"
  },
  {
    "value": "kalsel",
    "label": "PT. BANK PEMBANGUNAN DAERAH KALSEL"
  },
  {
    "value": "kalsel_syar",
    "label": "PT. BANK PEMBANGUNAN DAERAH KALSEL - UNIT USAHA SYARIAH"
  },
  {
    "value": "kalteng",
    "label": "PT. BPD KALIMANTAN TENGAH"
  },
  {
    "value": "kaltim",
    "label": "PT.BANK PEMBANGUNAN DAERAH KALTIM"
  },
  {
    "value": "kaltim_syar",
    "label": "PT.BANK PEMBANGUNAN DAERAH KALTIM - UNIT USAHA SYARIAH"
  },
  {
    "value": "lampung",
    "label": "PT.BANK PEMBANGUNAN DAERAH LAMPUNG"
  },
  {
    "value": "maluku",
    "label": "PT.BANK PEMBANGUNAN DAERAH MALUKU"
  },
  {
    "value": "mandiri",
    "label": "PT. BANK MANDIRI (PERSERO) TBK."
  },
  {
    "value": "mandiri_taspen",
    "label": "PT. BANK MANDIRI TASPEN POS"
  },
  {
    "value": "maspion",
    "label": "PT. BANK MASPION"
  },
  {
    "value": "mayapada",
    "label": "PT. BANK MAYAPADA TBK."
  },
  {
    "value": "maybank",
    "label": "PT. BANK MAYBANK INDONESIA TBK."
  },
  {
    "value": "maybank_syar",
    "label": "PT. BANK MAYBANK SYARIAH INDONESIA"
  },
  {
    "value": "maybank_uus",
    "label": "PT. BANK MAYBANK INDONESIA TBK. UNIT USAHA SYARIAH"
  },
  {
    "value": "mayora",
    "label": "PT. BANK MAYORA"
  },
  {
    "value": "mega_syar",
    "label": "PT. BANK MEGA SYARIAH"
  },
  {
    "value": "mega_tbk",
    "label": "PT. BANK MEGA TBK."
  },
  {
    "value": "mestika",
    "label": "PT. BANK MESTIKA DHARMA"
  },
  {
    "value": "metro",
    "label": "PT. BANK METRO EXPRESS"
  },
  {
    "value": "mitraniaga",
    "label": "PT. BANK MITRANIAGA"
  },
  {
    "value": "mitsubishi",
    "label": "THE BANK OF TOKYO MITSUBISHI UFJ LTD."
  },
  {
    "value": "mizuho",
    "label": "PT. BANK MIZUHO INDONESIA"
  },
  {
    "value": "mnc",
    "label": "PT. BANK MNC INTERNASIONAL TBK."
  },
  {
    "value": "muamalat",
    "label": "PT. BANK MUAMALAT INDONESIA"
  },
  {
    "value": "multiarta",
    "label": "PT. BANK MULTI ARTA SENTOSA"
  },
  {
    "value": "mutiara",
    "label": "PT. BANK JTRUST INDONESIA, TBK"
  },
  {
    "value": "niaga_syar",
    "label": "PT. BANK NIAGA TBK. SYARIAH"
  },
  {
    "value": "nagari",
    "label": "PT. BANK NAGARI"
  },
  {
    "value": "nagari_syar",
    "label": "PT. BANK NAGARI UNIT USAHA SYARIAH"
  },
  {
    "value": "nobu",
    "label": "PT. BANK NATIONALNOBU"
  },
  {
    "value": "ntb",
    "label": "PT. BANK PEMBANGUNAN DAERAH NTB"
  },
  {
    "value": "ntt",
    "label": "PT.BANK PEMBANGUNAN DAERAH NTT"
  },
  {
    "value": "ocbc",
    "label": "PT. BANK OCBC NISP TBK."
  },
  {
    "value": "ocbc_syar",
    "label": "PT. BANK OCBC NISP TBK. - UNIT USAHA SYARIAH"
  },
  {
    "value": "ok",
    "label": "PT. BANK OKE INDONESIA"
  },
  {
    "value": "ovo",
    "label": "OVO (See the Transfer to OVO notes)"
  },
  {
    "value": "panin",
    "label": "PT. PANIN BANK TBK."
  },
  {
    "value": "panin_syar",
    "label": "PT. BANK PANIN SYARIAH"
  },
  {
    "value": "papua",
    "label": "PT.BANK PEMBANGUNAN DAERAH PAPUA"
  },
  {
    "value": "permata",
    "label": "PT. BANK PERMATA TBK."
  },
  {
    "value": "permata_syar",
    "label": "PT. BANK PERMATA TBK. UNIT USAHA SYARIAH"
  },
  {
    "value": "permata_va",
    "label": "PT. BANK PERMATA TBK. - VIRTUAL ACCOUNT"
  },
  {
    "value": "prima_master",
    "label": "PT. PRIMA MASTER BANK"
  },
  {
    "value": "pundi",
    "label": "PT. BANK PUNDI INDONESIA"
  },
  {
    "value": "purba",
    "label": "PT. BANK PURBA DANARTA"
  },
  {
    "value": "qnb",
    "label": "PT. BANK QNB INDONESIA TBK."
  },
  {
    "value": "rabobank",
    "label": "PT. BANK RABOBANK INTERNATIONAL INDONESIA"
  },
  {
    "value": "rbos",
    "label": "THE ROYAL BANK OF SCOTLAND N.V."
  },
  {
    "value": "resona",
    "label": "PT. BANK RESONA PERDANIA"
  },
  {
    "value": "riau",
    "label": "PT. BANK PEMBANGUNAN DAERAH RIAU KEPRI"
  },
  {
    "value": "riau_syar",
    "label": "PT. BANK PEMBANGUNAN DAERAH RIAU KEPRI SYARIAH"
  },
  {
    "value": "sampoerna",
    "label": "PT. BANK SAHABAT SAMPOERNA"
  },
  {
    "value": "sbi",
    "label": "PT. BANK SBI INDONESIA"
  },
  {
    "value": "seabank",
    "label": "PT. BANK SEABANK INDONESIA"
  },
  {
    "value": "shinhan",
    "label": "PT. BANK SHINHAN INDONESIA"
  },
  {
    "value": "sinarmas",
    "label": "PT. BANK SINARMAS"
  },
  {
    "value": "sinarmas_syar",
    "label": "PT. BANK SINARMAS UNIT USAHA SYARIAH"
  },
  {
    "value": "stanchard",
    "label": "STANDARD CHARTERED BANK"
  },
  {
    "value": "sulselbar",
    "label": "PT. BANK SULSELBAR"
  },
  {
    "value": "sulselbar_syar",
    "label": "PT. BANK SULSELBAR UNIT USAHA SYARIAH"
  },
  {
    "value": "sulteng",
    "label": "PT. BPD SULAWESI TENGAH"
  },
  {
    "value": "sultenggara",
    "label": "PT. BPD SULAWESI TENGGARA"
  },
  {
    "value": "sulut",
    "label": "PT. BANK SULUTGO"
  },
  {
    "value": "sumitomo",
    "label": "PT. BANK SUMITOMO MITSUI INDONESIA"
  },
  {
    "value": "sumsel_babel",
    "label": "PT. BPD SUMSEL DAN BABEL"
  },
  {
    "value": "sumsel_babel_syar",
    "label": "PT. BPD SUMSEL DAN BABEL UNIT USAHA SYARIAH"
  },
  {
    "value": "sumut",
    "label": "PT. BANK PEMBANGUNAN DAERAH SUMUT"
  },
  {
    "value": "sumut_syar",
    "label": "PT. BANK PEMBANGUNAN DAERAH SUMUT UUS"
  },
  {
    "value": "uob",
    "label": "PT. BANK UOB INDONESIA"
  },
  {
    "value": "victoria",
    "label": "PT. BANK VICTORIA INTERNATIONAL"
  },
  {
    "value": "victoria_syar",
    "label": "PT. BANK VICTORIA SYARIAH"
  },
  {
    "value": "woori",
    "label": "PT. BANK WOORI SAUDARA INDONESIA 1906 TBK."
  },
  {
    "value": "yudha_bhakti",
    "label": "PT. BANK NEO COMMERCE, TBK"
  }
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
  const trackingIntegrationsQuery = useQuery({
    queryKey: ['tracking-integrations'],
    queryFn: async () => {
      return await trpcClient.trackingIntegration.list.query()
    },
    staleTime: 1000 * 30,
  })
  const accounts = bankAccountsQuery.data ?? []
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
    <div className='max-w-3xl mx-auto w-full'>
      <AppHeader>
        <AppHeaderContent title="Settings" />
      </AppHeader>
      <div className="px-4 md:px-10 pb-4 md:pb-10 space-y-6">
        <Tabs defaultValue="tab-1">
          <TabsList
            variant='underline'
            className={'mb-5'}
          >
            <TabsTab value="tab-1">Accounts</TabsTab>
            <TabsTab value="tab-2">Payment</TabsTab>
            <TabsTab value="tab-3">Integrations</TabsTab>
          </TabsList>
          <TabsPanel value="tab-1" className="space-y-6">
            <Frame>
              <FrameHeader>
                <FrameTitle className="text-lg">Username</FrameTitle>
              </FrameHeader>
              <FramePanel>
                <div className="flex items-center flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <p className="text-sm">
                    {profileUrl}
                  </p>

                  <Button
                    size="lg"
                    className='rounded-full'
                    variant="outline"
                    onClick={openUsernameDialog}
                  >
                    Change
                  </Button>
                </div>
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
              <DialogTitle>Change username</DialogTitle>
            </DialogHeader>

            <DialogPanel className="space-y-4">
              <Field name="username" >
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
                <FieldError>
                  {usernameFailedMessage || usernameFormErrors.username}
                </FieldError>
              </Field>
            </DialogPanel>

            <DialogFooter >
              <DialogClose render={<Button variant="ghost" />}>
                Cancel
              </DialogClose>
              <Button
                type="submit"
                loading={usernameMutation.isPending}
                disabled={isUsernameSaveBlocked}
              >
                Save
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
