import { createContext, useContext } from 'react'
import { DEFAULT_APPEARANCE, type Appearance } from '../../lib/appearance'

export type AppearanceContextValue = {
  appearance: Appearance
  update: (patch: Partial<Appearance>) => void
  /** Opens the "Giao diện" panel. */
  open: () => void
}

export const AppearanceContext = createContext<AppearanceContextValue>({
  appearance: DEFAULT_APPEARANCE,
  update: () => {},
  open: () => {},
})

export function useAppearance() {
  return useContext(AppearanceContext)
}
