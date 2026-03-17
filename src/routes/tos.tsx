import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const Route = createFileRoute('/tos')({
  component: TermsOfServicePage,
})

function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">
          Welcome to Kreasi. By using this app, you agree to use it responsibly and in compliance
          with applicable laws.
        </p>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Acceptable Use</h2>
          <p className="text-muted-foreground">
            You may not use this service to distribute harmful, illegal, or misleading content.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Accounts</h2>
          <p className="text-muted-foreground">
            You are responsible for maintaining the security of your account and the accuracy of the
            information you provide.
          </p>
        </section>
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Changes</h2>
          <p className="text-muted-foreground">
            We may update these terms over time. Continued use of the app means you accept the
            revised terms.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
