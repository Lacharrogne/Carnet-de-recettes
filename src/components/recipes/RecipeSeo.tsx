import { useEffect } from 'react'

import { getRecipeNutrition } from '../../lib/recipeNutrition'
import { getRecipeRatings, type RecipeRating } from '../../services/reviews'
import type { Recipe } from '../../types/recipe'

const SITE_NAME = 'Carnet de recettes'
const JSON_LD_ID = 'recipe-jsonld'

/** Convertit un nombre de minutes en durée ISO 8601 (ex : 75 → PT1H15M). */
function toIsoDuration(totalMinutes: number): string | undefined {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return undefined
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `PT${hours > 0 ? `${hours}H` : ''}${minutes > 0 ? `${minutes}M` : ''}`
}

/** Crée ou met à jour une balise <meta> repérée par name/property. */
function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  )

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, key)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function buildJsonLd(recipe: Recipe, authorName?: string, rating?: RecipeRating) {
  const description =
    recipe.description?.trim() ||
    `Découvre la recette « ${recipe.title} » sur ${SITE_NAME}.`

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: recipe.title,
    description,
    recipeCategory: recipe.category,
    keywords: recipe.tags.join(', ') || undefined,
    recipeYield:
      recipe.servings > 0
        ? `${recipe.servings} personne${recipe.servings > 1 ? 's' : ''}`
        : undefined,
    prepTime: toIsoDuration(recipe.prepTime),
    cookTime: toIsoDuration(recipe.cookTime),
    totalTime: toIsoDuration(recipe.prepTime + recipe.cookTime),
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text: step,
    })),
  }

  if (recipe.imageUrl) {
    jsonLd.image = [recipe.imageUrl]
  }

  if (authorName) {
    jsonLd.author = { '@type': 'Person', name: authorName }
  }

  if (rating && rating.count > 0) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating.average,
      reviewCount: rating.count,
      bestRating: 5,
      worstRating: 1,
    }
  }

  const nutrition = getRecipeNutrition(recipe)
  if (nutrition.coverage >= 0.5 && nutrition.perServing.kcal > 0) {
    jsonLd.nutrition = {
      '@type': 'NutritionInformation',
      calories: `${nutrition.perServing.kcal} kcal`,
      proteinContent: `${nutrition.perServing.prot} g`,
      carbohydrateContent: `${nutrition.perServing.carb} g`,
      fatContent: `${nutrition.perServing.fat} g`,
    }
  }

  return jsonLd
}

/**
 * Métadonnées par recette : titre, description, aperçus de partage (Open Graph
 * / Twitter) et données structurées schema.org `Recipe` (JSON-LD) pour les
 * résultats enrichis Google (photo, note, temps, calories).
 *
 * Gère le <head> de façon impérative pour être l'unique source de vérité sur
 * la fiche recette (et restaure l'état par défaut en quittant la page).
 */
export default function RecipeSeo({
  recipe,
  authorName,
}: {
  recipe: Recipe
  authorName?: string
}) {
  const image = recipe.imageUrl ?? ''
  const tagsKey = recipe.tags.join(',')

  useEffect(() => {
    const previousTitle = document.title

    const description =
      recipe.description?.trim() ||
      `Découvre la recette « ${recipe.title} » sur ${SITE_NAME}.`

    document.title = `${recipe.title} — ${SITE_NAME}`
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:type', 'article')
    upsertMeta('property', 'og:title', recipe.title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('name', 'twitter:title', recipe.title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')

    if (image) {
      upsertMeta('property', 'og:image', image)
      upsertMeta('name', 'twitter:image', image)
    }

    // La note agrège en une requête ; on (re)construit le JSON-LD ensuite.
    let cancelled = false

    function writeJsonLd(rating?: RecipeRating) {
      if (cancelled) return

      let script = document.getElementById(
        JSON_LD_ID,
      ) as HTMLScriptElement | null

      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        script.id = JSON_LD_ID
        document.head.appendChild(script)
      }

      script.textContent = JSON.stringify(
        buildJsonLd(recipe, authorName, rating),
      )
    }

    writeJsonLd()

    getRecipeRatings([recipe.id])
      .then((map) => writeJsonLd(map.get(recipe.id)))
      .catch(() => {
        // La note n'est qu'un bonus : on garde le JSON-LD sans agrégat.
      })

    return () => {
      cancelled = true
      document.title = previousTitle
      document.getElementById(JSON_LD_ID)?.remove()
    }
    // `recipe` change d'identité à chaque chargement de fiche : suffisant.
  }, [recipe, image, tagsKey, authorName])

  return null
}
