import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

import { Drawer } from '@/shared/components/drawer'

type ErrorKind = 'permission' | 'no-camera' | 'generic' | 'insecure'

interface BarcodeScannerProps {
  open: boolean
  onScan: (code: string) => void
  onClose: () => void
}

const READER_ID = 'barcode-reader'

export function BarcodeScanner({ open, onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null)
  const [ready, setReady] = useState(false)

  // Wait for drawer animation before mounting scanner
  useEffect(() => {
    if (!open) {
      setReady(false)
      setErrorKind(null)
      return
    }

    if (!window.isSecureContext) {
      setErrorKind('insecure')
      return
    }

    const delay = setTimeout(() => setReady(true), 500)
    return () => clearTimeout(delay)
  }, [open])

  // Start scanner
  useEffect(() => {
    if (!ready || !open) return

    const el = document.getElementById(READER_ID)
    if (!el) return

    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner
    let stopped = false

    function safeStop() {
      if (stopped) return
      stopped = true
      scannerRef.current = null
      try {
        const state = scanner.getState()
        // Only stop if actually scanning (state 2 = SCANNING, 3 = PAUSED)
        if (state === 2 || state === 3) {
          scanner.stop().then(() => scanner.clear()).catch(() => {})
        } else {
          scanner.clear()
        }
      } catch {
        // Scanner not initialized or already cleared — ignore
      }
    }

    scanner
      .start(
        { facingMode: 'environment' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {
          fps: 30,
          qrbox: { width: 300, height: 180 },
          // Use the native BarcodeDetector API when available (Chrome/Edge/Android)
          // — significantly faster than the JS fallback
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        } as any,
        (decodedText) => {
          console.log('[BarcodeScanner] ✅ detected:', decodedText)
          safeStop()
          onScan(decodedText)
        },
        () => {}
      )
      .catch((err: unknown) => {
        console.error('[BarcodeScanner] start error:', err)
        const msg = String(err)
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setErrorKind('permission')
        } else if (msg.includes('NotFoundError') || msg.includes('Devices')) {
          setErrorKind('no-camera')
        } else {
          setErrorKind('generic')
        }
      })

    return () => safeStop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, open])

  // Only close the drawer — the useEffect cleanup handles stopping the scanner
  function handleClose() {
    onClose()
  }

  return (
    <Drawer open={open} onClose={handleClose} zLayer={70} skipBodyLock>
      <div style={{ padding: '6px 22px 34px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2a40', textAlign: 'center', margin: '2px 0 4px' }}>
          Escaneando…
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: '#8a99a8', textAlign: 'center', marginBottom: 22 }}>
          Apuntá la cámara al código de barras
        </div>

        {/* Camera viewport — no overflow:hidden, let html5-qrcode control its own layout */}
        <div style={{ position: 'relative', width: '100%', borderRadius: 22, overflow: 'hidden', background: '#12212e' }}>
          {errorKind ? (
            <ErrorState kind={errorKind} />
          ) : (
            <>
              <div id={READER_ID} style={{ width: '100%' }} />

              {/* Scan line overlay */}
              {ready && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }} aria-hidden="true">
                  <div style={{
                    position: 'absolute',
                    left: '8%',
                    right: '8%',
                    height: 2.5,
                    top: '50%',
                    background: 'linear-gradient(90deg, transparent, #4fd39a, transparent)',
                    boxShadow: '0 0 14px #4fd39a',
                    animation: 'scanline 1.7s ease-in-out infinite',
                  }} />
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          style={{
            marginTop: 20,
            width: '100%',
            background: '#eef2f6',
            color: '#3a4d5e',
            border: 'none',
            borderRadius: 14,
            padding: 15,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Cancelar
        </button>
      </div>
    </Drawer>
  )
}

function ErrorState({ kind }: { kind: ErrorKind }) {
  const config: Record<ErrorKind, { icon: string; title: string; description: string }> = {
    permission: {
      icon: '🔒',
      title: 'Permiso de cámara requerido',
      description: 'Permití el acceso a la cámara en la configuración del navegador.',
    },
    'no-camera': {
      icon: '📷',
      title: 'No se encontró cámara',
      description: 'Asegurate de que tu dispositivo tenga una cámara disponible.',
    },
    generic: {
      icon: '⚠️',
      title: 'Error al iniciar la cámara',
      description: 'No se pudo acceder a la cámara. Cerrá e intentá nuevamente.',
    },
    insecure: {
      icon: '🔓',
      title: 'Conexión no segura',
      description: 'Se requiere HTTPS para acceder a la cámara.',
    },
  }

  const { icon, title, description } = config[kind]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 260,
      gap: 12,
      padding: 24,
      textAlign: 'center',
      color: '#fff',
    }}>
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>{description}</div>
    </div>
  )
}
