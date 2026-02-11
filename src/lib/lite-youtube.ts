const YOUTUBE_DOMAINS = ['youtube.com', 'www.youtube.com', 'm.youtube.com']

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, options: Record<string, unknown>) => unknown
      ready: (cb: () => void) => void
    }
  }
}

function canUseDOM() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function parseYouTubeIdFromUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl)
    const host = url.hostname.toLowerCase()

    if (
      YOUTUBE_DOMAINS.some(
        (domain) => host === domain || host.endsWith(`.${domain}`),
      )
    ) {
      const id = url.searchParams.get('v')
      return id || null
    }

    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id || null
    }

    return null
  } catch {
    return null
  }
}

export function extractYouTubeVideoId(rawUrl?: string | null): string | null {
  if (!rawUrl) return null
  return parseYouTubeIdFromUrl(rawUrl)
}

export function extractYouTubeVideoIdFromText(
  content?: string | null,
): string | null {
  if (!content) return null
  const urls = content.match(/https?:\/\/[^\s)]+/g)
  if (!urls) return null

  for (const maybeUrl of urls) {
    const id = parseYouTubeIdFromUrl(maybeUrl)
    if (id) return id
  }

  return null
}

function detectNeedsYTApi(el: HTMLElement) {
  if (!canUseDOM()) return false
  const wantsJsApi = el.hasAttribute('js-api')
  const vendor = window.navigator.vendor || ''
  const ua = window.navigator.userAgent || ''
  return (
    wantsJsApi ||
    vendor.includes('Apple') ||
    /Mobi|Android|iPhone|iPad/i.test(ua)
  )
}

export function defineLiteYouTubeElement() {
  if (!canUseDOM()) return
  if (!customElements.get('lite-youtube')) {
    class LiteYouTubeElement extends HTMLElement {
      static preconnected = false

      private videoId = ''
      private playLabel = 'Play video'
      private activated = false
      private needsYTApi = false
      private ytApiPromise: Promise<void> | null = null

      connectedCallback() {
        this.videoId = this.getAttribute('videoid') || ''
        if (!this.videoId) return

        this.dataset.title = this.getAttribute('title') || ''
        this.playLabel = this.getAttribute('playlabel') || 'Play video'

        if (!this.style.backgroundImage) {
          this.style.backgroundImage = `url("https://i.ytimg.com/vi/${this.videoId}/hqdefault.jpg")`
          this.upgradePosterImage()
        }

        this.ensurePlayButton()

        this.addEventListener(
          'pointerover',
          LiteYouTubeElement.warmConnections,
          {
            once: true,
          },
        )
        this.addEventListener('focusin', LiteYouTubeElement.warmConnections, {
          once: true,
        })

        this.addEventListener('click', this.activate)
        this.needsYTApi = detectNeedsYTApi(this)
      }

      disconnectedCallback() {
        this.removeEventListener('click', this.activate)
      }

      private ensurePlayButton() {
        let playBtnEl = this.querySelector<HTMLButtonElement>('.lyt-playbtn')
        if (!playBtnEl) {
          playBtnEl = document.createElement('button')
          playBtnEl.type = 'button'
          playBtnEl.className = 'lyt-playbtn lty-playbtn'
          this.append(playBtnEl)
        }

        playBtnEl.setAttribute('aria-label', this.playLabel)

        if (!playBtnEl.querySelector('.lyt-visually-hidden')) {
          const label = document.createElement('span')
          label.className = 'lyt-visually-hidden'
          label.textContent = this.playLabel
          playBtnEl.append(label)
        }
      }

      private static addPrefetch(kind: 'preconnect', url: string) {
        const linkEl = document.createElement('link')
        linkEl.rel = kind
        linkEl.href = url
        linkEl.crossOrigin = ''
        document.head.append(linkEl)
      }

      static warmConnections() {
        if (LiteYouTubeElement.preconnected || !canUseDOM()) return

        LiteYouTubeElement.addPrefetch(
          'preconnect',
          'https://www.youtube-nocookie.com',
        )
        LiteYouTubeElement.addPrefetch('preconnect', 'https://www.google.com')
        LiteYouTubeElement.addPrefetch('preconnect', 'https://i.ytimg.com')

        LiteYouTubeElement.preconnected = true
      }

      private getParams() {
        const params = new URLSearchParams(this.getAttribute('params') || '')
        if (!params.has('autoplay')) params.set('autoplay', '1')
        if (!params.has('playsinline')) params.set('playsinline', '1')
        if (!params.has('rel')) params.set('rel', '0')
        return params
      }

      private fetchYTPlayerApi() {
        if (window.YT?.Player) return Promise.resolve()
        if (this.ytApiPromise) return this.ytApiPromise

        this.ytApiPromise = new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://www.youtube.com/iframe_api'
          script.async = true
          script.onload = () => {
            if (window.YT?.ready) {
              window.YT.ready(resolve)
            } else {
              resolve()
            }
          }
          script.onerror = () => reject(new Error('Failed to load YouTube API'))
          document.head.append(script)
        })

        return this.ytApiPromise
      }

      private createBasicIframe() {
        const iframeEl = document.createElement('iframe')
        iframeEl.width = '560'
        iframeEl.height = '315'
        iframeEl.title = this.getAttribute('title') || this.playLabel
        iframeEl.allow =
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
        iframeEl.allowFullscreen = true
        iframeEl.referrerPolicy = 'strict-origin-when-cross-origin'
        iframeEl.loading = 'lazy'
        iframeEl.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(this.videoId)}?${this.getParams().toString()}`
        return iframeEl
      }

      private addYTPlayerIframe = async () => {
        await this.fetchYTPlayerApi()

        const placeholder = document.createElement('div')
        this.append(placeholder)

        const paramsObj = Object.fromEntries(this.getParams().entries())
        if (window.YT?.Player) {
          // eslint-disable-next-line no-new
          new window.YT.Player(placeholder, {
            width: '100%',
            videoId: this.videoId,
            playerVars: paramsObj,
            events: {
              onReady: (event: { target: { playVideo: () => void } }) => {
                event.target.playVideo()
              },
            },
          })
        } else {
          placeholder.append(this.createBasicIframe())
        }
      }

      private activate = async () => {
        if (this.activated) return
        this.activated = true
        this.classList.add('lyt-activated')

        if (this.needsYTApi) {
          await this.addYTPlayerIframe()
          return
        }

        const iframe = this.createBasicIframe()
        this.append(iframe)
        iframe.focus()
      }

      private upgradePosterImage() {
        window.setTimeout(() => {
          const webpUrl = `https://i.ytimg.com/vi_webp/${this.videoId}/sddefault.webp`
          const imageProbe = new Image()
          imageProbe.fetchPriority = 'low'
          imageProbe.referrerPolicy = 'origin'
          imageProbe.src = webpUrl
          imageProbe.onload = () => {
            const isFallbackImage =
              imageProbe.naturalWidth === 120 && imageProbe.naturalHeight === 90
            if (!isFallbackImage) {
              this.style.backgroundImage = `url("${webpUrl}")`
            }
          }
        }, 100)
      }
    }

    customElements.define('lite-youtube', LiteYouTubeElement)
  }
}
