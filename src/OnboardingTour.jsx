import { useState, useEffect, useCallback } from 'react'
import { FiChevronRight, FiChevronLeft, FiX } from 'react-icons/fi'

const LS_KEY = 'mm_onboarding_done'

const STEPS_ES = [
  {
    target: '[data-tour="rutas"]',
    title: 'Elige tu ruta',
    text: 'Tienes tres caminos: MEN de Tecnologia e Informatica, Diseno Escolar o STEM/STEAM. Cada uno genera un kit diferente.',
    position: 'bottom',
  },
  {
    target: '[data-tour="idioma"]',
    title: 'Idioma del kit',
    text: 'Todo el kit se genera en el idioma que elijas: espanol o ingles. Puedes cambiarlo despues.',
    position: 'bottom',
  },
  {
    target: '[data-tour="empezar"]',
    title: 'Empieza aqui',
    text: 'Haz clic en "Crear mi kit" para iniciar. Son 4 bloques de configuracion y 7 pasos de contenido. Tu primer kit tarda 10-15 minutos.',
    position: 'top',
  },
  {
    target: '[data-tour="ejemplo"]',
    title: 'O explora un ejemplo',
    text: 'Si prefieres ver como queda un kit terminado antes de crear el tuyo, carga el ejemplo. Se llena automaticamente para que explores.',
    position: 'top',
  },
  {
    target: '[data-tour="panel"]',
    title: 'Tu panel de progreso',
    text: 'Aqui ves tus kits guardados, puntaje promedio y progreso. Todo se guarda automaticamente.',
    position: 'bottom',
  },
]

const STEPS_EN = [
  {
    target: '[data-tour="rutas"]',
    title: 'Choose your route',
    text: 'You have three paths: MEN Technology and Computing, School Design, or STEM/STEAM. Each generates a different kit.',
    position: 'bottom',
  },
  {
    target: '[data-tour="idioma"]',
    title: 'Kit language',
    text: 'The entire kit is generated in your chosen language: Spanish or English. You can change it later.',
    position: 'bottom',
  },
  {
    target: '[data-tour="empezar"]',
    title: 'Start here',
    text: 'Click "Start my kit" to begin. It takes 4 configuration blocks and 7 content steps. Your first kit takes 10-15 minutes.',
    position: 'top',
  },
  {
    target: '[data-tour="ejemplo"]',
    title: 'Or explore an example',
    text: 'If you prefer to see a finished kit before creating your own, load the example. It fills in automatically so you can explore.',
    position: 'top',
  },
  {
    target: '[data-tour="panel"]',
    title: 'Your progress panel',
    text: 'Here you can see your saved kits, average score, and progress. Everything saves automatically.',
    position: 'bottom',
  },
]

export function OnboardingTour({ language = 'es' }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  const steps = language === 'en' ? STEPS_EN : STEPS_ES
  const current = steps[step]

  const dismiss = useCallback(() => {
    setVisible(false)
    try { localStorage.setItem(LS_KEY, '1') } catch {}
  }, [])

  // Check if first visit
  useEffect(() => {
    try {
      if (!localStorage.getItem(LS_KEY)) {
        setTimeout(() => setVisible(true), 800)
      }
    } catch {}
  }, [])

  // Position the bubble near the target
  useEffect(() => {
    if (!visible || !current?.target) return
    const el = document.querySelector(current.target)
    if (!el) {
      // If target not found, center the bubble
      setPos({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160 })
      return
    }
    const rect = el.getBoundingClientRect()
    const bw = 340 // bubble width
    let top, left
    if (current.position === 'bottom') {
      top = rect.bottom + 12
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - bw / 2, window.innerWidth - bw - 16))
    } else {
      top = rect.top - 200
      left = Math.max(16, Math.min(rect.left + rect.width / 2 - bw / 2, window.innerWidth - bw - 16))
    }
    setPos({ top: Math.max(16, top), left })
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [step, visible, current])

  if (!visible) return null

  const isLast = step === steps.length - 1
  const isFirst = step === 0
  const en = language === 'en'

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-[9998]"
        onClick={dismiss}
      />
      {/* Bubble */}
      <div
        className="fixed z-[9999] w-[340px] bg-white rounded-2xl shadow-2xl shadow-black/20 overflow-hidden"
        style={{ top: pos.top, left: pos.left }}
      >
        {/* Header */}
        <div className="bg-[#2b5a52] px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-xs font-bold">{step + 1}/{steps.length}</span>
            <span className="text-white font-bold text-sm">{current.title}</span>
          </div>
          <button onClick={dismiss} aria-label={en ? 'Close tour' : 'Cerrar tour'} className="text-white/60 hover:text-white p-1">
            <FiX className="text-sm" />
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-gray-600 leading-6">{current.text}</p>
        </div>
        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
          <button
            onClick={dismiss}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {en ? 'Skip tour' : 'Saltar tour'}
          </button>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#2b5a52] rounded-lg hover:bg-[#2b5a52]/10"
              >
                <FiChevronLeft className="text-xs" /> {en ? 'Back' : 'Atrás'}
              </button>
            )}
            <button
              onClick={() => isLast ? dismiss() : setStep(step + 1)}
              className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-[#2b5a52] rounded-lg hover:bg-[#234a43]"
            >
              {isLast ? (en ? 'Done!' : 'Listo!') : (en ? 'Next' : 'Siguiente')} {!isLast && <FiChevronRight className="text-xs" />}
            </button>
          </div>
        </div>
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-3">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[#fbb041]' : i < step ? 'bg-[#2b5a52]' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      </div>
    </>
  )
}

export function resetOnboarding() {
  try { localStorage.removeItem(LS_KEY) } catch {}
}
