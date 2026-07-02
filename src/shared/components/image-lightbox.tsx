import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface ImageLightboxProps {
  open: boolean
  src: string
  alt?: string
  onClose: () => void
}

/**
 * Full-screen image viewer. Tap backdrop or X to close.
 * Supports pinch-to-zoom via CSS touch-action.
 */
export function ImageLightbox({ open, src, alt = '', onClose }: ImageLightboxProps) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(0,0,0,.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            cursor: 'pointer',
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Cerrar imagen"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,.15)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 2,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>

          {/* Image */}
          <motion.img
            src={src}
            alt={alt}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: 8,
              touchAction: 'pinch-zoom',
              cursor: 'default',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
