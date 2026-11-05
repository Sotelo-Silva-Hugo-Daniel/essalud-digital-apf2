import { useEffect, useState } from 'react'
import { AccessibilityContext } from './accessibilityStore'

const readPreference = (key, fallback) => {
  try {
    const saved = window.localStorage.getItem(key)
    return saved ?? fallback
  } catch {
    return fallback
  }
}

export function AccessibilityProvider({ children }) {
  const [contrast, setContrast] = useState(() => readPreference('essalud-contrast', 'standard'))
  const [textSize, setTextSize] = useState(() => readPreference('essalud-text-size', 'standard'))

  useEffect(() => {
    document.documentElement.dataset.contrast = contrast
    document.documentElement.dataset.textSize = textSize
    try {
      window.localStorage.setItem('essalud-contrast', contrast)
      window.localStorage.setItem('essalud-text-size', textSize)
    } catch {
      // La preferencia sigue disponible durante la sesión, incluso si el navegador bloquea el almacenamiento.
    }
  }, [contrast, textSize])

  return <AccessibilityContext.Provider value={{
    contrast,
    textSize,
    toggleContrast: () => setContrast(current => current === 'high' ? 'standard' : 'high'),
    toggleTextSize: () => setTextSize(current => current === 'large' ? 'standard' : 'large'),
  }}>{children}</AccessibilityContext.Provider>
}

