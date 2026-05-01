import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type SupabaseLikeError = {
  message?: string
}

export default function AuthPage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setErrorMessage('')

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (!data.session) {
          setMessage(
            "Compte créé. Vérifie ta boîte mail avant de te connecter, ou désactive temporairement la confirmation email dans Supabase pour tester."
          )
        } else {
          navigate('/recipes')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        navigate('/recipes')
      }
    } catch (error: unknown) {
      console.error(error)

      const err = error as SupabaseLikeError
      setErrorMessage(err.message ?? "Impossible de terminer l'action.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
      <h2 className="mb-2 text-3xl font-bold">
        {mode === 'login' ? 'Connexion' : 'Créer un compte'}
      </h2>
      <p className="mb-8 text-slate-600">
        Connecte-toi pour ajouter, modifier et supprimer tes recettes.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div>
          <label className="mb-2 block font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
            required
          />
        </div>

        {message && (
          <p className="rounded-2xl bg-green-50 px-4 py-3 text-green-700">
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-600 disabled:opacity-70"
        >
          {loading
            ? 'Chargement...'
            : mode === 'login'
            ? 'Se connecter'
            : 'Créer le compte'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'signup' : 'login')
          setMessage('')
          setErrorMessage('')
        }}
        className="mt-5 text-sm font-medium text-orange-600"
      >
        {mode === 'login'
          ? "Je n'ai pas de compte"
          : "J'ai déjà un compte"}
      </button>
    </section>
  )
}