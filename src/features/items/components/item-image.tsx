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
 * Item thumbnail that shows the blue box icon as a placeholder,
 * then fades in the real image once it finishes loading.
 * If there's no url or the image fails, the icon stays.
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
      {/* Icon — always rendered underneath */}
      <BoxIcon size={size} />

      {/* Image — fades in over the icon once loaded */}
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
