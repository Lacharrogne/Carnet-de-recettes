import { supabase } from '../lib/supabase'
import { RECIPE_CATEGORIES } from '../data/recipeOptions'

/**
 * Configuration du gestionnaire d'administration générique : chaque « ressource »
 * décrit une table (clé primaire, colonnes affichées, champs éditables) et le
 * code CRUD s'appuie dessus. Toutes les écritures passent par l'API Supabase et
 * sont autorisées par les politiques RLS admin (migration 0005) — sauf le rôle,
 * qui passe par la fonction `admin_set_role`.
 */

export type AdminFieldType =
  | 'readonly'
  | 'text'
  | 'longtext'
  | 'number'
  | 'boolean'
  | 'json'
  | 'select'

export type AdminField = {
  name: string
  label: string
  type: AdminFieldType
  options?: string[]
  /** Champ écrit via une RPC dédiée plutôt que par UPDATE direct. */
  rpc?: 'role'
}

export type AdminRow = Record<string, unknown>

export type AdminResource = {
  key: string
  label: string
  emoji: string
  table: string
  pk: string[]
  orderBy: string
  orderAsc?: boolean
  /** Colonnes texte pour la recherche (ilike). */
  searchColumns: string[]
  /** Autorise la recherche par identifiant numérique (colonne `id`). */
  numericSearch?: boolean
  /** Colonnes montrées dans le tableau compact. */
  listColumns: string[]
  fields: AdminField[]
  /** Suppression des lignes liées avant celle-ci (intégrité référentielle). */
  cascade?: (row: AdminRow) => Promise<void>
  /** Autorise la suppression complète du compte (auth) via `admin_delete_user`. */
  authDelete?: boolean
}

const DIFFICULTIES = ['Facile', 'Moyen', 'Difficile']
const CATEGORY_VALUES = RECIPE_CATEGORIES.map((category) => category.value)

// --- Cascades de suppression (ordre : enfants avant parents) ----------------

async function cascadeRecipe(recipeId: number): Promise<void> {
  const { data: reviews } = await supabase
    .from('recipe_reviews')
    .select('id')
    .eq('recipe_id', recipeId)

  const reviewIds = (reviews ?? []).map((review) => (review as { id: number }).id)

  if (reviewIds.length > 0) {
    await supabase.from('recipe_review_likes').delete().in('review_id', reviewIds)
    await supabase
      .from('recipe_review_replies')
      .delete()
      .in('review_id', reviewIds)
  }

  await supabase.from('recipe_reviews').delete().eq('recipe_id', recipeId)
  await supabase.from('favorites').delete().eq('recipe_id', recipeId)
  await supabase.from('shopping_list_items').delete().eq('recipe_id', recipeId)
}

async function cascadeReview(reviewId: number): Promise<void> {
  await supabase.from('recipe_review_likes').delete().eq('review_id', reviewId)
  await supabase.from('recipe_review_replies').delete().eq('review_id', reviewId)
}

async function cascadeProfile(userId: string): Promise<void> {
  const { data: recipes } = await supabase
    .from('recipes')
    .select('id')
    .eq('user_id', userId)

  for (const recipe of recipes ?? []) {
    await cascadeRecipe((recipe as { id: number }).id)
  }

  await supabase.from('recipes').delete().eq('user_id', userId)
  await supabase.from('recipe_review_likes').delete().eq('user_id', userId)
  await supabase.from('recipe_review_replies').delete().eq('user_id', userId)
  await supabase.from('recipe_reviews').delete().eq('user_id', userId)
  await supabase.from('favorites').delete().eq('user_id', userId)
  await supabase.from('shopping_list_items').delete().eq('user_id', userId)
  await supabase.from('user_follows').delete().eq('follower_id', userId)
  await supabase.from('user_follows').delete().eq('following_id', userId)
  await supabase.from('site_ideas').delete().eq('user_id', userId)
  await supabase.from('subscriptions').delete().eq('user_id', userId)
}

// --- Définition des ressources ----------------------------------------------

