import { useCallback, useState } from 'react'

type ActionStatus = 'loading' | 'success' | 'error'

interface ActionDialogState {
  open: boolean
  status: ActionStatus
  loadingMessage: string
  successMessage: string
  errorMessage: string
}

const INITIAL: ActionDialogState = {
  open: false,
  status: 'loading',
  loadingMessage: '',
  successMessage: '',
  errorMessage: '',
}

/**
 * Hook that manages ActionDialog state.
 * Returns the state props + a `run` helper that opens the dialog,
 * executes the async action, and transitions to success/error.
 */
export function useActionDialog() {
  const [state, setState] = useState<ActionDialogState>(INITIAL)

  const close = useCallback(() => setState(INITIAL), [])

  const run = useCallback(
    async (opts: {
      loading: string
      success: string
      error?: string
      action: () => Promise<void>
    }) => {
      setState({
        open: true,
        status: 'loading',
        loadingMessage: opts.loading,
        successMessage: opts.success,
        errorMessage: opts.error ?? 'Ocurrió un error',
      })

      try {
        await opts.action()
        setState((s) => ({ ...s, status: 'success' }))
      } catch {
        setState((s) => ({ ...s, status: 'error' }))
        throw new Error('action-failed')
      }
    },
    []
  )

  return { dialogProps: state, closeDialog: close, runWithDialog: run }
}
