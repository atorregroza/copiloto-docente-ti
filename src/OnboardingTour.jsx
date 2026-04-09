import { useState, useEffect, useCallback } from 'react'
import { FiChevronRight, FiX } from 'react-icons/fi'

const LS_KEY = 'mm_onboarding_done'

// ─── Mini-tours por tema ─────────────────────────────────────────────────────
const TRACKS = {
  create: {
    emoji: '🚀', labelEs: 'Crear mi primer kit', labelEn: 'Create my first kit',
    descEs: 'Cómo llenar los bloques y generar el kit completo', descEn: 'How to fill the blocks and generate the full kit',
    stepsEs: [
      { step: 0, emoji: '🗂️', title: 'Elige tu ruta', text: 'Tienes tres caminos: MEN, Diseño Escolar o STEM/STEAM. Cada uno genera un kit diferente. Tú eliges la que necesites.' },
      { step: 1, emoji: '🏫', title: 'Tu institución', text: 'Tu colegio, ciudad y nombre. Aparecen en la portada, la rúbrica y todos los documentos exportados.' },
      { step: 2, emoji: '📚', title: 'Ruta y grado', text: 'En este ejemplo usamos MEN grado 7°. Esto determina los subtemas disponibles y la estructura de la rúbrica.' },
      { step: 5, emoji: '🎯', title: 'Subtema del proyecto', text: 'Elige un subtema o escribe el tuyo. A partir de aquí, los 7 pasos del kit se generan automáticamente.' },
      { step: 6, emoji: '📐', title: 'Tu kit se generó', text: 'Competencia, objetivo, reto, guías, rúbrica — todo listo. Y todo es editable: puedes modificar, agregar o quitar lo que necesites.' },
    ],
    stepsEn: [
      { step: 0, emoji: '🗂️', title: 'Choose your route', text: 'Three paths: MEN, School Design or STEM/STEAM. Each generates a different kit. Pick whichever you need.' },
      { step: 1, emoji: '🏫', title: 'Your institution', text: 'Your school, city and name. They appear on the cover, rubric and all exported documents.' },
      { step: 2, emoji: '📚', title: 'Route and grade', text: 'In this example we used MEN grade 7. This determines available topics and rubric structure.' },
      { step: 5, emoji: '🎯', title: 'Project topic', text: 'Choose a topic or write your own. From here, all 7 kit steps are generated automatically.' },
      { step: 6, emoji: '📐', title: 'Your kit is ready', text: 'Competency, objective, challenge, guides, rubric — all done. And everything is editable: modify, add or remove whatever you need.' },
    ],
  },
  products: {
    emoji: '🎁', labelEs: 'Lo que genera el kit', labelEn: 'What the kit generates',
    descEs: 'Los 7 documentos que produce: para qué sirve cada uno', descEn: 'The 7 documents it produces: what each one is for',
    stepsEs: [
      { step: 6, emoji: '📐', title: 'Alineación curricular', text: 'Tu competencia, objetivo medible y criterios de éxito. Este documento lo usas para planear y para mostrarlo a coordinación.' },
      { step: 7, emoji: '🎯', title: 'Reto auténtico', text: 'El problema contextualizado a tu colegio, versiones con y sin hardware, y la guía de evidencias. Esto lo proyectas al inicio de clase.' },
      { step: 8, emoji: '📦', title: 'Lista de materiales', text: 'Checklist completo: materiales físicos, digitales, alternativas de bajo costo y preparación del espacio. Lo imprimes antes de clase.' },
      { step: 9, emoji: '👩‍🏫', title: 'Guía docente', text: 'Tu secuencia cronometrada con tiempos reales: apertura, exploración, construcción, socialización y cierre. La llevas a clase como tu hoja de ruta.' },
      { step: 10, emoji: '📝', title: 'Guía del estudiante', text: 'El cuadernillo que le entregas al estudiante. Lo diligencia con respuestas, fotos del proceso, checkpoints de semáforo y reflexión final.' },
      { step: 11, emoji: '⭐', title: 'Rúbrica de evaluación', text: 'Tu instrumento de evaluación con criterios y pesos editables. Se convierte en planilla interactiva para calificar después de clase.' },
      { step: 12, emoji: '🏫', title: 'Empaque institucional', text: 'Portada con logo, índice de los 7 documentos, instrucciones de reutilización y recursos digitales. Para coordinación, portafolio docente o compartir con colegas.' },
    ],
    stepsEn: [
      { step: 6, emoji: '📐', title: 'Curricular alignment', text: 'Your competency, measurable objective and success criteria. Use this document for planning and to show your coordinator.' },
      { step: 7, emoji: '🎯', title: 'Authentic challenge', text: 'The problem contextualized to your school, versions with and without hardware, and the evidence guide. Project this at the start of class.' },
      { step: 8, emoji: '📦', title: 'Materials checklist', text: 'Complete checklist: physical, digital, low-cost alternatives and workspace setup. Print it before class.' },
      { step: 9, emoji: '👩‍🏫', title: 'Teacher guide', text: 'Your timed sequence with real durations: opening, exploration, building, sharing and closing. Take it to class as your roadmap.' },
      { step: 10, emoji: '📝', title: 'Student guide', text: 'The workbook you deliver to students. They fill it in with answers, process photos, traffic-light checkpoints and final reflection.' },
      { step: 11, emoji: '⭐', title: 'Assessment rubric', text: 'Your assessment tool with editable criteria and weights. It becomes an interactive grading sheet for after class.' },
      { step: 12, emoji: '🏫', title: 'Institutional package', text: 'Cover with logo, 7-document index, reuse instructions and digital resources. For coordination, teaching portfolio or sharing with colleagues.' },
    ],
  },
  evaluate: {
    emoji: '⭐', labelEs: 'Evaluar y calificar', labelEn: 'Evaluate and grade',
    descEs: 'La rúbrica, la planilla de notas y cómo compartir calificaciones', descEn: 'The rubric, grade sheet and how to share scores',
    stepsEs: [
      { step: 11, emoji: '⭐', title: 'Tu rúbrica', text: '4 criterios con pesos que suman 100%. Puedes editar nombres, pesos y descriptores para adaptarla a tu clase. Este es tu instrumento de evaluación.' },
      { step: 13, emoji: '📊', title: 'Planilla de calificación', text: 'Exporta la rúbrica como planilla interactiva: escribes el nombre del estudiante, haces clic en el nivel de cada criterio, la nota se calcula sola. Guardas y sigues con el siguiente estudiante.' },
      { step: 13, emoji: '📋', title: 'Notas y reportes', text: 'Todas las calificaciones se guardan. Puedes copiarlas a Excel con un clic, abrir una vista de resultados del grupo, o compartir la nota individual con cada estudiante.' },
    ],
    stepsEn: [
      { step: 11, emoji: '⭐', title: 'Your rubric', text: '4 criteria with weights that sum to 100%. You can edit names, weights and descriptors to adapt it to your class. This is your assessment tool.' },
      { step: 13, emoji: '📊', title: 'Grading sheet', text: 'Export the rubric as an interactive grading sheet: type the student name, click the level for each criterion, the score calculates automatically. Save and move to the next student.' },
      { step: 13, emoji: '📋', title: 'Grades and reports', text: 'All grades are saved. Copy them to Excel with one click, open a group results view, or share individual scores with each student.' },
    ],
  },
  student: {
    emoji: '📝', labelEs: 'Entregar al estudiante', labelEn: 'Deliver to students',
    descEs: 'Cómo enviar la guía y que el estudiante la diligencie', descEn: 'How to send the guide and have students fill it in',
    stepsEs: [
      { step: 10, emoji: '📝', title: 'Guía del estudiante', text: 'Este cuadernillo se lo entregas al estudiante. Tiene la ficha del reto, pasos cronometrados, espacios para escribir, subir fotos, checkpoints de semáforo y autoevaluación.' },
      { step: 10, emoji: '✏️', title: 'El estudiante la diligencia', text: 'El estudiante abre el link y puede completar todo: escribir respuestas en los espacios, subir fotos del proceso, marcar los checkpoints de semáforo y llenar la reflexión final. Se guarda automáticamente en su navegador.' },
      { step: 13, emoji: '📤', title: 'Enviar y exportar', text: 'Desde el botón "Entrega al estudiante" generas el cuadernillo interactivo. También puedes exportar un resumen de una página para las familias y compartir el kit por enlace con otros docentes.' },
    ],
    stepsEn: [
      { step: 10, emoji: '📝', title: 'Student guide', text: 'You deliver this workbook to students. It has the challenge card, timed steps, spaces to write, photo upload, traffic-light checkpoints and self-assessment.' },
      { step: 10, emoji: '✏️', title: 'Students fill it in', text: 'Students open the link and can complete everything: write answers, upload process photos, mark checkpoints and fill in the final reflection. It auto-saves in their browser.' },
      { step: 13, emoji: '📤', title: 'Send and export', text: 'The "Deliver to student" button generates the interactive workbook. You can also export a one-page family summary and share the kit with other teachers via link.' },
    ],
  },
  full: {
    emoji: '📦', labelEs: 'Recorrido completo', labelEn: 'Full walkthrough',
    descEs: 'Ver todo de principio a fin en 11 pasos', descEn: 'See everything from start to finish in 11 steps',
    stepsEs: [
      { step: 0, emoji: '👋', title: 'Bienvenido al Copiloto', text: 'Vamos a recorrer la plataforma completa con un kit de ejemplo. En cada pantalla te explico qué se llenó y para qué sirve.' },
      { step: 1, emoji: '🏫', title: 'Tu institución', text: 'Tu colegio, ciudad y nombre. Aparecen en todos los documentos exportados.' },
      { step: 2, emoji: '📚', title: 'Ruta y grado', text: 'Elige tu ruta: MEN, Diseño Escolar o STEM. En este ejemplo usamos MEN grado 7°.' },
      { step: 3, emoji: '🧰', title: 'Recursos y restricciones', text: 'Duración del proyecto, materiales y limitaciones. La guía docente se adapta a esto.' },
      { step: 4, emoji: '♿', title: 'Inclusión', text: 'Si tienes estudiantes con NEE, la plataforma genera adaptaciones específicas automáticamente.' },
      { step: 5, emoji: '🎯', title: 'Subtema', text: 'Elige subtema — desde aquí los 7 pasos se generan solos.' },
      { step: 6, emoji: '📐', title: 'Alineación', text: 'Competencia, objetivo y criterios de éxito. Todo editable.' },
      { step: 9, emoji: '👩‍🏫', title: 'Guía docente', text: 'Secuencia cronometrada lista para clase. Puedes editar tiempos y actividades.' },
      { step: 10, emoji: '📝', title: 'Guía del estudiante', text: 'Cuadernillo entregable con fotos, checkpoints y autoevaluación.' },
      { step: 11, emoji: '⭐', title: 'Rúbrica', text: 'Criterios editables. Se exporta como planilla interactiva de calificación.' },
      { step: 13, emoji: '🎉', title: '¡Kit completo!', text: 'Exporta todo: PDF, kit interactivo, planilla de notas y resumen para familias.' },
    ],
    stepsEn: [
      { step: 0, emoji: '👋', title: 'Welcome to the Copilot', text: 'Let\'s walk through the full platform with a sample kit. At each screen I\'ll explain what was filled and why.' },
      { step: 1, emoji: '🏫', title: 'Your institution', text: 'School, city and name. They appear on all exported documents.' },
      { step: 2, emoji: '📚', title: 'Route and grade', text: 'Choose your route: MEN, School Design or STEM. This example uses MEN grade 7.' },
      { step: 3, emoji: '🧰', title: 'Resources and constraints', text: 'Project duration, materials and limitations. The teacher guide adapts to this.' },
      { step: 4, emoji: '♿', title: 'Inclusion', text: 'If you have students with special needs, the platform generates specific adaptations automatically.' },
      { step: 5, emoji: '🎯', title: 'Topic', text: 'Choose a topic — from here all 7 steps generate automatically.' },
      { step: 6, emoji: '📐', title: 'Alignment', text: 'Competency, objective and success criteria. All editable.' },
      { step: 9, emoji: '👩‍🏫', title: 'Teacher guide', text: 'Timed sequence ready for class. You can edit times and activities.' },
      { step: 10, emoji: '📝', title: 'Student guide', text: 'Deliverable workbook with photos, checkpoints and self-assessment.' },
      { step: 11, emoji: '⭐', title: 'Rubric', text: 'Editable criteria. Exports as an interactive grading sheet.' },
      { step: 13, emoji: '🎉', title: 'Kit complete!', text: 'Export everything: PDF, interactive kit, grading sheet and family summary.' },
    ],
  },
}

