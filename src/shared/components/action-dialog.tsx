import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

type ActionStatus = 'loading' | 'success' | 'error'

interface ActionDialogProps {
  open: boolean
  status: ActionStatus
  /** e.g. "Creando artículo…", "Editando persona…" */
  loadingMessage: string
  successMessage?: string
  errorMessage?: string
  /** Auto-close delay after success/error (ms). Default: 1500 */
  autoCloseDelay?: number
  onClose: () => void
}

/**
 * Full-screen overlay dialog for async operations.
 * Shows a loading spinner → animated success check / error X.
 * Uses framer-motion for smooth enter/exit/transition animations.
 */
export function ActionDialog({
  open,
  status,
  loadingMessage,
  successMessage = 'Listo',
  errorMessage = 'Ocurrió un error',
  autoCloseDelay = 1500,
  onClose,
}: ActionDialogProps) {
  // Auto-close after success or error
  useEffect(() => {
    if (!open) return
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(onClose, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [open, status, autoCloseDelay, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="action-dialog-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(12,26,40,.45)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <motion.div
            key="action-dialog-card"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              background: '#fff',
              borderRadius: 24,
              padding: '40px 36px 32px',
              minWidth: 220,
              maxWidth: 280,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
              boxShadow: '0 24px 64px -16px rgba(16,45,74,.25)',
            }}
          >
            {/* Animated icon area */}
            <div style={{ width: 72, height: 72, position: 'relative' }}>
              <AnimatePresence mode="wait">
                {status === 'loading' && (
                  <motion.div
                    key="spinner"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: 72, height: 72 }}
                  >
                    <LoadingSpinner />
                  </motion.div>
                )}

                {status === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    style={{ width: 72, height: 72 }}
                  >
                    <SuccessIcon />
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    style={{ width: 72, height: 72 }}
                  >
                    <ErrorIcon />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Message with crossfade */}
            <AnimatePresence mode="wait">
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: status === 'error' ? '#c8392f' : '#0f2a40',
                  textAlign: 'center',
                  lineHeight: 1.35,
                }}
              >
                {status === 'loading' && loadingMessage}
                {status === 'success' && successMessage}
                {status === 'error' && errorMessage}
              </motion.div>
            </AnimatePresence>

            {/* Loading dots */}
            {status === 'loading' && (
              <div style={{ display: 'flex', gap: 7 }}>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#165382',
                    }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}

/** Animated spinning ring */
function LoadingSpinner() {
  return (
    <motion.svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <circle cx="36" cy="36" r="28" fill="none" stroke="#e9edf2" strokeWidth="5" />
      <circle
        cx="36"
        cy="36"
        r="28"
        fill="none"
        stroke="#165382"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="130 176"
      />
    </motion.svg>
  )
}

/** Animated success check with draw-in effect */
function SuccessIcon() {
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: '#e6f5ee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M20 6 9 17l-5-5"
          stroke="#2f9e6a"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        />
      </svg>
    </div>
  )
}

/** Animated error X with draw-in effect */
function ErrorIcon() {
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: '#fdeceb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <motion.path
          d="M18 6 6 18"
          stroke="#c8392f"
          strokeWidth="2.8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
        />
        <motion.path
          d="M6 6l12 12"
          stroke="#c8392f"
          strokeWidth="2.8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3, delay: 0.25, ease: 'easeOut' }}
        />
      </svg>
    </div>
  )
}
