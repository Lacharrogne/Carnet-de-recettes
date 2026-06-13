import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-2xl">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-terracotta">
          Erreur 404
        </p>

        <EmptyState
          emoji="🍽️"
          title="Cette page n’existe pas"
          description="La page que tu cherches est introuvable. Elle a peut-être été déplacée, supprimée, ou l’adresse est incorrecte."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button to="/">Retour à l’accueil</Button>
              <Button to="/recipes" variant="secondary">
                Voir les recettes
              </Button>
            </div>
          }
        />
      </div>
    </section>
  )
}
