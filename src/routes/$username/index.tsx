import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  ArrowUpRight,
  Globe,
  Link as LinkIcon,
  Mail,
  Instagram,
  Github,
  Youtube,
  Facebook,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPublicProfile } from '@/lib/profile-server'
import NotFound from '@/components/NotFound'
import { cn, formatPrice } from '@/lib/utils'

import { Gmail } from '@/components/icon/gmail'
import { LinkedIn } from '@/components/icon/linkedin'
import { XformerlyTwitter } from '@/components/icon/x'
import { WhatsApp } from '@/components/icon/whatsapp'

export const Route = createFileRoute('/$username/')({
  component: UserProfile,
  loader: async ({ params }) => {
    const data = await getPublicProfile({ data: params.username })
    if (!data) {
      throw notFound()
    }
    return data
  },
  notFoundComponent: NotFound,
})

// Platform icon mapping
const PLATFORM_ICONS: Record<
  string,
  { icon: any; color?: string; className?: string }
> = {
  twitter: { icon: XformerlyTwitter, className: 'invert' },
  linkedin: { icon: LinkedIn },
  email: { icon: Gmail },
  instagram: { icon: Instagram, color: '#E4405F' },
  github: { icon: Github },
  youtube: { icon: Youtube, color: '#FF0000' },
  facebook: { icon: Facebook, color: '#1877F2' },
  whatsapp: { icon: WhatsApp },
}

function getSocialIcon(platform: string) {
  const config = PLATFORM_ICONS[platform]
  if (config) {
    const Icon = config.icon
    return (
      <Icon
        className={cn('h-5 w-5', config.className)}
        style={config.color ? { color: config.color } : undefined}
      />
    )
  }
  return <Globe className="h-5 w-5" />
}

function getSocialUrl(link: { platform: string; url: string }) {
  if (link.platform === 'email') {
    return link.url.startsWith('mailto:') ? link.url : `mailto:${link.url}`
  }
  return link.url
}

