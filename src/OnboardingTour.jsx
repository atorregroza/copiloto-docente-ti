import { useState, useEffect, useCallback } from 'react'
import { FiChevronRight, FiX } from 'react-icons/fi'

const LS_KEY = 'mm_onboarding_done'

const TOUR_STEPS_ES = [
  { step: 0, emoji: '👋', title: 'Bienvenido al Copiloto', text: 'Vamos a recorrer la plataforma juntos con un kit de ejemplo. En cada pantalla te explico qué se llenó y para qué sirve. Solo dale "Siguiente".' },
  { step: 1, emoji: '🏫', title: 'Tu institución', text: 'Aquí va tu colegio, ciudad y nombre. Estos datos aparecen en la portada del kit, la rúbrica y todos los documentos exportados.' },
  { step: 2, emoji: '📚', title: 'Ruta y grado', text: 'Elegimos ruta MEN, grado 7° y componente "Solución de problemas". Esto determina los subtemas disponibles y la estructura de la rúbrica.' },
  { step: 3, emoji: '🧰', title: 'Recursos y restricciones', text: 'Aquí defines cuánto dura el proyecto, qué materiales tienes y qué limitaciones hay. La guía docente se adapta a esto.' },
  { step: 4, emoji: '♿', title: 'Inclusión', text: 'Activamos NEE para un estudiante con baja visión. La plataforma genera 4 adaptaciones específicas: fuente grande, par-apoyo, descripción verbal y materiales táctiles.' },
  { step: 5, emoji: '🎯', title: 'Subtema del proyecto', text: 'Elegimos "Algoritmos para procesos de la vida cotidiana". A partir de aquí, los 7 pasos del kit se generan automáticamente.' },
  { step: 6, emoji: '📐', title: 'Paso 1 — Alineación', text: 'Tu competencia, objetivo medible y criterios de éxito. Todo conectado al componente MEN que elegiste.' },
  { step: 9, emoji: '👩‍🏫', title: 'Paso 4 — Guía docente', text: 'Secuencia cronometrada real: Apertura (10 min), Exploración (15 min), Construcción, Socialización (10 min) y Cierre (10 min). Lista para usar en clase.' },
  { step: 10, emoji: '📝', title: 'Paso 5 — Guía del estudiante', text: 'Cuadernillo con ficha del reto, pasos cronometrados, espacios para fotos, 2 checkpoints formativos de semáforo y autoevaluación.' },
  { step: 11, emoji: '⭐', title: 'Paso 6 — Rúbrica', text: '4 criterios con pesos que suman 100%. Editable. Se exporta como tabla interactiva donde haces clic para calificar y calcula la nota.' },
  { step: 13, emoji: '🎉', title: '¡Kit completo!', text: 'Score 100/100. Desde aquí exportas: PDF para imprimir, kit interactivo, rúbrica de calificación y resumen para familias. Todo listo.' },
]

const TOUR_STEPS_EN = [
  { step: 0, emoji: '👋', title: 'Welcome to the Copilot', text: 'Let\'s walk through the platform together with a sample kit. At each screen I\'ll explain what was filled and why. Just click "Next".' },
  { step: 1, emoji: '🏫', title: 'Your institution', text: 'Your school, city and name go here. This data appears on the kit cover, rubric and all exported documents.' },
  { step: 2, emoji: '📚', title: 'Route and grade', text: 'We chose the MEN route, grade 7 and "Problem solving" component. This determines available topics and rubric structure.' },
  { step: 3, emoji: '🧰', title: 'Resources and constraints', text: 'Here you define project duration, available materials and limitations. The teacher guide adapts to this.' },
  { step: 4, emoji: '♿', title: 'Inclusion', text: 'We enabled accessibility for a low-vision student. The platform generates 4 specific adaptations: large font, peer support, verbal description and tactile materials.' },
  { step: 5, emoji: '🎯', title: 'Project topic', text: 'We chose "Algorithms for everyday processes". From here, all 7 kit steps are generated automatically.' },
  { step: 6, emoji: '📐', title: 'Step 1 — Alignment', text: 'Your competency, measurable objective and success criteria. All connected to the MEN component you chose.' },
  { step: 9, emoji: '👩‍🏫', title: 'Step 4 — Teacher guide', text: 'Real timed sequence: Opening (10 min), Exploration (15 min), Building, Sharing (10 min) and Closing (10 min). Ready to use in class.' },
  { step: 10, emoji: '📝', title: 'Step 5 — Student guide', text: 'Workbook with challenge card, timed steps, photo spaces, 2 formative traffic-light checkpoints and self-assessment.' },
  { step: 11, emoji: '⭐', title: 'Step 6 — Rubric', text: '4 criteria with weights that sum to 100%. Editable. Exports as an interactive table where you click to grade and it calculates the score.' },
  { step: 13, emoji: '🎉', title: 'Kit complete!', text: 'Score 100/100. From here you export: PDF to print, interactive kit, grading rubric and family summary. All ready.' },
]

export function GuidedTour({ language = 'es', currentStep, onNext, onDismiss }) {
  const steps = language === 'en' ? TOUR_STEPS_EN : TOUR_STEPS_ES
  const en = language === 'en'

  // Find the tour step that matches the current app step
  const tourIndex = steps.findIndex(s => s.step === currentStep)
  const current = tourIndex >= 0 ? steps[tourIndex] : null

  if (!current) return null

  const isLast = tourIndex === steps.length - 1
  const progress = ((tourIndex + 1) / steps.length) * 100

  const handleNext = (e) => {
    e.stopPropagation(); e.preventDefault()
    if (isLast) {
      onDismiss()
    } else {
      // Find the next tour step and tell the parent to jump there
      const nextTourStep = steps[tourIndex + 1]
      if (nextTourStep) onNext(nextTourStep.step)
    }
  }

  const handleDismiss = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault() }
    onDismiss()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[9998]" onClick={handleDismiss} />
      <div className="fixed z-[9999] inset-0 flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl shadow-black/25 overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <div className="h-1 bg-[#fbb041] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Header */}
          <div className="bg-[#2b5a52] px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{current.emoji}</span>
              <div>
                <span className="text-white/50 text-[10px] font-bold">{tourIndex + 1} / {steps.length}</span>
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
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#2b5a52] rounded-xl hover:bg-[#234a43] transition-colors shadow-sm"
            >
              {isLast ? (en ? 'Start creating!' : '¡Empezar a crear!') : (en ? 'Next' : 'Siguiente')} {!isLast && <FiChevronRight className="text-xs" />}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Simple first-visit welcome (kept as fallback)
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
              {en
                ? 'This platform helps you create complete teaching kits in 10-15 minutes. Choose your route, fill in a few fields, and everything is generated automatically.'
                : 'Esta plataforma te ayuda a crear kits docentes completos en 10-15 minutos. Elige tu ruta, llena unos campos y todo se genera automáticamente.'}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed font-semibold">
              {en
                ? 'Tip: Click "Load example to explore" to see a finished kit before creating your own.'
                : 'Consejo: Haz clic en "Cargar ejemplo para explorar" para ver un kit terminado antes de crear el tuyo.'}
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