export const ADMIN_RESOURCES: AdminResource[] = [
  {
    key: 'profiles',
    label: 'Utilisateurs',
    emoji: '👤',
    table: 'profiles',
    pk: ['user_id'],
    orderBy: 'created_at',
    searchColumns: ['username', 'bio'],
    listColumns: ['username', 'role', 'user_id'],
    fields: [
      { name: 'user_id', label: 'ID utilisateur', type: 'readonly' },
      { name: 'username', label: "Nom d'utilisateur", type: 'text' },
      { name: 'bio', label: 'Bio', type: 'longtext' },
      { name: 'avatar_url', label: 'Avatar (URL)', type: 'text' },
      {
        name: 'role',
        label: 'Rôle',
        type: 'select',
        options: ['user', 'admin'],
        rpc: 'role',
      },
      { name: 'created_at', label: 'Créé le', type: 'readonly' },
    ],
    cascade: (row) => cascadeProfile(String(row.user_id)),
    authDelete: true,
  },
  {
    key: 'recipes',
    label: 'Recettes',
    emoji: '🍽️',
    table: 'recipes',
    pk: ['id'],
    orderBy: 'created_at',
    searchColumns: ['title', 'category'],
    numericSearch: true,
    listColumns: ['id', 'title', 'category'],
    fields: [
      { name: 'id', label: 'ID', type: 'readonly' },
      { name: 'user_id', label: 'Auteur (ID)', type: 'readonly' },
      { name: 'title', label: 'Titre', type: 'text' },
      {
        name: 'category',
        label: 'Catégorie',
        type: 'select',
        options: CATEGORY_VALUES,
      },
      {
        name: 'difficulty',
        label: 'Difficulté',
        type: 'select',
        options: DIFFICULTIES,
      },
      { name: 'prep_time', label: 'Préparation (min)', type: 'number' },
      { name: 'cook_time', label: 'Cuisson (min)', type: 'number' },
      { name: 'servings', label: 'Portions', type: 'number' },
      { name: 'description', label: 'Description', type: 'longtext' },
      { name: 'image', label: 'Image (emoji/clé)', type: 'text' },
      { name: 'image_url', label: 'Image (URL)', type: 'text' },
      { name: 'tags', label: 'Tags', type: 'json' },
      { name: 'ingredients', label: 'Ingrédients', type: 'json' },
      { name: 'steps', label: 'Étapes', type: 'json' },
      { name: 'related_recipe_ids', label: 'Recettes liées', type: 'json' },
      { name: 'created_at', label: 'Créée le', type: 'readonly' },
    ],
    cascade: (row) => cascadeRecipe(Number(row.id)),
  },
  {
    key: 'recipe_reviews',
    label: 'Commentaires',
    emoji: '💬',
    table: 'recipe_reviews',
    pk: ['id'],
    orderBy: 'created_at',
    searchColumns: ['comment'],
    numericSearch: true,
    listColumns: ['id', 'recipe_id', 'rating'],
    fields: [
      { name: 'id', label: 'ID', type: 'readonly' },
      { name: 'recipe_id', label: 'Recette (ID)', type: 'number' },
      { name: 'user_id', label: 'Auteur (ID)', type: 'readonly' },
      { name: 'rating', label: 'Note', type: 'number' },
      { name: 'comment', label: 'Commentaire', type: 'longtext' },
      { name: 'created_at', label: 'Créé le', type: 'readonly' },
      { name: 'updated_at', label: 'Modifié le', type: 'readonly' },
    ],
    cascade: (row) => cascadeReview(Number(row.id)),
  },
  {
    key: 'recipe_review_replies',
    label: 'Réponses',
    emoji: '↩️',
    table: 'recipe_review_replies',
    pk: ['id'],
    orderBy: 'created_at',
    searchColumns: ['content'],
    numericSearch: true,
    listColumns: ['id', 'review_id', 'content'],
    fields: [
      { name: 'id', label: 'ID', type: 'readonly' },
      { name: 'review_id', label: 'Commentaire (ID)', type: 'number' },
      { name: 'user_id', label: 'Auteur (ID)', type: 'readonly' },
      { name: 'content', label: 'Contenu', type: 'longtext' },
      { name: 'created_at', label: 'Créé le', type: 'readonly' },
      { name: 'updated_at', label: 'Modifié le', type: 'readonly' },
    ],
  },
  {
    key: 'recipe_review_likes',
    label: 'Likes',
    emoji: '❤️',
    table: 'recipe_review_likes',
    pk: ['review_id', 'user_id'],
    orderBy: 'review_id',
    searchColumns: [],
    listColumns: ['review_id', 'user_id'],
    fields: [
      { name: 'review_id', label: 'Commentaire (ID)', type: 'readonly' },
      { name: 'user_id', label: 'Utilisateur (ID)', type: 'readonly' },
    ],
  },
  {
    key: 'favorites',
    label: 'Favoris',
    emoji: '⭐',
    table: 'favorites',
    pk: ['user_id', 'recipe_id'],
    orderBy: 'created_at',
    searchColumns: [],
    listColumns: ['user_id', 'recipe_id'],
    fields: [
      { name: 'user_id', label: 'Utilisateur (ID)', type: 'readonly' },
      { name: 'recipe_id', label: 'Recette (ID)', type: 'readonly' },
      { name: 'created_at', label: 'Ajouté le', type: 'readonly' },
    ],
  },
  {
    key: 'shopping_list_items',
    label: 'Listes de courses',
    emoji: '🛒',
    table: 'shopping_list_items',
    pk: ['id'],
    orderBy: 'created_at',
    searchColumns: ['text'],
    numericSearch: true,
    listColumns: ['id', 'text', 'checked'],
    fields: [
      { name: 'id', label: 'ID', type: 'readonly' },
      { name: 'user_id', label: 'Utilisateur (ID)', type: 'readonly' },
      { name: 'recipe_id', label: 'Recette (ID)', type: 'number' },
      { name: 'text', label: 'Article', type: 'text' },
      { name: 'checked', label: 'Coché', type: 'boolean' },
      { name: 'created_at', label: 'Ajouté le', type: 'readonly' },
    ],
  },
  {
    key: 'site_ideas',
    label: 'Boîte à idées',
    emoji: '💡',
    table: 'site_ideas',
    pk: ['id'],
    orderBy: 'created_at',
    searchColumns: ['title', 'message', 'category', 'status'],
    numericSearch: true,
    listColumns: ['id', 'title', 'status'],
    fields: [
      { name: 'id', label: 'ID', type: 'readonly' },
      { name: 'user_id', label: 'Auteur (ID)', type: 'readonly' },
      { name: 'title', label: 'Titre', type: 'text' },
      { name: 'message', label: 'Message', type: 'longtext' },
      { name: 'category', label: 'Catégorie', type: 'text' },
      { name: 'status', label: 'Statut', type: 'text' },
      { name: 'created_at', label: 'Créée le', type: 'readonly' },
      { name: 'updated_at', label: 'Modifiée le', type: 'readonly' },
    ],
  },
  {
    key: 'user_follows',
    label: 'Abonnements (suivis)',
    emoji: '🔗',
    table: 'user_follows',
    pk: ['follower_id', 'following_id'],
    orderBy: 'follower_id',
    searchColumns: [],
    listColumns: ['follower_id', 'following_id'],
    fields: [
      { name: 'follower_id', label: 'Suiveur (ID)', type: 'readonly' },
      { name: 'following_id', label: 'Suivi (ID)', type: 'readonly' },
    ],
  },
  {
    key: 'subscriptions',
    label: 'Abonnements (premium)',
    emoji: '💎',
    table: 'subscriptions',
    pk: ['user_id'],
    orderBy: 'updated_at',
    searchColumns: ['status', 'source', 'ls_subscription_id'],
    listColumns: ['user_id', 'status', 'source'],
    fields: [
      { name: 'user_id', label: 'Utilisateur (ID)', type: 'readonly' },
      { name: 'status', label: 'Statut', type: 'text' },
      { name: 'source', label: 'Source', type: 'text' },
      { name: 'variant_id', label: 'Variante (ID)', type: 'text' },
      { name: 'ls_subscription_id', label: 'Abonnement LS (ID)', type: 'text' },
      { name: 'renews_at', label: 'Renouvellement', type: 'text' },
      { name: 'ends_at', label: "Fin d'accès", type: 'text' },
      { name: 'customer_portal_url', label: 'Portail client', type: 'text' },
      { name: 'update_payment_url', label: 'MàJ paiement', type: 'text' },
      { name: 'updated_at', label: 'Mis à jour le', type: 'readonly' },
    ],
  },
]

