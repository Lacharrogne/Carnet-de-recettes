import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import SectionHeader from './SectionHeader'

const FAQ_ITEMS = [
  {
    question: 'À quoi sert Carnet de recettes ?',
    answer:
      "Carnet de recettes centralise vos recettes de cuisine, génère vos listes de courses, vous aide à planifier vos repas de la semaine et à cuisiner avec ce que vous avez déjà dans le frigo.",
  },
  {
    question: 'Est-ce adapté à une famille ?',
    answer:
      "Absolument. Le carnet est pensé pour la cuisine du quotidien en famille. L'offre Premium permet même de partager un même carnet entre plusieurs membres de la famille.",
  },
  {
    question: 'Puis-je ajouter mes propres recettes ?',
    answer:
      "Oui, c'est l'une des fonctions principales. Ajoutez autant de recettes que vous voulez : ingrédients, étapes, photos et notes personnelles.",
  },
  {
    question: 'La liste de courses est-elle automatique ?',
    answer:
      "Oui. Quand vous planifiez un repas, les ingrédients de la recette s'ajoutent à votre liste, regroupés par rayon pour faciliter vos courses.",
  },
  {
    question: 'Puis-je annuler mon abonnement ?',
    answer:
      "Oui, à tout moment et sans engagement. L'abonnement Premium est résiliable sans frais ni délai de préavis.",
  },
  {
    question: 'Mes données sont-elles privées ?',
    answer:
      "Vos recettes et vos données restent privées, accessibles uniquement à vous et aux personnes que vous invitez. Aucune donnée n'est revendue à des tiers.",
  },
  {
    question: 'Est-ce utilisable sur mobile ?',
    answer:
      'Oui, le carnet fonctionne sur smartphone, tablette et ordinateur, directement depuis votre navigateur web.',
  },
  {
    question: 'De nouvelles fonctionnalités seront-elles ajoutées ?',
    answer:
      "Oui, régulièrement. Le carnet évolue selon les retours des utilisateurs, et l'offre Premium inclut d'emblée les futures fonctionnalités.",
  },
]

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="scroll-mt-20">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <SectionHeader
          centered
          eyebrow="Questions fréquentes"
          title="Tout ce que vous voulez savoir"
        />

        <div className="mt-8 divide-y divide-bark rounded-card bg-card px-5 shadow-soft ring-1 ring-bark sm:px-7">
          {FAQ_ITEMS.map((item, index) => (
            <div key={index}>
              <button
                type="button"
                onClick={() => setOpen(open === index ? null : index)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
                aria-expanded={open === index}
              >
                <span className="font-display font-bold text-espresso">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-hazel transition-transform duration-200 ${
                    open === index ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {open === index && (
                <p className="pb-4 text-sm leading-6 text-cacao/80">
                  {item.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
