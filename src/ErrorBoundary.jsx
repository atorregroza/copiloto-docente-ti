import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-5xl">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800">Algo salió mal</h1>
          <p className="text-sm text-gray-500">
            La aplicación encontró un error inesperado. Tu progreso guardado no se ha perdido.
          </p>
          <button
            onClick={() => {
              this.setState({ error: null })
              window.location.reload()
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2b5a52] text-white rounded-xl font-semibold text-sm hover:bg-[#1e4a42] transition-colors"
          >
            Recargar aplicación
          </button>
        </div>
      </div>
    )
  }
}
