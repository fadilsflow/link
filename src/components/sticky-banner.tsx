'use client'
import React, { useState } from 'react'
import type { SVGProps} from 'react';
import { cn } from '@/lib/utils'

export const StickyBanner = ({
  className,
  children,
  closable = true,
}: {
  className?: string
  children: React.ReactNode
  closable?: boolean
}) => {
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <div
      className={cn(
        'sticky inset-x-0 top-0 z-40 flex min-h-14 w-full items-center justify-center bg-transparent px-4 py-1',
        className,
      )}
    >
      {children}

      {closable && (
        <button
          className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer"
          onClick={() => setOpen(false)}
        >
          <CloseIcon className="h-5 w-5 text-white" />
        </button>
      )}
    </div>
  )
}

const CloseIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  )
}
