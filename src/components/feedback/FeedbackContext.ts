import { createContext, useContext } from 'react'
import { WEB3FORMS_ACCESS_KEY } from '../../config'

export type FeedbackContextValue = {
  /** False until a Web3Forms access key is set in src/config.ts. */
  enabled: boolean
  open: (rating?: number) => void
}

export const FeedbackContext = createContext<FeedbackContextValue>({ enabled: false, open: () => {} })

export function useFeedback() {
  return useContext(FeedbackContext)
}

export const FEEDBACK_ENABLED = WEB3FORMS_ACCESS_KEY.trim().length > 0

export const RATINGS = [
  { value: 1, emoji: '😞', label: 'Very bad' },
  { value: 2, emoji: '😕', label: 'Not great' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😍', label: 'Love it' },
] as const
