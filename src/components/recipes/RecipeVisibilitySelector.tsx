import { useRecipeVisibility } from '../../context/useRecipeVisibility'
import type { RecipeVisibilityMode } from '../../lib/recipeVisibility'
import type { SocialProfile } from '../../services/social'

type Props = {
  /** Amis de l'utilisateur (pour le choix « un ami précis »). */
  friends: SocialProfile[]
  /** 'card' : section réglage (profil). 'compact' : filtre en ligne (page Recettes). */
  variant?: 'card' | 'compact'
}

const MODE_OPTIONS: { id: RecipeVisibilityMode; label: string; emoji: string }[] =
  [
    { id: 'community', label: 'Communauté', emoji: '🌍' },
    { id: 'mine', label: 'Mes recettes', emoji: '📖' },
    { id: 'friends', label: 'Amis', emoji: '🧑‍🍳' },
  ]

function friendName(friend: SocialProfile): string {
  return friend.full_name || friend.username || 'Ami·e'
}

export default function RecipeVisibilitySelector({
  friends,
  variant = 'compact',
}: Props) {
  const { visibility, setVisibility } = useRecipeVisibility()

  // Le bouton « Amis » couvre les deux modes amis.
  const isFriendsGroup =
    visibility.mode === 'friends' || visibility.mode === 'friend'

  function selectMode(mode: RecipeVisibilityMode) {
    if (mode === 'friends') {
      // Par défaut : tous mes amis.
      if (!isFriendsGroup) {
        setVisibility({ mode: 'friends', friendId: null })
      }
      return
    }

    setVisibility({ mode, friendId: null })
  }

  function handleFriendChange(value: string) {
    if (value === '') {
      setVisibility({ mode: 'friends', friendId: null })
    } else {
      setVisibility({ mode: 'friend', friendId: value })
    }
  }

  const isActive = (id: RecipeVisibilityMode) =>
    id === 'friends' ? isFriendsGroup : visibility.mode === id

  const buttons = (
    <div
      role="radiogroup"
      aria-label="Recettes affichées"
      className={
        variant === 'card'
          ? 'grid gap-3 sm:grid-cols-3'
          : 'flex flex-wrap gap-2'
      }
    >
      {MODE_OPTIONS.map((option) => {
        const active = isActive(option.id)

        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => selectMode(option.id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition ${
              active
                ? 'border-orange-300 bg-orange-50 text-orange-800 ring-2 ring-orange-200'
                : 'border-orange-100 bg-[#fffaf5] text-stone-700 hover:border-orange-200 hover:bg-orange-50'
            }`}
          >
            <span aria-hidden="true">{option.emoji}</span>
            {option.label}
          </button>
        )
      })}
    </div>
  )

  const friendPicker = isFriendsGroup ? (
    <div className="mt-3">
      <label className="mb-1 block text-xs font-black uppercase tracking-wide text-orange-700">
        Quels amis ?
      </label>
      <select
        value={visibility.mode === 'friend' ? (visibility.friendId ?? '') : ''}
        onChange={(event) => handleFriendChange(event.target.value)}
        className="w-full rounded-2xl bg-linen ring-1 ring-bark px-4 py-2.5 text-sm font-semibold text-stone-800 outline-none transition focus:bg-card focus:ring-2 focus:ring-terracotta/40 sm:max-w-xs"
      >
        <option value="">Tous mes amis</option>
        {friends.map((friend) => (
          <option key={friend.user_id} value={friend.user_id}>
            {friendName(friend)}
          </option>
        ))}
      </select>

      {friends.length === 0 && (
        <p className="mt-2 text-xs font-semibold text-stone-500">
          Vous n’avez pas encore d’amis (abonnements mutuels). En attendant,
          « Tous mes amis » n’affichera que vos recettes.
        </p>
      )}
    </div>
  ) : null

  if (variant === 'card') {
    return (
      <section
        aria-labelledby="recipe-visibility-title"
        className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-orange-100"
      >
        <div className="mb-5">
          <p className="font-bold text-orange-700">Recettes</p>
          <h2
            id="recipe-visibility-title"
            className="mt-1 text-2xl font-black text-stone-950"
          >
            Recettes affichées
          </h2>
          <p className="mt-2 text-stone-600">
            Choisissez ce que vous voyez dans « Toutes les recettes » : toute la
            communauté, seulement les vôtres, ou celles de vos amis.
          </p>
        </div>

        {buttons}
        {friendPicker}
      </section>
    )
  }

  return (
    <div className="rounded-[1.5rem] border border-orange-100 bg-[#fffaf5]/70 p-4">
      <p className="mb-2 text-xs font-black uppercase tracking-wide text-orange-700">
        Recettes affichées
      </p>
      {buttons}
      {friendPicker}
    </div>
  )
}
