import { AnimatePresence, motion } from 'framer-motion'
import { useOnline } from '@/shared/hooks/use-online'

/**
 * Fixed banner at the top of the screen when the device is offline.
 * Slides in/out with animation.
 */
export function OfflineBanner() {
  const online = useOnline()

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          key="offline-banner"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ overflow: 'hidden', zIndex: 45 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '10px 16px',
              background: '#f8efdc',
              borderBottom: '1px solid #f2e0c9',
              fontSize: 13,
              fontWeight: 600,
              color: '#8a6914',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b5851f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1l22 22"/>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <path d="M12 20h.01"/>
            </svg>
            Sin conexión — Solo lectura
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
