import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type SupabaseLikeError = {
  message?: string
}

function cleanFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '')
}

export default function AuthPage() {
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null

    setAvatarFile(file)
    setErrorMessage('')

    if (!file) {
      setAvatarPreview('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setAvatarFile(null)
      setAvatarPreview('')
      setErrorMessage('Le fichier choisi doit être une image.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarFile(null)
      setAvatarPreview('')
      setErrorMessage('La photo ne doit pas dépasser 2 Mo.')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setAvatarPreview(String(reader.result))
    }

    reader.readAsDataURL(file)
  }

  async function uploadAvatar(userId: string) {
    if (!avatarFile) return ''

    const fileExtension = avatarFile.name.split('.').pop() || 'jpg'
    const fileNameWithoutExtension = avatarFile.name.replace(/\.[^/.]+$/, '')
    const fileName = `${Date.now()}-${cleanFileName(
      fileNameWithoutExtension,
    )}.${fileExtension}`

    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) throw error

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setErrorMessage('')

    try {
      if (mode === 'signup') {
        const cleanUsername = username.trim()

        if (!cleanUsername) {
          setErrorMessage('Tu dois choisir un pseudo.')
          setLoading(false)
          return
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: cleanUsername,
            },
          },
        })

        if (error) throw error

        if (data.user && data.session) {
          const avatarUrl = await uploadAvatar(data.user.id)

          const { error: profileError } = await supabase.from('profiles').upsert({
            user_id: data.user.id,
            username: cleanUsername,
            bio: '',
            avatar_url: avatarUrl,
            updated_at: new Date().toISOString(),
          })

          if (profileError) throw profileError

          navigate('/')
          return
        }

        setMessage(
          "Compte créé. Vérifie ta boîte mail avant de te connecter. Le pseudo a bien été enregistré. La photo pourra être ajoutée depuis ton profil après confirmation du compte.",
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        navigate('/')
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
    <section className="mx-auto max-w-md rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-orange-100">
      <h2 className="mb-2 text-3xl font-black text-stone-950">
        {mode === 'login' ? 'Connexion' : 'Créer un compte'}
      </h2>

      <p className="mb-8 leading-7 text-stone-600">
        {mode === 'login'
          ? 'Connecte-toi pour retrouver ton carnet de recettes.'
          : 'Crée ton espace avec un pseudo et une photo de profil.'}
      </p>

      <form onSubmit={handleSubmit} className="grid gap-5">
        {mode === 'signup' && (
          <>
            <div>
              <label className="mb-2 block font-bold text-stone-800">
                Pseudo
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Exemple : Toudou"
                className="w-full rounded-2xl border border-orange-100 bg-[#fffdf9] px-4 py-3 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block font-bold text-stone-800">
                Photo de profil
              </label>

              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-3xl ring-1 ring-orange-200">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Aperçu de la photo de profil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    '👤'
                  )}
                </div>

                <label className="cursor-pointer rounded-full border border-orange-200 bg-white px-5 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50">
                  Choisir une photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              <p className="mt-2 text-xs font-medium text-stone-500">
                Image conseillée : carrée, maximum 2 Mo.
              </p>
            </div>
          </>
        )}

        <div>
          <label className="mb-2 block font-bold text-stone-800">Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-orange-100 bg-[#fffdf9] px-4 py-3 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            required
          />
        </div>

        <div>
          <label className="mb-2 block font-bold text-stone-800">
            Mot de passe
          </label>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-orange-100 bg-[#fffdf9] px-4 py-3 pr-14 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-lg transition hover:bg-orange-50"
              aria-label={
                showPassword
                  ? 'Cacher le mot de passe'
                  : 'Afficher le mot de passe'
              }
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {message && (
          <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm font-semibold leading-6 text-green-700">
            {message}
          </p>
        )}

        {errorMessage && (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600 disabled:opacity-70"
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
          setUsername('')
          setAvatarFile(null)
          setAvatarPreview('')
          setShowPassword(false)
        }}
        className="mt-5 text-sm font-bold text-orange-600 hover:text-orange-700"
      >
        {mode === 'login'
          ? "Je n'ai pas de compte"
          : "J'ai déjà un compte"}
      </button>
    </section>
  )
}