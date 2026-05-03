import { supabase } from '../lib/supabase'

export type ShoppingListItem = {
  id: number
  userId: string
  recipeId: number | null
  text: string
  checked: boolean
  createdAt: string
}

type ShoppingListItemRow = {
  id: number
  user_id: string
  recipe_id: number | null
  text: string
  checked: boolean
  created_at: string
}

type AddRecipeIngredientsOptions = {
  allowDuplicates?: boolean
}

function mapShoppingListItem(row: ShoppingListItemRow): ShoppingListItem {
  return {
    id: row.id,
    userId: row.user_id,
    recipeId: row.recipe_id,
    text: row.text,
    checked: row.checked,
    createdAt: row.created_at,
  }
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!user) {
    throw new Error('Utilisateur non connecté.')
  }

  return user.id
}

export async function getShoppingListItems() {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('user_id', userId)
    .order('checked', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) =>
    mapShoppingListItem(row as ShoppingListItemRow),
  )
}

export async function addShoppingListItem(text: string) {
  const userId = await getCurrentUserId()

  const cleanedText = text.trim()

  if (!cleanedText) {
    throw new Error('Le nom de l’ingrédient est obligatoire.')
  }

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      user_id: userId,
      text: cleanedText,
      checked: false,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapShoppingListItem(data as ShoppingListItemRow)
}

export async function addRecipeIngredientsToShoppingList(
  recipeId: number,
  ingredients: string[],
  options: AddRecipeIngredientsOptions = {},
) {
  const userId = await getCurrentUserId()
  const allowDuplicates = options.allowDuplicates ?? false

  const cleanedIngredients = ingredients
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient.length > 0)

  if (cleanedIngredients.length === 0) {
    return []
  }

  let ingredientsToAdd = cleanedIngredients

  if (!allowDuplicates) {
    const { data: existingItems, error: existingItemsError } = await supabase
      .from('shopping_list_items')
      .select('*')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)

    if (existingItemsError) {
      throw existingItemsError
    }

    const existingTexts = new Set(
      (existingItems ?? []).map((item) =>
        normalizeText((item as ShoppingListItemRow).text),
      ),
    )

    ingredientsToAdd = cleanedIngredients.filter((ingredient) => {
      const normalizedIngredient = normalizeText(ingredient)

      if (existingTexts.has(normalizedIngredient)) {
        return false
      }

      existingTexts.add(normalizedIngredient)
      return true
    })
  }

  if (ingredientsToAdd.length === 0) {
    return []
  }

  const rows = ingredientsToAdd.map((ingredient) => ({
    user_id: userId,
    recipe_id: recipeId,
    text: ingredient,
    checked: false,
  }))

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert(rows)
    .select()

  if (error) {
    throw error
  }

  return (data ?? []).map((row) =>
    mapShoppingListItem(row as ShoppingListItemRow),
  )
}

export async function updateShoppingListItemChecked(
  itemId: number,
  checked: boolean,
) {
  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('shopping_list_items')
    .update({ checked })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return mapShoppingListItem(data as ShoppingListItemRow)
}

export async function deleteShoppingListItem(itemId: number) {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}

export async function deleteCheckedShoppingListItems() {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('user_id', userId)
    .eq('checked', true)

  if (error) {
    throw error
  }
}

export async function deleteAllShoppingListItems() {
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('user_id', userId)

  if (error) {
    throw error
  }
}