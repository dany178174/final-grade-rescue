import type { TierId } from './grade'

export const TIER_STYLES: Record<TierId, { text: string; fill: string; message: string; badge: string }> = {
  secured: {
    text: 'text-emerald-400',
    fill: 'bg-emerald-400',
    message: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
    badge: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300',
  },
  easy: {
    text: 'text-emerald-400',
    fill: 'bg-emerald-400',
    message: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
    badge: 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300',
  },
  focus: {
    text: 'text-yellow-300',
    fill: 'bg-yellow-300',
    message: 'border-yellow-300/25 bg-yellow-300/10 text-yellow-100',
    badge: 'border-yellow-300/30 bg-yellow-300/15 text-yellow-200',
  },
  cram: {
    text: 'text-orange-400',
    fill: 'bg-orange-400',
    message: 'border-orange-400/25 bg-orange-400/10 text-orange-200',
    badge: 'border-orange-400/30 bg-orange-400/15 text-orange-300',
  },
  impossible: {
    text: 'text-red-400',
    fill: 'bg-red-400',
    message: 'border-red-400/25 bg-red-400/10 text-red-200',
    badge: 'border-red-400/30 bg-red-400/15 text-red-300',
  },
}
