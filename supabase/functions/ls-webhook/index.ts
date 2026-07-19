// Webhook Lemon Squeezy → met à jour la table `subscriptions`.
//
// Déploiement (depuis la racine du dépôt, avec le CLI Supabase) :
//   supabase functions deploy ls-webhook --no-verify-jwt
//   supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=xxxxx
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.)
//
// Puis, dans Lemon Squeezy → Settings → Webhooks, pointer l'URL :
//   https://<project-ref>.supabase.co/functions/v1/ls-webhook
// et cocher les événements subscription_*.

import { createClient } from 'npm:@supabase/supabase-js@2'

/** Vérifie la signature HMAC-SHA256 du corps brut (header X-Signature). */
async function isValidSignature(
  rawBody: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!signature) {
    return false
  }

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(rawBody),
  )

  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  // Comparaison à temps constant.
  if (expected.length !== signature.length) {
    return false
  }

  let mismatch = 0
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }

  return mismatch === 0
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const secret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ?? ''
  const rawBody = await request.text()
  const signature = request.headers.get('X-Signature') ?? ''

  if (!secret || !(await isValidSignature(rawBody, signature, secret))) {
    return new Response('Invalid signature', { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const meta = (payload.meta ?? {}) as Record<string, unknown>
  const custom = (meta.custom_data ?? {}) as Record<string, unknown>
  const userId = typeof custom.user_id === 'string' ? custom.user_id : null

  const data = (payload.data ?? {}) as Record<string, unknown>
  const attributes = (data.attributes ?? {}) as Record<string, unknown>
  const urls = (attributes.urls ?? {}) as Record<string, unknown>

  if (!userId) {
    // Rien à rattacher : on répond 200 pour ne pas faire réessayer indéfiniment.
    return new Response('No user_id in custom_data', { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { error } = await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      status: (attributes.status as string) ?? 'none',
      variant_id: attributes.variant_id
        ? String(attributes.variant_id)
        : null,
      ls_subscription_id: data.id ? String(data.id) : null,
      renews_at: (attributes.renews_at as string) ?? null,
      ends_at: (attributes.ends_at as string) ?? null,
      customer_portal_url: (urls.customer_portal as string) ?? null,
      update_payment_url: (urls.update_payment_method as string) ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    console.error('Upsert subscription failed', error)
    return new Response('Database error', { status: 500 })
  }

  return new Response('ok', { status: 200 })
})
