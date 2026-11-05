# APF3 — Control de ejecución y evidencia

Este archivo organiza el trabajo del APF3. No reemplaza la matriz WCAG completa, las evidencias ni los registros de participantes que se entregarán en los anexos.

## 1. Alcance verificable

**Producto:** EsSalud Digital, flujo de teleconsulta.

**Pantallas a auditar:** inicio de sesión, inicio, selección de médico, selección de fecha y hora, revisión, confirmación y Mis citas. Se observarán también los estados de carga, error y lista vacía.

**Tareas de referencia APF2:**

| Código | Tarea |
|---|---|
| T1 | Reservar una teleconsulta de Medicina General con médico y horario disponibles. |
| T2 | Cambiar la fecha u hora manteniendo el médico elegido. |
| T3 | Localizar e identificar la reserva confirmada en “Mis citas”. |
| T4 | Recuperarse de un error de formulario en el registro sin perder la información ingresada. |

## 2. Auditoría inicial v2 — evidencia ya observada

Los siguientes hallazgos proceden de la revisión del código y de la interfaz publicada. No se deben presentar como resultado de una herramienta automática ni de una sesión con usuarios.

| Hallazgo v2 | WCAG | Severidad | Alcance | Prioridad | Ajuste v3 aplicado | Falta verificar |
|---|---:|---:|---:|---:|---|---|
| El documento HTML estaba declarado en inglés y el título era genérico (“avance2”), aunque la interfaz es española. | 3.1.1 | 3 | 3 | 9 Alta | `lang="es-PE"` y título descriptivo. | Lector de pantalla. |
| No había una regla de foco visible; al navegar con Tab no era evidente el control activo. | 2.4.7 | 4 | 3 | 12 Alta | Foco amarillo de alto contraste, con separación visible, en enlaces, botones, campos y resumen. | Recorrido completo con teclado. |
| Carga y errores se mostraban visualmente, pero no se anunciaban como estado o alerta. | 4.1.3 | 3 | 3 | 9 Alta | `role=status` para carga y `role=alert` para errores. | NVDA, VoiceOver o equivalente. |
| La ayuda era un diálogo visual sin gestión completa de teclado. | 2.1.1, 2.4.3 | 3 | 2 | 6 Media | Foco inicial, Escape, ciclo de Tab y devolución de foco al disparador. | Prueba manual de foco. |
| Selección de médico, fecha y horario dependía en parte del color y de símbolos decorativos. | 1.4.1, 4.1.2 | 3 | 3 | 9 Alta | Grupos de selección expuestos como radios con estado `aria-checked`; iconos decorativos ocultos al lector. | Lector de pantalla y contraste. |
| Contornos de campos y controles secundarios eran demasiado claros para una identificación no textual robusta. | 1.4.11 | 3 | 3 | 9 Alta | Bordes y separadores con contraste reforzado; modo alto contraste. | Medición con Stark/contrast checker. |
| El botón “Leer más” de privacidad no exponía contenido. | 3.2.4, 4.1.2 | 2 | 2 | 4 Media | Contenido expandible con estado `aria-expanded`. | Teclado y lector de pantalla. |

La prioridad se calcula como **severidad × alcance**. Los hallazgos de prioridad alta no se considerarán cerrados hasta tener evidencia técnica de la v3.

## 3. Matriz WCAG 2.1 AA obligatoria

En la matriz XLSX final se evaluarán los 26 criterios centrales de forma individual y los restantes criterios A/AA como “Aplica” o “No aplica”, con justificación. Cada fila debe indicar pantalla/estado, evidencia, resultado v2, ajuste v3, método y responsable de verificación.

| Principio | Criterios centrales que se verificarán |
|---|---|
| Perceptible | 1.1.1, 1.3.1, 1.3.4, 1.3.5, 1.4.1, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 1.4.12, 1.4.13 |
| Operable | 2.1.1, 2.2.1, 2.4.3, 2.4.7, 2.5.1, 2.5.3 |
| Comprensible | 3.1.1, 3.2.3, 3.2.4, 3.3.1, 3.3.2, 3.3.3, 3.3.4 |
| Robusto | 4.1.2, 4.1.3 |

## 4. Mejoras v3 a completar y demostrar

