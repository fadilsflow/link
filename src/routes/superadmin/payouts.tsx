import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable, DataTableColumnHeader } from '@/components/ui/data-table'
import { Spinner } from '@/components/ui/spinner'
import { toastManager } from '@/components/ui/toast'
import {
  AlertDialog,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { trpcClient } from '@/integrations/tanstack-query/root-provider'
import { formatPrice } from '@/lib/utils'

export const Route = createFileRoute('/superadmin/payouts')({
  component: SuperAdminPayoutsPage,
})

type PayoutRow = {
  id: string
  creatorId: string
  creatorLabel: string
  creatorName: string | null
  creatorEmail: string
  creatorUsername: string | null
  amount: number
  status: string
  payoutMethod: string | null
  payoutDetails: Record<string, unknown> | null
  createdAt: string
  processedAt: string | null
  notes: string | null
  failureReason: string | null
  bankName: string | null
  bankAccountName: string | null
  bankAccountNumber: string | null
}

const statusVariantMap: Record<
  string,
  'warning' | 'info' | 'success' | 'error'
> = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'error',
  cancelled: 'error',
}

function SuperAdminPayoutsPage() {
  const queryClient = useQueryClient()
  const payoutsQuery = useQuery({
    queryKey: ['superadmin', 'payouts'],
    queryFn: async () => {
      return await trpcClient.superAdmin.listPayouts.query()
    },
    staleTime: 1000 * 30,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: {
      payoutId: string
      status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
      notes?: string
      failureReason?: string
    }) => {
      return await trpcClient.superAdmin.updatePayoutStatus.mutate(payload)
    },
    onError: (error) => {
      toastManager.add({
        title: 'Gagal update payout',
        description:
          error instanceof Error ? error.message : 'Coba lagi beberapa saat.',
        type: 'error',
      })
    },
  })

  const handlePayoutUpdate = async (payload: {
    payoutId: string
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
    notes?: string
    failureReason?: string
  }) => {
    await updateStatusMutation.mutateAsync(payload)
    await queryClient.invalidateQueries({
      queryKey: ['superadmin', 'payouts'],
    })
    await queryClient.refetchQueries({
      queryKey: ['superadmin', 'payouts'],
      type: 'active',
    })
    toastManager.add({
      title: 'Payout updated',
      description: 'Status payout berhasil diperbarui.',
    })
  }

  const rows = useMemo<PayoutRow[]>(() => {
    const data = payoutsQuery.data ?? []
    return data.map((payout: any) => {
      const creatorName = payout.creator?.name ?? null
      const creatorEmail = payout.creator?.email ?? ''
      const creatorUsername = payout.creator?.username ?? null
      const creatorLabel = [creatorName, creatorEmail, creatorUsername]
        .filter(Boolean)
        .join(' ')
      const bankAccount = payout.bankAccount
      return {
        id: payout.id,
        creatorId: payout.creatorId,
        creatorLabel,
        creatorName,
        creatorEmail,
        creatorUsername,
        amount: payout.amount ?? 0,
        status: payout.status ?? 'pending',
        payoutMethod: payout.payoutMethod ?? null,
        payoutDetails: payout.payoutDetails ?? null,
        createdAt: payout.createdAt,
        processedAt: payout.processedAt ?? null,
        notes: payout.notes ?? null,
        failureReason: payout.failureReason ?? null,
        bankName: bankAccount?.bankName ?? null,
        bankAccountName: bankAccount?.accountName ?? null,
        bankAccountNumber: bankAccount?.accountNumber ?? null,
      }
    })
  }, [payoutsQuery.data])

  const columns = useMemo<ColumnDef<PayoutRow>[]>(
    () => [
      {
        accessorKey: 'creatorLabel',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Creator" />
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {row.original.creatorName ?? row.original.creatorUsername ?? '-'}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.creatorEmail}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" />
        ),
        cell: ({ row }) => (
          <div className="text-sm font-medium">
            {formatPrice(row.original.amount)}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" />
        ),
        cell: ({ row }) => (
          <Badge variant={statusVariantMap[row.original.status] ?? 'info'}>
            {formatStatusLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        accessorKey: 'bankName',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Payout Account" />
        ),
        cell: ({ row }) => {
          const bankName = row.original.bankName ?? 'Unknown bank'
          const accountName = row.original.bankAccountName ?? 'Unknown name'
          const accountNumber = row.original.bankAccountNumber
            ? maskAccountNumber(row.original.bankAccountNumber)
            : 'Unknown number'
          return (
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="text-sm font-medium text-foreground">
                {bankName}
              </div>
              <div>{accountName}</div>
              <div>{accountNumber}</div>
            </div>
          )
        },
      },
      {
        accessorKey: 'notes',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Notes" />
        ),
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground">
            {row.original.notes || row.original.failureReason || '-'}
          </div>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Requested" />
        ),
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <PayoutRowActions row={row.original} onUpdate={handlePayoutUpdate} />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 space-y-6">
      <DataTable
        columns={columns}
        data={rows}
        searchKey="creatorLabel"
        filterPlaceholder="Cari creator..."
        isLoading={payoutsQuery.isLoading}
        emptyText="No payout requests found."
      />
    </div>
  )
}

