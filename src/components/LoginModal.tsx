import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { authClient } from '@/lib/auth-client'
import { useState } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { Google } from './icon/google'
import { Link } from '@tanstack/react-router'

export function LoginModal() {
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'google',
      })
    } catch (error) {
      console.error('Login failed:', error)
      setLoading(false)
    }
  }
  

  return (
    <Dialog>
      <DialogTrigger
        className={buttonVariants({ variant: 'default', size: 'sm' })}
      >
        Login
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in to Link.</DialogTitle>
          <DialogDescription>
            Welcome back! Please sign in to continue
          </DialogDescription>
        </DialogHeader>
        <DialogPanel className="flex flex-col gap-4 py-4">
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex gap-2"
          >
            {loading ? <Spinner className="h-4 w-4" /> : <Google />}
            Continue with Google
          </Button>
        </DialogPanel>
        <DialogFooter>
          <p className="text-xs text-muted-foreground">
            By signing up, you agree to our{' '}
            <Link
              to="/"
              className="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/"
              className="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
