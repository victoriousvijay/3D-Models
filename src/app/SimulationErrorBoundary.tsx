import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  onError: (message: string) => void
  children: ReactNode
}

interface State {
  failed: boolean
}

/**
 * Contains a failing simulation (view crash, failed lazy load, domain
 * initialisation error) so it cannot take down the canvas or the WebGL
 * context. The lab environment keeps rendering; the failure is reported
 * to the UI through `onError`.
 */
export class SimulationErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.props.onError(error instanceof Error ? error.message : String(error))
    // Keep the stack visible to developers; production telemetry can hook in here later.
    console.error(error, info.componentStack)
  }

  override render(): ReactNode {
    return this.state.failed ? null : this.props.children
  }
}
