// Vercel Function: stores feedback from the site in Upstash Redis and serves
// it to the owner's inbox page (#/inbox).
//
//   GET    /api/feedback                      -> { ready } (is storage set up?)
//   GET    /api/feedback  + Bearer password   -> { entries } for the inbox
//   POST   /api/feedback  { rating, message, email, page, botcheck }
//   DELETE /api/feedback?id=...  + Bearer password
//
// Setup (Vercel dashboard): connect an Upstash Redis database to the project
// (it adds KV_REST_API_URL and KV_REST_API_TOKEN), and add an environment
// variable FEEDBACK_ADMIN_PASSWORD with the inbox password.

import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'

const LIST_KEY = 'feedback:entries'
const MAX_ENTRIES = 1000
const RATE_LIMIT = 5
const RATE_WINDOW_SECONDS = 600

type Entry = {
  id: string
  at: string
  rating: number | null
  message: string
  email: string
  page: string
}

const redisUrl = () => process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
const redisToken = () => process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const storageReady = () => Boolean(redisUrl() && redisToken())

async function redis<T>(...command: (string | number)[]): Promise<T> {
  const response = await fetch(redisUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${redisToken()}` },
    body: JSON.stringify(command),
  })
  const data = (await response.json().catch(() => ({}))) as { result?: T; error?: string }
  if (!response.ok || data.error) throw new Error(`Redis ${command[0]} failed: ${data.error ?? response.status}`)
  return data.result as T
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

const sha256 = (value: string) => createHash('sha256').update(value).digest()

function isAdmin(request: Request): boolean {
  const password = process.env.FEEDBACK_ADMIN_PASSWORD ?? ''
  const header = request.headers.get('authorization') ?? ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!password || !given) return false
  // Compare hashes so the check takes the same time whatever was typed.
  return timingSafeEqual(sha256(given), sha256(password))
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

export async function GET(request: Request): Promise<Response> {
  if (!request.headers.has('authorization')) return json({ ready: storageReady() })
  if (!storageReady()) return json({ error: 'Storage is not connected yet.' }, 503)
  if (!process.env.FEEDBACK_ADMIN_PASSWORD) return json({ error: 'FEEDBACK_ADMIN_PASSWORD is not set.' }, 503)
  if (!isAdmin(request)) return json({ error: 'Wrong password.' }, 401)

  const raw = await redis<string[]>('LRANGE', LIST_KEY, 0, MAX_ENTRIES - 1)
  const entries = raw.flatMap((item) => {
    try {
      return [JSON.parse(item) as Entry]
    } catch {
      return []
    }
  })
  return json({ entries })
}

export async function POST(request: Request): Promise<Response> {
  if (!storageReady()) return json({ error: 'Feedback is not set up yet.' }, 503)

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) return json({ error: 'Invalid request.' }, 400)
  // Honeypot: real visitors never tick the hidden box. Pretend it worked.
  if (body.botcheck) return json({ ok: true })

  const rating = typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5 ? Math.round(body.rating) : null
  const message = text(body.message, 2000)
  if (!message && rating === null) return json({ error: 'Add a rating or a message.' }, 400)

  // Rate-limit by a hash of the IP, so no raw IP address is ever stored.
  const ip = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
  const rateKey = `feedback:rate:${sha256(ip).toString('hex').slice(0, 24)}`
  const count = await redis<number>('INCR', rateKey)
  if (count === 1) await redis('EXPIRE', rateKey, RATE_WINDOW_SECONDS)
  if (count > RATE_LIMIT) return json({ error: 'Too many messages. Please try again in a few minutes.' }, 429)

  const entry: Entry = {
    id: randomUUID(),
    at: new Date().toISOString(),
    rating,
    message,
    email: text(body.email, 200),
    page: text(body.page, 200),
  }
  await redis('LPUSH', LIST_KEY, JSON.stringify(entry))
  await redis('LTRIM', LIST_KEY, 0, MAX_ENTRIES - 1)
  return json({ ok: true })
}

export async function DELETE(request: Request): Promise<Response> {
  if (!storageReady()) return json({ error: 'Storage is not connected yet.' }, 503)
  if (!isAdmin(request)) return json({ error: 'Wrong password.' }, 401)

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ error: 'Missing id.' }, 400)

  const raw = await redis<string[]>('LRANGE', LIST_KEY, 0, MAX_ENTRIES - 1)
  const match = raw.find((item) => item.includes(`"id":"${id}"`))
  if (match) await redis('LREM', LIST_KEY, 1, match)
  return json({ ok: true })
}
