import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  /**
   * Quand cette valeur change (ex : le chemin de la page), on réinitialise
   * l'erreur pour laisser une nouvelle page s'afficher après une navigation.
   */
  resetKey?: string
}

type ErrorBoundaryState = {
  hasError: boolean
}

/**
 * Garde-fou global : si un composant plante au rendu, on affiche un écran
 * doux plutôt qu'une page blanche. L'erreur est loggée pour le suivi.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    // Nouvelle page → on retente un rendu normal.
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false })
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erreur de rendu interceptée :', error, info)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <section className="mx-auto max-w-lg rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-bark">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-terracotta-soft text-3xl">
          🍳
        </div>

        <h1 className="mt-5 text-2xl font-black text-cacao">
          Oups, un petit accroc en cuisine
        </h1>

        <p className="mt-3 leading-7 text-hazel">
          Cette page n'a pas pu s'afficher correctement. Pas de panique, tes
          recettes sont en sécurité. Recharge la page ou reviens à l'accueil.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-terracotta px-6 py-3 font-bold text-white shadow-soft transition duration-200 hover:-translate-y-0.5 hover:bg-terracotta-deep hover:shadow-card focus-visible:ring-4 focus-visible:ring-terracotta/25"
          >
            Recharger la page
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-card px-6 py-3 font-bold text-cacao ring-1 ring-bark transition duration-200 hover:-translate-y-0.5 hover:bg-linen"
          >
            Retour à l'accueil
          </a>
        </div>
      </section>
    )
  }
}
