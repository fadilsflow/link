import { useEffect, useState } from 'react'

import { COMPANY_NAME, LINK_VERSION } from '@/lib/constans'

// Use import.meta.env for Vite-compatible environment variables
// Cloudflare Workers uses WORKERS_CI_COMMIT_SHA
const cloudflareCommitHash = import.meta.env.VITE_WORKERS_CI_COMMIT_SHA || import.meta.env.WORKERS_CI_COMMIT_SHA
const commitHash = cloudflareCommitHash ? `-${cloudflareCommitHash.slice(0, 7)}` : ''
const LinkVersion = `v.${LINK_VERSION}`

export default function Credits() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return (
    <small className="text-default mx-3 mb-2 mt-1 hidden text-[0.5rem] opacity-50 lg:block">
      &copy; {new Date().getFullYear()}{' '}
      <a
        href="https://github.com/fadilsflow/link"
        target="_blank"
        className="hover:underline"
      >
        {COMPANY_NAME}
      </a>{' '}
      {hasMounted && (
        <>
          <a
            href="https://github.com/fadilsflow/link/releases"
            target="_blank"
            className="hover:underline"
          >
            {LinkVersion}
          </a>
          {cloudflareCommitHash ? (
            <a
              href={`https://github.com/fadilsflow/link/commit/${cloudflareCommitHash}`}
              target="_blank"
              className="hover:underline"
            >
              {commitHash}
            </a>
          ) : (
            commitHash
          )}
        </>
      )}
    </small>
  )
}