const TRACK_ORDER = ['create', 'products', 'student', 'evaluate', 'full']

// ─── Menú de selección de recorrido ──────────────────────────────────────────
export function TourMenu({ language = 'es', onSelect, onDismiss }) {
  const en = language === 'en'
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={onDismiss} />
      <div className="fixed z-[9999] inset-0 flex items-center justify-center p-4" onClick={onDismiss}>
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="bg-[#2b5a52] px-6 py-4 text-center">
            <p className="text-2xl">🧭</p>
            <p className="text-white font-bold text-base mt-1">{en ? 'What do you want to learn?' : '¿Qué quieres aprender?'}</p>
            <p className="text-white/60 text-xs mt-1">{en ? 'Choose a guided tour with the example kit' : 'Elige un recorrido guiado con el kit de ejemplo'}</p>
          </div>
          <div className="p-4 grid gap-2">
            {TRACK_ORDER.map(key => {
              const t = TRACKS[key]
              return (
                <button
                  key={key}
                  onClick={(e) => { e.stopPropagation(); onSelect(key) }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 bg-white hover:bg-[#f8faf9] hover:border-[#2b5a52]/30 text-left transition-colors group"
                >
                  <span className="text-2xl flex-shrink-0">{t.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#173d37] group-hover:text-[#2b5a52]">{en ? t.labelEn : t.labelEs}</p>
                    <p className="text-xs text-gray-500 leading-4 mt-0.5">{en ? t.descEn : t.descEs}</p>
                  </div>
                  <FiChevronRight className="text-gray-300 group-hover:text-[#2b5a52] flex-shrink-0" />
                </button>
              )
            })}
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
            <button onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-600">{en ? 'Skip, I\'ll explore on my own' : 'Saltar, prefiero explorar solo'}</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Tour guiado (recibe track) ──────────────────────────────────────────────
export function GuidedTour({ language = 'es', track = 'full', currentStep, onNext, onDismiss, onReset, onShowMenu }) {
  const en = language === 'en'
  const trackData = TRACKS[track] || TRACKS.full
  const steps = en ? trackData.stepsEn : trackData.stepsEs

  // Find the tour step that matches the current app step
  // For steps with duplicates (e.g. two bubbles on step 13), use a sequential index
  const [tourIndex, setTourIndex] = useState(0)
  const current = steps[tourIndex]

  // Reset index when track changes
  useEffect(() => { setTourIndex(0) }, [track])

  if (!current || tourIndex >= steps.length) return null

  const isLast = tourIndex === steps.length - 1
  const progress = ((tourIndex + 1) / steps.length) * 100

  const handleNext = (e) => {
    e.stopPropagation(); e.preventDefault()
    if (isLast) {
      onDismiss()
      if (onShowMenu) onShowMenu() // Show "another tour?" menu
    } else {
      const nextStep = steps[tourIndex + 1]
      if (nextStep && nextStep.step !== currentStep) {
        onNext(nextStep.step)
      }
      setTourIndex(i => i + 1)
    }
  }

  const handleDismiss = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault() }
    onDismiss()
    if (onReset) onReset()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[9998]" onClick={handleDismiss} />
      <div className="fixed z-[9999] inset-0 flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl shadow-black/25 overflow-hidden pointer-events-auto" onClick={e => e.stopPropagation()}>
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div className="h-1 bg-[#fbb041] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          {/* Header */}
          <div className="bg-[#2b5a52] px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{current.emoji}</span>
              <div>
                <span className="text-white/50 text-[10px] font-bold">{tourIndex + 1} / {steps.length} · {en ? trackData.labelEn : trackData.labelEs}</span>
                <p className="text-white font-bold text-sm leading-tight">{current.title}</p>
              </div>
            </div>
            <button onClick={handleDismiss} aria-label={en ? 'Exit tour' : 'Salir del tour'} className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <FiX className="text-sm" />
            </button>
          </div>
          {/* Body */}
          <div className="px-5 py-4">
            <p className="text-[13px] text-gray-600 leading-relaxed">{current.text}</p>
          </div>
          {/* Footer */}
          <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
            <button onClick={handleDismiss} className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
              {en ? 'Exit tour' : 'Salir del tour'}
            </button>
            <button onClick={handleNext} className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2b5a52] rounded-xl hover:bg-[#234a43] transition-colors shadow-sm">
              {isLast ? (en ? 'Done!' : '¡Listo!') : (en ? 'Next' : 'Siguiente')} {!isLast && <FiChevronRight className="text-xs" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Modal post-tour: ¿otro recorrido? ───────────────────────────────────────
export function TourCompleteMenu({ language = 'es', completedTrack, onSelect, onCreateKit }) {
  const en = language === 'en'
  const remaining = TRACK_ORDER.filter(k => k !== completedTrack)
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[9998]" onClick={onCreateKit} />
      <div className="fixed z-[9999] inset-0 flex items-center justify-center p-4" onClick={onCreateKit}>
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="bg-[#2b5a52] px-6 py-4 text-center">
            <p className="text-2xl">✅</p>
            <p className="text-white font-bold text-base mt-1">{en ? 'Tour complete!' : '¡Recorrido completo!'}</p>
          </div>
          <div className="p-4 space-y-2">
            <button
              onClick={(e) => { e.stopPropagation(); onCreateKit() }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#2b5a52] text-white font-bold text-sm hover:bg-[#234a43] transition-colors"
            >
              <span className="text-lg">🚀</span>
              {en ? 'Start creating my own kit!' : '¡Empezar a crear mi propio kit!'}
            </button>
            <p className="text-[11px] text-gray-400 text-center pt-1">{en ? 'Or explore another topic:' : 'O explora otro tema:'}</p>
            {remaining.map(key => {
              const t = TRACKS[key]
              return (
                <button
                  key={key}
                  onClick={(e) => { e.stopPropagation(); onSelect(key) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-gray-100 bg-white hover:bg-[#f8faf9] hover:border-[#2b5a52]/30 text-left transition-colors"
                >
                  <span className="text-lg">{t.emoji}</span>
                  <p className="text-sm font-semibold text-[#173d37]">{en ? t.labelEn : t.labelEs}</p>
                  <FiChevronRight className="text-gray-300 ml-auto" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Welcome de primera visita (simplificado) ────────────────────────────────
export function OnboardingTour({ language = 'es' }) {
  const [visible, setVisible] = useState(false)
  const en = language === 'en'
  const dismiss = useCallback(() => {
    setVisible(false)
    try { localStorage.setItem(LS_KEY, '1') } catch {}
  }, [])
  useEffect(() => {
    try { if (!localStorage.getItem(LS_KEY)) setTimeout(() => setVisible(true), 600) } catch {}
  }, [])
  if (!visible) return null
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[9998]" onClick={dismiss} />
      <div className="fixed z-[9999] inset-0 flex items-center justify-center p-4" onClick={dismiss}>
        <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="bg-[#2b5a52] px-5 py-4 text-center">
            <p className="text-2xl">👋</p>
            <p className="text-white font-bold text-base mt-1">{en ? 'Welcome to Teaching Copilot' : 'Bienvenido al Copiloto Docente'}</p>
          </div>
          <div className="px-5 py-5 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              {en ? 'This platform helps you create complete teaching kits in 10-15 minutes.' : 'Esta plataforma te ayuda a crear kits docentes completos en 10-15 minutos.'}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed font-semibold">
              {en ? 'Tip: Click "Load example to explore" to take a guided tour.' : 'Consejo: Haz clic en "Cargar ejemplo para explorar" para hacer un recorrido guiado.'}
            </p>
          </div>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button onClick={dismiss} className="px-5 py-2 text-xs font-bold text-white bg-[#2b5a52] rounded-xl hover:bg-[#234a43]">
              {en ? 'Got it!' : '¡Entendido!'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export function resetOnboarding() {
  try { localStorage.removeItem(LS_KEY) } catch {}
}