// --- Lecture / écriture / suppression ---------------------------------------

/** Nettoie un terme de recherche des caractères qui cassent le filtre or(). */
function sanitizeSearch(term: string): string {
  return term.replace(/[,()]/g, ' ').trim()
}

function pkFilter(resource: AdminResource, row: AdminRow): Record<string, unknown> {
  const filter: Record<string, unknown> = {}
  for (const key of resource.pk) {
    filter[key] = row[key]
  }
  return filter
}

export type ListResult = {
  rows: AdminRow[]
  count: number
}

export async function listResource(
  resource: AdminResource,
  { search, page, pageSize }: { search: string; page: number; pageSize: number },
): Promise<ListResult> {
  let query = supabase
    .from(resource.table)
    .select('*', { count: 'exact' })

  const cleaned = sanitizeSearch(search)

  if (cleaned) {
    if (resource.numericSearch && /^\d+$/.test(cleaned)) {
      query = query.eq('id', Number(cleaned))
    } else if (resource.searchColumns.length > 0) {
      const filter = resource.searchColumns
        .map((column) => `${column}.ilike.%${cleaned}%`)
        .join(',')
      query = query.or(filter)
    }
  }

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await query
    .order(resource.orderBy, { ascending: resource.orderAsc ?? false })
    .range(from, to)

  if (error) throw error

  return { rows: (data ?? []) as AdminRow[], count: count ?? 0 }
}

export async function updateResourceRow(
  resource: AdminResource,
  row: AdminRow,
  patch: Record<string, unknown>,
): Promise<void> {
  const rest = { ...patch }

  const roleField = resource.fields.find((field) => field.rpc === 'role')
  if (roleField && roleField.name in rest) {
    const { error } = await supabase.rpc('admin_set_role', {
      target_user_id: row.user_id,
      new_role: rest[roleField.name],
    })
    if (error) throw error
    delete rest[roleField.name]
  }

  if (Object.keys(rest).length > 0) {
    const { error } = await supabase
      .from(resource.table)
      .update(rest)
      .match(pkFilter(resource, row))
    if (error) throw error
  }
}

/** Supprime intégralement un compte, y compris son authentification. */
export async function deleteAuthUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_user', {
    target_user_id: userId,
  })

  if (error) throw error
}

export async function deleteResourceRow(
  resource: AdminResource,
  row: AdminRow,
): Promise<void> {
  if (resource.cascade) {
    await resource.cascade(row)
  }

  const { error } = await supabase
    .from(resource.table)
    .delete()
    .match(pkFilter(resource, row))

  if (error) throw error
}