function maskAccountNumber(value: string) {
  const trimmed = value.trim()
  if (trimmed.length <= 4) return trimmed
  const last = trimmed.slice(-4)
  return `${'*'.repeat(Math.max(0, trimmed.length - 4))}${last}`
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function formatStatusLabel(status: string) {
  switch (status) {
    case 'pending':
      return 'Pending'
    case 'processing':
      return 'Processing'
    case 'completed':
      return 'Completed'
    case 'failed':
      return 'Failed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}
type PayoutUpdatePayload = {
  payoutId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  notes?: string
  failureReason?: string
}

function PayoutRowActions({
  row,
  onUpdate,
}: {
  row: PayoutRow
  onUpdate: (payload: PayoutUpdatePayload) => Promise<void>
}) {
  const { id: payoutId, status } = row

  return (
    <div className="flex flex-wrap gap-2">
      <ActionAlert
        title="Process payout?"
        description="Pastikan admin sudah mulai proses transfer manual."
        confirmLabel="Process"
        disabled={status !== 'pending'}
        onConfirm={async () =>
          await onUpdate({
            payoutId,
            status: 'processing',
            notes: 'Processing manual transfer',
          })
        }
      />
      <ActionAlert
        title="Complete payout?"
        description="Konfirmasi dana sudah berhasil ditransfer."
        confirmLabel="Complete"
        disabled={status !== 'processing'}
        onConfirm={async () =>
          await onUpdate({
            payoutId,
            status: 'completed',
            notes: 'Transfer completed',
          })
        }
      />
      <ActionAlert
        title="Fail payout?"
        description="Payout akan ditandai gagal dan saldo akan dikembalikan."
        confirmLabel="Fail"
        confirmVariant="destructive"
        disabled={status === 'completed'}
        onConfirm={async (reason) =>
          await onUpdate({
            payoutId,
            status: 'failed',
            failureReason: reason,
            notes: reason,
          })
        }
        requireReason
      />
      <ActionAlert
        title="Cancel payout?"
        description="Payout akan dibatalkan dan saldo akan dikembalikan."
        confirmLabel="Cancel"
        confirmVariant="destructive"
        disabled={status === 'completed'}
        onConfirm={async (reason) =>
          await onUpdate({
            payoutId,
            status: 'cancelled',
            failureReason: reason,
            notes: reason,
          })
        }
        requireReason
      />
      <EditNotesDialog
        payoutId={payoutId}
        status={status}
        initialNotes={row.notes ?? ''}
        onSave={async (notes) =>
          await onUpdate({
            payoutId,
            status: status as any,
            notes,
          })
        }
      />
    </div>
  )
}

function ActionAlert({
  title,
  description,
  confirmLabel,
  confirmVariant = 'outline',
  disabled,
  onConfirm,
  requireReason = false,
}: {
  title: string
  description: string
  confirmLabel: string
  confirmVariant?: 'outline' | 'destructive' | 'default'
  disabled?: boolean
  onConfirm: (reason?: string) => Promise<void>
  requireReason?: boolean
}) {
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isLoading = isSubmitting

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isLoading) return
        if (nextOpen) setReason('')
        setOpen(nextOpen)
      }}
    >
      <AlertDialogTrigger
        render={
          <Button size="sm" variant="outline" disabled={disabled}>
            {confirmLabel}
          </Button>
        }
      />
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireReason ? (
          <div className="px-6 pb-6">
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tulis alasan..."
              disabled={isLoading}
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <Button
            variant="ghost"
            type="button"
            disabled={isLoading}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            type="button"
            onClick={async () => {
              if (requireReason && !reason.trim()) return
              setIsSubmitting(true)
              try {
                await onConfirm(requireReason ? reason : undefined)
                setOpen(false)
              } catch {
                // Keep dialog open on error so admin can retry.
              } finally {
                setIsSubmitting(false)
              }
            }}
            disabled={isLoading || (requireReason && !reason.trim())}
            loading={isLoading}
          >
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}

function EditNotesDialog({
  payoutId,
  status,
  initialNotes,
  onSave,
}: {
  payoutId: string
  status: string
  initialNotes: string
  onSave: (notes: string) => Promise<void>
}) {
  const [notesDraft, setNotesDraft] = useState(initialNotes)
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isLoading = isSubmitting

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isLoading) return
        if (nextOpen) setNotesDraft(initialNotes)
        setOpen(nextOpen)
      }}
    >
      <AlertDialogTrigger
        render={
          <Button size="sm" variant="outline" data-payout-id={payoutId}>
            Edit Notes
          </Button>
        }
      />
      <AlertDialogPopup>
        <AlertDialogHeader>
          <AlertDialogTitle>Edit notes</AlertDialogTitle>
          <AlertDialogDescription>
            Simpan catatan internal untuk payout ini (
            {formatStatusLabel(status)}
            ).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="px-6 pb-6">
          <Textarea
            value={notesDraft}
            onChange={(event) => setNotesDraft(event.target.value)}
            placeholder="Tulis catatan..."
            disabled={isLoading}
          />
        </div>
        <AlertDialogFooter>
          <Button
            variant="ghost"
            type="button"
            disabled={isLoading}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={async () => {
              setIsSubmitting(true)
              try {
                await onSave(notesDraft)
                setOpen(false)
              } catch {
                // Keep dialog open on error so admin can retry.
              } finally {
                setIsSubmitting(false)
              }
            }}
            disabled={isLoading}
            loading={isLoading}
          >
            Save Notes
          </Button>
        </AlertDialogFooter>
      </AlertDialogPopup>
    </AlertDialog>
  )
}
