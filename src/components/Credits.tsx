import { useEffect, useState } from 'react'

import { COMPANY_NAME, LINK_VERSION } from '@/lib/constans'

// Use import.meta.env for Vite-compatible environment variables
const vercelCommitHash = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA
const commitHash = vercelCommitHash ? `-${vercelCommitHash.slice(0, 7)}` : ''
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
          {vercelCommitHash ? (
            <a
              href={`https://github.com/fadilsflow/link/commit/${vercelCommitHash}`}
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
