import { CheckCircle } from 'lucide-react'
import Button from '../components/ui/Button'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function PaymentSuccessPage() {
  useDocumentTitle('Abonnement activé')

  return (
    <section className="mx-auto max-w-md text-center">
      <div className="rounded-[2rem] bg-card p-8 shadow-card ring-1 ring-bark sm:p-10">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sage-soft ring-1 ring-bark">
            <CheckCircle className="h-10 w-10 text-sage-deep" />
          </div>
        </div>

        <h1 className="mt-6 font-display text-3xl font-black text-espresso">
          Paiement réussi !
        </h1>

        <p className="mt-3 leading-7 text-cacao/80">
          Votre abonnement Famille Premium est maintenant actif. Vous pouvez
          profiter de toutes les fonctionnalités du carnet.
        </p>

        <div className="mt-8 grid gap-3">
          <Button to="/" size="lg" fullWidth>
            Aller dans mon carnet
          </Button>

          <Button to="/profile" variant="secondary" size="lg" fullWidth>
            Voir mon compte
          </Button>
        </div>
      </div>
    </section>
  )
}
