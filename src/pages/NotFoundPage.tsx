import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-sm ring-1 ring-orange-100">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 text-5xl">
          🍽️
        </div>

        <p className="mt-6 font-medium text-orange-500">Erreur 404</p>

        <h1 className="mt-3 text-4xl font-black text-slate-950">
          Cette page n’existe pas
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          La page que tu cherches est introuvable. Elle a peut-être été
          déplacée, supprimée ou l’adresse est incorrecte.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="rounded-2xl bg-orange-500 px-6 py-3 font-semibold text-white transition hover:bg-orange-600"
          >
            Retour à l’accueil
          </Link>

          <Link
            to="/recipes"
            className="rounded-2xl border border-orange-200 px-6 py-3 font-semibold text-orange-600 transition hover:bg-orange-50"
          >
            Voir les recettes
          </Link>
        </div>
      </div>
    </section>
  )
}