function UserProfile() {
  const { user, blocks, products, socialLinks } = Route.useLoaderData()

  type BgMode = 'banner' | 'wallpaper' | 'color' | 'image'
  type WallpaperStyle = 'flat' | 'gradient' | 'avatar' | 'image'

  const bgType = (user.appearanceBgType as BgMode) ?? 'banner'
  const wallpaperStyle =
    (user.appearanceBgWallpaperStyle as WallpaperStyle) ?? 'flat'
  const bgColor = user.appearanceBgColor
  const bgImage = user.appearanceBgImageUrl
  const wallpaperColor = user.appearanceWallpaperColor
  const wallpaperGradientTop = user.appearanceWallpaperGradientTop
  const wallpaperGradientBottom = user.appearanceWallpaperGradientBottom
  const wallpaperImage = user.appearanceWallpaperImageUrl

  const isBanner = bgType === 'banner' || !bgType

  // Helper to determine if image is local (starts with /) or external
  const getImageUrl = (imageUrl?: string | null, fallback?: string) => {
    if (imageUrl) {
      return imageUrl.startsWith('/') ? imageUrl : imageUrl
    }
    return fallback
  }

  // Build background styles based on type
  const getBackgroundStyles = () => {
    if (isBanner) {
      return {
        backgroundImage: bgImage
          ? `url('${getImageUrl(bgImage)}')`
          : `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: bgColor || undefined,
      }
    }

    // Wallpaper/Full background mode
    if (bgType === 'wallpaper' || bgType === 'image') {
      if (wallpaperStyle === 'image' || wallpaperImage) {
        return {
          backgroundImage: wallpaperImage
            ? `url('${getImageUrl(wallpaperImage)}')`
            : bgImage
              ? `url('${getImageUrl(bgImage)}')`
              : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      }

      if (
        wallpaperStyle === 'gradient' &&
        wallpaperGradientTop &&
        wallpaperGradientBottom
      ) {
        return {
          background: `linear-gradient(180deg, ${wallpaperGradientTop}, ${wallpaperGradientBottom})`,
        }
      }

      if (wallpaperStyle === 'flat' && wallpaperColor) {
        return {
          backgroundColor: wallpaperColor,
        }
      }

      if (wallpaperStyle === 'avatar') {
        return {
          background:
            'radial-gradient(circle at center, rgba(15,23,42,0.1), #020617)',
        }
      }
    }

    if (bgType === 'color' && bgColor) {
      return {
        background: bgColor,
      }
    }

    // Default fallback
    return {
      background: 'radial-gradient(circle at top, #1f2937, #020617)',
    }
  }

  const backgroundStyles = getBackgroundStyles()

  // Full page background for wallpaper mode
  const isFullPageBg = bgType === 'wallpaper' || bgType === 'color'

  const blockStyle =
    (user.appearanceBlockStyle as 'basic' | 'flat' | 'shadow') ?? 'basic'
  const blockRadius =
    (user.appearanceBlockRadius as 'rounded' | 'square') ?? 'rounded'

  const cardBase =
    blockStyle === 'flat'
      ? 'bg-white/95 backdrop-blur-sm border border-slate-200/50'
      : blockStyle === 'shadow'
        ? 'bg-white/95 backdrop-blur-sm border-none shadow-lg'
        : 'bg-white border border-slate-100 shadow-sm'

  const radiusClass = blockRadius === 'rounded' ? 'rounded-2xl' : 'rounded-md'

  // Determine if we need light or dark text based on background
  const isDarkBg =
    isFullPageBg &&
    (wallpaperStyle === 'gradient' ||
      wallpaperStyle === 'avatar' ||
      (bgType === 'color' && bgColor?.includes('#0')) ||
      bgColor?.includes('rgb(0'))

  return (
    <div
      className="min-h-screen relative font-sans text-slate-900"
      style={isFullPageBg ? backgroundStyles : { backgroundColor: '#f8fafc' }}
    >
      {/* Background Header - Only for banner mode */}
      {isBanner && (
        <div
          className="h-[280px] w-full bg-cover bg-center relative"
          style={backgroundStyles}
        >
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
      )}

      {/* Top Right User Badge */}
      <div className="absolute top-6 right-6 z-10">
        <Button
          variant="secondary"
          className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-xs font-semibold h-8 gap-2 shadow-sm border border-black/5"
        >
          <Avatar className="h-4 w-4">
            <AvatarImage src={user.image || '/avatar-placeholder.png'} />
            <AvatarFallback className="bg-black text-white text-[8px]">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {user.username}
        </Button>
      </div>

      {/* Main Content Container */}
      <div
        className={cn(
          'max-w-[680px] mx-auto px-4 pb-16 relative z-20 flex flex-col items-center gap-6',
          isBanner ? '-mt-24' : 'pt-20',
        )}
      >
        {/* Profile Card */}
        <Card
          className={cn(
            'w-full overflow-visible',
            isFullPageBg
              ? 'shadow-2xl border-none rounded-2xl bg-white/95 backdrop-blur-md'
              : 'shadow-lg border-none rounded-2xl',
          )}
        >
          <CardContent className="pt-0 pb-8 px-6 lg:px-8 relative bg-white rounded-2xl">
            {/* Avatar - Overlapping top */}
            <div className="-mt-12 mb-4 flex justify-start">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md bg-black ring-4 ring-white/50">
                <AvatarImage src={user.image || '/avatar-placeholder.png'} />
                <AvatarFallback className="bg-black text-white text-2xl font-bold">
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold leading-tight flex items-center gap-2">
                  {user.name}
                </h1>
                {user.title && (
                  <p className="text-muted-foreground font-medium text-sm mt-1">
                    {user.title}
                  </p>
                )}
              </div>

              {user.bio && (
                <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                  {user.bio}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        {socialLinks && socialLinks.length > 0 && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {socialLinks.map((link: any) => (
              <a
                key={link.id}
                href={getSocialUrl(link)}
                target={link.platform === 'email' ? undefined : '_blank'}
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    'rounded-full h-12 w-12 border-none shadow-sm transition-all hover:scale-105 active:scale-95',
                    isFullPageBg
                      ? 'bg-white/90 backdrop-blur-sm hover:bg-white text-slate-700'
                      : 'bg-white hover:bg-gray-50 text-slate-700',
                  )}
                >
                  {getSocialIcon(link.platform)}
                </Button>
              </a>
            ))}
          </div>
        )}

        {/* Blocks List */}
        {blocks.map((block: any) => {
          if (block.type === 'text') {
            return (
              <div key={block.id} className="w-full text-center py-2 space-y-1">
                <h2
                  className={cn(
                    'font-bold text-lg',
                    isFullPageBg && isDarkBg ? 'text-white' : 'text-slate-800',
                  )}
                >
                  {block.title}
                </h2>
                {block.content && (
                  <p
                    className={cn(
                      'text-sm',
                      isFullPageBg && isDarkBg
                        ? 'text-white/70'
                        : 'text-slate-600',
                    )}
                  >
                    {block.content}
                  </p>
                )}
              </div>
            )
          }

          return (
            <Card
              key={block.id}
              className={cn(
                'w-full overflow-hidden hover:scale-[1.01] transition-all cursor-pointer group',
                cardBase,
                radiusClass,
              )}
              style={{
                backgroundColor: user.appearanceBlockColor || undefined,
              }}
              onClick={() => block.url && window.open(block.url, '_blank')}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-muted/80 transition-colors">
                    <LinkIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <span className="font-semibold text-sm">{block.title}</span>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Card>
          )
        })}

        {/* Products section */}
        {products.length > 0 && (
          <div className="w-full mt-4 space-y-3">
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                isFullPageBg && isDarkBg ? 'text-white/60' : 'text-slate-500',
              )}
            >
              Digital Products
            </p>
            <div className="grid gap-3">
              {products.map((product: any) => {
                const href = `/${user.username}/products/${product.id}`
                const price = product.payWhatYouWant
                  ? product.minimumPrice
                    ? `From ${formatPrice(product.minimumPrice)}`
                    : 'Pay what you want'
                  : product.salePrice && product.price
                    ? formatPrice(product.salePrice)
                    : product.price
                      ? formatPrice(product.price)
                      : 'Free'

                const productImages = product.images as string[] | null
                const hasImage = productImages && productImages.length > 0

                return (
                  <Card
                    key={product.id}
                    className={cn(
                      'w-full overflow-hidden hover:scale-[1.01] transition-all cursor-pointer group',
                      cardBase,
                      radiusClass,
                    )}
                    style={{
                      backgroundColor: user.appearanceBlockColor || undefined,
                    }}
                    render={<Link to={href} />}
                  >
                    <div className="flex items-stretch">
                      {/* Product Image */}
                      {hasImage && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-slate-100 overflow-hidden">
                          <img
                            src={productImages[0]}
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex-1 p-4 flex items-center justify-between gap-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm truncate">
                            {product.title}
                          </span>
                          <span className="text-xs text-slate-500 mt-0.5">
                            {price}
                          </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 mb-4">
          <div
            className={cn(
              'flex items-center gap-1.5',
              isFullPageBg && isDarkBg ? 'text-white/50' : 'text-slate-500',
            )}
          >
            <span className="text-xs font-medium">Powered by</span>
            <span
              className={cn(
                'font-bold text-lg tracking-tighter',
                isFullPageBg && isDarkBg ? 'text-white' : 'text-slate-900',
              )}
            >
              BLOCKS
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
