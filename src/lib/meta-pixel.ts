import * as React from 'react'

declare global {
  interface Window {
    fbq?: (...args: Array<any>) => void
    _fbq?: (...args: Array<any>) => void
  }
}

export function MetaPixel({ pixelId }: { pixelId?: string | null }) {
  React.useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return
    if (window.fbq) {
      window.fbq('init', pixelId)
      return
    }

    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'

    const fbqShim = function (...args: Array<any>) {
      ;(fbqShim as any).callMethod
        ? (fbqShim as any).callMethod.apply(fbqShim, args)
        : (fbqShim as any).queue.push(args)
    }

    ;(fbqShim as any).queue = []
    ;(fbqShim as any).loaded = true
    ;(fbqShim as any).version = '2.0'

    window.fbq = fbqShim
    window._fbq = fbqShim

    document.head.appendChild(script)
    window.fbq('init', pixelId)
  }, [pixelId])

  return null
}

export function trackMetaPixelEvent(
  eventName: string,
  payload?: Record<string, unknown>,
  eventId?: string,
) {
  if (typeof window === 'undefined' || !window.fbq) return

  if (eventId) {
    window.fbq('track', eventName, payload ?? {}, {
      eventID: eventId,
    })
    return
  }

  window.fbq('track', eventName, payload ?? {})
}

export function createMetaEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