1. Idioma y título correctos en todo el documento.
2. Foco visible y orden lógico de teclado.
3. Enlace “Saltar al contenido principal”.
4. Alto contraste, con preferencia persistente durante la sesión.
5. Texto ampliado, sin ocultar contenido ni perder controles.
6. Estados de carga y error anunciados.
7. Ayuda contextual utilizable con teclado.
8. Selección de médico, fecha y hora con estado accesible.
9. Iconos decorativos excluidos del lector de pantalla.
10. Validación de formularios con mensaje de error asociado.
11. Información de privacidad expandible y accesible.
12. Bordes y controles secundarios distinguibles sin depender solo del color.

Las mejoras 1 a 12 son la base de implementación. Las capturas de antes/después y el kit de componentes en Figma se elaborarán a partir de la versión comprobada, no antes.

## 5. Pruebas técnicas pendientes

- [ ] Recorrido con teclado completo: Tab, Shift+Tab, Enter, Espacio y Escape.
- [ ] Zoom al 200 % en cada pantalla del alcance y comprobación de reflow sin scroll horizontal innecesario.
- [ ] Lectura de las pantallas principales y los estados con un lector de pantalla disponible.
- [ ] Medición de contraste con Stark en Figma para texto, controles y componentes no textuales.
- [ ] Comprobación de la lista vacía, carga y error en una cuenta/control de prueba.
- [ ] Verificación de alto contraste y texto ampliado durante T1–T4.

## 6. Pruebas con participantes: lo que debe hacer el equipo

La consigna exige **cinco participantes, tres perfiles diferentes**. Para apuntar al nivel excelente, al menos dos deben tener una condición real relacionada con accesibilidad o usar habitualmente una tecnología de apoyo. No se registran diagnósticos, correos ni contraseñas: solo el perfil que la persona acepte declarar.

### Perfiles recomendados

| Código anónimo | Perfil a convocar | Evidencia permitida |
|---|---|---|
| P1 | Persona que usa habitualmente lector de pantalla o navegación por teclado. | Consentimiento y registro de la sesión; no se requiere diagnóstico. |
| P2 | Persona con baja visión o que usa zoom/texto ampliado/alto contraste habitualmente. | Consentimiento y registro de la sesión; no se requiere diagnóstico. |
| P3 | Persona adulta con menor familiaridad digital. | Consentimiento y registro de la sesión. |
| P4 | Usuario habitual de celular y formularios web. | Consentimiento y registro de la sesión. |
| P5 | Usuario con un perfil diferente a P1–P4. | Consentimiento y registro de la sesión. |

### Cómo hacer una sesión real (25–35 minutos)

1. Explicar que se prueba el sistema, no a la persona; pedir consentimiento para tomar notas anónimas.
2. Entregar una cuenta de demostración o permitir crear una cuenta de prueba. No pedir ni registrar datos clínicos reales.
3. Pedir T1, T2, T3 y T4 sin enseñar la ruta.
4. Para cada tarea registrar: inicio/fin, éxito o fracaso, errores, retrocesos, ayuda solicitada, observación y SEQ de 1 a 7.
5. Al finalizar, aplicar los diez ítems SUS tal como están redactados y calcular el puntaje individual.
6. Registrar barreras residuales y una mejora sugerida, sin atribuir frases que la persona no haya dicho.
7. Guardar los consentimientos separados de la tabla anonimizada. En el informe solo usar P1–P5.

### Qué falta antes de afirmar que C3 está cumplido

- [ ] Confirmar y realizar las cinco sesiones reales.
- [ ] Reunir cinco consentimientos reales y anonimizarlos.
- [ ] Registrar mediciones observadas de T1–T4 y SEQ.
- [ ] Aplicar SUS a cada participante y calcular los cinco valores.
- [ ] Comparar contra la línea base APF2 de forma honesta, indicando si el número de participantes o perfiles difiere.
- [ ] Analizar diferencias por perfil y barreras residuales.

## 7. Entregables APF3 y estado

| Entregable | Estado actual |
|---|---|
| Web v3 accesible | En implementación y verificación. |
| Auditoría WCAG completa en XLSX | Pendiente de completar tras pruebas técnicas. |
| Figma público: 00–05, antes/después, kit y anotaciones | Pendiente de generar desde v3 validada. |
| Protocolo, consentimiento y fichas de registro | Pendiente de preparar como anexos. |
| Validación con cinco personas | Pendiente: requiere sesiones reales del equipo. |
| Informe PDF, máximo 15 páginas sin portada/referencias/anexos | Pendiente: se redacta después de tener las evidencias. |
| PPT, máximo 12 diapositivas | Pendiente: se arma cuando los datos estén cerrados. |
| Declaración de conformidad honesta y accesible | Pendiente de resultados de la auditoría final. |
