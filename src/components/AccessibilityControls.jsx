import { useEffect, useRef } from 'react'
import { useAccessibility } from '../context/useAccessibilitySettings'

export default function AccessibilityControls({ compact = false }) {
  const { contrast, textSize, toggleContrast, toggleTextSize } = useAccessibility()
  const detailsRef = useRef(null)

  useEffect(() => {
    const closeOnEscape = event => {
      if (event.key !== 'Escape' || !detailsRef.current?.open) return
      event.preventDefault()
      detailsRef.current.open = false
      detailsRef.current.querySelector('summary')?.focus()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [])

  return <details ref={detailsRef} className={`accessibility-controls ${compact ? 'accessibility-controls-compact' : ''}`}>
    <summary aria-label="Abrir opciones de accesibilidad">Accesibilidad</summary>
    <div className="accessibility-panel" aria-label="Opciones de accesibilidad">
      <p>Personaliza la visualización sin perder el contenido.</p>
      <button type="button" aria-label={contrast === 'high' ? 'Desactivar alto contraste' : 'Activar alto contraste'} aria-pressed={contrast === 'high'} onClick={toggleContrast}>
        {contrast === 'high' ? 'Contraste estándar' : 'Alto contraste'}
      </button>
      <button type="button" aria-label={textSize === 'large' ? 'Restablecer tamaño de texto' : 'Ampliar tamaño de texto'} aria-pressed={textSize === 'large'} onClick={toggleTextSize}>
        {textSize === 'large' ? 'Texto estándar' : 'Texto ampliado'}
      </button>
    </div>
  </details>
}
