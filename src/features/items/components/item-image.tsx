import { useState } from 'react'

interface ItemImageProps {
  /** Image URL, or null/undefined to show only the icon. */
  url?: string | null
  /** Size of the square container in px. */
  size?: number
  /** Border radius in px. */
  radius?: number
}

/** Blue box icon shown as placeholder / fallback. */
function BoxIcon({ size }: { size: number }) {
  const iconSize = Math.round(size * 0.48)
  return (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#2c6ea0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M3.3 7 12 12l8.7-5" /><path d="M12 22V12" />
    </svg>
  )
}

/**
 * Square item thumbnail: shows the blue box icon as a placeholder,
 * then fades in the real image once it finishes loading.
 */
export function ItemImage({ url, size = 46, radius = 14 }: ItemImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const showImage = url && !failed

  return (
    <div
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: radius,
        background: '#eaf1f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <BoxIcon size={size} />
      {showImage && (
        <img
          src={url}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity .25s ease',
          }}
        />
      )}
    </div>
  )
}

interface ItemImageBannerProps {
  url: string
  alt?: string
  /** Fixed height of the banner in px. */
  height?: number
}

/**
 * Wide banner image for the item detail view. Shows a subtle placeholder
 * background + centered icon until the image loads, then fades in.
 * Prevents the "blank flash" while the image decodes.
 */
export function ItemImageBanner({ url, alt = '', height = 160 }: ItemImageBannerProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        background: '#eaf1f7',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Placeholder icon — visible until image loads */}
      {!loaded && !failed && <BoxIcon size={56} />}

      {!failed && (
        <img
          src={url}
          alt={alt}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity .25s ease',
          }}
        />
      )}
    </div>
  )
}
