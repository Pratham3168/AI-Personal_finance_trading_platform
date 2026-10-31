import { Component } from 'react'
import { TriangleAlert } from 'lucide-react'

// Catches rendering errors so one bad response shows a message instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Page error:', error, info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-md rounded-2xl border border-warning/30 bg-warning/10 p-8 text-center text-fg">
        <TriangleAlert className="mx-auto h-8 w-8 text-warning" aria-hidden />
        <h2 className="mt-3 text-lg font-semibold">This section couldn’t be displayed</h2>
        <p className="mt-1 text-sm text-muted">
          Something unexpected came back from the server. Your data is safe. Try again, or open another page.
        </p>
        <button
          onClick={() => this.setState({ error: null })}
          className="mt-5 rounded-xl border border-line-strong px-4 py-2 text-sm font-semibold text-fg hover:bg-accent/10"
        >
          Try again
        </button>
      </div>
    )
  }
}
