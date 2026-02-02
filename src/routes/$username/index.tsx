import { createFileRoute } from '@tanstack/react-router'
import {
  Globe,
  Link as LinkIcon,
  X as XIcon,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/$username/')({
  component: UserProfile,
})

function UserProfile() {
  const { username } = Route.useParams()

  return (
    <div className="min-h-screen relative font-sans text-slate-900 bg-gray-50">
      {/* Background Image Header */}
      <div
        className="h-[280px] w-full bg-cover bg-center relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Top Right User Badge */}
        <div className="absolute top-6 right-6 z-10">
          <Button
            variant="secondary"
            className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-xs font-semibold h-8 gap-2 shadow-sm border border-black/5"
          >
            <Avatar className="h-4 w-4">
              <AvatarImage src="/avatar-placeholder.png" />
              <AvatarFallback className="bg-black text-white text-[8px]">
                FD
              </AvatarFallback>
            </Avatar>
            {username}
          </Button>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="max-w-[680px] mx-auto px-4 pb-16 -mt-24 relative z-20 flex flex-col items-center gap-6">
        {/* Profile Card */}
        <Card className="w-full shadow-lg border-none rounded-2xl overflow-visible">
          <CardContent className="pt-0 pb-8 px-6 lg:px-8 relative bg-white rounded-2xl">
            {/* Avatar - Overlapping top */}
            <div className="-mt-12 mb-4 flex justify-start">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-black">
                <AvatarImage src="/avatar-placeholder.png" />
                <AvatarFallback className="bg-black text-white text-2xl font-bold">
                  FD
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold leading-tight flex items-center gap-2">
                  {username}
                </h1>
                <p className="text-muted-foreground font-medium text-sm mt-1">
                  Software Engineer
                </p>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                Full Stack Developer from Indonesia passionate about creating
                efficient, user-centric web solutions from front-end to
                back-end.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-12 w-12 bg-white border-none shadow-sm hover:bg-gray-50 text-slate-700"
          >
            <XIcon className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-12 w-12 bg-white border-none shadow-sm hover:bg-gray-50 text-slate-700"
          >
            <Globe className="h-5 w-5" />
          </Button>
        </div>

        {/* Featured Content Block */}
        <Card className="w-full border-none shadow-sm rounded-2xl overflow-hidden bg-white">
          <div className="p-4 flex items-center gap-3 border-b border-border/40">
            <div className="bg-muted p-1.5 rounded-md">
              <LinkIcon className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm">Featured Content</span>
          </div>

          <div className="p-4">
            <div className="bg-black rounded-lg aspect-video mb-4 flex items-center justify-center relative overflow-hidden group cursor-pointer">
              {/* Mock Video UI */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                <div className="mb-4">
                  {/* Laravel Logo Mock */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-12 w-12 text-red-500"
                  >
                    <path d="M7 20l10 0" />
                    <path d="M9 16l0 4" />
                    <path d="M15 16l0 4" />
                    <path d="M12 4l-9 6l2 11l14 -0l2 -11z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold tracking-tight">
                  Tutorial lengkap membangun aplikasi Laravel
                </h3>
                <p className="text-xs text-gray-400 mt-2 max-w-[250px]">
                  dari Migration database sampai implementasi MVC dan CRUD.
                </p>
              </div>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-sm leading-tight">
                Belajar Laravel dari Migration hingga CRUD menggunakan pola MVC
                - Fadil
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                Tutorial lengkap membangun aplikasi Laravel: dari Migration
                database sampai implementasi MVC dan CRUD. Cocok untuk pemula
                yang ingin menguasai framework Laravel!
              </p>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2 mt-4 pt-2">
              <div className="h-2 w-4 rounded-full bg-slate-800"></div>
              <div className="h-2 w-2 rounded-full bg-slate-200"></div>
              <div className="h-2 w-2 rounded-full bg-slate-200"></div>
            </div>
          </div>
        </Card>

        {/* Link Block - Porto */}
        <Card className="w-full border-none shadow-sm rounded-2xl overflow-hidden bg-white hover:scale-[1.01] hover:shadow-md transition-all cursor-pointer group">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-muted/80 transition-colors">
                <LinkIcon className="h-5 w-5 text-slate-600" />
              </div>
              <span className="font-semibold text-sm">porto</span>
            </div>
            <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 mb-4">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="text-xs font-medium">Powered by</span>
            <span className="font-bold text-lg tracking-tighter text-slate-900">
              LIN<span className="rotate-180 inline-block">K</span>E
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
