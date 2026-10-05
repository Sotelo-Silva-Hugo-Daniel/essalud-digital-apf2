# Evidencias a reunir para APF2

## Prototipo y despliegue

- URL pública funcionando: https://essalud-digital-apf2.vercel.app/login
- Capturas del registro, inicio de sesión, reserva, revisión, confirmación y “Mis citas”.
- Captura de la descarga “Agregar al calendario”, modal “Ayuda” y recuperación de contraseña.
- Captura de las variables de entorno configuradas en Vercel sin mostrar claves completas.

## Trazabilidad APF1 → APF2

| Hallazgo priorizado del APF1 | Decisión aplicada en APF2 | Evidencia a capturar |
| --- | --- | --- |
| El usuario debía recordar qué había seleccionado. | El médico y horario elegidos se muestran durante la reserva y en la revisión. | Paso 3 y revisión. |
| Cambiar una decisión obligaba a reiniciar. | Los enlaces “Editar” permiten volver al paso pertinente. | Revisión y cambio de horario. |
| La confirmación no era suficientemente clara. | Constancia, código de cita, “Mis citas” y descarga de calendario. | Confirmación y Mis citas. |

## Antes de entregar

- Ejecutar las sesiones reales y completar el CSV y SUS.
- Crear tabla de resultados, tasa de éxito, tiempos, errores y promedio SUS.
- Redactar conclusiones accionables basadas únicamente en los datos obtenidos.
- Preparar informe PDF (máximo 14 páginas, sin portada ni referencias) y presentación (máximo 14 diapositivas).
