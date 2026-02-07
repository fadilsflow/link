import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ArrowUpRight, Link as LinkIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { getPublicProfile } from '@/lib/profile-server'
import NotFound from '@/components/not-found'
import { cn, formatPrice } from '@/lib/utils'

import SiteUserProfileHeader, {
  ProfileBanner,
  ProfileCard,
  SocialLinks,
} from '@/components/site-user-profile-header'

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
      className="relative min-h-screen font-sans text-slate-900"
      style={isFullPageBg ? backgroundStyles : { backgroundColor: '#f8fafc' }}
    >
      <SiteUserProfileHeader
        avatarUrl={user.image || '/avatar-placeholder.png'}
        username={user.name}
      />
      {/* Background Header - Only for banner mode */}
      <ProfileBanner isBanner={isBanner} backgroundStyles={backgroundStyles} />

      {/* Main Content Container */}
      <div
        className={cn(
          'relative z-20 mx-auto flex max-w-[680px] flex-col items-center gap-6 px-4 pb-16',
          isBanner ? '-mt-24' : 'pt-20',
        )}
      >
        {/* Profile Card */}
        <ProfileCard
          user={user}
          isFullPageBg={isFullPageBg}
          id="profile-card-section"
        />

        {/* Social Links */}
        <SocialLinks socialLinks={socialLinks} isFullPageBg={isFullPageBg} />

        {/* Blocks List */}
        {blocks.map((block: any) => {
          if (block.type === 'text') {
            return (
              <div key={block.id} className="w-full space-y-1 py-2 text-center">
                <h2
                  className={cn(
                    'text-2xl font-bold',
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
                'group w-full cursor-pointer overflow-hidden transition-all hover:scale-[1.01]',
                cardBase,
                radiusClass,
              )}
              style={{
                backgroundColor: user.appearanceBlockColor || undefined,
              }}
              onClick={() => block.url && window.open(block.url, '_blank')}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-muted/80">
                    <LinkIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <span className="text-sm font-semibold">{block.title}</span>
                </div>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </Card>
          )
        })}

        {/* Products section */}
        {products.length > 0 && (
          <div className="mt-4 w-full space-y-3">
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
                      'group w-full cursor-pointer overflow-hidden transition-all hover:scale-[1.01]',
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
                        <div className="h-20 w-20 shrink-0 overflow-hidden bg-slate-100 sm:h-24 sm:w-24">
                          <img
                            src={productImages[0]}
                            alt={product.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}

                      {/* Product Info */}
                      <div className="flex flex-1 items-center justify-between gap-3 p-4">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold">
                            {product.title}
                          </span>
                          <span className="mt-0.5 text-xs text-slate-500">
                            {price}
                          </span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mb-4 mt-8">
          <div
            className={cn(
              'flex items-center gap-1.5',
              isFullPageBg && isDarkBg ? 'text-white/50' : 'text-slate-500',
            )}
          >
            <span className="text-xs font-medium">Powered by</span>
            <span
              className={cn(
                'text-lg font-bold tracking-tighter',
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
