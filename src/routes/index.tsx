import { Header } from '@/components/Header'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <>
      <Header />
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-4xl font-bold">
          The Trusted Gateway to Organizations and Creators
        </h1>
      </div>
    </>
  )
}
