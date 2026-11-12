import { createContext, useContext } from 'react'

export type FeedbackContextValue = {
  /** True once /api/feedback reports that storage is connected. */
  enabled: boolean
  open: (rating?: number) => void
}

export const FeedbackContext = createContext<FeedbackContextValue>({ enabled: false, open: () => {} })

export function useFeedback() {
  return useContext(FeedbackContext)
}

export const FEEDBACK_API = '/api/feedback'

export const RATINGS = [
  { value: 1, emoji: '😞', label: 'Very bad' },
  { value: 2, emoji: '😕', label: 'Not great' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😍', label: 'Love it' },
] as const
