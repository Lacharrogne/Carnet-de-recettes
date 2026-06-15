import { XCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function PaymentCancelPage() {
  useDocumentTitle('Paiement annulé')

  return (
    <section className="mx-auto max-w-md text-center">
      <div className="rounded-[2rem] bg-card p-8 shadow-card ring-1 ring-bark sm:p-10">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-terracotta-soft ring-1 ring-bark">
            <XCircle className="h-10 w-10 text-terracotta-deep" />
          </div>
        </div>

        <h1 className="mt-6 font-display text-3xl font-black text-espresso">
          Paiement annulé
        </h1>

        <p className="mt-3 leading-7 text-cacao/80">
          Votre abonnement n'a pas été activé. Vous pouvez réessayer à tout
          moment depuis la page des offres.
        </p>

        <div className="mt-8 grid gap-3">
          <Button to="/pricing" size="lg" fullWidth>
            Retour aux offres
          </Button>

          <Button to="/" variant="secondary" size="lg" fullWidth>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </section>
  )
}
