import * as React from 'react'
import { defineLiteYouTubeElement } from '@/lib/lite-youtube'

import '@/styles/lite-youtube.css'

type LiteYouTubeProps = {
  videoId: string
  title: string
  playLabel?: string
  params?: string
  jsApi?: boolean
  className?: string
}

export default function LiteYouTube({
  videoId,
  title,
  playLabel = 'Play video',
  params,
  jsApi = false,
  className,
}: LiteYouTubeProps) {
  React.useEffect(() => {
    defineLiteYouTubeElement()
  }, [])

  const noscriptHtml = React.useMemo(() => {
    const query = new URLSearchParams(params || '')
    if (!query.has('autoplay')) query.set('autoplay', '1')
    if (!query.has('playsinline')) query.set('playsinline', '1')
    if (!query.has('rel')) query.set('rel', '0')

    const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${query.toString()}`

    return `<iframe width="560" height="315" title="${title.replace(/"/g, '&quot;')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="${src}"></iframe>`
  }, [params, title, videoId])

  return (
    <lite-youtube
      videoid={videoId}
      title={title}
      playlabel={playLabel}
      params={params}
      className={className}
      {...(jsApi ? { 'js-api': '' } : {})}
    >
      <button type="button" className="lyt-playbtn" aria-label={playLabel}>
        <span className="lyt-visually-hidden">{playLabel}</span>
      </button>
      <noscript dangerouslySetInnerHTML={{ __html: noscriptHtml }} />
    </lite-youtube>
  )
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'lite-youtube': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        videoid?: string
        playlabel?: string
        params?: string
        'js-api'?: string
      }
    }
  }
}
