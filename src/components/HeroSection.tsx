import { Button } from './ui/button'
import { Users, Briefcase, Zap, Sparkles } from 'lucide-react'
export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
      {/* Badge */}
      <div className="mb-8 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-50/50 p-1 pr-4 backdrop-blur-sm transition-colors hover:bg-emerald-100/50">
        <span className="rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase leading-tight tracking-wide text-white shadow-sm">
          Link 2.0
        </span>
        <span className="ml-2.5 text-xs font-bold tracking-wide text-emerald-600 uppercase">
          Streamline your digital identity
        </span>
      </div>

      {/* Main Heading */}
      <h1 className="max-w-4xl font-heading text-4xl font-bold tracking-tight text-primary sm:text-6xl md:text-7xl leading-[1.1]">
        The Trusted Gateway to{' '}
        <span className="block sm:inline">Organizations and Creators</span>
      </h1>

      {/* Subheading with Icons */}
      <div className="mt-8 max-w-3xl text-lg text-muted-foreground sm:text-xl leading-relaxed font-light">
        <p>
          Link is the all-in-one profile platform{' '}
          <span className="font-heading text-foreground">for Web2 </span>
          <span className="inline-flex items-center justify-center align-middle mx-1">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-black text-white shadow-sm transform -rotate-3">
              <Briefcase size={14} className="text-white" />
            </span>
          </span>{' '}
          projects,{' '}
          <span className="inline-flex items-center justify-center align-middle mx-1">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-emerald-500 text-white shadow-sm transform rotate-2">
              <Users size={14} />
            </span>
          </span>{' '}
          communities, and content{' '}
          <span className="inline-flex items-center justify-center align-middle mx-1">
            <span className="flex items-center justify-center w-6 h-6 rounded bg-indigo-500 text-white shadow-sm transform -rotate-2">
              <Zap size={14} />
            </span>
          </span>{' '}
          creators that aggregates your all most important resources on a single{' '}
          <span className="inline-flex items-center justify-center align-middle mx-1">
            <span className="flex items-center justify-center w-7 h-7 text-amber-400 drop-shadow-sm">
              <Sparkles size={24} fill="currentColor" />
            </span>
          </span>{' '}
          <span className="font-heading text-foreground">verified</span> access
          point.
        </p>
      </div>

      {/* Buttons */}
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        <Button
          size="lg"
          className="h-12 px-8 text-base font-medium min-w-[200px] shadow-lg hover:shadow-xl transition-all"
        >
          Create Personal Profile
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 px-8 text-base font-medium min-w-[200px] bg-white hover:bg-gray-50 transition-all border-gray-200"
        >
          Create Organization Profile
        </Button>
      </div>
    </section>
  )
}
