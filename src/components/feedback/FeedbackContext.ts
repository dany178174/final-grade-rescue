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
  { value: 1, emoji: '😞', label: 'Very bad', labelVi: 'Rất tệ' },
  { value: 2, emoji: '😕', label: 'Not great', labelVi: 'Chưa tốt' },
  { value: 3, emoji: '😐', label: 'Okay', labelVi: 'Tạm được' },
  { value: 4, emoji: '🙂', label: 'Good', labelVi: 'Tốt' },
  { value: 5, emoji: '😍', label: 'Love it', labelVi: 'Rất thích' },
] as const
