import { useState, useEffect, useRef } from 'react'
import { FiChevronRight, FiChevronLeft, FiPrinter, FiRefreshCw, FiCheck, FiBook, FiExternalLink, FiFileText, FiUsers, FiCheckSquare, FiPackage, FiUpload, FiX, FiSave, FiClock, FiFolder, FiLink, FiAlertCircle, FiTrash2, FiAward, FiImage, FiCopy, FiInfo, FiZap, FiSliders, FiLock } from 'react-icons/fi'
import logoMM from './assets/images/LogoMM.svg'
import { detectStemDomain, buildStemPackage, STEM_DOMAINS } from './data/stemCatalog'
import { OnboardingTour, GuidedTour, TourMenu, TourCompleteMenu } from './OnboardingTour'

const MEN_URL = 'https://www.colombiaaprende.edu.co/sites/default/files/files_public/2022-11/Orientaciones_Curricures_Tecnologia.pdf'
const IB_MYP_DESIGN_URL = 'https://www.ibo.org/programmes/middle-years-programme/curriculum/design/'
const STEM_REF_URL = '/stem-ref.html#start'
const AI_OPTIONS = [
  { label: 'Claude', url: 'https://claude.ai/new' },
  { label: 'ChatGPT', url: 'https://chatgpt.com/' },
  { label: 'Gemini', url: 'https://gemini.google.com/' },
]

// ─── Kit compartible ─────────────────────────────────────────────────────────
const SHARE_FIELDS = [
  'institucion', 'ciudad', 'tienelogo', 'logoFileName',
  'docente',
  'route', 'language', 'grado', 'mypYear', 'componente', 'competencia',
  'duracionProyecto', 'duracionSimulador', 'recursos', 'restricciones',
  'incluyeImagenes', 'tiposVisual', 'maxImagenes', 'puedenFotografiar',
  'tieneNEE', 'tiposNEE', 'descripcionNEE',
  'subtema', 'subtemaPropio', 'ibNeed', 'ibOutcome', 'ibEvidence', 'ibPrereq', 'ibCriterion', 'ibGlobalContext', 'ibKeyConcept', 'ibRelatedConcept',
  'stemNeed', 'stemUsers', 'stemAreas', 'stemImpact', 'stemMetric', 'stemPrototype', 'stemEvidenceLink', 'stemRounds', 'stemRoles',
  'paso0Mode', 'checkpoints',
]

function buildSharePayload(data) {
  const payload = {}
  SHARE_FIELDS.forEach((k) => { if (data[k] !== undefined) payload[k] = data[k] })
  return payload
}

function kitToLegacyShareUrl(data) {
  const payload = buildSharePayload(data)
  try {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    const base = `${window.location.origin}/kit-docente`
    // encodeURIComponent es obligatorio: base64 puede contener '+', '/', '='
    // y URLSearchParams.get() convierte '+' en espacio, corrompiendo el payload
    return `${base}?kit=${encodeURIComponent(encoded)}`
  } catch { return null }
}

const LOCAL_SHARE_PREFIX = 'kit_share:'

function makeShortId() {
  return Math.random().toString(16).slice(2, 10)
}

function saveLocalShare(payload) {
  try {
    const id = makeShortId()
    localStorage.setItem(`${LOCAL_SHARE_PREFIX}${id}`, JSON.stringify(payload))
    return id
  } catch {
    return null
  }
}

async function createShortShareUrl(data) {
  const payload = buildSharePayload(data)
  const base = `${window.location.origin}/kit-docente`
  try {
    const res = await fetch('/api/share-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    })
    if (res.ok) {
      const json = await res.json()
      if (json?.shortUrl) return json.shortUrl
    }
  } catch {
    // fallback local
  }

  const localId = saveLocalShare(payload)
  return localId ? `${base}?sid=${encodeURIComponent(localId)}` : kitToLegacyShareUrl(data)
}

async function kitFromUrlParam() {
  try {
    const params = new URLSearchParams(window.location.search)
    const sid = params.get('sid')
    if (sid) {
      const res = await fetch(`/api/share-resolve?id=${encodeURIComponent(sid)}`)
      if (res.ok) {
        const json = await res.json()
        if (json?.payload) return json.payload
      }
    }

    const param = params.get('kit')
    if (param) return JSON.parse(decodeURIComponent(escape(atob(param))))
    return null
  } catch { return null }
}

function AILinks({ compact = false, stopClick = false }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {AI_OPTIONS.map((opt) => (
        <a
          key={opt.label}
          href={opt.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={stopClick ? (e) => e.stopPropagation() : undefined}
          className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors
            ${compact
          ? 'text-[11px] bg-white/15 hover:bg-white/25 text-white px-2.5 py-1.5 border border-white/20'
          : 'text-xs bg-[#fbb041] hover:bg-[#f5a832] text-white px-3 py-2 shadow-md'}`}
        >
          {opt.label}
          <FiExternalLink className="text-[10px]" />
        </a>
      ))}
    </div>
  )
}

const AUTORA = {
  nombre: 'Astrid Lizbeth Torregroza Olivero',
  titulo: 'Lic. Matemáticas y Física',
}

const REFERENTES_MEN = [
  {
    tag: 'MEN', color: 'bg-blue-100 text-blue-700',
    titulo: 'Orientaciones Curriculares — Tecnología e Informática',
    cita: 'Ministerio de Educación Nacional, Colombia, 2022',
  },
  {
    tag: 'Ley', color: 'bg-gray-100 text-gray-600',
    titulo: 'Ley General de Educación',
    cita: 'Ley 115 de 1994, República de Colombia',
  },
  {
    tag: 'Decreto', color: 'bg-gray-100 text-gray-600',
    titulo: 'Educación inclusiva — atención a personas con discapacidad',
    cita: 'Decreto 1421 de 2017, Ministerio de Educación Nacional',
  },
]

const REFERENTES_IB = [
  {
    tag: 'Ref.', color: 'bg-red-100 text-red-700',
    titulo: 'Ciclo de Diseño Escolar',
    cita: 'Adaptado de International Baccalaureate Organization — curriculum overview',
  },
  {
    tag: 'Ref.', color: 'bg-orange-100 text-orange-700',
    titulo: 'Marco de Programa por Años',
    cita: 'Adaptado de International Baccalaureate Organization — programme framework',
  },
]

const REFERENTES_COMPARTIDOS = [
  {
    tag: 'UNESCO', color: 'bg-green-100 text-green-700',
    titulo: 'Marco de Competencias TIC para Docentes (ICT-CFT v3)',
    cita: 'UNESCO, 2019',
  },
  {
    tag: 'DUA', color: 'bg-purple-100 text-purple-700',
    titulo: 'Diseño Universal para el Aprendizaje (DUA / UDL)',
    cita: 'CAST — Center for Applied Special Technology, 2018',
  },
  {
    tag: 'ABP', color: 'bg-purple-100 text-purple-700',
    titulo: 'Aprendizaje Basado en Proyectos (ABP)',
    cita: 'Buck Institute for Education — PBLWorks, 2019',
  },
  {
    tag: 'CompTec', color: 'bg-teal-100 text-teal-700',
    titulo: 'Pensamiento Computacional',
    cita: 'Wing, J. M. (2006). Computational Thinking. Communications of the ACM, 49(3), 33–35',
  },
  {
    tag: 'Eval.', color: 'bg-amber-100 text-amber-700',
    titulo: 'Evaluación formativa — Assessment for Learning',
    cita: 'Black, P. & Wiliam, D. (1998). Inside the Black Box. Phi Delta Kappan, 80(2)',
  },
  {
    tag: 'IA Educ.', color: 'bg-rose-100 text-rose-700',
    titulo: 'Inteligencia Artificial en Educación',
    cita: 'Holmes, W., Bialik, M. & Fadel, C. (2019). Artificial Intelligence in Education. CCR',
  },
]

const REFERENTES_STEM = [
  { tag: 'NGSS', color: 'bg-blue-100 text-blue-700', titulo: 'NGSS Appendix I: Engineering Design', cita: 'Next Generation Science Standards, 2013' },
  { tag: 'MEN', color: 'bg-green-100 text-green-700', titulo: 'Orientaciones Curriculares Tec. e Informática 2022', cita: 'Ministerio de Educación Nacional de Colombia' },
  { tag: 'Ref.', color: 'bg-orange-100 text-orange-700', titulo: 'Ciclo de Diseño Escolar', cita: 'Adaptado de International Baccalaureate Organization' },
  { tag: 'UNESCO', color: 'bg-teal-100 text-teal-700', titulo: 'ICT-CFT v3 · Inclusión y sostenibilidad', cita: 'UNESCO, 2019' },
  { tag: 'REF', color: 'bg-amber-100 text-amber-700', titulo: 'Referencia interna STEM / STEAM', cita: 'Disponible en la plataforma · /stem-ref.html' },
]

function getReferentesByRoute(route = 'men') {
  const routeSpecific = route === 'ib_myp_design'
    ? REFERENTES_IB
    : route === 'stem'
      ? REFERENTES_STEM
      : REFERENTES_MEN
  return [...routeSpecific, ...REFERENTES_COMPARTIDOS]
}

// ─── Generador de prompts para el Simulador Maryam Math ──────────────────────
function generarPromptSimulador(subtema, grado, componenteLabel, data = {}) {
  const nombre = subtema?.nombre || '[subtema seleccionado]'
  const producto = subtema?.producto || '[producto a construir]'
  const prereq = subtema?.prerequisito || 'conocimientos básicos del área'
  const dur = data.duracionSimulador || '15–20'
  const recursos = data.recursos?.trim() ? `Recursos disponibles: ${data.recursos}.` : ''
  const restricc = data.restricciones?.trim() ? `Restricciones del contexto: ${data.restricciones}.` : ''
  const isIB = data.route === 'ib_myp_design'
  const audience = isIB ? (data.mypYear || 'Año 1') : grado
  const area = isIB ? 'Diseño Escolar' : (componenteLabel || 'Tecnología e Informática')
  const intro = isIB
    ? `Eres un docente experto en diseño escolar y ciclo de diseño aplicado, trabajando con estudiantes de ${audience}.`
    : `Eres un tutor experto en Tecnología e Informática para estudiantes de ${audience} de educación básica en Colombia, alineado con las Orientaciones Curriculares MEN 2022.`
  const context = isIB
    ? 'Estoy preparando un kit didáctico con enfoque de diseño. Necesito que el reto, el producto y la evaluación dialoguen con el ciclo de diseño escolar.'
    : `Estoy preparando un kit didáctico sobre "${nombre}". Mis estudiantes deben lograr construir: ${producto}.`
  const examplesBlock = isIB
    ? `2. EJEMPLOS Y CONTEXTOS DE DISEÑO
   → 3 contextos de uso cercanos para estudiantes de ${audience}.
   → Uno centrado en usuario escolar, otro en sistema/servicio y otro en mejora de producto.`
    : `2. EJEMPLOS DEL CONTEXTO COLOMBIANO
   → 3 ejemplos concretos y cercanos a la realidad escolar colombiana.
   → Uno con tecnología cotidiana, otro con el entorno escolar, otro con la comunidad.`
  const activityBlock = isIB
    ? `4. GUÍA PARA LA ACTIVIDAD DE ${dur} MINUTOS
   → Pasos concretos para investigar, proponer, construir y evaluar una solución de diseño.
   → Incluye preguntas que ayuden a justificar decisiones y revisar restricciones.`
    : `4. GUÍA PARA LA ACTIVIDAD DE ${dur} MINUTOS
   → Pasos concretos para que los estudiantes construyan: ${producto}.
   → Versión sin hardware y versión con hardware (si está disponible).`

  return `═══════════════════════════════════════════════
PROMPT PARA EL SIMULADOR MARYAM MATH
═══════════════════════════════════════════════
Tema   : ${nombre}
Trayecto: ${audience} | Área: ${area}
Sesión : ${dur} minutos
═══════════════════════════════════════════════

${intro}

CONTEXTO DEL PROYECTO:
${context}
Producto esperado: ${producto}.
${recursos}${restricc}
Prerrequisito del grupo: ${prereq}.

POR FAVOR AYÚDAME CON:

1. CONCEPTOS CLAVE (para el docente)
   → Explícame "${nombre}" con precisión pero accesible para estudiantes de ${audience}.
   → Los 3 conceptos que mis estudiantes DEBEN comprender antes de terminar la clase.

${examplesBlock}

3. PREGUNTAS DINAMIZADORAS (apertura de clase)
   → 4 preguntas que partan de saberes previos y lleven al concepto nuevo.
   → Redacción directa para el docente, lista para leer en clase.

${activityBlock}

5. ERRORES FRECUENTES Y CÓMO PREVENIRLOS
   → Los 3 errores más comunes con este tema.
   → Cómo detectarlos y corregirlos durante la clase, sin interrumpir el flujo.

═══════════════════════════════════════════════
Responde con lenguaje pedagógico claro y práctico.
Enfócate en aplicaciones reales, no en teoría abstracta.
═══════════════════════════════════════════════`
}

// ─── Datos curriculares MEN ───────────────────────────────────────────────────
const MEN_COMPONENTES = [
  {
    id: 'naturaleza',
    label: 'Naturaleza y evolución de la tecnología y la informática',
    temas: [
      'Historia y evolución de los computadores',
      'Componentes de hardware y software',
      'Ciclo de vida de los productos tecnológicos',
      'Tipos de sistemas tecnológicos',
      'Innovación tecnológica y diseño de artefactos',
      'Impacto de la inteligencia artificial en la sociedad',
      'Evolución de las telecomunicaciones',
      'Tecnología sostenible y medio ambiente',
    ],
  },
  {
    id: 'uso',
    label: 'Uso y apropiación de la tecnología y la informática',
    temas: [
      'Ofimática y productividad digital',
      'Programación visual con Scratch',
      'Robótica educativa básica',
      'Internet seguro y ciudadanía digital',
      'Herramientas colaborativas en la nube',
      'Bases de datos sencillas',
      'Multimedia y edición digital',
      'Aplicaciones móviles educativas',
    ],
  },
  {
    id: 'solucion',
    label: 'Solución de problemas con tecnología e informática',
    temas: [
      'Pensamiento computacional y algoritmos',
      'Diagramas de flujo y pseudocódigo',
      'Simuladores y modelos digitales',
      'Prototipado y diseño de soluciones',
      'Arduino / micro:bit básico',
      'Análisis de datos con hojas de cálculo',
      'Diseño de interfaz de usuario (UX/UI)',
      'Depuración y prueba de sistemas',
    ],
  },
  {
    id: 'sociedad',
    label: 'Tecnología, informática y sociedad',
    temas: [
      'Ética digital y uso responsable',
      'Brecha digital e inclusión tecnológica',
      'Propiedad intelectual y licencias Creative Commons',
      'Impacto ambiental de la tecnología',
      'Trabajo, automatización y futuro laboral',
      'Privacidad y seguridad de datos personales',
      'Tecnología accesible e inclusiva',
      'Derechos digitales y legislación colombiana',
    ],
  },
]

const GRADOS = ['Preescolar', '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°', '11°']
const MYP_YEARS = ['Año 1', 'Año 2', 'Año 3', 'Año 4', 'Año 5']
const LANGUAGES = [
  { id: 'es', label: 'Español', shortLabel: 'ES' },
  { id: 'en', label: 'English', shortLabel: 'EN' },
]
const IB_DESIGN_CRITERIA = [
  { id: 'A', label: 'Criterion A', labelEs: 'Criterio A', title: 'Inquiring and analysing', titleEs: 'Indagar y analizar' },
  { id: 'B', label: 'Criterion B', labelEs: 'Criterio B', title: 'Developing ideas', titleEs: 'Desarrollar ideas' },
  { id: 'C', label: 'Criterion C', labelEs: 'Criterio C', title: 'Creating the solution', titleEs: 'Crear la solución' },
  { id: 'D', label: 'Criterion D', labelEs: 'Criterio D', title: 'Evaluating', titleEs: 'Evaluar' },
]
const IB_GLOBAL_CONTEXTS = [
  { id: 'identities', label: 'Identities and relationships', labelEs: 'Identidades y relaciones' },
  { id: 'space_time', label: 'Orientation in space and time', labelEs: 'Orientación en el espacio y el tiempo' },
  { id: 'expression', label: 'Personal and cultural expression', labelEs: 'Expresión personal y cultural' },
  { id: 'innovation', label: 'Scientific and technical innovation', labelEs: 'Innovación científica y técnica' },
  { id: 'globalization', label: 'Globalization and sustainability', labelEs: 'Globalización y sostenibilidad' },
  { id: 'fairness', label: 'Fairness and development', labelEs: 'Equidad y desarrollo' },
]
const IB_KEY_CONCEPTS = [
  { id: 'communication', label: 'Communication', labelEs: 'Comunicación' },
  { id: 'communities', label: 'Communities', labelEs: 'Comunidades' },
  { id: 'development', label: 'Development', labelEs: 'Desarrollo' },
  { id: 'systems', label: 'Systems', labelEs: 'Sistemas' },
]
const IB_RELATED_CONCEPTS = [
  { id: 'adaptation', label: 'Adaptation', labelEs: 'Adaptación' },
  { id: 'ergonomics', label: 'Ergonomics', labelEs: 'Ergonomía' },
  { id: 'sustainability', label: 'Sustainability', labelEs: 'Sostenibilidad' },
  { id: 'innovation', label: 'Innovation', labelEs: 'Innovación' },
]
const IB_CRITERION_GUIDANCE = {
  A: {
    objectiveEs: 'indagar la necesidad, analizar el contexto, el usuario y las restricciones antes de pasar a una solución final',
    objective: 'inquire into the need, analyse context, user and constraints before moving to a final solution',
    outcomeEs: 'brief de diseño con problema definido, usuario identificado y criterios de éxito claros',
    outcome: 'design brief with a defined problem, identified user and clear success criteria',
    evidenceEs: 'indagación del problema, entrevista u observación, criterios de diseño y análisis de restricciones',
    evidence: 'problem inquiry, interview or observation, design criteria and constraint analysis',
    outcomeKeywords: ['brief', 'criterios', 'criteria', 'analysis', 'analisis', 'specification', 'especificacion', 'problem', 'problema', 'user', 'usuario'],
    evidenceKeywords: ['investig', 'indag', 'entrevista', 'observ', 'criteria', 'criterios', 'restric', 'anal', 'research'],
  },
  B: {
    objectiveEs: 'desarrollar varias ideas viables, compararlas y justificar la selección de la mejor alternativa',
    objective: 'develop several viable ideas, compare them and justify the strongest option',
    outcomeEs: 'portafolio de ideas o propuesta comparativa con bocetos anotados y decisión justificada',
    outcome: 'idea portfolio or comparative proposal with annotated sketches and justified selection',
    evidenceEs: 'bocetos, comparación de alternativas, matriz de decisión y justificación de la idea elegida',
    evidence: 'sketches, comparison of alternatives, decision matrix and justification of the selected idea',
    outcomeKeywords: ['idea', 'ideas', 'boceto', 'sketch', 'comparison', 'compar', 'proposal', 'propuesta', 'decision'],
    evidenceKeywords: ['boceto', 'sketch', 'alternat', 'matrix', 'matriz', 'decision', 'justify', 'justific'],
  },
  C: {
    objectiveEs: 'crear y materializar una solución funcional que responda al reto planteado',
    objective: 'create and build a functional solution that responds to the challenge',
    outcomeEs: 'prototipo, producto o sistema funcional listo para pruebas de uso',
    outcome: 'prototype, product or functional system ready for user testing',
    evidenceEs: 'registro de construcción, pruebas de funcionamiento, fotos del prototipo y ajustes realizados',
    evidence: 'build record, functionality testing, prototype photos and implemented adjustments',
    outcomeKeywords: ['prototype', 'prototipo', 'product', 'producto', 'system', 'sistema', 'functional', 'funcional', 'solution', 'solucion'],
    evidenceKeywords: ['test', 'prueba', 'build', 'constru', 'photo', 'foto', 'prototype', 'prototipo', 'adjust', 'ajuste'],
  },
  D: {
    objectiveEs: 'evaluar la solución, recoger retroalimentación y proponer mejoras sustentadas',
    objective: 'evaluate the solution, gather feedback and propose grounded improvements',
    outcomeEs: 'evaluación de la solución o versión mejorada con cambios sustentados',
    outcome: 'solution evaluation or improved version with justified changes',
    evidenceEs: 'retroalimentación, evaluación frente a criterios, conclusiones y mejoras priorizadas',
    evidence: 'feedback, evaluation against criteria, conclusions and prioritised improvements',
    outcomeKeywords: ['evaluation', 'evaluacion', 'improvement', 'mejora', 'refinement', 'feedback', 'revision', 'iterate', 'iteracion'],
    evidenceKeywords: ['feedback', 'retro', 'evalu', 'criteria', 'criterios', 'improv', 'mejor', 'reflection', 'reflex'],
  },
}
const CURRICULAR_ROUTES = [
  {
    id: 'men',
    label: 'Tecnología e Informática',
    labelEn: 'Technology and Computing',
    shortLabel: 'MEN',
    desc: 'Por grado y componente MEN.',
    descEn: 'By grade and MEN component.',
  },
  {
    id: 'ib_myp_design',
    label: 'Diseño',
    labelEn: 'Design',
    shortLabel: 'Diseño',
    desc: 'Por año y ciclo de diseño.',
    descEn: 'By year and design cycle.',
  },
  {
    id: 'stem',
    label: 'STEM / STEAM',
    labelEn: 'STEM / STEAM',
    shortLabel: 'STEM',
    desc: 'Interdisciplinario bilingüe.',
    descEn: 'Bilingual interdisciplinary.',
  },
]

function getRouteMeta(route = 'men') {
  return CURRICULAR_ROUTES.find((item) => item.id === route) || CURRICULAR_ROUTES[0]
}

function getRouteLabel(route = 'men', language = 'es') {
  const meta = getRouteMeta(route)
  return language === 'en' ? (meta.labelEn || meta.label) : meta.label
}

function getRouteDescription(route = 'men', language = 'es') {
  const meta = getRouteMeta(route)
  return language === 'en' ? (meta.descEn || meta.desc) : meta.desc
}

function getLanguageMeta(language = 'es') {
  return LANGUAGES.find((item) => item.id === language) || LANGUAGES[0]
}

function isEnglish(data = {}) {
  return data.language === 'en'
}

const STEM_BANDS = [
  {
    key: 'exploradores',
    grades: ['Preescolar', '1°', '2°'],
    label: { es: 'Exploradores', en: 'Explorers' },
    desc: {
      es: 'Descubren el problema y prueban ideas sencillas.',
      en: 'Discover the problem and try simple ideas.',
    },
  },
  {
    key: 'constructores',
    grades: ['3°', '4°', '5°'],
    label: { es: 'Constructores', en: 'Builders' },
    desc: {
      es: 'Fijan criterios, comparan ideas y levantan su primer prototipo.',
      en: 'Set criteria, compare ideas and build their first prototype.',
    },
  },
  {
    key: 'innovadores',
    grades: ['6°', '7°', '8°'],
    label: { es: 'Innovadores', en: 'Innovators' },
    desc: {
      es: 'Combinan soluciones y mejoran con dos pruebas.',
      en: 'Combine solutions and improve with two test rounds.',
    },
  },
  {
    key: 'arquitectos',
    grades: ['9°', '10°', '11°'],
    label: { es: 'Arquitectos de impacto', en: 'Impact architects' },
    desc: {
      es: 'Abordan retos complejos, modelan y priorizan trade‑offs.',
      en: 'Tackle complex challenges, model and prioritize trade‑offs.',
    },
  },
]

function getStemBand(grado = '') {
  return STEM_BANDS.find((b) => b.grades.includes(grado)) || null
}

const STEM_RUBRICAS = {
  exploradores: (en) => ({
    escala: 4,
    criterios: [
      { nombre: en ? 'Understands the problem' : 'Comprende el problema', pct: 30, s: en ? 'Explains what is needed and why' : 'Explica qué se necesita y por qué', a: en ? 'Mentions the need' : 'Menciona la necesidad', b: en ? 'Confuses need and solution' : 'Confunde necesidad y solución', l: en ? 'Does not identify the need' : 'No identifica la necesidad' },
      { nombre: en ? 'Builds and tries' : 'Construye y prueba', pct: 35, s: en ? 'Builds a simple model and shows it works' : 'Construye un modelo simple y muestra que funciona', a: en ? 'Builds but shows partial function' : 'Construye pero muestra funcionamiento parcial', b: en ? 'Builds without showing function' : 'Construye sin mostrar funcionamiento', l: en ? 'No builds or gives up' : 'No construye o abandona' },
      { nombre: en ? 'Shares evidence' : 'Comparte evidencias', pct: 20, s: en ? 'Shows a photo/drawing and tells what changed' : 'Muestra foto/dibujo y cuenta qué cambió', a: en ? 'Shows a photo/drawing' : 'Muestra foto/dibujo', b: en ? 'Only says it worked' : 'Solo dice que funcionó', l: en ? 'No evidence' : 'Sin evidencia' },
      { nombre: en ? 'Collaboration' : 'Colaboración', pct: 15, s: en ? 'Participates and listens' : 'Participa y escucha', a: en ? 'Participates with help' : 'Participa con ayuda', b: en ? 'Little participation' : 'Escasa participación', l: en ? 'No participation' : 'No participa' },
    ],
  }),
  constructores: (en) => ({
    escala: 4,
    criterios: [
      { nombre: en ? 'Criteria & limits' : 'Criterios y límites', pct: 25, s: en ? 'Lists criteria and limits and uses them' : 'Enumera criterios y límites y los usa', a: en ? 'Lists some criteria/limits' : 'Enumera algunos criterios/límites', b: en ? 'Mentions only one criterion' : 'Menciona solo un criterio', l: en ? 'No criteria/limits' : 'Sin criterios/límites' },
      { nombre: en ? 'Prototype works' : 'Prototipo funciona', pct: 30, s: en ? 'Works and meets most criteria' : 'Funciona y cumple la mayoría de criterios', a: en ? 'Works partially' : 'Funciona parcialmente', b: en ? 'Barely works' : 'Apenas funciona', l: en ? 'Does not work' : 'No funciona' },
      { nombre: en ? 'Test & improve' : 'Prueba y mejora', pct: 25, s: en ? 'Tests and records one improvement' : 'Prueba y registra una mejora', a: en ? 'Tests but no improvement noted' : 'Prueba pero no anota mejora', b: en ? 'Says it was tested' : 'Dice que probó', l: en ? 'No test' : 'Sin prueba' },
      { nombre: en ? 'Evidence' : 'Evidencias', pct: 20, s: en ? 'Photos/drawing + short note of result' : 'Fotos/dibujo + nota breve de resultado', a: en ? 'Photo or drawing only' : 'Solo foto o dibujo', b: en ? 'Verbal only' : 'Solo verbal', l: en ? 'No evidence' : 'Sin evidencia' },
    ],
  }),
  innovadores: (en) => ({
    escala: 4,
    criterios: [
      { nombre: en ? 'Integration of areas' : 'Integración de áreas', pct: 25, s: en ? 'Links at least 3 areas with clear roles' : 'Vincula ≥3 áreas con roles claros', a: en ? 'Links 2 areas' : 'Vincula 2 áreas', b: en ? 'Lists areas without integration' : 'Enumera áreas sin integración', l: en ? 'No integration' : 'Sin integración' },
      { nombre: en ? 'Prototype quality' : 'Calidad del prototipo', pct: 25, s: en ? 'Functional and responds to need' : 'Funcional y responde a la necesidad', a: en ? 'Partial response' : 'Responde parcialmente', b: en ? 'Weak response' : 'Respuesta débil', l: en ? 'No response' : 'Sin respuesta' },
      { nombre: en ? 'Testing and data' : 'Pruebas y datos', pct: 25, s: en ? 'Two test rounds with data and adjustment' : 'Dos pruebas con datos y ajuste', a: en ? 'Two tests without data/adjustment' : 'Dos pruebas sin datos/ajuste', b: en ? 'One test' : 'Una prueba', l: en ? 'No tests' : 'Sin pruebas' },
      { nombre: en ? 'Reflection' : 'Reflexión', pct: 25, s: en ? 'Justifies decisions and next step' : 'Justifica decisiones y siguiente paso', a: en ? 'Mentions a change' : 'Menciona un cambio', b: en ? 'General comment' : 'Comentario general', l: en ? 'No reflection' : 'Sin reflexión' },
    ],
  }),
  arquitectos: (en) => ({
    escala: 4,
    criterios: [
      { nombre: en ? 'Systems thinking' : 'Pensamiento sistémico', pct: 20, s: en ? 'Decomposes and maps constraints/trade-offs' : 'Descompone y mapea restricciones/trade-offs', a: en ? 'Lists constraints' : 'Enumera restricciones', b: en ? 'Mentions constraints' : 'Menciona restricciones', l: en ? 'No constraints' : 'Sin restricciones' },
      { nombre: en ? 'Prototype robustness' : 'Robustez del prototipo', pct: 25, s: en ? 'Works in tests and addresses main constraints' : 'Funciona en pruebas y atiende restricciones clave', a: en ? 'Works with minor gaps' : 'Funciona con brechas menores', b: en ? 'Unstable' : 'Inestable', l: en ? 'Does not work' : 'No funciona' },
      { nombre: en ? 'Evidence & data' : 'Evidencias y datos', pct: 30, s: en ? '2–3 tests, data table/chart, improvement justified' : '2–3 pruebas, tabla/gráfico, mejora justificada', a: en ? '2 tests with some data' : '2 pruebas con algunos datos', b: en ? 'Tests without data' : 'Pruebas sin datos', l: en ? 'No tests/data' : 'Sin pruebas/datos' },
      { nombre: en ? 'Impact & reflection' : 'Impacto y reflexión', pct: 25, s: en ? 'Evaluates social/environmental impact and next iteration' : 'Evalúa impacto socioambiental y siguiente iteración', a: en ? 'Mentions impact' : 'Menciona impacto', b: en ? 'Superficial impact note' : 'Impacto superficial', l: en ? 'No impact reflection' : 'Sin reflexión de impacto' },
    ],
  }),
}

function getStemRubrica(bandKey = 'innovadores', language = 'es') {
  const builder = STEM_RUBRICAS[bandKey] || STEM_RUBRICAS.innovadores
  return builder(language === 'en')
}

function buildStemCoherentPackage(stemNeed = '', bandKey = 'innovadores', language = 'es') {
  const domain = detectStemDomain(stemNeed || '')
  return buildStemPackage(domain, bandKey, language, stemNeed || '')
}

function getStemTemplates(bandKey = 'innovadores', en = false) {
  const t = {
    exploradores: {
      need: en ? 'Keep classroom plants healthy with light and water.' : 'Mantener las plantas del salón sanas con luz y agua.',
      users: en ? 'Our classroom kids and teacher.' : 'Niños de mi curso y la maestra.',
      metric: en ? 'After 1 week: plant alive? Count green leaves (yes/no).' : 'Tras 1 semana: ¿la planta sigue viva? Cuenta hojas verdes (sí/no).',
      prototype: en ? 'Simple pot with drainage + color stick as watering reminder.' : 'Maceta simple con drenaje + palito de color como recordatorio de riego.',
      impact: en ? 'Care for classroom environment and shared responsibility.' : 'Cuidado del entorno del aula y responsabilidad compartida.',
      evidence: en ? 'Photo before/after + count of green leaves.' : 'Foto antes/después + conteo de hojas verdes.',
    },
    constructores: {
      need: en ? 'Reduce noise in the lunch line for clearer instructions.' : 'Reducir ruido en la fila del comedor para dar instrucciones claras.',
      users: en ? 'Students in 3rd–5th grade and lunch assistants.' : 'Estudiantes de 3°–5° y auxiliares del comedor.',
      metric: en ? 'Noise level before/after (3-point scale or dB) in 15–30 min.' : 'Nivel de ruido antes/después (escala de 3 puntos o dB) en 15–30 min.',
      prototype: en ? 'Visual "traffic light" for noise or simple divider with reused cardboard.' : 'Semáforo visual de ruido o divisor simple con cartón reutilizado.',
      impact: en ? 'Safer, calmer wait line; clear instructions.' : 'Fila más segura y tranquila; instrucciones claras.',
      evidence: en ? 'Photo of prototype + quick note of noise change.' : 'Foto del prototipo + nota rápida del cambio de ruido.',
    },
    innovadores: {
      need: en ? 'Improve airflow in a hot classroom without A/C.' : 'Mejorar la ventilación en un aula calurosa sin A/C.',
      users: en ? 'Students and teacher in that classroom.' : 'Estudiantes y docente de ese salón.',
      metric: en ? 'Temperature/airflow change in 20 min (thermometer or paper flutter).' : 'Cambio de temperatura/flujo en 20 min (termómetro o aleteo de papel).',
      prototype: en ? 'Low-cost airflow device: bottle + small fan, or window deflector.' : 'Dispositivo de flujo de aire: botella + ventilador pequeño, o deflector en ventana.',
      impact: en ? 'Comfort and focus; simple energy use.' : 'Confort y concentración; uso simple de energía.',
      evidence: en ? 'Photos of tests + temperature/airflow note.' : 'Fotos de pruebas + nota de temperatura/flujo.',
    },
    arquitectos: {
      need: en ? 'Make drinking water safer for a specific group in school.' : 'Hacer más segura el agua de consumo para un grupo específico del colegio.',
      users: en ? 'School community; identify target users.' : 'Comunidad escolar; definir usuarios objetivo.',
      metric: en ? 'Turbidity/clarity before vs after (strip/visual) in 20–30 min.' : 'Turbidez/claridad antes vs después (tira/visual) en 20–30 min.',
      prototype: en ? 'Gravity filter + visual clarity indicator; quick user test.' : 'Filtro por gravedad + indicador visual de claridad; prueba rápida con usuarios.',
      impact: en ? 'Health, inclusion and sustainability.' : 'Salud, inclusión y sostenibilidad.',
      evidence: en ? 'Data table (before/after), photos, and adjustment note.' : 'Tabla de datos (antes/después), fotos y nota de ajuste.',
    },
  }
  return t[bandKey] || t.innovadores
}

function getStemSuggestedChallenges(bandKey = 'innovadores', en = false) {
  const bank = {
    exploradores: [
      {
        title: en ? 'Healthy classroom plants' : 'Plantas sanas en el aula',
        need: en ? 'Keep classroom plants hydrated and with enough light.' : 'Mantener hidratadas y con luz las plantas del salón.',
        prototype: en ? 'Simple pot with drainage and colored stick reminder.' : 'Maceta con drenaje y palito de color como recordatorio de riego.',
        metric: en ? 'Green leaves count before/after one week.' : 'Conteo de hojas verdes antes/después de una semana.',
      },
      {
        title: en ? 'Quiet story corner' : 'Rincón de lectura tranquilo',
        need: en ? 'Lower noise so kids can hear stories.' : 'Bajar el ruido para que los niños escuchen los cuentos.',
        prototype: en ? 'Soft divider or visual noise flag.' : 'Divisor suave o bandera visual de ruido.',
        metric: en ? 'Noise level on a 3-step scale before/after 20 min.' : 'Nivel de ruido en escala de 3 pasos antes/después de 20 min.',
      },
    ],
    constructores: [
      {
        title: en ? 'Safer lunch line' : 'Fila del comedor segura',
        need: en ? 'Reduce noise and disorder while waiting for lunch.' : 'Reducir ruido y desorden mientras esperan el almuerzo.',
        prototype: en ? 'Visual noise traffic light or simple line markers.' : 'Semáforo visual de ruido o marcadores simples de fila.',
        metric: en ? 'Noise level (dB or 1–3 scale) before/after 15–30 min.' : 'Nivel de ruido (dB o escala 1–3) antes/después de 15–30 min.',
      },
      {
        title: en ? 'Cooler classroom' : 'Aula más fresca',
        need: en ? 'Improve airflow without A/C in hot rooms.' : 'Mejorar ventilación en aulas calurosas sin A/C.',
        prototype: en ? 'Airflow deflector with cardboard + small fan.' : 'Deflector de aire con cartón + ventilador pequeño.',
        metric: en ? 'Temperature/airflow change in 20 min.' : 'Cambio de temperatura/flujo en 20 min.',
      },
    ],
    innovadores: [
      {
        title: en ? 'Water you can trust' : 'Agua que se puede confiar',
        need: en ? 'Make drinking water safer for a specific group in school.' : 'Hacer más segura el agua de consumo para un grupo específico del colegio.',
        prototype: en ? 'Gravity filter + clarity indicator; quick user test.' : 'Filtro por gravedad + indicador de claridad; prueba rápida con usuarios.',
        metric: en ? 'Turbidity/clarity before vs after (strip/visual).' : 'Turbidez/claridad antes vs después (tira/visual).',
      },
      {
        title: en ? 'Breathe better' : 'Respirar mejor',
        need: en ? 'Reduce heat and stale air in crowded classrooms.' : 'Reducir calor y aire cargado en aulas concurridas.',
        prototype: en ? 'DIY airflow booster with recycled bottle + fan.' : 'Aumentador de flujo con botella reciclada + ventilador.',
        metric: en ? 'Temperature/airflow change in 20–30 min.' : 'Cambio de temperatura/flujo en 20–30 min.',
      },
    ],
    arquitectos: [
      {
        title: en ? 'Safe drinking water system' : 'Sistema seguro de agua potable',
        need: en ? 'Improve water safety for a defined user group at school.' : 'Mejorar la seguridad del agua para un grupo definido en el colegio.',
        prototype: en ? 'Multi-stage gravity filter + clarity and flow monitor.' : 'Filtro por etapas + indicador de claridad y caudal.',
        metric: en ? 'Turbidity/flow before vs after; user acceptance test.' : 'Turbidez/caudal antes vs después; prueba de aceptación de usuarios.',
      },
      {
        title: en ? 'Heat-smart classroom' : 'Aula térmicamente inteligente',
        need: en ? 'Control heat gain and airflow with low-cost tech.' : 'Controlar ganancia de calor y flujo de aire con tecnología de bajo costo.',
        prototype: en ? 'Ventilation panel with sensors and data log.' : 'Panel de ventilación con sensores y registro de datos.',
        metric: en ? 'Temperature and airflow logs across two tests.' : 'Registro de temperatura y flujo en dos pruebas.',
      },
    ],
  }
  return bank[bandKey] || bank.innovadores
}

// Deprecated helper removed (replaced by deterministic STEM templates)

function buildStemRoundsFromChallenge(bandKey = 'innovadores', language = 'es', challenge = {}) {
  const rounds = bandKey === 'exploradores' ? 1 : bandKey === 'arquitectos' ? 3 : 2
  const need = challenge.need || (language === 'en' ? 'Need' : 'Necesidad')
  const metric = challenge.metric || (language === 'en' ? 'Metric or quick measurement' : 'Métrica o medición rápida')
  const prototype = challenge.prototype || (language === 'en' ? 'Prototype' : 'Prototipo')
  const en = language === 'en'
  const focusTemplates = en
    ? [
        `Does "${prototype}" respond to "${need}"?`,
        `How can we improve the design based on test 1 data?`,
        `Does the improved prototype meet user needs and constraints?`,
      ]
    : [
        `¿"${prototype}" responde a "${need}"?`,
        `¿Cómo mejoramos el diseño con los datos de la prueba 1?`,
        `¿El prototipo mejorado cumple con las necesidades y restricciones?`,
      ]
  const evidenceTemplates = en
    ? [
        `Capture ${metric.toLowerCase()} with a photo/data note.`,
        `Compare test 1 vs test 2 data. Photo of the change made.`,
        `Trend table/chart across all rounds. Impact note.`,
      ]
    : [
        `Captura ${metric.toLowerCase()} con una foto/dato.`,
        `Compara datos prueba 1 vs prueba 2. Foto del cambio realizado.`,
        `Tabla/gráfico de tendencia entre rondas. Nota de impacto.`,
      ]
  const adjustTemplates = en
    ? [
        'One adjustment after the test (material, size, time).',
        'Priority adjustment based on data — what changed and why?',
        'Decide: iterate again or present? Justify with data.',
      ]
    : [
        'Un ajuste después de la prueba (material, tamaño, tiempo).',
        'Ajuste prioritario basado en datos — ¿qué cambió y por qué?',
        'Decidir: ¿iterar de nuevo o presentar? Justificar con datos.',
      ]
  return Array.from({ length: rounds }, (_, i) => ({
    focus: `${en ? 'Test' : 'Prueba'} ${i + 1}: ${focusTemplates[Math.min(i, focusTemplates.length - 1)]}`,
    evidence: evidenceTemplates[Math.min(i, evidenceTemplates.length - 1)],
    adjustment: adjustTemplates[Math.min(i, adjustTemplates.length - 1)],
  }))
}

function buildStemBandDefaults(grado = '', language = 'es', prev = {}) {
  const band = getStemBand(grado)
  if (!band) return {}
  const rounds = band.key === 'exploradores' ? 1 : band.key === 'arquitectos' ? 3 : 2
  const template = getStemTemplates(band.key, language === 'en')
  const stemRounds = Array.from({ length: rounds }, (_, i) => prev.stemRounds?.[i] || {
    focus: language === 'en'
      ? `Test ${i + 1}: does the prototype for "${template.need}" work?`
      : `Prueba ${i + 1}: ¿funciona el prototipo para "${template.need}"?`,
    evidence: language === 'en'
      ? 'Photo or data from the test (temperature, clarity, time, etc.).'
      : 'Foto o dato de la prueba (temperatura, claridad, tiempo, etc.).',
    adjustment: language === 'en'
      ? 'One concrete tweak after this test.'
      : 'Un ajuste concreto después de esta prueba.',
  })
  const maxImagenes = band.key === 'exploradores' ? 2 : band.key === 'arquitectos' ? 4 : 3
  const tiposVisual = (() => {
    if (band.key === 'exploradores') return ['Fotos de materiales / montaje']
    if (band.key === 'constructores') return ['Fotos de materiales / montaje', 'Diagramas de bloques (entrada-proceso-salida)']
    if (band.key === 'innovadores') return ['Flujograma / pasos', 'Fotos de materiales / montaje']
    return ['Tabla de conexiones (pines/componentes)', 'Capturas de pantalla (software/simulador)']
  })()
  const stemRoles = (() => {
    if (band.key === 'exploradores') return ['integracion', 'construccion', 'evidencias']
    if (band.key === 'constructores') return ['integracion', 'construccion', 'evidencias', 'tester']
    if (band.key === 'innovadores') return ['integracion', 'construccion', 'evidencias', 'tester']
    return ['integracion', 'construccion', 'evidencias', 'tester']
  })()
  const duracionSimulador = band.key === 'exploradores' ? '10–15' : band.key === 'constructores' ? '15–20' : band.key === 'innovadores' ? '20–25' : '25–30'
  const rubricaBuilder = STEM_RUBRICAS[band.key] || STEM_RUBRICAS.innovadores
  return {
    stemBand: band.key,
    stemRounds,
    maxImagenes,
    tiposVisual,
    stemRoles,
    duracionSimulador,
    rubrica: rubricaBuilder(language === 'en'),
    stemNeed: template.need,
    stemUsers: template.users,
    stemMetric: template.metric,
    stemPrototype: template.prototype,
    stemImpact: template.impact,
    stemEvidenceLink: '',
    subtemaPropio: template.need,
    subtema: {
      nombre: template.need,
      producto: template.prototype,
      evidencia: template.evidence,
      prerequisito: language === 'en'
        ? 'Team roles and safety agreements.'
        : 'Acuerdos de roles y seguridad.',
    },
  }
}

// Helper reserved for future use: keep band label/desc lookup in one place
// (lint-ignored because we may surface it in more UI spots later)
// function getStemBandLabel(grado = '', language = 'es') {
//   const band = getStemBand(grado)
//   return band ? (language === 'en' ? band.label.en : band.label.es) : ''
// }

function getLevelLabel(data = {}) {
  if (data.route === 'stem') return isEnglish(data) ? 'Suggested level' : 'Nivel sugerido'
  if (isEnglish(data)) return data.route === 'ib_myp_design' ? 'Design year' : 'Grade'
  return data.route === 'ib_myp_design' ? 'Año de diseño' : 'Grado'
}

function getLevelValue(data = {}) {
  if (data.route === 'stem') {
    const band = getStemBand(data.grado)
    const bandLabel = band ? (isEnglish(data) ? band.label.en : band.label.es) : ''
    return `${data.grado || '9°'}${bandLabel ? ` · ${bandLabel}` : ''}`
  }
  return data.route === 'ib_myp_design' ? (data.mypYear || 'Año 1') : (data.grado || '7°')
}

function translateMenText(text = '') {
  let output = String(text || '')
  const replacements = [
    ['Uso y apropiación de la tecnología y la informática', 'Use and appropriation of technology and computing'],
    ['Naturaleza y evolución de la tecnología y la informática', 'Nature and evolution of technology and computing'],
    ['Solución de problemas con tecnología e informática', 'Problem solving with technology and computing'],
    ['Tecnología, informática y sociedad', 'Technology, computing and society'],
    ['Producción digital con herramientas de ofimática', 'Digital production with office productivity tools'],
    ['herramientas de ofimática', 'office productivity tools'],
    ['tecnología e informática', 'technology and computing'],
    ['tecnología', 'technology'],
    ['informática', 'computing'],
    ['Producción digital', 'Digital production'],
    ['producción digital', 'digital production'],
    ['tema escolar', 'school topic'],
    ['Documento', 'Document'],
    ['presentación', 'presentation'],
    ['hoja de cálculo', 'spreadsheet'],
    ['evidencia', 'evidence'],
    ['producto', 'product'],
    ['proyecto', 'project'],
    ['escolar', 'school'],
  ]
  replacements.forEach(([source, target]) => {
    output = output.replaceAll(source, target)
  })
  return output
}

function getLocalizedSubtema(data = {}) {
  if (!data?.subtema) return data?.subtema || null
  if (!isEnglish(data) || data.route === 'ib_myp_design') return data.subtema
  return {
    ...data.subtema,
    nombre: translateMenText(data.subtema.nombre),
    producto: translateMenText(data.subtema.producto),
    evidencia: translateMenText(data.subtema.evidencia),
    prerequisito: translateMenText(data.subtema.prerequisito),
  }
}

function getFrameworkValue(data = {}) {
  if (data.route === 'ib_myp_design') return 'Diseño Escolar'
  if (data.route === 'stem') return 'STEM / STEAM'
  const label = MEN_COMPONENTES.find((c) => c.id === data.componente)?.label || ''
  return isEnglish(data) ? translateMenText(label) : label
}

function getCurriculumBadge(data = {}) {
  if (data.route === 'ib_myp_design') return 'Diseño Escolar'
  if (data.route === 'stem') return 'STEM / STEAM Plus'
  return isEnglish(data) ? 'MEN Technology and Computing' : 'Tecnologia e Informatica MEN'
}

function getSourceLabel(data = {}) {
  if (data.route === 'ib_myp_design') return 'Diseño Escolar'
  if (data.route === 'stem') return 'STEM / STEAM plus'
  return isEnglish(data) ? 'MEN Technology and Computing 2022' : 'MEN Colombia 2022'
}

function buildDefaultRubrica(route = 'men', language = 'es') {
  const en = language === 'en'

  if (route === 'stem') {
    return {
      escala: 4,
      criterios: [
        {
          nombre: en ? 'Interdisciplinary integration' : 'Integración interdisciplinaria',
          pct: 25,
          s: en ? 'Connects science, technology, engineering, arts and math with clear roles.' : 'Conecta ciencia, tecnología, ingeniería, artes y matemáticas con roles claros.',
          a: en ? 'Links at least three areas with partial roles.' : 'Vincula al menos tres áreas con roles parciales.',
          b: en ? 'Mentions areas but without integration or roles.' : 'Menciona áreas pero sin integración ni roles.',
          l: en ? 'No real integration between areas.' : 'No hay integración real entre áreas.',
        },
        {
          nombre: en ? 'Challenge and prototype' : 'Reto y prototipo',
          pct: 25,
          s: en ? 'Problem is authentic; prototype works and responds to the need.' : 'Problema auténtico; el prototipo funciona y responde a la necesidad.',
          a: en ? 'Prototype addresses part of the need; minor faults.' : 'Prototipo responde parcialmente; fallos menores.',
          b: en ? 'Prototype exists but does not solve the need.' : 'Hay prototipo pero no resuelve la necesidad.',
          l: en ? 'No prototype or unrelated product.' : 'Sin prototipo o producto no relacionado.',
        },
        {
          nombre: en ? 'Evidence and testing' : 'Evidencias y pruebas',
          pct: 25,
          s: en ? 'Complete log: photos, tests with users, data and adjustments.' : 'Bitácora completa: fotos, pruebas con usuarios, datos y ajustes.',
          a: en ? 'Evidence covers process and at least one round of testing.' : 'Evidencias cubren proceso y al menos una ronda de pruebas.',
          b: en ? 'Evidence is incomplete or lacks tests.' : 'Evidencias incompletas o sin pruebas.',
          l: en ? 'No documented evidence.' : 'No hay evidencias documentadas.',
        },
        {
          nombre: en ? 'Reflection and next steps' : 'Reflexión y siguientes pasos',
          pct: 25,
          s: en ? 'Identifies impact, inclusion and sustainability; proposes concrete improvements.' : 'Identifica impacto, inclusión y sostenibilidad; propone mejoras concretas.',
          a: en ? 'Reflects on impact or inclusion; improvements partially defined.' : 'Reflexiona sobre impacto o inclusión; mejoras parcialmente definidas.',
          b: en ? 'Reflection is superficial; no clear improvements.' : 'Reflexión superficial; sin mejoras claras.',
          l: en ? 'No reflection or next steps.' : 'Sin reflexión ni siguientes pasos.',
        },
      ],
    }
  }

  if (route === 'ib_myp_design') {
    if (en) {
      return {
        escala: 5,
        criterios: [
          {
            nombre: 'Understanding of problem and context',
            pct: 25,
            s: 'Defines the need, user and constraints with clarity',
            a: 'Recognizes the need and most conditions of the challenge',
            b: 'Identifies only part of the problem or context',
            l: 'Cannot explain the problem or context clearly',
          },
          {
            nombre: 'Quality of the design solution',
            pct: 35,
            s: 'The solution is relevant, functional and shows strong design decisions',
            a: 'The solution responds to the challenge with minor adjustments needed',
            b: 'The solution responds only partially or shows major weaknesses',
            l: 'The solution does not respond to the challenge or is incomplete',
          },
          {
            nombre: 'Justification and improvement',
            pct: 25,
            s: 'Explains decisions, tests and improvements with clear reasoning',
            a: 'Describes decisions and some improvements made during the process',
            b: 'Mentions decisions or improvements without enough support',
            l: 'Does not justify decisions or propose improvements',
          },
          {
            nombre: 'Documentation and collaboration',
            pct: 15,
            s: 'Documents the process with complete evidence and collaborates actively',
            a: 'Documents most of the process and participates consistently',
            b: 'Provides partial evidence or collaborates irregularly',
            l: 'Does not document the process or shows minimal participation',
          },
        ],
      }
    }

    return {
      escala: 5,
      criterios: [
        {
          nombre: 'Comprensión del problema y contexto',
          pct: 25,
          s: 'Define con claridad la necesidad, el usuario y las restricciones del reto',
          a: 'Reconoce la necesidad y la mayoría de las condiciones del reto',
          b: 'Identifica parcialmente el problema o el contexto',
          l: 'No logra explicar con claridad el problema o el contexto',
        },
        {
          nombre: 'Calidad de la solución de diseño',
          pct: 35,
          s: 'La solución es pertinente, funcional y muestra decisiones de diseño bien resueltas',
          a: 'La solución responde al reto y funciona con algunos ajustes menores',
          b: 'La solución responde solo parcialmente al reto o presenta fallas importantes',
          l: 'La solución no responde al reto o queda incompleta',
        },
        {
          nombre: 'Justificación y mejora',
          pct: 25,
          s: 'Explica decisiones, pruebas y mejoras con argumentos claros',
          a: 'Describe decisiones y algunas mejoras realizadas durante el proceso',
          b: 'Menciona decisiones o mejoras sin suficiente sustento',
          l: 'No justifica decisiones ni plantea mejoras',
        },
        {
          nombre: 'Documentación y colaboración',
          pct: 15,
          s: 'Documenta el proceso con evidencias completas y colabora activamente',
          a: 'Documenta la mayor parte del proceso y participa de manera constante',
          b: 'Entrega evidencias parciales o la colaboración es irregular',
          l: 'No documenta el proceso o la participación es mínima',
        },
      ],
    }
  }

  if (en) {
    return {
      escala: 5,
      criterios: [
        { nombre: 'Understanding of the challenge', pct: 25, s: 'Explains the problem and proposed solution precisely', a: 'Explains the problem; solution is partially clear', b: 'Identifies the problem but not a clear solution', l: 'Does not understand the challenge' },
        { nombre: 'Quality of the product', pct: 35, s: 'Meets all requirements; functional and well presented', a: 'Meets most requirements', b: 'Meets only basic requirements', l: 'Incomplete or missing product' },
        { nombre: 'Documented evidence', pct: 25, s: 'Provides process photos and a complete reflection', a: 'Provides photos and a partial reflection', b: 'Provides only photos or only reflection', l: 'Provides no evidence' },
        { nombre: 'Teamwork', pct: 15, s: 'Active and balanced participation', a: 'Most members participated actively', b: 'Uneven participation', l: 'Only one member worked' },
      ],
    }
  }

  return {
    escala: 5,
    criterios: [
      { nombre: 'Comprensión del reto', pct: 25, s: 'Explica con precisión el problema y la solución propuesta', a: 'Explica el problema; solución parcialmente clara', b: 'Identifica el problema pero sin solución clara', l: 'No comprende el reto' },
      { nombre: 'Calidad del producto', pct: 35, s: 'Cumple todos los requisitos; es funcional y bien presentado', a: 'Cumple la mayoría de los requisitos', b: 'Cumple requisitos básicos', l: 'Producto incompleto o no entregado' },
      { nombre: 'Evidencias documentadas', pct: 25, s: 'Entrega fotos del proceso + reflexión completa', a: 'Fotos + reflexión parcial', b: 'Solo fotos o solo reflexión', l: 'No entrega evidencias' },
      { nombre: 'Trabajo en equipo', pct: 15, s: 'Participación activa y equitativa', a: 'Mayoría participó activamente', b: 'Participación desigual', l: 'Solo trabajó un integrante' },
    ],
  }
}

function normalizeKitData(data = {}) {
  const route = data.route || 'men'
  const language = data.language || 'es'
  const normalized = {
    ...INITIAL,
    ...data,
    route,
    language,
    rubrica: data.rubrica?.criterios?.length ? data.rubrica : buildDefaultRubrica(route, language),
  }

  if (route === 'ib_myp_design') {
    normalized.subtema = buildIBSubtemaFromData(normalized)
  }

  return normalized
}

function buildStemPreset(language = 'es') {
  const en = language === 'en'
  const defaultGrade = '9°'
  const bandDefaults = buildStemBandDefaults(defaultGrade, language, {})

  const pasos = en
    ? {
      paso1: 'Purpose and integration: define the authentic need, users, areas involved (science, technology, engineering, arts, math) and the impact on inclusion/sustainability.',
      paso2: 'Challenge: Improve a real situation (e.g., water quality, air flow, energy use at school). State success criteria and minimal viable prototype.',
      paso3: 'Materials and constraints: reusable materials, sensors/phones if available, time 4–6 weeks, 3h/week; accessibility requirements for all roles.',
      paso4: 'Teacher guide: plan inquiry → design → build → test → iterate. Schedule two testing checkpoints with users and short feedback forms.',
      paso5: 'Student guide: choose roles (integration lead, builder, evidence lead, tester); document questions, sketches, tests and improvements; keep bilingual captions for evidence.',
      paso6: 'Unified rubric: integration, prototype quality, evidence/testing, reflection/next steps (see rubric table). Evidence must include at least 2 test rounds.',
      paso7: 'Package and share: upload photos, data sheets and 2-minute demo video; include family summary and access link to evidence folder.',
    }
    : {
      paso1: 'Propósito e integración: definir la necesidad auténtica, usuarios, áreas implicadas (ciencia, tecnología, ingeniería, artes, matemáticas) e impacto en inclusión/sostenibilidad.',
      paso2: 'Reto: Mejorar una situación real (ej. calidad del agua, ventilación, uso de energía en el colegio). Declarar criterios de éxito y prototipo mínimo viable.',
      paso3: 'Materiales y restricciones: materiales reutilizables, sensores/celulares si existen, tiempo 4–6 semanas, 3 h/semana; requisitos de accesibilidad para todos los roles.',
      paso4: 'Guía docente: planear indagación → diseño → construcción → prueba → iteración. Agendar dos paradas de prueba con usuarios y retroalimentación breve.',
      paso5: 'Guía estudiante: elegir roles (integración, construcción, evidencias, pruebas); documentar preguntas, bocetos, pruebas y mejoras; mantener rótulos bilingües en evidencias.',
      paso6: 'Rúbrica unificada: integración, calidad del prototipo, evidencias/pruebas, reflexión y siguientes pasos (ver tabla). Evidencia mínima: 2 rondas de pruebas.',
      paso7: 'Empaque y compartido: subir fotos, hojas de datos y video demo de 2 minutos; incluir resumen para familias y enlace a carpeta de evidencias.',
    }

  return {
    route: 'stem',
    language,
    grado: defaultGrade,
    mypYear: 'Año 1',
    componente: 'solucion',
    competencia: en ? 'STEM / STEAM interdisciplinary integration' : 'Integración interdisciplinaria STEM / STEAM',
    duracionProyecto: en ? '4-6 weeks' : '4–6 semanas',
    duracionSimulador: bandDefaults.duracionSimulador || '15–20',
    recursos: en ? 'Reusable materials, mobile devices, internet, shared evidence folder.' : 'Materiales reutilizables, dispositivos móviles, internet, carpeta compartida de evidencias.',
    restricciones: en ? '3h/week, limited budget, universal access required.' : '3 h/semana, presupuesto limitado, acceso universal obligatorio.',
    stemAreas: ['science', 'technology', 'engineering', 'math'],
    paso1: pasos.paso1,
    paso2: pasos.paso2,
    paso3: pasos.paso3,
    paso4: pasos.paso4,
    paso5: pasos.paso5,
    paso6: pasos.paso6,
    paso7: pasos.paso7,
    stemEvidenceLink: '',
    ...bandDefaults,
    rubrica: bandDefaults.rubrica || buildDefaultRubrica('stem', language),
  }
}

function getRubricaForData(data = {}) {
  if (data.route === 'stem') {
    const band = getStemBand(data.grado)
    const bandKey = data.stemBand || band?.key || 'innovadores'
    return data.rubrica?.criterios?.length ? data.rubrica : getStemRubrica(bandKey, data.language)
  }
  return data.rubrica || buildDefaultRubrica(data.route, data.language)
}

function buildIBSubtemaFromData(data = {}) {
  const nombre = buildIBChallengeTitle(data) || data.subtema?.nombre || ''
  if (!nombre) return null
  return {
    nombre,
    producto: data.ibOutcome?.trim() || data.subtema?.producto || '[definir producto, prototipo o sistema]',
    evidencia: data.ibEvidence?.trim() || data.subtema?.evidencia || '[definir evidencia del proceso y de la solución]',
    prerequisito: data.ibPrereq?.trim() || data.subtema?.prerequisito || '[definir conocimientos o habilidades previas]',
  }
}

function getIBLabel(item, en = false) {
  return en ? item?.label : item?.labelEs
}

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function matchesAnyKeyword(value, keywords = []) {
  const source = normalizeSearchText(value)
  return keywords.some((keyword) => source.includes(normalizeSearchText(keyword)))
}

function hasMeaningfulText(value, min = 12) {
  return String(value || '').trim().length >= min
}

function shortenPhrase(value, max = 80) {
  const text = String(value || '').trim().replace(/[.?!]+$/g, '')
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max - 1).trim()}…` : text
}

function buildIBSupport(data = {}) {
  const en = isEnglish(data)
  const criterion = IB_DESIGN_CRITERIA.find((item) => item.id === data.ibCriterion) || IB_DESIGN_CRITERIA[0]
  const context = IB_GLOBAL_CONTEXTS.find((item) => item.id === data.ibGlobalContext) || IB_GLOBAL_CONTEXTS[3]
  const keyConcept = IB_KEY_CONCEPTS.find((item) => item.id === data.ibKeyConcept) || IB_KEY_CONCEPTS[3]
  const relatedConcept = IB_RELATED_CONCEPTS.find((item) => item.id === data.ibRelatedConcept) || IB_RELATED_CONCEPTS[2]
  const need = data.ibNeed?.trim() || (en ? 'a relevant design need in the learning context' : 'una necesidad de diseño relevante en el contexto de aprendizaje')
  const outcome = data.ibOutcome?.trim() || (en ? 'a feasible solution' : 'una solución viable')

  const focus = en
    ? `${criterion.label}: ${criterion.title} · ${context.label} · ${keyConcept.label} + ${relatedConcept.label}`
    : `${criterion.labelEs}: ${criterion.titleEs} · ${context.labelEs} · ${keyConcept.labelEs} + ${relatedConcept.labelEs}`
  const inquiry = en
    ? `How can students design ${outcome} in response to ${need}, considering ${keyConcept.label.toLowerCase()} and ${relatedConcept.label.toLowerCase()} within ${context.label}?`
    : `¿Cómo pueden los estudiantes diseñar ${outcome} en respuesta a ${need}, considerando ${keyConcept.labelEs.toLowerCase()} y ${relatedConcept.labelEs.toLowerCase()} dentro de ${context.labelEs}?`
  const brief = en
    ? `Students inquire into the situation, develop ideas and create ${outcome} to respond to ${need}.`
    : `Los estudiantes indagan la situación, desarrollan ideas y crean ${outcome} para responder a ${need}.`

  return { criterion, context, keyConcept, relatedConcept, focus, inquiry, brief }
}

function buildIBChallengeTitle(data = {}) {
  const en = isEnglish(data)
  const support = buildIBSupport(data)
  const need = shortenPhrase(data.ibNeed, 72)
  const outcome = shortenPhrase(data.ibOutcome, 56)
  const contextLabel = getIBLabel(support.context, en)
  if (!need || !outcome) return ''
  return en
    ? `Design ${outcome.toLowerCase()} for ${contextLabel.toLowerCase()} in response to ${need.toLowerCase()}`
    : `Diseñar ${outcome.toLowerCase()} para ${contextLabel.toLowerCase()} en respuesta a ${need.toLowerCase()}`
}

function buildIBCoherenceReport(data = {}) {
  const en = isEnglish(data)
  const support = buildIBSupport(data)
  const guide = IB_CRITERION_GUIDANCE[data.ibCriterion] || IB_CRITERION_GUIDANCE.A
  const contextLabel = getIBLabel(support.context, en)
  const keyLabel = getIBLabel(support.keyConcept, en)
  const relatedLabel = getIBLabel(support.relatedConcept, en)
  const recommendedNeed = en
    ? `Design a response to a real need connected to ${contextLabel.toLowerCase()}, making ${keyLabel.toLowerCase()} and ${relatedLabel.toLowerCase()} visible in the decision-making process.`
    : `Diseñar una respuesta a una necesidad real vinculada con ${contextLabel.toLowerCase()}, haciendo visible ${keyLabel.toLowerCase()} y ${relatedLabel.toLowerCase()} en la toma de decisiones.`
  const recommendedOutcome = en
    ? `${guide.outcome} for ${data.mypYear || 'Año 1'}`
    : `${guide.outcomeEs} para ${data.mypYear || 'Año 1'}`
  const recommendedEvidence = en
    ? `${guide.evidence}.`
    : `${guide.evidenceEs}.`

  const issues = []
  if (data.ibOutcome?.trim() && !hasMeaningfulText(data.ibOutcome)) {
    issues.push({
      field: 'outcome',
      severity: 'high',
      message: en
        ? 'Try expanding the outcome — describe the product, prototype or system your students will create.'
        : 'Intenta ampliar el producto — describe el prototipo o sistema que tus estudiantes van a crear.',
    })
  }
  if (data.ibOutcome?.trim() && !matchesAnyKeyword(data.ibOutcome, guide.outcomeKeywords)) {
    issues.push({
      field: 'outcome',
      severity: 'medium',
      message: en
        ? `Tip: try including a word like "prototype", "product" or "system" to align better with ${support.criterion.label}.`
        : `Sugerencia: incluye una palabra como "prototipo", "producto" o "sistema" para alinearte mejor con ${support.criterion.labelEs}.`,
    })
  }
  if (data.ibEvidence?.trim() && !hasMeaningfulText(data.ibEvidence)) {
    issues.push({
      field: 'evidence',
      severity: 'high',
      message: en
        ? 'Try expanding the evidence — mention process photos, testing data or a short reflection.'
        : 'Intenta ampliar la evidencia — menciona fotos del proceso, datos de pruebas o una reflexión breve.',
    })
  }
  if (data.ibEvidence?.trim() && !matchesAnyKeyword(data.ibEvidence, guide.evidenceKeywords)) {
    issues.push({
      field: 'evidence',
      severity: 'medium',
      message: en
        ? 'Consider adding words like "test", "photo", "prototype" or "adjustment" to strengthen the evidence.'
        : 'Considera agregar palabras como "prueba", "foto", "prototipo" o "ajuste" para fortalecer la evidencia.',
    })
  }
  if (data.ibNeed?.trim() && data.ibNeed.trim().length < 18) {
    issues.push({
      field: 'need',
      severity: 'medium',
      message: en
        ? 'The need could be more specific — try describing who is affected and what the concrete problem is.'
        : 'La necesidad podría ser más específica — intenta describir a quién afecta y cuál es el problema concreto.',
    })
  }

  return {
    support,
    guide,
    recommendedNeed,
    recommendedOutcome,
    recommendedEvidence,
    issues,
    blockers: issues.filter((item) => item.severity === 'high'),
  }
}

function buildIBFieldSuggestions(data = {}) {
  const en = isEnglish(data)
  const support = buildIBSupport(data)
  const coherence = buildIBCoherenceReport(data)
  const contextLabel = getIBLabel(support.context, en)
  const keyLabel = getIBLabel(support.keyConcept, en)
  const relatedLabel = getIBLabel(support.relatedConcept, en)

  if (en) {
    return {
      need: [
        coherence.recommendedNeed,
        `Students need to improve a classroom experience connected to ${contextLabel.toLowerCase()}.`,
        `A school user needs a better solution related to ${keyLabel.toLowerCase()} and ${relatedLabel.toLowerCase()}.`,
        'The current situation creates a usability or organization problem that can be addressed through design.',
      ],
      outcome: [
        coherence.recommendedOutcome,
        'Functional prototype with clear user purpose',
        'Improved product or system proposal with annotated design decisions',
        'Testable solution model ready for feedback and refinement',
      ],
      evidence: [
        coherence.recommendedEvidence,
        'Annotated research notes, idea comparison and justified final choice',
        'Sketches, prototype photos, testing notes and evaluation reflection',
        'Brief presentation explaining user, function, constraints and improvement',
      ],
      prereq: [
        'Basic sketching and idea communication',
        'Simple measurement, planning and collaborative work',
        'Ability to observe needs, compare options and explain decisions',
      ],
    }
  }

  return {
    need: [
      coherence.recommendedNeed,
      `Los estudiantes deben mejorar una experiencia de aula vinculada con ${contextLabel.toLowerCase()}.`,
      `Un usuario escolar necesita una mejor solución relacionada con ${keyLabel.toLowerCase()} y ${relatedLabel.toLowerCase()}.`,
      'La situación actual genera un problema de uso, organización o funcionamiento que puede abordarse desde el diseño.',
    ],
    outcome: [
      coherence.recommendedOutcome,
      'Prototipo funcional con propósito claro para el usuario',
      'Propuesta de producto o sistema mejorado con decisiones de diseño anotadas',
      'Modelo de solución listo para recibir retroalimentación y ajustes',
    ],
    evidence: [
      coherence.recommendedEvidence,
      'Notas de indagación, comparación de ideas y justificación de la decisión final',
      'Bocetos, fotos del prototipo, registro de pruebas y reflexión de evaluación',
      'Presentación breve que explique usuario, función, restricciones y mejora propuesta',
    ],
    prereq: [
      'Bocetación básica y comunicación de ideas',
      'Medición simple, planificación y trabajo colaborativo',
      'Capacidad para observar necesidades, comparar opciones y explicar decisiones',
    ],
  }
}

function buildIBProposalPrompt(data = {}) {
  const en = isEnglish(data)
  const support = buildIBSupport(data)
  const coherence = buildIBCoherenceReport(data)
  return en
    ? `You are a school design cycle curriculum assistant. Based on the information below, generate exactly 3 classroom-ready design brief proposals for a teacher.\n\nReturn ONLY valid JSON with this shape:\n{"proposals":[{"title":"","need":"","outcome":"","evidence":"","prereq":"","rationale":""}]}\n\nRules:\n- Each proposal must be different and usable in school context.\n- Keep the language concise and teacher-facing.\n- Align with ${support.focus}.\n- Guiding inquiry: ${support.inquiry}\n- Suggested brief: ${support.brief}\n- Criterion coherence: the outcome should reflect ${coherence.guide.objective}, and the evidence should show ${coherence.guide.evidence}.\n- If current inputs are weak or incoherent, correct them instead of repeating them.\n- Design year: ${data.mypYear || 'Año 1'}\n- Route: Diseño Escolar\n- Language: English\n\nCurrent inputs:\n- Need/problem: ${data.ibNeed || '[not defined]'}\n- Expected product/system: ${data.ibOutcome || '[not defined]'}\n- Evidence: ${data.ibEvidence || '[not defined]'}\n- Prior knowledge: ${data.ibPrereq || '[not defined]'}`
    : `Actua como asistente curricular de Diseño Escolar. Con base en la informacion siguiente, genera exactamente 3 propuestas de brief de diseño listas para aula.\n\nDevuelve SOLO JSON valido con esta estructura:\n{"proposals":[{"title":"","need":"","outcome":"","evidence":"","prereq":"","rationale":""}]}\n\nReglas:\n- Cada propuesta debe ser distinta y usable en contexto escolar.\n- Usa lenguaje breve y util para docentes.\n- Alinea las propuestas con ${support.focus}.\n- Pregunta orientadora: ${support.inquiry}\n- Formulacion sugerida: ${support.brief}\n- Coherencia con el criterio: el producto debe responder a ${coherence.guide.objectiveEs}, y la evidencia debe mostrar ${coherence.guide.evidenceEs}.\n- Si las entradas actuales son debiles o incoherentes, corrigelas en lugar de repetirlas.\n- Año de diseño: ${data.mypYear || 'Año 1'}\n- Ruta: Diseño Escolar\n- Idioma: Espanol\n\nEntradas actuales:\n- Necesidad/problema: ${data.ibNeed || '[sin definir]'}\n- Producto/sistema esperado: ${data.ibOutcome || '[sin definir]'}\n- Evidencia: ${data.ibEvidence || '[sin definir]'}\n- Prerrequisitos: ${data.ibPrereq || '[sin definir]'}`
}

function parseAIProposalResponse(raw) {
  const source = String(raw || '').trim()
  if (!source) return []
  const fenced = source.match(/```json\s*([\s\S]*?)```/i)
  const jsonText = fenced?.[1]?.trim() || source
  try {
    const parsed = JSON.parse(jsonText)
    const proposals = Array.isArray(parsed) ? parsed : parsed?.proposals
    if (!Array.isArray(proposals)) return []
    return proposals.filter(Boolean).slice(0, 3)
  } catch {
    return []
  }
}

const TIPOS_VISUAL = [
  'Fotos de materiales / montaje',
  'Diagramas de bloques (entrada-proceso-salida)',
  'Flujograma / pasos',
  'Tabla de conexiones (pines/componentes)',
  'Capturas de pantalla (software/simulador)',
  'Ejemplos de producto final',
]

const STEP_LABELS = [
  '', // 0 = welcome
  'Bloque A · Institución',
  'Bloque B · Currículo',
  'Bloque C · Recursos',
  'Bloque D · Visual',
  'PASO 0 · Subtema',
  'PASO 1 · Alineación',
  'PASO 2 · Reto',
  'PASO 3 · Materiales',
  'PASO 4 · Guía docente',
  'PASO 5 · Guía estudiante',
  'PASO 6 · Rúbrica',
  'PASO 7 · Empaque',
  'Kit completo',
]

// ─── Utilities ───────────────────────────────────────────────────────────────
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

function safeLang(v) {
  return v === 'en' ? 'en' : 'es'
}

// ─── localStorage ────────────────────────────────────────────────────────────
const LS_KEY = 'mm_kitdocente_v1'
function lsGetKits() {
  try { return (JSON.parse(localStorage.getItem(LS_KEY) || '[]')).filter(k => k?.id && k?.preview) } catch { return [] }
}
function lsSaveKit(uid, step, data) {
  const kits = lsGetKits()
  const idx = kits.findIndex((k) => k.id === uid)
  const prev = idx >= 0 ? kits[idx] : null
  const entry = {
    id: uid,
    createdAt: prev?.createdAt || new Date().toISOString(),
    savedAt: new Date().toISOString(),
    step,
    preview: {
      institucion: data.institucion || '(sin institución)',
      docente: data.docente || '',
      route: getRouteMeta(data.route).shortLabel,
      grado: getLevelValue(data),
      subtema: data.subtema?.nombre || '(subtema pendiente)',
    },
    data,
  }
  if (idx >= 0) kits[idx] = entry
  else kits.unshift(entry)
  try { localStorage.setItem(LS_KEY, JSON.stringify(kits.slice(0, 8))) } catch { }
}
function lsDeleteKit(id) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(lsGetKits().filter((k) => k.id !== id))) } catch { }
}

function getExportBlockers(data, mode = 'full') {
  const blockers = []

  if (!data.subtema?.nombre) blockers.push({ paso: 5, label: 'Falta subtema del proyecto.' })

  const guia = ensureStudentGuideContent(data.paso5 || gen5(data), data)
  if (!guia.trim()) blockers.push({ paso: 10, label: 'Falta guía del estudiante (PASO 5).' })

  if (!(data.rubrica?.criterios?.length > 0)) blockers.push({ paso: 11, label: 'Falta rúbrica de evaluación (PASO 6).' })

  if (mode !== 'student') {
    if (!data.institucion?.trim()) blockers.push({ paso: 1, label: 'Falta institución.' })
    if (!data.docente?.trim()) blockers.push({ paso: 1, label: 'Falta nombre del docente.' })
    if (!(data.paso2 || gen2(data)).trim()) blockers.push({ paso: 7, label: 'Falta reto del proyecto (PASO 2).' })
  }

  return blockers
}

function getInstitutionMetrics(kits) {
  const total = kits.length
  if (!total) return { total: 0, avgMin: 0, pctCompleto: 0 }

  const avgMin = Math.round(kits.reduce((acc, k) => {
    const start = new Date(k.createdAt || k.savedAt).getTime()
    const end = new Date(k.savedAt || k.createdAt).getTime()
    const elapsedMs = Math.max(0, end - start)
    // For migrated/short sessions avoid misleading 0 when there was actual work.
    const min = elapsedMs > 0 ? Math.ceil(elapsedMs / 60000) : ((k.step || 0) > 1 ? 1 : 0)
    return acc + min
  }, 0) / total)

  const completos = kits.filter((k) => {
    const d = k.data || {}
    const tieneGuia = !!ensureStudentGuideContent(d.paso5 || gen5(d), d).trim()
    const tieneRubrica = (d.rubrica?.criterios?.length || 0) > 0
    return tieneGuia && tieneRubrica
  }).length
  const pctCompleto = Math.round((completos / total) * 100)
  return { total, avgMin, pctCompleto }
}

// ─── Puntuación pedagógica ───────────────────────────────────────────────────
function calcScore(data) {
  const en = isEnglish(data)
  const copy = (es, english) => (en ? english : es)
  const checks = [
    { key: 'institution', ok: !!data.institucion?.trim(), pts: 8, label: copy('Institución definida', 'Institution set') },
    { key: 'teacher', ok: !!data.docente?.trim(), pts: 7, label: copy('Docente identificado', 'Teacher identified') },
    {
      key: 'framework',
      ok: !!(data.route === 'ib_myp_design' ? data.mypYear : data.route === 'stem' ? data.stemBand : data.componente),
      pts: 10,
      label: data.route === 'ib_myp_design'
        ? copy('Marco de diseño definido', 'Design framework set')
        : data.route === 'stem'
          ? copy('Banda STEM seleccionada', 'STEM band selected')
          : copy('Componente MEN seleccionado', 'MEN component selected'),
    },
    {
      key: 'competency',
      ok: !!data.competencia?.trim(),
      pts: 15,
      label: data.route === 'ib_myp_design'
        ? copy('Objetivo o foco de diseño declarado', 'Design objective or focus stated')
        : copy('Competencia curricular declarada', 'Curricular competency stated'),
    },
    { key: 'duration', ok: !!data.duracionProyecto?.trim(), pts: 8, label: copy('Duración del proyecto definida', 'Project duration set') },
    { key: 'context', ok: !!data.restricciones?.trim(), pts: 7, label: copy('Contexto real documentado (restricciones)', 'Real context documented (constraints)') },
    {
      key: 'challenge',
      ok: !!data.subtema?.nombre,
      pts: 15,
      label: data.route === 'ib_myp_design'
        ? copy('Reto de diseño definido', 'Design challenge defined')
        : copy('Subtema curricular seleccionado', 'Curricular topic selected'),
    },
    { key: 'steps12', ok: !!(data.paso1?.trim() && data.paso2?.trim()), pts: 10, label: copy('PASO 1 y 2 aprobados', 'STEP 1 and 2 completed') },
    { key: 'steps34', ok: !!(data.paso3?.trim() && data.paso4?.trim()), pts: 10, label: copy('PASO 3 y 4 aprobados', 'STEP 3 and 4 completed') },
    { key: 'steps56', ok: !!(data.paso5?.trim() && data.paso6?.trim()), pts: 10, label: copy('Guía del estudiante y rúbrica aprobadas', 'Student workbook and rubric completed') },
    { key: 'checkpoints', ok: !!(data.checkpoints?.cp1?.some(v => v) || data.checkpoints?.cp2?.some(v => v)), pts: 0, label: copy('Puntos de chequeo formativo incluidos', 'Formative checkpoints included'), formative: true },
  ]
  const score = checks.reduce((s, c) => s + (c.ok ? c.pts : 0), 0)
  return { score, pending: checks.filter((c) => !c.ok) }
}

// ─── NEE — Necesidades Educativas Especiales ─────────────────────────────────
const NEE_TIPOS = [
  {
    id: 'visual', label: 'Discapacidad visual', icon: '👁️', color: 'bg-blue-50 border-blue-200 text-blue-800',
    adaptaciones: (s) => [
      `Imprime las instrucciones del reto "${s}" en fuente grande (mínimo 18 pt) o en braille si dispones del recurso.`,
      'Describe verbalmente cada paso y material antes de iniciar la actividad.',
      'Asigna un par-apoyo que lea en voz alta las guías del estudiante.',
      'Usa materiales táctiles siempre que sea posible para representar el producto final.',
    ],
  },
  {
    id: 'auditiva', label: 'Discapacidad auditiva', icon: '👂', color: 'bg-purple-50 border-purple-200 text-purple-800',
    adaptaciones: (s) => [
      `Para el proyecto "${s}", entrega instrucciones escritas paso a paso y apóyate en pictogramas.`,
      'Usa intérprete de lengua de señas colombiana (LSC) o subtítulos en los videos que proyectes.',
      'Mantén contacto visual al hablar y ubica al estudiante en la primera fila.',
      'Refuerza cada explicación oral con un apoyo visual en el tablero o pantalla.',
    ],
  },
  {
    id: 'motriz', label: 'Discapacidad motriz', icon: '♿', color: 'bg-green-50 border-green-200 text-green-800',
    adaptaciones: (s) => [
      `Adapta el espacio físico para el proyecto "${s}": asegura accesibilidad a todos los materiales desde la posición del estudiante.`,
      'Permite el uso de software de apoyo (dictado por voz, teclado adaptado) si la actividad requiere escritura.',
      'Asigna roles dentro del grupo que se ajusten a las capacidades motrices del estudiante.',
      'Amplía los tiempos de entrega y considera evidencias orales en lugar de escritas cuando sea pertinente.',
    ],
  },
  {
    id: 'cognitiva', label: 'Discapacidad cognitiva', icon: '🧠', color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    adaptaciones: (s) => [
      `Divide el reto "${s}" en micro-tareas con instrucciones de un solo paso a la vez.`,
      'Usa pictogramas, colores y organizadores gráficos para representar la secuencia del proyecto.',
      'Ajusta el nivel del producto esperado sin excluir al estudiante de la actividad grupal.',
      'Refuerza positivamente cada avance y reduce la cantidad de criterios de la rúbrica a evaluar.',
    ],
  },
  {
    id: 'talentos', label: 'Talentos excepcionales', icon: '⭐', color: 'bg-amber-50 border-amber-200 text-amber-800',
    adaptaciones: (s) => [
      `Diseña un reto ampliado para el proyecto "${s}": mayor complejidad técnica, investigación adicional o conexión con otra área.`,
      'Asigna el rol de par-tutor o líder técnico del equipo.',
      'Propón un producto de extensión (prototipo más avanzado, presentación a otro grado, artículo corto).',
      'Conecta la actividad con competencias de nivel superior según el marco de Altas Capacidades del MEN.',
    ],
  },
  {
    id: 'psicosocial', label: 'Barreras psicosociales', icon: '💙', color: 'bg-rose-50 border-rose-200 text-rose-800',
    adaptaciones: (s) => [
      `Antes de iniciar "${s}", realiza una pausa activa o rutina de bienestar para reducir la ansiedad grupal.`,
      'Ofrece la opción de trabajo individual o en pareja antes de integrar al estudiante en grupo grande.',
      'Acuerda señales discretas de autorregulación (tarjeta de pausa, señal con la mano) para momentos de crisis.',
      'Comunica previamente los cambios de rutina y los criterios de evaluación para reducir la incertidumbre.',
    ],
  },
]

// ─── Rutas de aprendizaje ────────────────────────────────────────────────────
const RUTAS_MAP = {
  institution: {
    paso: 1,
    accion: { es: 'Bloque A · campo 1', en: 'Block A · field 1' },
    tip: { es: 'El encabezado institucional le da credibilidad al kit ante directivos y familias.', en: 'The institutional heading gives the kit credibility for leadership teams and families.' },
  },
  teacher: {
    paso: 1,
    accion: { es: 'Bloque A · campo 4', en: 'Block A · field 4' },
    tip: { es: 'Firma el kit como autor/a para reutilizarlo y compartirlo con colegas.', en: 'Add the teacher name so the kit can be reused and shared with colleagues.' },
  },
  framework: {
    paso: 2,
    accion: {
      es: 'Bloque B · campo 6',
      en: 'Block B · field 6',
      ibEs: 'Bloque B · ruta curricular y año de diseño',
      ibEn: 'Block B · curricular route and design year',
    },
    tip: {
      es: 'El componente alinea todo el kit con las Orientaciones Curriculares MEN 2022.',
      en: 'The selected component aligns the whole kit with the MEN Curriculum Guidelines 2022.',
      ibEs: 'La ruta de diseño y el año organizan todo el kit desde la lógica del ciclo de diseño.',
      ibEn: 'The design route and year organise the whole kit through the design cycle logic.',
    },
  },
  competency: {
    paso: 2,
    accion: {
      es: 'Bloque B · campo 7',
      en: 'Block B · field 7',
      ibEs: 'Bloque B · foco de diseño',
      ibEn: 'Block B · design focus',
    },
    tip: {
      es: 'La competencia es el ancla pedagógica de todos los 7 PASOS del kit.',
      en: 'The competency is the pedagogical anchor for all 7 kit STEPS.',
      ibEs: 'El foco de diseño debe orientar el reto, la solución y la evaluación dentro de la ruta de diseño.',
      ibEn: 'The design focus should guide the challenge, the solution and the assessment within the design route.',
    },
  },
  duration: {
    paso: 2,
    accion: { es: 'Bloque B · campo 8', en: 'Block B · field 8' },
    tip: { es: 'Sin duración definida, la guía docente queda incompleta para planear clases.', en: 'Without a set duration, the teacher guide stays incomplete for lesson planning.' },
  },
  context: {
    paso: 2,
    accion: { es: 'Bloque B · campo 10', en: 'Block B · field 10' },
    tip: { es: 'El contexto real hace que el reto sea auténtico y relevante para tus estudiantes.', en: 'The real context makes the challenge authentic and relevant for students.' },
  },
  challenge: {
    paso: 5,
    accion: {
      es: 'PASO 0 · seleccionar subtema',
      en: 'STEP 0 · select topic',
      ibEs: 'PASO 0 · definir necesidad, producto y evidencia',
      ibEn: 'STEP 0 · define need, outcome and evidence',
    },
    tip: {
      es: 'El subtema define el enfoque concreto de todos los documentos del kit.',
      en: 'The selected topic sets the concrete focus for every document in the kit.',
      ibEs: 'El reto de diseño debe quedar coherente con el criterio seleccionado antes de pasar al resto del kit.',
      ibEn: 'The design challenge must stay coherent with the selected criterion before moving through the rest of the kit.',
    },
  },
  steps12: {
    paso: 6,
    accion: { es: 'PASO 1 y PASO 2', en: 'STEP 1 and STEP 2' },
    tip: { es: 'El reto y los materiales son la base visible del kit para el estudiante.', en: 'The challenge and materials are the visible foundation of the kit for students.' },
  },
  steps34: {
    paso: 8,
    accion: { es: 'PASO 3 y PASO 4', en: 'STEP 3 and STEP 4' },
    tip: { es: 'La guía docente y el uso del chat IA enriquecen la práctica en el aula.', en: 'The teacher guide and AI support strengthen classroom implementation.' },
  },
  steps56: {
    paso: 10,
    accion: { es: 'PASO 5 y PASO 6', en: 'STEP 5 and STEP 6' },
    tip: { es: 'Sin estos dos documentos el kit no queda listo para uso estudiantil ni para evaluación coherente.', en: 'Without these two documents, the kit is not ready for student use or coherent assessment.' },
  },
}

function getRouteGuidance(item, data) {
  const config = RUTAS_MAP[item.key]
  if (!config) return null
  const en = isEnglish(data)
  const isIB = data?.route === 'ib_myp_design'
  const accion = isIB
    ? (en ? (config.accion.ibEn || config.accion.en) : (config.accion.ibEs || config.accion.es))
    : (en ? config.accion.en : config.accion.es)
  const tip = isIB
    ? (en ? (config.tip.ibEn || config.tip.en) : (config.tip.ibEs || config.tip.es))
    : (en ? config.tip.en : config.tip.es)
  return { paso: config.paso, accion, tip }
}

function RutaMejoraSection({ data, pending, onGoTo }) {
  const [open, setOpen] = useState(true)
  const en = isEnglish(data)
  if (!pending.length) return null

  return (
    <div className="mt-4 rounded-2xl overflow-hidden border-2 border-amber-200 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
      >
        <span className="text-xl flex-shrink-0">🗺️</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-amber-800 text-sm">{en ? 'Your improvement path' : 'Tu ruta de mejora'}</p>
          <p className="text-amber-600 text-xs mt-0.5">
            {en
              ? `${pending.length} step${pending.length > 1 ? 's' : ''} to complete the kit at 100%`
              : `${pending.length} paso${pending.length > 1 ? 's' : ''} para completar el kit al 100 %`}
          </p>
        </div>
        <FiChevronRight className={`text-amber-400 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="bg-white divide-y divide-amber-50/60">
          {pending.map((item) => {
            const ruta = getRouteGuidance(item, data)
            return (
              <div key={item.key} className="flex items-start gap-3 px-5 py-3.5">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiAlertCircle className="text-amber-500 text-[10px]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                  {ruta && (
                    <>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{ruta.tip}</p>
                      {onGoTo && (
                        <button
                          onClick={() => onGoTo(ruta.paso)}
                          className="mt-2 text-xs text-[#2b5a52] font-semibold flex items-center gap-1 hover:underline"
                        >
                          <FiChevronRight className="text-[10px]" /> {en ? 'Go to' : 'Ir a'} {ruta.accion}
                        </button>
                      )}
                    </>
                  )}
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5">
                  +{item.pts} pts
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Subtemas por componente ──────────────────────────────────────────────────
function generarSubtemas(componenteId, route = 'men') {
  if (route === 'ib_myp_design') return []
  const mapa = {
    naturaleza: [
      {
        nombre: 'Historia y componentes del computador',
        producto: 'Línea de tiempo ilustrada + maqueta de partes del PC',
        evidencia: 'Informe con fotos de la maqueta y explicación escrita de cada componente',
        prerequisito: 'Conocimiento básico de dispositivos de uso cotidiano',
      },
      {
        nombre: 'Ciclo de vida de un producto tecnológico',
        producto: 'Diagrama de ciclo de vida + propuesta de reutilización o reciclaje',
        evidencia: 'Póster o presentación digital con análisis de impacto ambiental',
        prerequisito: 'Noción de consumo responsable y materiales',
      },
      {
        nombre: 'Innovación y diseño de artefactos tecnológicos',
        producto: 'Prototipo físico o digital de mejora de un objeto cotidiano',
        evidencia: 'Bitácora de diseño con bocetos, pruebas y conclusiones',
        prerequisito: 'Capacidad de identificar problemas del entorno',
      },
    ],
    uso: [
      {
        nombre: 'Producción digital con herramientas de ofimática',
        producto: 'Documento + presentación + hoja de cálculo integrados sobre un tema escolar',
        evidencia: 'Portafolio digital con archivos y criterios de calidad evaluados',
        prerequisito: 'Manejo básico del teclado y mouse',
      },
      {
        nombre: 'Programación visual con Scratch para resolver un problema',
        producto: 'Programa interactivo (juego educativo o animación) funcional en Scratch',
        evidencia: 'Archivo .sb3 + video de 2 min presentando el funcionamiento',
        prerequisito: 'Noción de secuencias y condiciones lógicas',
      },
      {
        nombre: 'Ciudadanía digital: uso seguro y responsable de internet',
        producto: 'Campaña digital (infografía + video corto) sobre seguridad en línea',
        evidencia: 'Producto publicado en plataforma escolar + checklist de verificación',
        prerequisito: 'Acceso a internet y experiencia básica en redes sociales',
      },
    ],
    solucion: [
      {
        nombre: 'Algoritmos para procesos de la vida cotidiana',
        producto: 'Algoritmo escrito + diagrama de flujo de un proceso del entorno escolar',
        evidencia: 'Diagrama revisado + prueba de escritorio documentada paso a paso',
        prerequisito: 'Comprensión de procesos secuenciales y condiciones',
      },
      {
        nombre: 'Simulación de sistemas con herramientas digitales',
        producto: 'Modelo en simulador gratuito (Tinkercad, PhET, etc.) de un sistema físico',
        evidencia: 'Capturas del simulador + informe de variables y resultados obtenidos',
        prerequisito: 'Conceptos básicos del área a simular (física, electrónica, etc.)',
      },
      {
        nombre: 'Prototipado: diseño y prueba de solución tecnológica',
        producto: 'Prototipo físico o digital de solución a un problema escolar identificado',
        evidencia: 'Bitácora de diseño (problema → propuesta → prototipo → evaluación)',
        prerequisito: 'Capacidad de identificar problemas y proponer mejoras creativas',
      },
    ],
    sociedad: [
      {
        nombre: 'Ética digital: derechos y deberes en entornos digitales',
        producto: 'Código de ética digital del curso + infografía de derechos digitales',
        evidencia: 'Documento firmado por el grupo + reflexión escrita individual',
        prerequisito: 'Experiencia previa usando redes sociales o plataformas digitales',
      },
      {
        nombre: 'Impacto ambiental de la tecnología y economía circular',
        producto: 'Análisis de residuos electrónicos local + propuesta de acción comunitaria',
        evidencia: 'Informe con datos reales + plan de acción con pasos concretos y responsables',
        prerequisito: 'Noción de ciclo de vida de productos y concepto de residuos',
      },
      {
        nombre: 'Brecha digital e inclusión tecnológica en mi comunidad',
        producto: 'Diagnóstico de acceso tecnológico + propuesta de solución comunitaria',
        evidencia: 'Encuesta aplicada + presentación de resultados y recomendaciones',
        prerequisito: 'Habilidades básicas de recolección de datos y entrevista',
      },
    ],
  }
  return mapa[componenteId] || mapa.solucion
}

// ─── Generadores de plantillas PASO 1–7 ──────────────────────────────────────
function gen1(d) {
  const en = isEnglish(d)
  const levelLabel = getLevelLabel(d)
  const levelValue = getLevelValue(d)
  const frameworkLabel = d.route === 'ib_myp_design' ? (en ? 'Design Framework' : 'Marco de Diseño') : (en ? 'MEN Component' : 'Componente MEN')
  const competenciaBase = d.route === 'ib_myp_design'
    ? (en
      ? `Base objective: The student investigates, develops and evaluates a design solution related to "${d.subtema?.nombre || 'the proposed challenge'}", justifying decisions and considering user, function and constraints.`
      : `Objetivo base: El/la estudiante investiga, desarrolla y evalúa una solución de diseño relacionada con "${d.subtema?.nombre || 'el reto propuesto'}", justificando decisiones y considerando usuario, función y restricciones.`)
    : (en
      ? `Proposed competency: The student identifies, analyzes and applies concepts from "${d.subtema?.nombre || 'technology and computing'}" to design and build a technological product, developing critical thinking and collaborative work aligned with MEN Curriculum Guidelines (2022).`
      : `Competencia propuesta: El/la estudiante identifica, analiza y aplica conceptos propios de "${d.subtema?.nombre || 'la tecnología e informática'}" para diseñar y construir un producto tecnológico, desarrollando pensamiento crítico y trabajo colaborativo alineado a las Orientaciones Curriculares MEN (2022).`)
  if (en) {
    return `STEP 1: CURRICULAR ALIGNMENT
================================
Institution: ${d.institucion || '[institution name]'}
${levelLabel}: ${levelValue} | Teacher: ${d.docente || '[teacher name]'}
${frameworkLabel}: ${getFrameworkValue(d)}
${d.route === 'ib_myp_design' ? 'Design challenge' : 'Topic'}: ${d.subtema?.nombre || (d.route === 'ib_myp_design' ? '[defined design challenge]' : '[selected topic]')}

CURRICULAR FRAMEWORK:
${d.competencia?.trim() || competenciaBase}

PROJECT SCOPE:
✔ Includes: conceptual exploration, design and construction of the product, evidence documentation and presentation.
✘ Does NOT include: advanced programming, power electronics or permanent physical installations.

MEASURABLE OBJECTIVE:
By the end of the project, the student will produce "${d.subtema?.producto || '[defined product]'}" ${d.route === 'ib_myp_design' ? 'as a coherent response to the design challenge' : 'showing understanding of the topic'} and meeting at least 2 of the 3 rubric criteria.

OBSERVABLE SUCCESS CRITERIA:
1. The student submits: ${d.subtema?.evidencia || '[defined evidence]'}
2. The student explains verbally or in writing how the product responds to the proposed challenge.

PROPOSED VISUAL SUPPORTS:
• Visual 1: Block diagram (input → process → output) to guide the workflow.
• Visual 2: Example of a finished product as a clear reference for the student.`
  }
  return `PASO 1: ALINEACIÓN CURRICULAR
================================
Institución: ${d.institucion || '[nombre institución]'}
${levelLabel}: ${levelValue} | Docente: ${d.docente || '[nombre docente]'}
${frameworkLabel}: ${getFrameworkValue(d)}
${d.route === 'ib_myp_design' ? 'Reto de diseño' : 'Subtema'}: ${d.subtema?.nombre || (d.route === 'ib_myp_design' ? '[reto definido]' : '[subtema seleccionado]')}

MARCO CURRICULAR:
${d.competencia?.trim() || competenciaBase}

ALCANCE DEL PROYECTO:
✔ Incluye: exploración conceptual, diseño y construcción del producto, documentación de evidencias y socialización.
✘ NO incluye: programación avanzada, electrónica de potencia ni instalaciones físicas permanentes.

OBJETIVO MEDIBLE:
Al finalizar el proyecto, el/la estudiante elaborara "${d.subtema?.producto || '[producto definido]'}" ${d.route === 'ib_myp_design' ? 'como respuesta coherente al reto de diseño' : 'que evidencie comprension del subtema'}, cumpliendo al menos 2 de los 3 criterios de la rubrica de evaluacion.

CRITERIOS DE ÉXITO OBSERVABLES:
1. El/la estudiante entrega: ${d.subtema?.evidencia || '[evidencia definida]'}
2. El/la estudiante explica verbalmente o por escrito cómo su producto responde al reto planteado.

APOYOS VISUALES PROPUESTOS:
• Visual 1: Diagrama de bloques (entrada → proceso → salida) — para orientar la secuencia de trabajo.
• Visual 2: Ejemplo de producto final terminado — referente claro para el/la estudiante.`
}

function gen2(d) {
  const en = isEnglish(d)
  const isIB = d.route === 'ib_myp_design'
  const reto = isIB
    ? `${d.institucion || 'La comunidad escolar'} necesita una solución de diseño relacionada con ${d.subtema?.nombre || '[descripción del reto]'}. Tu equipo debe investigar la necesidad, proponer alternativas y desarrollar una solución justificada para un usuario o contexto real.`
    : `${d.institucion || 'Nuestra institución'} necesita demostrar cómo funciona: ${d.subtema?.nombre || '[descripción del reto]'}. Tu equipo debe diseñar y construir un artefacto o sistema que presente una solución o demostración del concepto trabajado.`
  const productoTitulo = isIB ? 'SOLUCIÓN / PRODUCTO FINAL ESPERADO:' : 'PRODUCTO FINAL (artefacto tecnológico):'
  const versionLigeraTitulo = isIB ? 'VERSIÓN DE BAJA COMPLEJIDAD O PROTOTIPO INICIAL:' : 'VERSIÓN SIN HARDWARE (con pocos recursos):'
  const versionCompletaTitulo = isIB ? `VERSIÓN DESARROLLADA (si el tiempo y los recursos lo permiten: ${d.recursos || 'según disponibilidad'}):` : `VERSIÓN CON HARDWARE (si está disponible: ${d.recursos || 'según disponibilidad'}):`
  const evidencias = isIB
    ? `□ Indagación breve sobre usuario, necesidad o contexto
□ Boceto inicial con anotaciones
□ Foto/captura del prototipo en desarrollo
□ Foto/captura de la solución final
□ ${d.subtema?.evidencia || 'Justificación breve de decisiones de diseño'}
□ Reflexión escrita: ¿qué mejoramos y por qué?`
    : `□ Foto del equipo de trabajo al inicio
□ Boceto o diagrama del diseño propuesto
□ Foto/captura del prototipo en construcción
□ Foto/captura del producto terminado
□ ${d.subtema?.evidencia || 'Informe o bitácora del proceso'}
□ Reflexión escrita: ¿qué aprendiste? ¿qué cambiarías?`
  const apoyos = isIB
    ? `1. "Mapa rápido de usuario, necesidad y criterio de éxito" → apertura de la guía del docente.
2. "Ejemplo de prototipo con anotaciones" → referente visual para la guía del estudiante.
3. "Tabla de comparación entre ideas posibles" → apoyo para justificar la solución elegida.`
    : `1. "Diagrama entrada-proceso-salida del sistema" → incluir en slide 3 de la guía del docente.
2. "Foto ejemplo de producto terminado" → portada de la guía del estudiante.
3. "Tabla comparativa: sin hardware vs con hardware" → slide 5 de la guía del docente.`
  if (en) {
    return `STEP 2: AUTHENTIC CHALLENGE AND SOLUTION / PRODUCT
===============================================
SCHOOL CHALLENGE:
"${reto}"

${isIB ? 'EXPECTED FINAL SOLUTION / PRODUCT:' : 'FINAL PRODUCT (technological artifact):'}
${d.subtema?.producto || '[define product]'}

${isIB ? 'LOW-COMPLEXITY VERSION OR INITIAL PROTOTYPE:' : 'LOW-RESOURCE VERSION (without hardware):'}
${isIB
    ? '• Annotated sketch or storyboard of the solution\n• Quick prototype in paper, cardboard or recycled materials\n• Simple digital model or functional simulation\n• Short presentation explaining user, function and main decision'
    : '• Prototype in paper, cardboard or recycled materials\n• Flowchart printed or drawn by hand\n• Simulation using a free online tool (Tinkercad, PhET, Scratch)\n• Digital presentation with photo evidence of the process'}

${isIB ? `DEVELOPED VERSION (if time and resources allow: ${d.recursos || 'depending on availability'}):` : `FULL VERSION WITH HARDWARE (if available: ${d.recursos || 'depending on availability'}):`}
${isIB
    ? '• Improved functional prototype with testing and adjustments\n• Iteration on materials, form or use\n• Version with digital support, sensors or simulation if it adds real value'
    : '• Physical build with kit or lab materials\n• Control program in Arduino, micro:bit or another available tool\n• Educational robot programmed with the project logic'}

EVIDENCE GUIDE — what must be documented?
${evidencias}

KEY VISUAL SUPPORTS (3 images/diagrams):
${apoyos}`
  }
  return `PASO 2: RETO AUTÉNTICO Y SOLUCIÓN / PRODUCTO
===============================================
RETO ESCOLAR:
"${reto}"

${productoTitulo}
${d.subtema?.producto || '[definir producto]'}

${versionLigeraTitulo}
${isIB
    ? '• Boceto comentado o storyboard de la solución\n• Prototipo rápido en papel, cartón o materiales reciclados\n• Modelo digital simple o simulación funcional\n• Presentación corta que explique usuario, función y decisión principal'
    : '• Prototipo en papel, cartón o materiales reciclados\n• Diagrama de flujo impreso o dibujado a mano\n• Simulación en herramienta gratuita online (Tinkercad, PhET, Scratch)\n• Presentación digital con evidencias fotográficas del proceso'}

${versionCompletaTitulo}
${isIB
    ? '• Prototipo funcional mejorado con pruebas y ajustes\n• Iteración sobre materiales, forma o uso\n• Versión con apoyo digital, sensores o simulación si agrega valor real'
    : '• Montaje físico con kit o materiales del laboratorio\n• Programa de control en Arduino, micro:bit u otro disponible\n• Robot educativo programado con la lógica del proyecto'}

GUÍA DE EVIDENCIAS — ¿qué debe quedar documentado?
${evidencias}

APOYOS VISUALES CLAVE (3 imágenes/diagramas):
${apoyos}`
}

function gen3(d) {
  const en = isEnglish(d)
  const isIB = d.route === 'ib_myp_design'
  if (en) {
    return `STEP 3: MATERIALS AND RESOURCES CHECKLIST
============================================
PHYSICAL MATERIALS:
□ ${isIB ? 'Bond paper / cardstock (research, sketches and testing)' : 'Bond paper / cardstock (sketches and prototypes)'}
□ Scissors, glue, colored markers
□ Recycled materials: cardboard, bottles, caps, discarded cables
□ ${d.recursos || 'Specific project materials (complete as needed)'}
□ Phone/camera to record photo evidence

DIGITAL MATERIALS:
□ Computer or tablet (at least 1 per group)
□ Internet connection${d.restricciones?.toLowerCase().includes('internet') ? ' — NOTE: download resources in advance at home or in the computer lab' : ''}
□ Free digital tools: ${isIB ? 'Canva / Google Slides / sketching tool / simple simulator according to the challenge' : (d.recursos?.toLowerCase().includes('arduino') ? 'Arduino IDE, Tinkercad' : 'Google Slides / free Canva / Scratch / PhET')}
□ Kit templates (printed or shared on the platform)

LOW-COST ALTERNATIVES:
• No computer → Do everything on paper; teacher takes photos with a phone
• No internet → Download materials in advance, use offline mode
• No materials → Use what is available in the classroom
• No printer → Project the guides on a screen or classroom TV

REUSABLE FOR FUTURE GROUPS:
✔ Editable platform templates
✔ Assessment rubric (Step 6)
✔ ${isIB ? 'Prototype or reference solution examples' : 'Example photo of finished product'} (store in a shared folder)
✔ Teacher guide with adjustment notes by group or year

WORKSPACE SETUP:
1. Arrange tables in groups of 3–4 students.
2. Place materials in the center of each table before students arrive.
3. ${d.restricciones?.toLowerCase().includes('equipo') ? 'Rotate devices: 15 min on computer, 15 min on hands-on work.' : 'Assign 1 device per group.'}
4. Keep the Student Guide projected during the whole lesson.`
  }
  return `PASO 3: CHECKLIST DE MATERIALES Y RECURSOS
============================================
MATERIALES FÍSICOS:
□ ${isIB ? 'Papel bond / cartulina (indagación, bocetos y pruebas)' : 'Papel bond / cartulina (bocetos y prototipos)'}
□ Tijeras, pegante, marcadores de colores
□ Materiales reciclados: cartón, botellas, tapas, cables en desuso
□ ${d.recursos || 'Materiales específicos del proyecto (completar)'}
□ Celular/cámara para registrar evidencias fotográficas

MATERIALES DIGITALES:
□ Computador o tableta (mínimo 1 por grupo)
□ Conexión a internet${d.restricciones?.toLowerCase().includes('internet') ? ' — NOTA: descargar recursos anticipadamente en casa o sala de sistemas' : ''}
□ Herramientas digitales gratuitas: ${isIB ? 'Canva / Google Slides / herramienta de bocetación / simulador simple según el reto' : (d.recursos?.toLowerCase().includes('arduino') ? 'IDE de Arduino, Tinkercad' : 'Google Slides / Canva gratuito / Scratch / PhET')}
□ Plantillas del kit (impresas o compartidas en plataforma)

ALTERNATIVAS DE BAJO COSTO:
• Sin computador → Todo en papel; fotos con celular del docente
• Sin internet → Descargar materiales con anticipación, usar modo offline
• Sin materiales → Usar lo disponible en el aula (cuadernos, colores, hojas)
• Sin impresora → Proyectar las guías en pantalla o televisor del aula

REUTILIZABLE PARA PRÓXIMOS GRUPOS:
✔ Plantillas editables en plataforma
✔ Rúbrica de evaluación (Paso 6)
✔ ${isIB ? 'Ejemplos de prototipo o soluciones de referencia' : 'Foto de ejemplo de producto terminado'} (guardar en carpeta compartida)
✔ Guía del docente con anotaciones de ajuste por grupo o año

PREPARACIÓN DEL ESPACIO DE TRABAJO:
1. Organizar mesas en grupos de 3–4 estudiantes.
2. Colocar materiales en el centro de cada mesa antes de que lleguen.
3. ${d.restricciones?.toLowerCase().includes('equipo') ? 'Rotar equipos: 15 min en computador, 15 min en trabajo manual.' : 'Asignar 1 dispositivo por grupo.'}
4. Proyectar la Guía del Estudiante en el tablero durante toda la clase.`
}

function gen4(d) {
  const en = isEnglish(d)
  const dur = d.duracionSimulador || '15–20'
  const audience = getLevelValue(d)
  const isIB = d.route === 'ib_myp_design'
  if (en) {
    return `STEP 4: TEACHER GUIDE (STEP-BY-STEP SEQUENCE)
===================================================
Total project duration: ${d.duracionProyecto || '[X weeks / lessons]'}
Construction/simulation activity duration: ${dur} min

ACTIVITY SEQUENCE:

⏱ OPENING (10 min)
• Activate prior knowledge: ${isIB ? `What do students know about the problem, user or context of "${d.subtema?.nombre || 'the challenge'}"?` : `What do students know about "${d.subtema?.nombre || 'the topic'}"?`}
• Present the PROJECT CHALLENGE (see Step 2) and clarify doubts.
• Form work groups (3–4 students) and assign roles.

⏱ EXPLORATION (15 min)
• Hand out the Student Guide (Step 5).
• Individual and group reading of the challenge and the steps.
• Driving questions:
${isIB
    ? '  → "Who are we designing for and what do they need?"\n  → "What criteria should a good solution meet?"\n  → "What constraints must we keep in mind from the start?"'
    : '  → "What problem are we going to solve?"\n  → "What resources are available on your table?"\n  → "How will you divide the work in your team?"'}

⏱ BUILDING / SIMULATION (${dur} min)
• Groups work on their ${isIB ? 'solution, prototype or design iteration' : 'prototype or simulation'}.
• TEACHER INTERVENTION: Visit each group and ask:
${isIB
    ? '  → "Which alternative did you choose and why was it the best one?"\n  → "What did you learn when testing the idea?"\n  → "What will you adjust before presenting?"'
    : '  → "What did you decide to do and why?"\n  → "What obstacles did you find? How did you solve them?"'}
📸 PHOTO/CAPTURE: Ask one student from each group to take a photo halfway through the process.

⏱ SHARING (10 min)
• Each group presents its product in a maximum of 2 minutes.
• The rest of the class provides feedback using the rubric (Step 6)${isIB ? ' and by asking about decision-making.' : '.'}
📸 PHOTO/CAPTURE: Take a photo of each finished product before it is disassembled.

⏱ CLOSING AND REFLECTION (10 min)
• Group reflection: ${isIB ? 'What worked for the user or context? What would we improve in a next iteration?' : 'What did we learn today? What would we improve?'}
• Collect evidence: photos, logs and products.
• Communicate assessment criteria and final submission date.

ADAPTATIONS ACCORDING TO CONTEXT:
${d.restricciones || '• Large groups: assign one monitor/leader per group.\n• Few devices: rotate every 15 min between computer and hands-on work.\n• Limited internet: download all resources before class.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 MARYAM MATH AI ACTIVITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Suggested duration: ${dur} min (integrated into BUILDING)

HOW TO USE THE SIMULATOR IN THIS LESSON:
1. BEFORE class → Consult the Maryam Math simulator with the prompt from STEP 0
   to prepare examples, driving questions and activity guidance.

2. DURING the opening (10 min) → Use the simulator questions
   to activate prior knowledge. Project them if you have connectivity.

3. DURING building (${dur} min) → If devices are available, groups
   can consult the simulator to solve doubts about "${d.subtema?.nombre || '[topic]'}".
   Instruction for the group: "Ask the simulator: How does [specific part] work?"

4. DURING closing (10 min) → Ask one group to share what the
   simulator answered and how they applied it in their work.

GUIDING QUESTIONS FOR CLASS USE:
□ "How can I explain ${d.subtema?.nombre || '[topic]'} to students in ${audience}?"
□ "${d.route === 'ib_myp_design' ? `Give me a design or use context for ${d.subtema?.nombre || '[topic]'}.` : `Give me an example of ${d.subtema?.nombre || '[topic]'} in a school context.`}"
□ "Why is my [prototype/diagram/code] not working?"
□ "${isIB ? `How can I improve the solution ${d.subtema?.producto || '[product]'} while keeping user, function and constraints in mind?` : `How can I improve the product: ${d.subtema?.producto || '[product]'}?`}"

NOTE: Maryam Math simulator is available at: ${typeof window !== 'undefined' ? window.location.origin : 'your platform'}/plataforma`
  }
  return `PASO 4: GUÍA DEL DOCENTE (SECUENCIA PASO A PASO)
===================================================
Duración total del proyecto: ${d.duracionProyecto || '[X semanas / clases]'}
Duración actividad de construcción/simulación: ${dur} min

SECUENCIA DE ACTIVIDADES:

⏱ APERTURA (10 min)
• Activar saberes previos: ${isIB ? `¿Qué saben sobre el problema, usuario o contexto de "${d.subtema?.nombre || 'el reto'}"?` : `¿Qué saben de "${d.subtema?.nombre || 'el tema'}"?`}
• Presentar el RETO del proyecto (ver Paso 2) y aclarar dudas.
• Formar grupos de trabajo (3–4 estudiantes), asignar roles.

⏱ EXPLORACIÓN (15 min)
• Distribuir la Guía del Estudiante (Paso 5).
• Lectura individual y grupal del reto y los pasos.
• Preguntas dinamizadoras:
${isIB
    ? '  → "¿Para quién estamos diseñando y qué necesita?"\n  → "¿Qué criterios debe cumplir una buena solución?"\n  → "¿Qué restricciones debemos tener presentes desde el inicio?"'
    : '  → "¿Cuál es el problema que vamos a resolver?"\n  → "¿Qué recursos tienen disponibles en la mesa?"\n  → "¿Cómo se dividirán el trabajo entre el equipo?"'}

⏱ CONSTRUCCIÓN / SIMULACIÓN (${dur} min)
• Los grupos trabajan en su ${isIB ? 'solución, prototipo o iteración de diseño' : 'prototipo o simulación'}.
• INTERVENCIÓN DOCENTE: Visitar cada grupo y preguntar:
${isIB
    ? '  → "¿Qué alternativa eligieron y por qué fue la mejor?"\n  → "¿Qué aprendieron al probar la idea?"\n  → "¿Qué van a ajustar antes de presentar?"'
    : '  → "¿Qué decidieron hacer y por qué?"\n  → "¿Qué obstáculos encontraron? ¿Cómo los resolvieron?"'}
📸 FOTO/CAPTURA: Pedir a un integrante de cada grupo que tome foto del proceso a mitad de la construcción.

⏱ SOCIALIZACIÓN (10 min)
• Cada grupo presenta su producto en máximo 2 minutos.
• El resto del grupo da retroalimentación usando la rúbrica (Paso 6)${isIB ? ' y preguntando por la justificación de decisiones.' : '.'}
📸 FOTO/CAPTURA: Tomar foto del producto terminado de cada grupo antes de desarmarlo.

⏱ CIERRE Y REFLEXIÓN (10 min)
• Reflexión grupal: ${isIB ? '¿Qué funcionó para el usuario o contexto? ¿Qué mejoraríamos en una siguiente iteración?' : '¿Qué aprendimos hoy? ¿Qué mejoraríamos?'}
• Recoger evidencias: fotos, bitácoras, productos.
• Comunicar criterios y fecha de evaluación final.

ADAPTACIONES SEGÚN CONTEXTO:
${d.restricciones || '• Grupos grandes: asignar monitor/líder por grupo que coordina las tareas.\n• Pocos equipos: rotación cada 15 min entre computador y trabajo manual.\n• Internet limitado: descargar todos los recursos antes de la clase.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 ACTIVIDAD CON EL SIMULADOR MARYAM MATH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Duración sugerida: ${dur} min (integrado en el bloque de CONSTRUCCIÓN)

CÓMO USAR EL SIMULADOR EN ESTA CLASE:
1. ANTES de clase → Consulta el Simulador Maryam Math con el prompt del PASO 0
   para preparar ejemplos, preguntas dinamizadoras y guía de la actividad.

2. DURANTE la apertura (10 min) → Usa las preguntas sugeridas por el simulador
   para activar saberes previos. Proyecta en el tablero si tienes conexión.

3. EN la construcción (${dur} min) → Si hay dispositivos disponibles, los grupos
   pueden consultar el simulador para resolver dudas sobre: "${d.subtema?.nombre || '[subtema]'}".
   Instrucción para el grupo: "Pregúntenle al simulador: ¿Cómo funciona [parte específica]?"

4. EN el cierre (10 min) → Pide a un grupo que comparta qué le respondió el
   simulador y cómo lo aplicaron en su construcción.

PREGUNTAS GUÍA PARA CONSULTAR AL SIMULADOR DURANTE CLASE:
□ "¿Cómo puedo explicar ${d.subtema?.nombre || '[subtema]'} a estudiantes de ${audience}?"
□ "${d.route === 'ib_myp_design' ? `Dame un contexto de uso o diseño para ${d.subtema?.nombre || '[subtema]'}.` : `Dame un ejemplo de ${d.subtema?.nombre || '[subtema]'} que ocurra en una escuela colombiana.`}"
□ "¿Por qué no funciona mi [prototipo/diagrama/código]?" (cuando un grupo tenga dificultades)
□ "${isIB ? `¿Cómo puedo mejorar la solución ${d.subtema?.producto || '[producto]'} sin perder de vista usuario, función y restricciones?` : `¿Cómo mejoro el producto: ${d.subtema?.producto || '[producto]'}?`}"

NOTA: El Simulador Maryam Math está disponible en: ${typeof window !== 'undefined' ? window.location.origin : 'tu plataforma'}/plataforma`
}


function buildStudentRetoFicha(d) {
  const en = isEnglish(d)
  const isIB = d.route === 'ib_myp_design'
  const isSTEM = d.route === 'stem'

  const reto = isIB
    ? `${d.institucion || 'La comunidad escolar'} necesita una solución de diseño relacionada con ${d.subtema?.nombre || d.stemNeed || '[descripción del reto]'} .`
    : isSTEM
      ? `${d.institucion || 'Nuestra institución'} necesita resolver: ${d.stemNeed || d.subtema?.nombre || '[necesidad STEM / STEAM]'}.`
      : `${d.institucion || 'Nuestra institución'} necesita demostrar cómo funciona: ${d.subtema?.nombre || '[descripción del reto]'}.`

  const producto = isSTEM
    ? (d.stemPrototype || 'Prototipo mínimo viable que puedas probar dos veces con usuarios.')
    : (d.subtema?.producto || '[definir producto]')

  const evidencia = isSTEM
    ? (d.stemEvidenceLink || 'Fotos del proceso, datos de pruebas y mejoras registradas.')
    : (d.subtema?.evidencia || '[definir evidencia]')

  const duracion = d.duracionSimulador || '15–20'

  if (en) {
    return `CHALLENGE CARD (WHAT YOU MUST SUBMIT TODAY):
${isIB ? 'Situation or need to address:' : 'Problem to solve:'}
${reto}

Expected final product:
${producto}

Minimum success criteria:
□ ${isIB ? 'The solution responds to a defined need or context.' : 'The product works or clearly demonstrates the concept.'}
□ ${isIB ? 'The team explains why certain design decisions were made.' : 'The team explains how the product responds to the challenge.'}
□ The team presents the work in a maximum of 2 minutes.

Minimum evidence:
□ ${isIB ? 'Brief inquiry or definition of user/context' : 'Initial sketch or design'}
□ Initial sketch or design
□ Process photo/capture
□ Final product photo/capture
□ ${evidencia}

Time and roles:
• Build/simulation time: ${duracion} min
• Suggested roles: ${isIB ? 'researcher, designer, builder, presenter or evidence lead' : 'coordinator, builder, presenter, evidence lead'}`
  }
  return `FICHA DEL RETO (LO QUE DEBES ENTREGAR HOY):
${isIB ? 'Situación o necesidad a atender:' : 'Problema a resolver:'}
${reto}

Producto final esperado:
${producto}

Criterios de logro (mínimos):
□ ${isIB ? 'La solución responde a una necesidad o contexto definido.' : 'El producto funciona o demuestra claramente el concepto.'}
□ ${isIB ? 'El equipo explica por qué tomó ciertas decisiones de diseño.' : 'El equipo explica cómo su producto responde al reto.'}
□ El equipo presenta el trabajo en máximo 2 minutos.

Evidencias mínimas:
□ ${isIB ? 'Indagación breve o definición del usuario/contexto' : 'Boceto o diseño inicial'}
□ Boceto o diseño inicial
□ Foto/captura del proceso
□ Foto/captura del producto terminado
□ ${evidencia}

Tiempo y roles:
• Tiempo de construcción/simulación: ${duracion} min
• Roles sugeridos: ${isIB ? 'investigador(a), diseñador(a), constructor(a), relator(a) o encargado(a) de evidencias' : 'coordinador(a), constructor(a), relator(a), encargado(a) de evidencias'}`
}

function ensureStudentGuideContent(raw, d) {
  const marker = isEnglish(d) ? 'CHALLENGE CARD (WHAT YOU MUST SUBMIT TODAY):' : 'FICHA DEL RETO (LO QUE DEBES ENTREGAR HOY):'
  const source = String(raw || '').trim()
  if (!source) return gen5(d)
  if (source.includes(marker)) return source
  const ficha = buildStudentRetoFicha(d)
  const challengeHeader = isEnglish(d) ? 'OUR CHALLENGE:' : 'NUESTRO RETO:'
  if (source.includes(challengeHeader)) {
    return source.replace(challengeHeader, `${challengeHeader}\n${ficha}\n`)
  }
  return `${ficha}\n\n====\n${source}`
}

function buildStemStudentGuide(d) {
  const en = isEnglish(d)
  const bandKey = d.stemBand || getStemBand(d.grado)?.key || 'innovadores'
  const reto = d.subtema?.nombre || d.stemNeed || (en ? 'STEM / STEAM challenge' : 'Reto STEM / STEAM')
  const proto = d.stemPrototype || (en ? 'Prototype to test twice' : 'Prototipo para probar dos veces')
  const metric = d.stemMetric || (en ? 'Quick metric (15–30 min)' : 'Métrica rápida (15–30 min)')
  const evidencia = d.subtema?.evidencia || (en ? 'Photos + data from tests' : 'Fotos + datos de las pruebas')
  const dur = d.duracionSimulador || '15–20'
  const rounds = d.stemRounds || []
  const baseHeader = en ? 'STEP 5: STUDENT GUIDE' : 'PASO 5: GUÍA DEL ESTUDIANTE'
  const line = '================================'
  const header = `${baseHeader}\n${line}\n${en ? 'Project' : 'Proyecto'}: ${reto}\n${en ? 'Time' : 'Tiempo'}: ${dur} min · ${en ? 'Prototype' : 'Prototipo'}: ${proto}\n${en ? 'Metric' : 'Métrica'}: ${metric}`

  const renderRounds = () => rounds.map((r, i) => {
    const title = en ? `Test ${i + 1}` : `Prueba ${i + 1}`
    return `${title}\n- ${en ? 'What we test:' : 'Qué probamos:'} ${r.focus || '[define test]'}\n- ${en ? 'Evidence:' : 'Evidencia:'} ${r.evidence || evidencia}\n- ${en ? 'Adjustment:' : 'Ajuste:'} ${r.adjustment || (en ? 'One small change after the test.' : 'Un cambio pequeño después de la prueba.')}`
  }).join('\n\n')

  if (bandKey === 'exploradores') {
    return `${header}
${line}
${en ? '1) Look and draw' : '1) Miramos y dibujamos'}
□ ${en ? 'Draw the problem and your idea.' : 'Dibuja el problema y tu idea.'}
□ ${en ? 'Name the users.' : 'Di quiénes usarán la solución.'}

##CHECKPOINT1##

${en ? '2) Build and show' : '2) Construimos y mostramos'}
□ ${en ? 'Build the simple model.' : 'Construye el modelo sencillo.'}
□ ${en ? 'Take 1 photo while you build.' : 'Toma 1 foto mientras construyes.'}

${en ? '3) Test and change' : '3) Probamos y cambiamos'}
□ ${en ? 'Try it once. Did it work?' : 'Prueba una vez. ¿Funcionó?'}
□ ${en ? 'Make one change and say why.' : 'Haz un cambio y di por qué.'}

##CHECKPOINT2##

${en ? 'Evidence to submit:' : 'Evidencias a entregar:'}
• ${en ? '1 photo of process' : '1 foto del proceso'}
• ${en ? '1 photo of result' : '1 foto del resultado'}
• ${en ? 'One sentence: what changed?' : 'Una frase: ¿qué cambió?'}

${en ? 'Mini self-check:' : 'Auto-revisión:'}
□ ${en ? 'We can explain the problem in one sentence.' : 'Podemos explicar el problema en una frase.'}
□ ${en ? 'Our model does something visible.' : 'Nuestro modelo hace algo visible.'}
□ ${en ? 'We made at least one improvement.' : 'Hicimos al menos una mejora.'}`
  }

  if (bandKey === 'constructores') {
    return `${header}
${line}
##CHECKPOINT1##

${renderRounds()}

##CHECKPOINT2##

${en ? 'Evidence checklist:' : 'Lista de evidencias:'}
□ ${en ? 'Sketch or diagram (entrada-proceso-salida).' : 'Boceto o diagrama (entrada-proceso-salida).'}
□ ${en ? 'Photo of prototype working.' : 'Foto del prototipo funcionando.'}
□ ${en ? 'Noise/airflow/etc. metric before vs after.' : 'Métrica (ruido/flujo/etc.) antes vs después.'}
□ ${en ? 'One note about what we improved.' : 'Una nota sobre lo que mejoramos.'}

${en ? 'Presentation (max 2 min): need → idea → what changed after test.' : 'Presentación (máx 2 min): necesidad → idea → qué cambió tras la prueba.'}`
  }

  if (bandKey === 'innovadores') {
    return `${header}
${line}
##CHECKPOINT1##

${renderRounds()}

##CHECKPOINT2##

${en ? 'Evidence checklist:' : 'Lista de evidencias:'}
□ ${en ? 'Sketch/diagram with materials.' : 'Boceto/diagrama con materiales.'}
□ ${en ? '2 test photos with data (table or short note).' : '2 fotos de pruebas con datos (tabla o nota corta).'} 
□ ${en ? 'One improvement justified with the data.' : 'Una mejora justificada con los datos.'}

${en ? 'Presentation (max 2 min): need → prototype → data → improvement.' : 'Presentación (máx 2 min): necesidad → prototipo → datos → mejora.'}`
  }

  return `${header}
${line}
##CHECKPOINT1##

${renderRounds()}

##CHECKPOINT2##

${en ? 'Evidence checklist:' : 'Lista de evidencias:'}
□ ${en ? 'System map or constraints list.' : 'Mapa de sistema o lista de restricciones.'}
□ ${en ? '2–3 test records with data (table/chart).' : '2–3 registros de prueba con datos (tabla/gráfico).'} 
□ ${en ? 'Impact note (who benefits, risks, environment).' : 'Nota de impacto (quién se beneficia, riesgos, ambiente).'} 
□ ${en ? 'Next iteration decision with justification.' : 'Decisión de siguiente iteración con justificación.'}

${en ? 'Presentation (max 2 min): need → prototype → data → trade-offs → next step.' : 'Presentación (máx 2 min): necesidad → prototipo → datos → trade-offs → siguiente paso.'}`
}

function gen5(d) {
  const en = isEnglish(d)
  const max = Number(d.maxImagenes) || 3
  const isIB = d.route === 'ib_myp_design'
  if (d.route === 'stem') return buildStemStudentGuide(d)
  const fotoLabels = [
    isIB ? (en ? 'Photo of your research, sketch or initial idea' : 'Foto de tu investigación, boceto o idea inicial') : (en ? 'Photo of your sketch or initial design' : 'Foto de tu boceto o diseño inicial'),
    isIB ? (en ? 'Photo of your prototype or test halfway through the process' : 'Foto de tu prototipo o prueba a mitad del proceso') : (en ? 'Photo of your work halfway through the process' : 'Foto de tu trabajo a mitad del proceso'),
    en ? 'Photo of the finished product' : 'Foto del producto terminado',
    en ? 'Screenshot of the simulator or digital tool' : 'Captura de pantalla del simulador o herramienta digital',
  ]
  const fotos = Array.from({ length: max }, (_, i) =>
    `📸 ${en ? 'PHOTO' : 'FOTO'} ${i + 1}: ${fotoLabels[i] || (en ? 'Process evidence photo' : 'Foto de evidencia del proceso')}`
  )
  if (en) {
    return `STEP 5: STUDENT GUIDE
================================
Project: ${d.subtema?.nombre || '[project name]'}
Name: _________________________  ${getLevelLabel(d)}: ${getLevelValue(d)}
Date: __________________________  Group No.: _____

OUR CHALLENGE:
"${d.subtema?.nombre ? (isIB ? `Design a solution for: ${d.subtema.nombre}` : `Show how this works: ${d.subtema.nombre}`) : '[challenge description — copy from Step 2]'}"
${buildStudentRetoFicha(d)}

====
⏱ STEP 1 — I read and understand the challenge (5 min)
□ I read the full challenge with my team.
□ We understand what we must do and submit.
□ We have the materials ready.
${isIB ? '□ We identified who we are designing for and what they need.' : ''}

====
⏱ STEP 2 — ${isIB ? 'We investigate and propose an idea' : 'We design our solution'} (10 min)
${isIB ? 'What did we discover about the user, context or need?\n[RESEARCH SPACE — Write findings, criteria and constraints]\n\nOur best first idea:\n[SKETCH SPACE — Draw or write your design proposal here]' : 'Draw or describe your first idea here:\n[SKETCH SPACE — Draw or write your design here]'}
${fotos[0] || ''}

##CHECKPOINT1##

====
⏱ STEP 3 — ${isIB ? 'We build, test and improve' : 'We build or simulate'} (${d.duracionSimulador || '15–20'} min)
□ ${isIB ? 'We build or model the solution based on the chosen idea.' : 'We begin to build or simulate according to the design.'}
□ ${isIB ? 'We test the solution and adjust it if needed.' : 'We make adjustments if something does not work.'}
${isIB ? 'What did we learn while testing?\n[TESTING SPACE — Write what worked, what did not and what you adjusted]' : 'Problems we found:\n[PROBLEM SPACE — Write the obstacles you found]'}
${fotos[1] || ''}

##CHECKPOINT2##

====
⏱ STEP 4 — We present our product
□ The product is ready.
□ ${isIB ? 'We practised how to explain decisions, user and proposed improvement in 2 minutes.' : 'We practised how to present it in 2 minutes.'}
□ We presented to the group.

EVIDENCE OF MY PRODUCT:
[EVIDENCE SPACE — ${isIB ? 'Describe your final solution: what does it look like, who does it help, why did you choose it, what would you improve?' : 'Describe your finished product: what does it look like? what makes it work? does it meet the challenge?'}]
${fotos[2] || ''}
${fotos[3] || ''}

====
MY FINAL REFLECTION
1. ${isIB ? 'What did I learn about designing for a need or user?' : 'What did I learn today?'}
[REFLECTION SPACE 1 — ${isIB ? 'What did I learn about designing for a need or user?' : 'What did I learn today?'}]
2. ${isIB ? 'Which design decision was the hardest and why?' : 'What was the most difficult part?'}
[REFLECTION SPACE 2 — ${isIB ? 'Which design decision was the hardest and why?' : 'What was the most difficult part?'}]
3. ${isIB ? 'What would I change in a next iteration?' : 'What would I change if I did it again?'}
[REFLECTION SPACE 3 — ${isIB ? 'What would I change in a next iteration?' : 'What would I change if I did it again?'}]

====
##AUTOEVAL##`
  }
  return `PASO 5: GUÍA DEL ESTUDIANTE
================================
Proyecto: ${d.subtema?.nombre || '[nombre del proyecto]'}
Nombre: _________________________  ${getLevelLabel(d)}: ${getLevelValue(d)}
Fecha: __________________________  Grupo N°: _____

NUESTRO RETO:
"${d.subtema?.nombre ? (isIB ? `Diseña una solución para: ${d.subtema.nombre}` : `Demuestra cómo funciona: ${d.subtema.nombre}`) : '[descripción del reto — copiar del Paso 2]'}"
${buildStudentRetoFicha(d)}

====
⏱ PASO 1 — Leo y entiendo el reto (5 min)
□ Leí el reto completo con mi equipo.
□ Entendemos qué debemos hacer y entregar.
□ Tenemos los materiales listos.
${isIB ? '□ Identificamos para quién diseñamos y qué necesita.' : ''}

====
⏱ PASO 2 — ${isIB ? 'Investigamos y planteamos una idea' : 'Diseñamos nuestra solución'} (10 min)
${isIB ? '¿Qué descubrimos del usuario, contexto o necesidad?\n[ESPACIO PARA INDAGACIÓN — Escribe hallazgos, criterios y restricciones]\n\nNuestra mejor idea inicial:\n[ESPACIO PARA BOCETO — Dibuja o escribe tu propuesta de diseño aquí]' : 'Dibuja o describe tu idea inicial aquí:\n[ESPACIO PARA BOCETO — Dibuja o escribe tu diseño aquí]'}
${fotos[0] || ''}

##CHECKPOINT1##

====
⏱ PASO 3 — ${isIB ? 'Construimos, probamos y ajustamos' : 'Construimos o simulamos'} (${d.duracionSimulador || '15–20'} min)
□ ${isIB ? 'Construimos o modelamos la solución según la idea elegida.' : 'Comenzamos a construir o simular según el diseño.'}
□ ${isIB ? 'Probamos la solución y hacemos ajustes si es necesario.' : 'Hacemos ajustes si algo no funciona.'}
${isIB ? 'Qué aprendimos al probar:\n[ESPACIO PARA PRUEBAS — Anota qué funcionó, qué no y qué ajustaste]' : 'Problemas que encontramos:\n[ESPACIO PARA PROBLEMAS — Anota los obstáculos que encontraste]'}
${fotos[1] || ''}

##CHECKPOINT2##

====
⏱ PASO 4 — Presentamos nuestro producto
□ El producto está listo.
□ ${isIB ? 'Practicamos cómo explicar decisiones, usuario y mejora propuesta en 2 minutos.' : 'Practicamos cómo presentarlo en 2 minutos.'}
□ Presentamos al grupo.

EVIDENCIAS DE MI PRODUCTO:
[ESPACIO PARA EVIDENCIAS — ${isIB ? 'Describe tu solución final: ¿cómo quedó?, ¿a quién ayuda?, ¿por qué la elegiste?, ¿qué mejorarías?' : 'Describe tu producto terminado: ¿cómo quedó? ¿qué lo hace funcionar? ¿cumple el reto?'}]
${fotos[2] || ''}
${fotos[3] || ''}

====
MI REFLEXIÓN FINAL
1. ${isIB ? '¿Qué aprendí sobre diseñar para una necesidad o usuario?' : '¿Qué aprendí hoy?'}
[ESPACIO REFLEXIÓN 1 — ${isIB ? '¿Qué aprendí sobre diseñar para una necesidad o usuario?' : '¿Qué aprendí hoy?'}]
2. ${isIB ? '¿Qué decisión de diseño fue la más difícil y por qué?' : '¿Qué fue lo más difícil?'}
[ESPACIO REFLEXIÓN 2 — ${isIB ? '¿Qué decisión de diseño fue la más difícil y por qué?' : '¿Qué fue lo más difícil?'}]
3. ${isIB ? '¿Qué cambiaría en una siguiente iteración?' : '¿Qué cambiaría si lo hiciera de nuevo?'}
[ESPACIO REFLEXIÓN 3 — ${isIB ? '¿Qué cambiaría en una siguiente iteración?' : '¿Qué cambiaría si lo hiciera de nuevo?'}]

====
##AUTOEVAL##`
}

function gen6(d) {
  const en = isEnglish(d)
  const r = d.rubrica || INITIAL.rubrica
  const rows = r.criterios.map(c =>
    `${c.nombre} | ${c.s} | ${c.a} | ${c.b} | ${c.l}`
  ).join('\n')

  const competenciaTexto = d.competencia?.trim() || (d.route === 'ib_myp_design'
    ? `El/la estudiante investiga, desarrolla y evalúa una solución de diseño relacionada con "${d.subtema?.nombre || d.componenteLabel}", justificando decisiones y considerando usuario, función y restricciones.`
    : `El/la estudiante identifica y aplica conceptos de "${d.subtema?.nombre || d.componenteLabel}" en la creación de un producto tecnológico documentado.`)

  if (en) {
    return `STEP 6: TEACHER ASSESSMENT RUBRIC
=======================================
Project: ${d.subtema?.nombre || '[project name]'}
${d.route === 'ib_myp_design' ? 'Design Framework' : 'MEN Component'}: ${getFrameworkValue(d)}
${getLevelLabel(d)}: ${getLevelValue(d)} | Teacher: ${d.docente || '[name]'}

ASSESSED COMPETENCY:
${competenciaTexto}

ASSESSMENT SCALE:
⭐ EXCELLENT (5.0) | ✅ HIGH (4.2) | ⚠ BASIC (3.5) | ✗ LOW (1.5)

Criterion (weight) | EXCELLENT | HIGH | BASIC | LOW
-------------------|-----------|------|-------|----
${rows}

GUIDED GRADE CALCULATION:
Excellent (5.0 × weight) + High (4.2 × weight) + Basic (3.5 × weight) + Low (1.5 × weight)
`
  }
  return `PASO 6: RÚBRICA DE EVALUACIÓN DOCENTE
=======================================
Proyecto: ${d.subtema?.nombre || '[nombre del proyecto]'}
${d.route === 'ib_myp_design' ? 'Marco de Diseño' : 'Componente MEN'}: ${getFrameworkValue(d)}
${getLevelLabel(d)}: ${getLevelValue(d)} | Docente: ${d.docente || '[nombre]'}

COMPETENCIA EVALUADA:
${competenciaTexto}

ESCALA DE VALORACIÓN:
⭐ SUPERIOR (5.0) | ✅ ALTO (4.2) | ⚠ BÁSICO (3.5) | ✗ BAJO (1.5)

Criterio (ponderación) | SUPERIOR | ALTO | BÁSICO | BAJO
-----------------------|----------|------|--------|-----
${rows}

CÁLCULO ORIENTATIVO DE NOTA:
Superior (5.0 × peso) + Alto (4.2 × peso) + Básico (3.5 × peso) + Bajo (1.5 × peso)
`
}

function gen7(d) {
  const en = isEnglish(d)
  const levelLabel = getLevelLabel(d)
  const levelValue = getLevelValue(d)
  const frameworkLabel = d.route === 'ib_myp_design' ? (en ? 'Design Framework' : 'Marco de Diseño') : (en ? 'MEN Component' : 'Componente MEN')
  const areaLabel = d.route === 'ib_myp_design' ? (en ? 'Area: School Design' : 'Area: Diseño Escolar') : (en ? 'Area: Technology and Computing' : 'Area: Tecnologia e Informatica')
  if (en) {
    return `STEP 7: INSTITUTIONAL PACKAGE
==============================
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         [INSTITUTIONAL LOGO]
${d.tienelogo && d.logoUrl ? '         (Logo attached)' : '         (Insert institution logo)'}

${(d.institucion || '[NAME OF THE SCHOOL]').toUpperCase()}
${d.ciudad || '[City / Campus]'}

    REUSABLE TEACHING KIT
    ${areaLabel}
    ${levelLabel}: ${levelValue} | Year: ${new Date().getFullYear()}
    ${frameworkLabel}: ${d.componenteLabel}
    Topic: ${d.subtema?.nombre || '[topic]'}
    Teacher: ${d.docente || '[Teacher name]'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KIT INDEX:
□ Document 1 — Curricular alignment (STEP 1)
□ Document 2 — Challenge and solution / product (STEP 2)
□ Document 3 — Materials checklist (STEP 3)
□ Document 4 — Teacher guide (STEP 4)
□ Document 5 — Student guide — editable and returnable (STEP 5)
□ Document 6 — Assessment rubric (STEP 6)
□ Evidence folder (photos and student work)

USE AND REUSE INSTRUCTIONS:
1. Before use: read the Teacher Guide (Document 4) completely.
2. Adaptation: adjust the Student Guide to the group (${levelLabel.toLowerCase()}, available resources).
3. Copies: Document 5 is designed for one copy per student.
4. Evidence: save photos in the kit folder for the teacher portfolio.
5. Reuse: this kit works with different groups; only update names and dates.
6. Continuous improvement: record adjustments at the end of each use in the kit log.

DIGITAL SUPPORT RESOURCES:
• Tinkercad (electronics and 3D): https://www.tinkercad.com
• Scratch (visual coding): https://scratch.mit.edu
• PhET (science simulations): https://phet.colorado.edu
• Canva for Education: https://www.canva.com
${d.route === 'ib_myp_design' ? '' : '• MEN Curriculum Guidelines: https://www.colombiaaprende.edu.co\n'}• The kit prioritizes work in the platform and leaves exports as support.

Responsible teacher: ${d.docente || '[Name]'} — ${d.institucion || '[Institution]'}`
  }
  return `PASO 7: EMPAQUE INSTITUCIONAL
==============================
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
         [LOGO INSTITUCIONAL]
${d.tienelogo && d.logoUrl ? '         (Logo adjunto)' : '         (Insertar logo de la institución)'}

${(d.institucion || '[NOMBRE DE LA INSTITUCIÓN EDUCATIVA]').toUpperCase()}
${d.ciudad || '[Ciudad / Sede]'}

    KIT DIDÁCTICO REUTILIZABLE
    ${areaLabel}
    ${levelLabel}: ${levelValue} | Año: ${new Date().getFullYear()}
    ${frameworkLabel}: ${d.componenteLabel}
    Subtema: ${d.subtema?.nombre || '[subtema]'}
    Docente: ${d.docente || '[Nombre del Docente]'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ÍNDICE DEL KIT:
□ Documento 1 — Alineación curricular (PASO 1)
□ Documento 2 — Reto y solución / producto (PASO 2)
□ Documento 3 — Checklist de materiales (PASO 3)
□ Documento 4 — Guía del docente (PASO 4)
□ Documento 5 — Guía del estudiante — editable y retornable (PASO 5)
□ Documento 6 — Rúbrica de evaluación (PASO 6)
□ Carpeta de evidencias (fotos y trabajos de estudiantes)

INSTRUCCIONES DE USO Y REUTILIZACIÓN:
1. Antes de usar: leer completamente la Guía del Docente (Documento 4).
2. Adaptación: ajustar la Guía del Estudiante al grupo (${levelLabel.toLowerCase()}, recursos disponibles).
3. Fotocopias: el Documento 5 está diseñado para 1 copia por estudiante.
4. Evidencias: guardar fotos en la carpeta del kit para portafolio docente.
5. Reutilización: este kit funciona con diferentes grupos; solo actualizar nombre y fecha.
6. Mejora continua: registrar ajustes al final de cada uso en la Bitácora del kit.

RECURSOS DIGITALES DE APOYO:
• Tinkercad (electrónica y 3D): https://www.tinkercad.com
• Scratch (programación visual): https://scratch.mit.edu
• PhET (simuladores científicos): https://phet.colorado.edu/es
• Canva educativo gratuito: https://www.canva.com/es_co/
${d.route === 'ib_myp_design' ? '' : '• Orientaciones Curriculares MEN: https://www.colombiaaprende.edu.co\n'}• El kit prioriza el trabajo en plataforma y deja los exportables como apoyo.

Docente responsable: ${d.docente || '[Nombre]'} — ${d.institucion || '[Institución]'}`
}

const GENERADORES = [gen1, gen2, gen3, gen4, gen5, gen6, gen7]
function getPasosInfo(language = 'es') {
  if (language === 'en') {
    return [
      { num: 1, titulo: 'Curricular alignment', desc: 'Framework, measurable objective and success criteria.' },
      { num: 2, titulo: 'Authentic challenge and product', desc: 'Real challenge, solution or product and evidence guide.' },
      { num: 3, titulo: 'Materials and resources', desc: 'Complete checklist with low-cost alternatives.' },
      { num: 4, titulo: 'Teacher guide', desc: 'Activity sequence, driving questions and photo instructions.' },
      { num: 5, titulo: 'Student guide', desc: 'Visual instructions, learning log and self-assessment. (Editable and returnable)' },
      { num: 6, titulo: 'Assessment rubric', desc: 'Criteria, scale and weighting aligned with the curricular route.' },
      { num: 7, titulo: 'Institutional package', desc: 'Cover, index, reuse instructions and digital resources.' },
    ]
  }
  return [
    { num: 1, titulo: 'Alineación curricular', desc: 'Marco curricular, objetivo medible y criterios de éxito.' },
    { num: 2, titulo: 'Reto auténtico y producto', desc: 'Reto real, solución o producto y guía de evidencias.' },
    { num: 3, titulo: 'Materiales y recursos', desc: 'Checklist completo con alternativas de bajo costo.' },
    { num: 4, titulo: 'Guía del docente', desc: 'Secuencia de actividades, preguntas dinamizadoras e instrucciones de fotos.' },
    { num: 5, titulo: 'Guía del estudiante', desc: 'Instrucciones visuales, bitácora y autoevaluación. (Editable y retornable)' },
    { num: 6, titulo: 'Rúbrica de evaluación', desc: 'Criterios, escala y ponderación alineados a la ruta curricular.' },
    { num: 7, titulo: 'Empaque institucional', desc: 'Portada, índice, instrucciones de reutilización y recursos digitales.' },
  ]
}

// ─── Componentes UI ───────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = Math.round((current / total) * 100)
  const label = STEP_LABELS[current] || ''
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-2.5 flex-shrink-0">
      <div className="mx-auto w-full max-w-6xl px-1 lg:px-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-[#2b5a52]">{label}</span>
          <span className="text-xs text-gray-400">{pct}%</span>
        </div>
        <div className="bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-gradient-to-r from-[#2b5a52] to-[#3d7a6e] h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function Label({ children, required, className = '' }) {
  return (
    <label className={`mb-2 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#335c55] ${className}`}>
      {children} {required && <span className="text-[#fbb041]">*</span>}
    </label>
  )
}

function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-[#c7d6d1] bg-[linear-gradient(180deg,#fffdf8_0%,#f9fbfa_100%)] px-4 py-3 text-sm text-[#173d37] shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition-all
        placeholder:text-[#8aa19a] focus:outline-none focus:border-[#2b5a52] focus:ring-4 focus:ring-[#2b5a52]/10 focus:bg-white"
    />
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-[#c7d6d1] bg-[linear-gradient(180deg,#fffdf8_0%,#f9fbfa_100%)] px-4 py-3 text-sm text-[#173d37] shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition-all
        focus:outline-none focus:border-[#2b5a52] focus:ring-4 focus:ring-[#2b5a52]/10"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={typeof o === 'string' ? o : o.value} value={typeof o === 'string' ? o : o.value}>
          {typeof o === 'string' ? o : o.label}
        </option>
      ))}
    </select>
  )
}

function Textarea({ value, onChange, rows = 4, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-[#c7d6d1] bg-[linear-gradient(180deg,#fffdf8_0%,#f9fbfa_100%)] px-4 py-3 text-sm text-[#173d37] shadow-[inset_0_1px_0_rgba(255,255,255,.8)] transition-all
        placeholder:text-[#8aa19a] focus:outline-none focus:border-[#2b5a52] focus:ring-4 focus:ring-[#2b5a52]/10 resize-y"
    />
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onChange(!value)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onChange(!value) }}
        className={`w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center
          ${value ? 'bg-[#2b5a52]' : 'bg-gray-200'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-1
          ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}

function SectionTitle({ letter, title, desc }) {
  return (
    <div className="mb-7 rounded-[28px] border border-[#d7e3df] bg-[linear-gradient(135deg,#fffdfa_0%,#f7fbfa_100%)] px-5 py-4 shadow-[0_12px_32px_rgba(23,61,55,.06)]">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[#173d37] text-sm font-black text-white shadow-[0_8px_18px_rgba(23,61,55,.18)]">
          {letter}
        </span>
        <div>
          <h2 className="text-[1.05rem] font-black text-[#173d37]" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>{title}</h2>
          {desc && <p className="mt-1 max-w-2xl text-sm leading-6 text-[#49615a]">{desc}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Pantallas de cada paso ───────────────────────────────────────────────────
function Welcome({ data, onChange, onStart, onLoad, onOpenPanel, onStartTour }) {
  const [savedKits, setSavedKits] = useState(() => lsGetKits())
  const routeMeta = getRouteMeta(data?.route)
  const isIB = data?.route === 'ib_myp_design'
  const languageMeta = getLanguageMeta(data?.language)
  const en = isEnglish(data)
  const filteredSavedKits = savedKits.filter((kit) => (kit?.data?.route || 'men') === (data?.route || 'men') && kit?.preview?.institucion?.trim())

  const handleStemPreset = () => {
    const preset = buildStemPreset(data?.language || 'es')
    onChange(normalizeKitData({ ...data, ...preset }))
    onStart()
  }

  const handleLoadExample = () => {
    const lang = data?.language || 'es'
    const esLang = lang === 'es'
    const subtemaEj = {
      nombre: esLang ? 'Algoritmos para procesos de la vida cotidiana' : 'Algorithms for everyday processes',
      producto: esLang ? 'Algoritmo escrito + diagrama de flujo de un proceso del entorno escolar' : 'Written algorithm + flowchart of a school environment process',
      evidencia: esLang ? 'Diagrama revisado + prueba de escritorio documentada paso a paso' : 'Reviewed diagram + step-by-step desk check documentation',
      prerequisito: esLang ? 'Comprensi\u00F3n de procesos secuenciales y condiciones' : 'Understanding of sequential processes and conditions',
    }
    const example = {
      route: data?.route || 'men',
      language: lang,
      institucion: esLang ? 'Colegio Distrital Ejemplo' : 'Example District School',
      ciudad: 'Bogot\u00E1',
      docente: esLang ? 'Mar\u00EDa Garc\u00EDa' : 'Maria Garcia',
      grado: '7\u00B0',
      mypYear: 'A\u00F1o 3',
      componente: 'solucion',
      competencia: esLang
        ? 'Resuelve problemas tecnol\u00F3gicos sencillos evaluando alternativas y seleccionando la m\u00E1s adecuada'
        : 'Solves simple technology problems by evaluating alternatives and selecting the most suitable',
      duracionProyecto: esLang ? '3 semanas (6 sesiones de 55 min)' : '3 weeks (6 sessions of 55 min)',
      duracionSimulador: '20',
      recursos: esLang ? 'Aula de inform\u00E1tica con 15 computadores, material reciclable, cartulinas' : 'Computer lab with 15 computers, recyclable material, poster board',
      restricciones: esLang ? 'Sin impresora 3D, celulares no permitidos en clase' : 'No 3D printer, phones not allowed in class',
      incluyeImagenes: true, maxImagenes: 3, puedenFotografiar: true,
      tieneNEE: true, tiposNEE: ['visual'],
      descripcionNEE: esLang ? '1 estudiante con baja visi\u00F3n' : '1 student with low vision',
      subtema: subtemaEj,
      subtemaPropio: subtemaEj.nombre,
    }
    onLoad({ data: example, step: 0 })
    if (onStartTour) onStartTour()
  }

  const handleDelete = (id, e) => {
    e.stopPropagation()
    lsDeleteKit(id)
    setSavedKits(lsGetKits())
  }

  return (
    <div className="min-h-full w-full max-w-3xl px-4 py-6 mx-auto sm:py-10">
      <OnboardingTour language={data?.language || 'es'} />

      {/* ── Kits guardados ARRIBA (usuarios que vuelven) ── */}
      {filteredSavedKits.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[#2b5a52]/15 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8e5e12] mb-2 flex items-center gap-1.5">
            <FiFolder className="text-[#2b5a52]" /> {en ? 'Continue where you left off' : 'Continúa donde dejaste'}
          </p>
          <div className="space-y-2">
            {filteredSavedKits.slice(0, 2).map((kit) => (
              <div key={kit.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-100 hover:border-[#2b5a52]/25 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{kit.preview.institucion || (en ? '(no institution)' : '(sin institución)')}</p>
                  <p className="text-xs text-gray-500 truncate">{kit.preview.grado} · {kit.preview.subtema || (en ? '(pending)' : '(pendiente)')}</p>
                </div>
                <button onClick={() => onLoad(kit)} className="text-xs px-3 py-1.5 bg-[#2b5a52] text-white rounded-lg font-semibold hover:bg-[#234a43] transition-colors flex-shrink-0">
                  {en ? 'Continue' : 'Continuar'}
                </button>
                <button onClick={(e) => handleDelete(kit.id, e)} className="text-gray-300 hover:text-red-400 p-1 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0" title={en ? 'Delete' : 'Eliminar'}>
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Hero compacto ── */}
      <div className="text-center mb-8">
        <img src={logoMM} alt="Maryam Math" className="mx-auto h-12 mb-4" />
        <h1 className="text-[2.2rem] sm:text-[2.8rem] leading-[1.05] text-[#173d37]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 800 }}>
          {en ? 'Create your teaching kit.' : 'Crea tu kit docente.'}
        </h1>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {(en
            ? ['Planning', 'Student guide', 'Rubric', 'Assessment', 'Family summary']
            : ['Planeación', 'Guía del estudiante', 'Rúbrica', 'Evaluación', 'Resumen familias']
          ).map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-[#2b5a52]/15 bg-[#2b5a52]/5 px-3 py-1.5 text-xs font-semibold text-[#2b5a52]">
              <FiCheck className="text-[10px] text-[#fbb041]" /> {item}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#8a9e98]">
          {en ? 'One connected flow · Ready in 10-15 minutes' : 'Un solo flujo conectado · Listo en 10-15 minutos'}
        </p>
        <div className="mt-5 rounded-xl bg-[#2b5a52] px-5 py-4 max-w-lg mx-auto text-center">
          <p className="text-sm text-white font-semibold leading-6">
            {en
              ? 'You design. This is your copilot.'
              : 'Tú diseñas. Esto es tu copiloto.'}
          </p>
          <p className="mt-1 text-xs text-white/70 leading-5">
            {en
              ? 'The platform generates the structure — your expertise in the area makes it exceptional.'
              : 'La plataforma genera la estructura — tu dominio del área la hace excepcional.'}
          </p>
        </div>
      </div>

      {/* ── Selector de ruta (compacto) ── */}
      <div className="mb-4" data-tour="rutas">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8e5e12] mb-2">{en ? 'Route' : 'Ruta'}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {CURRICULAR_ROUTES.map((route) => {
            const active = data?.route === route.id
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => onChange({
                  route: route.id,
                  rubrica: buildDefaultRubrica(route.id, data?.language || 'es'),
                  mypYear: route.id === 'ib_myp_design' ? (data?.mypYear || 'Año 1') : data?.mypYear,
                  grado: route.id === 'men' ? (data?.grado || '7°') : data?.grado,
                  paso1: '', paso2: '', paso3: '', paso4: '', paso5: '', paso6: '', paso7: '',
                })}
                className={`text-left rounded-xl border px-3.5 py-3 transition-all ${
                  active
                    ? 'border-[#2b5a52] bg-[#2b5a52]/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-[#2b5a52]/30'
                }`}
              >
                <p className="text-sm font-bold text-[#173d37]">{getRouteLabel(route.id, data?.language)}</p>
                <p className="text-xs text-[#5a7069] mt-0.5 leading-4">{getRouteDescription(route.id, data?.language)}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Selector de idioma (inline) ── */}
      <div className="mb-6" data-tour="idioma">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#8e5e12] mb-2">{en ? 'Language' : 'Idioma'}</p>
        <div className="flex gap-2">
          {LANGUAGES.map((language) => {
            const active = data?.language === language.id
            return (
              <button
                key={language.id}
                type="button"
                onClick={() => onChange({
                  language: language.id,
                  rubrica: buildDefaultRubrica(data?.route || 'men', language.id),
                  paso1: '', paso2: '', paso3: '', paso4: '', paso5: '', paso6: '', paso7: '',
                })}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  active ? 'border-[#2b5a52] bg-[#2b5a52]/5' : 'border-gray-200 hover:border-[#2b5a52]/30'
                }`}
              >
                {language.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CTA principal ── */}
      <div className="space-y-3">
        <button
          type="button"
          data-tour="empezar"
          onClick={data.route === 'stem' ? handleStemPreset : onStart}
          className="w-full py-4 bg-[#2b5a52] text-white rounded-2xl font-bold text-base hover:bg-[#234a43] active:scale-[0.98] transition-all shadow-lg shadow-[#2b5a52]/25 flex items-center justify-center gap-2"
        >
          {en ? 'Start my kit' : 'Crear mi kit'} <FiChevronRight />
        </button>
        <button
          type="button"
          data-tour="ejemplo"
          onClick={handleLoadExample}
          className="w-full py-3 rounded-2xl border-2 border-[#fbb041]/50 bg-[#fff8ec] text-sm font-bold text-[#9b6714] hover:-translate-y-0.5 transition-transform flex items-center justify-center gap-2"
        >
          {en ? 'Take a guided tour with a sample kit' : 'Haz un recorrido guiado con un kit de ejemplo'}
        </button>
      </div>

      {/* ── Cómo funciona (debajo del fold) ── */}
      <div className="mt-8 rounded-2xl border border-[#d7e3df] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8e5e12]">{en ? 'How it works' : 'Cómo funciona'}</p>
          <p className="text-[11px] text-[#8a9e98]">{en ? '~10-15 min · Saves automatically' : '~10-15 min · Se guarda automáticamente'}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { n: '01', icon: FiSliders, title: en ? 'Define' : 'Define', text: en ? 'Route, grade, challenge, resources and constraints.' : 'Ruta, grado, reto, recursos y restricciones.' },
            { n: '02', icon: FiPackage, title: en ? 'Generate' : 'Genera', text: en ? '7 documents auto-generated: guides, rubric, assessment, family summary.' : '7 documentos auto-generados: guías, rúbrica, evaluación, resumen familias.' },
            { n: '03', icon: FiCheck, title: en ? 'Use' : 'Usa', text: en ? 'Edit what you need, deliver to students, grade with the interactive rubric, share.' : 'Edita lo que necesites, entrega al estudiante, califica con la rúbrica interactiva, comparte.' },
          ].map((item) => (
            <div key={item.n} className="rounded-xl border border-[#e8f0ec] bg-[#f8fbfa] p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#2b5a52]/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="text-sm text-[#2b5a52]" />
                </div>
                <span className="text-xs font-black text-[#fbb041]">{item.n}</span>
              </div>
              <p className="text-sm font-bold text-[#173d37]">{item.title}</p>
              <p className="mt-1 text-xs text-[#5a7069] leading-5">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Bloque de confianza */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(en
            ? [{icon: FiUsers, t: 'No account needed'}, {icon: FiImage, t: 'Works on phone'}, {icon: FiSave, t: 'Auto-saves'}, {icon: FiCheck, t: 'Free'}, {icon: FiLock, t: '100% private'}]
            : [{icon: FiUsers, t: 'Sin cuenta ni registro'}, {icon: FiImage, t: 'Funciona en el celular'}, {icon: FiSave, t: 'Se guarda solo'}, {icon: FiCheck, t: 'Gratis'}, {icon: FiLock, t: '100% privado'}]
          ).map((item) => (
            <div key={item.t} className="flex items-center gap-2 rounded-xl border border-[#e8f0ec] bg-[#f8fbfa] px-3 py-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#2b5a52]/10 flex items-center justify-center flex-shrink-0">
                <item.icon className="text-xs text-[#2b5a52]" />
              </div>
              <span className="text-xs font-semibold text-[#2b5a52] leading-4">{item.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BlockA({ data, onChange }) {
  const logoInputRef = useRef()
  const [logoMode, setLogoMode] = useState('file') // 'file' | 'url'
  const [logoUrlDraft, setLogoUrlDraft] = useState('')
  const isEN = isEnglish(data)

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange({ logoUrl: ev.target.result, logoFileName: file.name, tienelogo: true })
    reader.readAsDataURL(file)
  }

  const handleLogoUrlConfirm = () => {
    const url = logoUrlDraft.trim()
    if (url) onChange({ logoUrl: url, logoFileName: 'logo-url', tienelogo: true })
  }

  const handleLogoRemove = () => {
    onChange({ logoUrl: '', logoFileName: '', tienelogo: false })
    setLogoUrlDraft('')
    setLogoMode('file')
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionTitle
        letter="A"
        title={isEN ? 'Institutional identity' : 'Identidad institucional'}
        desc={isEN ? 'Define the institutional signature that will frame the kit with credibility.' : 'Define la firma institucional que enmarcará el kit con credibilidad.'}
      />
      <div className="grid gap-5 lg:grid-cols-[1.22fr_.78fr]">
        <div className="rounded-[30px] border border-[#d7e3df] bg-[linear-gradient(180deg,#fffdfa_0%,#f7fbfa_100%)] p-5 shadow-[0_18px_42px_rgba(23,61,55,.06)]">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#dde9e5] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e5e12]">{isEN ? 'Institution panel' : 'Panel institucional'}</p>
              <p className="mt-1 text-xl text-[#173d37]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700 }}>
                {isEN ? 'Prepare the institutional presentation of the kit' : 'Prepara la presentación institucional del kit'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#d7e3df] bg-white px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#587069]">{isEN ? 'Visible in' : 'Visible en'}</p>
              <p className="text-sm font-black text-[#173d37]">{isEN ? 'Header and outputs' : 'Encabezado y salidas'}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label required>{isEN ? '1. Institution name' : '1. Nombre de la institución'}</Label>
              <Input value={data.institucion} onChange={(v) => onChange({ institucion: v })} placeholder={isEN ? 'Ex: Technical School La Esperanza' : 'Ej: I.E. Técnica La Esperanza'} />
            </div>
            <div>
              <Label>{isEN ? '2. City / campus' : '2. Ciudad / sede'}</Label>
              <Input value={data.ciudad} onChange={(v) => onChange({ ciudad: v })} placeholder={isEN ? 'Ex: Bogota, main campus' : 'Ej: Bogotá, sede principal'} />
            </div>
            <div>
              <Label>{isEN ? '3. Institutional logo' : '3. Logo institucional'} <span className="text-gray-400 font-normal">{isEN ? '(optional)' : '(opcional)'}</span></Label>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
              {data.logoUrl ? (
                <div className="mt-2 flex items-center gap-3 rounded-[24px] border border-[#2b5a52]/15 bg-[#2b5a52]/5 p-4">
                  <img src={data.logoUrl} alt="Logo" className="h-14 w-14 object-contain rounded-2xl bg-white border border-gray-100 p-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {data.logoFileName === 'logo-url'
                        ? (isEN ? 'Logo from URL' : 'Logo por URL')
                        : (data.logoFileName || (isEN ? 'Attached logo' : 'Logo adjunto'))}
                    </p>
                    <button type="button" onClick={handleLogoRemove} className="text-xs text-[#2b5a52] hover:underline mt-1">
                      {isEN ? 'Replace logo' : 'Cambiar logo'}
                    </button>
                  </div>
                  <button type="button" onClick={handleLogoRemove} className="text-[#68807a] hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50" title={isEN ? 'Remove logo' : 'Quitar logo'}>
                    <FiX />
                  </button>
                </div>
              ) : logoMode === 'url' ? (
                <div className="mt-2 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={logoUrlDraft}
                      onChange={(e) => setLogoUrlDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogoUrlConfirm()}
                      placeholder="https://colegio.edu.co/logo.png"
                      className="flex-1 rounded-2xl border border-[#c7d6d1] bg-[linear-gradient(180deg,#fffdf8_0%,#f9fbfa_100%)] px-4 py-3 text-sm text-[#173d37] focus:outline-none focus:border-[#2b5a52] focus:ring-4 focus:ring-[#2b5a52]/10"
                    />
                    <button
                      type="button"
                      onClick={handleLogoUrlConfirm}
                      disabled={!logoUrlDraft.trim()}
                      className="rounded-2xl bg-[#173d37] px-4 py-3 text-xs font-bold text-white transition-colors hover:bg-[#214740] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isEN ? 'Use URL' : 'Usar URL'}
                    </button>
                  </div>
                  <button type="button" onClick={() => setLogoMode('file')} className="text-sm text-[#5a7069] hover:text-[#173d37]">
                    {isEN ? '← Upload file instead' : '← Subir archivo'}
                  </button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-[24px] border-2 border-dashed border-[#2b5a52]/30 px-4 py-4 text-sm font-semibold text-[#2b5a52] transition-colors hover:border-[#2b5a52]/60 hover:bg-[#2b5a52]/5"
                  >
                    <FiUpload /> {isEN ? 'Add institutional logo' : 'Agregar logo institucional'}
                  </button>
                  <p className="text-xs text-[#5a7069] text-center">
                    PNG, JPG o SVG ·{' '}
                    <button type="button" onClick={() => setLogoMode('url')} className="underline hover:text-gray-600 transition-colors">
                      {isEN ? 'paste URL' : 'pegar URL'}
                    </button>
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label required>{isEN ? '4. Facilitating teacher name' : '4. Nombre del docente facilitador(a)'}</Label>
              <Input value={data.docente} onChange={(v) => onChange({ docente: v })} placeholder={isEN ? 'How the name should appear in the kit' : 'Como debe aparecer en el documento'} />
            </div>
          </div>
        </div>

        <aside className="rounded-[30px] border border-[#d7e3df] bg-[linear-gradient(180deg,#173d37_0%,#214740_100%)] p-5 text-white shadow-[0_18px_42px_rgba(23,61,55,.14)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f3cf86]">{isEN ? 'Trust signal' : 'Señal de confianza'}</p>
          <p className="mt-2 text-xl" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700 }}>
            {isEN ? 'Así se verá tu kit ante coordinación o familias.' : 'Así se verá tu kit ante coordinación o familias.'}
          </p>

          <div className="mt-5 space-y-3">
            {[
              isEN ? 'Use the institution name exactly as the school officially writes it.' : 'Usa el nombre institucional exactamente como lo escribe el colegio.',
              isEN ? 'A clean logo reinforces confidence, but the kit can work without it.' : 'Un logo limpio refuerza confianza, pero el kit puede funcionar sin él.',
              isEN ? 'The teacher name should be publishable as-is, without later edits.' : 'El nombre del docente debe quedar publicable, sin retoques posteriores.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm leading-6 text-white/92">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-[#f3cf86]/30 bg-[#fff5db] px-4 py-4 text-[#5c430e]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]">{isEN ? 'Institutional reading' : 'Lectura institucional'}</p>
            <p className="mt-1 text-sm leading-6">
              {isEN ? 'The platform should feel ready for coordination, leadership review and classroom use from the first screen.' : 'La plataforma debe sentirse lista para coordinación, revisión directiva y uso en aula desde la primera pantalla.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function BlockB({ data, onChange }) {
  const isIB = data.route === 'ib_myp_design'
  const isEN = isEnglish(data)
  const languageMeta = getLanguageMeta(data?.language)
  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionTitle
        letter="B"
        title={isEN ? 'Curricular route' : 'Ruta curricular'}
        desc={isEN ? 'Choose whether you will work with the MEN Technology and Computing kit or with the School Design kit.' : 'Elige si trabajarás con el kit MEN de Tecnología e Informática o con el kit de Diseño Escolar.'}
      />
      <div className="grid gap-5 lg:grid-cols-[1.24fr_.76fr]">
        <div className="rounded-[30px] border border-[#d7e3df] bg-[linear-gradient(180deg,#fffdfa_0%,#f7fbfa_100%)] p-5 shadow-[0_18px_42px_rgba(23,61,55,.06)]">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#dde9e5] pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e5e12]">{isEN ? 'Configuration panel' : 'Panel de configuración'}</p>
              <p className="mt-1 text-xl text-[#173d37]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700 }}>
                {isEN ? 'Define the curricular structure before generating content' : 'Define la estructura curricular antes de generar contenido'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#d7e3df] bg-white px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#587069]">{isEN ? 'Active route' : 'Ruta activa'}</p>
              <p className="text-sm font-black text-[#173d37]">
                {getRouteLabel(data.route, data.language)} · {languageMeta.label}
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <Label required>{isEN ? '5. Curricular route' : '5. Ruta curricular'}</Label>
              <div className="space-y-2">
                {CURRICULAR_ROUTES.map((route) => (
                  <div
                    key={route.id}
                    className={`flex items-start gap-3 rounded-[24px] border px-4 py-4 transition-all ${
                      data.route === route.id ? 'border-[#173d37] bg-[#173d37]/[0.04] shadow-[0_10px_20px_rgba(23,61,55,.08)]' : 'border-[#d7e3df] bg-white hover:border-[#2b5a52]/40 hover:-translate-y-0.5'
                    }`}
                  >
                    <input
                      id={`route-${route.id}`}
                      type="radio"
                      name="route"
                      value={route.id}
                      checked={data.route === route.id}
                      onChange={() => {
                        const base = {
                          ...INITIAL,
                          language: data.language || 'es',
                          route: route.id,
                        }
                        const preset = route.id === 'stem'
                          ? buildStemPreset(data.language || 'es')
                          : {
                            route: route.id,
                            componente: route.id === 'men' ? data.componente : '',
                            rubrica: buildDefaultRubrica(route.id, data.language),
                          }
                        onChange(normalizeKitData({ ...base, ...preset }))
                      }}
                      className="mt-0.5 accent-[#2b5a52]"
                    />
                    <label htmlFor={`route-${route.id}`} className="cursor-pointer">
                      <span className="block text-sm text-gray-800 font-semibold">{getRouteLabel(route.id, data.language)}</span>
                      <span className="block text-sm leading-6 text-[#526863] mt-1">{getRouteDescription(route.id, data.language)}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label required>{isEN ? '6. Kit language' : '6. Idioma del kit'}</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {LANGUAGES.map((language) => (
                  <div key={language.id} className={`flex items-start gap-3 rounded-[24px] border px-4 py-4 transition-all ${
                    data.language === language.id ? 'border-[#173d37] bg-[#173d37]/[0.04] shadow-[0_10px_20px_rgba(23,61,55,.08)]' : 'border-[#d7e3df] bg-white hover:border-[#2b5a52]/40 hover:-translate-y-0.5'
                  }`}>
                    <input
                      id={`language-${language.id}`}
                      type="radio"
                      name="language"
                      value={language.id}
                      checked={data.language === language.id}
                      onChange={() => {
                        if (data.route === 'stem') {
                          const fallbackGrade = data.grado || (data.stemBand ? (STEM_BANDS.find((b) => b.key === data.stemBand)?.grades[0]) : '9°') || '9°'
                          const defaults = buildStemBandDefaults(fallbackGrade, language.id, data)
                          onChange({
                            language: language.id,
                            ...defaults,
                            rubrica: defaults.rubrica || buildDefaultRubrica('stem', language.id),
                            paso1: '',
                            paso2: '',
                            paso3: '',
                            paso4: '',
                            paso5: '',
                            paso6: '',
                            paso7: '',
                          })
                          return
                        }
                        onChange({
                          language: language.id,
                          rubrica: buildDefaultRubrica(data.route, language.id),
                          paso1: '',
                          paso2: '',
                          paso3: '',
                          paso4: '',
                          paso5: '',
                          paso6: '',
                          paso7: '',
                        })
                      }}
                      className="mt-0.5 accent-[#2b5a52]"
                    />
                    <label htmlFor={`language-${language.id}`} className="cursor-pointer">
                      <span className="block text-sm text-gray-800 font-semibold">{language.label}</span>
                      <span className="block text-sm leading-6 text-[#526863] mt-1">{language.id === 'en' ? 'The generated kit, guide, rubric and evaluation will be produced in English.' : 'El kit, la guía, la rúbrica y la evaluación se generarán en español.'}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
            {data.route === 'stem' ? (
              <>
                <div>
                  <Label>{isEN ? '7. Band / focus' : '7. Banda / enfoque'}</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {STEM_BANDS.map((b) => {
                      const active = (data.stemBand && data.stemBand === b.key) || (!data.stemBand && b.grades.includes(data.grado))
                      return (
                        <button
                          key={b.key}
                          type="button"
                          onClick={() => {
                            const gradoDefault = b.grades[0]
                            const defaults = buildStemBandDefaults(gradoDefault, data.language, data)
                            onChange(normalizeKitData({
                              ...data,
                              stemBand: b.key,
                              grado: gradoDefault,
                              ...defaults,
                            }))
                          }}
                          className={`text-left rounded-2xl border px-3 py-3 transition-colors ${
                            active ? 'border-[#2b5a52] bg-[#2b5a52]/6 shadow-[0_8px_18px_rgba(43,90,82,.12)]' : 'border-[#d7e3df] bg-white hover:border-[#2b5a52]/35'
                          }`}
                        >
                          <p className="text-sm font-black text-[#173d37]">{isEN ? b.label.en : b.label.es}</p>
                          <p className="text-xs text-[#5b6f69] mt-1 leading-5">{isEN ? b.desc.en : b.desc.es}</p>
                          <p className="text-[11px] text-[#8e5e12] mt-1 font-semibold uppercase tracking-wide">{b.grades.join(' · ')}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {/* Grado sugerido ocultado para no duplicar selección; se mantiene en estado interno */}
              </>
            ) : (
              <div>
                <Label required>{isIB ? (isEN ? '7. Design year' : '7. Año de diseño') : (isEN ? '7. Grade' : '7. Grado')}</Label>
                <Select
                  value={isIB ? data.mypYear : data.grado}
                  onChange={(v) => onChange(isIB ? { mypYear: v } : { grado: v })}
                  options={isIB ? MYP_YEARS : GRADOS}
                />
              </div>
            )}
            {data.route === 'men' && (
              <>
                <div>
                  <Label required>{isEN ? '8. MEN component to prioritise' : '8. Componente MEN a priorizar'}</Label>
                  <div className="space-y-2">
                    {MEN_COMPONENTES.map((c) => (
                      <label key={c.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                    ${data.componente === c.id ? 'border-[#2b5a52] bg-[#2b5a52]/5' : 'border-gray-200 hover:border-[#2b5a52]/40'}`}>
                        <input
                          type="radio"
                          name="componente"
                          value={c.id}
                          checked={data.componente === c.id}
                          onChange={() => onChange({ componente: c.id })}
                          className="mt-0.5 accent-[#2b5a52]"
                        />
                        <span className="text-sm text-gray-700 leading-snug">{isEN ? translateMenText(c.label) : c.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>{isEN ? '9. Evidence / competency from your curriculum plan' : '9. Evidencia / competencia de tu plan de área'}</Label>
                  <Textarea
                    value={data.competencia}
                    onChange={(v) => onChange({ competencia: v })}
                    placeholder={isEN
                      ? 'Paste the competency from your curriculum plan here, or leave it blank and we will generate one aligned with MEN.'
                      : 'Pega aquí la competencia de tu plan de área, o deja vacío y la generaremos acorde al MEN.'}
                    rows={4}
                  />
                  <p className="mt-1 text-sm leading-6 text-[#5a7069]">{isEN ? 'If left blank, we will propose a competency aligned with MEN.' : 'Si lo dejas vacío, propondremos una competencia acorde al MEN.'}</p>
                </div>
              </>
            )}
            {isIB && (
              <div>
                <Label>{isEN ? '8. Design objective or focus ' : '8. Objetivo o foco de diseño '}<span className="text-[#5a7069] font-normal">{isEN ? '(optional)' : '(opcional)'}</span></Label>
                <Textarea
                  value={data.competencia}
                  onChange={(v) => onChange({ competencia: v })}
                  placeholder={isEN
                    ? 'Write the design objective or unit focus here. If left blank, we will use a default formulation aligned with the design cycle.'
                    : 'Escribe aquí el objetivo de diseño o el foco de la unidad. Si lo dejas vacío, usaremos una formulación base alineada al ciclo de diseño.'}
                  rows={4}
                />
                <p className="mt-1 text-sm leading-6 text-[#5a7069]">{isEN ? 'In the design route we preserve a design-centered logic instead of forcing literal equivalences with MEN.' : 'En la ruta de diseño preservamos una lógica propia de diseño, sin forzar equivalencias literales con MEN.'}</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-[30px] border border-[#d7e3df] bg-[linear-gradient(180deg,#173d37_0%,#214740_100%)] p-5 text-white shadow-[0_18px_42px_rgba(23,61,55,.14)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f3cf86]">{isEN ? 'Decision quality' : 'Calidad de decisión'}</p>
          <p className="mt-2 text-xl" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700 }}>
            {isEN ? 'This block defines the language, route and academic structure of the whole kit.' : 'Este bloque define el idioma, la ruta y la estructura académica de todo el kit.'}
          </p>

          <div className="mt-5 space-y-3">
            {[
              isIB
                ? (isEN ? 'Use design year and design focus as the organising frame.' : 'Usa año de diseño y foco de diseño como marco organizador.')
                : (isEN ? 'Use grade and MEN component as the organising frame.' : 'Usa grado y componente MEN como marco organizador.'),
              isEN ? 'A strong decision here avoids weak or contradictory outputs later.' : 'Una decisión fuerte aquí evita salidas débiles o contradictorias después.',
              isEN ? 'If the school already has official wording, paste it here instead of reinventing it.' : 'Si la institución ya tiene redacción oficial, pégala aquí en lugar de reinventarla.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm leading-6 text-white/92">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-[#f3cf86]/30 bg-[#fff5db] px-4 py-4 text-[#5c430e]">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]">{isEN ? 'Protected base' : 'Base protegida'}</p>
            <p className="mt-1 text-sm leading-6">
              {isEN ? 'The redesign can change presentation and confidence signals, but it must not alter MEN / Design separation or the core pedagogical flow.' : 'El rediseño puede cambiar presentación y señales de confianza, pero no debe alterar la separación MEN / Diseño ni el flujo pedagógico central.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

function BlockC({ data, onChange }) {
  const isEN = isEnglish(data)
  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionTitle
        letter="C"
        title={isEN ? 'Implementation conditions' : 'Condiciones de implementación'}
        desc={isEN ? 'Anchor the kit to the real operating conditions of your school.' : 'Ancla el kit a las condiciones reales de operación de tu institución.'}
      />
      <div className="grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
        <div className="rounded-[30px] border border-[#d7e3df] bg-[linear-gradient(180deg,#fffdfa_0%,#f7fbfa_100%)] p-5 shadow-[0_18px_42px_rgba(23,61,55,.06)]">
          <div className="mb-5 border-b border-[#dde9e5] pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e5e12]">{isEN ? 'Context setup' : 'Configuración de contexto'}</p>
            <p className="mt-1 text-xl text-[#173d37]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700 }}>
              {isEN ? 'Set the realistic conditions that will shape the kit' : 'Fija las condiciones reales que van a moldear el kit'}
            </p>
          </div>
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{isEN ? '10a. Project duration' : '10a. Duración del proyecto'}</Label>
                <Input value={data.duracionProyecto} onChange={(v) => onChange({ duracionProyecto: v })} placeholder={isEN ? 'Ex: 3 weeks' : 'Ej: 3 semanas'} />
              </div>
              <div>
                <Label>{isEN ? '10b. Session or simulator duration' : '10b. Duración del simulador'}</Label>
                <Input value={data.duracionSimulador} onChange={(v) => onChange({ duracionSimulador: v })} placeholder={isEN ? 'Ex: 20 min' : 'Ej: 20 min'} />
              </div>
            </div>
            <div>
              <Label>{isEN ? '11. Available resources' : '11. Recursos disponibles'}</Label>
              <Textarea
                value={data.recursos}
                onChange={(v) => onChange({ recursos: v })}
                placeholder={isEN ? 'Ex: Arduino, recycled materials, simulator only, 10 tablets...' : 'Ej: Arduino, materiales reciclados, solo simulador sin hardware, 10 tabletas...'}
                rows={4}
              />
            </div>
            <div>
              <Label>{isEN ? '12. Constraints to consider' : '12. Restricciones'}</Label>
              <Textarea
                value={data.restricciones}
                onChange={(v) => onChange({ restricciones: v })}
                placeholder={isEN ? 'Ex: limited internet, few devices, 45-minute classes, groups of 35 students...' : 'Ej: internet limitado, pocos equipos, clases de 45 min, grupos de 35 estudiantes...'}
                rows={4}
              />
            </div>
          </div>
        </div>

        <aside className="rounded-[30px] border border-[#d7e3df] bg-[linear-gradient(180deg,#fff9ed_0%,#fffef9_100%)] p-5 shadow-[0_18px_42px_rgba(23,61,55,.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e5e12]">{isEN ? 'Plan with what you have' : 'Planifica con lo que hay'}</p>
          <p className="mt-2 text-xl text-[#173d37]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700 }}>
            {isEN ? 'Describe the real conditions; the kit will adapt to them.' : 'Describe las condiciones reales; el kit se ajusta a ellas.'}
          </p>
          <div className="mt-5 space-y-3">
            {[
              isEN ? 'List only the resources you truly have available.' : 'Escribe solo los recursos que sí tienes a mano.',
              isEN ? 'Make limits visible early: time per session, devices, internet, group size.' : 'Haz visibles los límites: tiempo por sesión, dispositivos, internet, tamaño del grupo.',
              isEN ? 'Adjust activities to those limits before sharing.' : 'Ajusta las actividades a esos límites antes de compartir.',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[#ecdcb8] bg-white px-4 py-3">
                <p className="text-sm leading-6 text-[#4f4330]">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function BlockD({ data, onChange }) {
  const isEN = isEnglish(data)
  const toggleVisual = (tipo) => {
    const actual = data.tiposVisual || []
    if (actual.includes(tipo)) {
      onChange({ tiposVisual: actual.filter((t) => t !== tipo) })
    } else if (actual.length < 2) {
      onChange({ tiposVisual: [...actual, tipo] })
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionTitle
        letter="D"
        title={isEN ? 'Visual and inclusion support' : 'Apoyo visual e inclusión'}
        desc={isEN ? 'Define how the platform will guide, show and adapt the learning experience.' : 'Define cómo la plataforma orientará, mostrará y adaptará la experiencia de aprendizaje.'}
      />
      <div className="grid gap-5 lg:grid-cols-[1.18fr_.82fr]">
        <div className="rounded-[30px] border border-[#d7e3df] bg-[linear-gradient(180deg,#fffdfa_0%,#f7fbfa_100%)] p-5 shadow-[0_18px_42px_rgba(23,61,55,.06)]">
          <div className="mb-5 border-b border-[#dde9e5] pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e5e12]">{isEN ? 'Support configuration' : 'Configuración de apoyos'}</p>
            <p className="mt-1 text-xl text-[#173d37]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700 }}>
              {isEN ? 'Shape the visual guidance and accessibility layer of the kit' : 'Define la capa de guía visual y accesibilidad del kit'}
            </p>
          </div>
          <div className="space-y-5">
            <div>
              <Label>{isEN ? '13. Will you include real images or classroom photos?' : '13. ¿Incluirás imágenes reales/fotos del kit o del aula?'}</Label>
              <Toggle
                value={data.incluyeImagenes}
                onChange={(v) => onChange({ incluyeImagenes: v })}
                label={data.incluyeImagenes
                  ? (isEN ? 'Yes, I will include real images' : 'Sí, incluiré fotos reales')
                  : (isEN ? 'No, use the platform template only' : 'No, solo plantilla')}
              />
            </div>
            <div>
              <Label>{isEN ? '14. Preferred visual support type (choose up to 2)' : '14. Tipo de apoyo visual preferido (elige máximo 2)'}</Label>
              <div className="space-y-2">
                {TIPOS_VISUAL.map((t) => {
                  const sel = (data.tiposVisual || []).includes(t)
                  const max = (data.tiposVisual || []).length >= 2 && !sel
                  return (
                    <label key={t} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors
                      ${sel ? 'border-[#2b5a52] bg-[#2b5a52]/5' : max ? 'border-gray-100 opacity-50 cursor-not-allowed' : 'border-gray-200 hover:border-[#2b5a52]/40'}`}>
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => !max && toggleVisual(t)}
                        className="accent-[#2b5a52]"
                        disabled={max}
                      />
                      <span className="text-sm text-gray-700">{t}</span>
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <Label>{isEN ? '15. Maximum images per student guide' : '15. Máximo de imágenes por guía del estudiante'}</Label>
              <div className="flex gap-2">
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => onChange({ maxImagenes: n })}
                    className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-colors
                      ${data.maxImagenes === n ? 'bg-[#173d37] text-white border-[#173d37]' : 'border-gray-200 text-gray-600 hover:border-[#2b5a52]/40'}`}
                  >
                    {n} {isEN ? 'images' : 'imágenes'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>{isEN ? '16. Will the group be able to take photos during class?' : '16. ¿Tu grupo podrá tomar fotos/capturas durante la clase?'}</Label>
              <Toggle
                value={data.puedenFotografiar}
                onChange={(v) => onChange({ puedenFotografiar: v })}
                label={data.puedenFotografiar
                  ? (isEN ? 'Yes, devices or cameras are available' : 'Sí, tienen celular o cámara disponible')
                  : (isEN ? 'No, that will not be possible' : 'No, no es posible')}
              />
            </div>

            <div className="pt-2 border-t border-gray-100">
              <Label>{isEN ? '17. Are there students with special educational needs in this group?' : '17. ¿Tienes estudiantes con Necesidades Educativas Especiales (NEE)?'}</Label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ tieneNEE: false, tiposNEE: [] })}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-colors
                    ${!data.tieneNEE ? 'bg-[#173d37] text-white border-[#173d37]' : 'border-gray-200 text-gray-600 hover:border-[#2b5a52]/40'}`}
                >
                  {isEN ? 'No, not in this group' : 'No, en este grupo no'}
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ tieneNEE: true })}
                  className={`flex-1 rounded-2xl border py-3 text-sm font-semibold transition-colors
                    ${data.tieneNEE ? 'bg-[#173d37] text-white border-[#173d37]' : 'border-gray-200 text-gray-600 hover:border-[#2b5a52]/40'}`}
                >
                  {isEN ? 'Yes, include adjustments' : 'Sí, incluir adaptaciones'}
                </button>
              </div>
            </div>

            {data.tieneNEE && (
              <div>
                <Label>{isEN ? '18. SEN types present in the group' : '18. Tipos de NEE presentes en tu grupo (selecciona los que apliquen)'}</Label>
                <div className="space-y-2">
                  {NEE_TIPOS.map((t) => {
                    const sel = (data.tiposNEE || []).includes(t.id)
                    return (
                      <label key={t.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors
                        ${sel ? 'border-[#2b5a52] bg-[#2b5a52]/5' : 'border-gray-200 hover:border-[#2b5a52]/40'}`}>
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => {
                            const actual = data.tiposNEE || []
                            onChange({ tiposNEE: sel ? actual.filter((x) => x !== t.id) : [...actual, t.id] })
                          }}
                          className="accent-[#2b5a52]"
                        />
                        <span className="text-lg">{t.icon}</span>
                        <span className="text-sm text-gray-700">{t.label}</span>
                      </label>
                    )
                  })}
                </div>
                <div className="mt-3">
                  <Label>{isEN ? 'Additional description' : 'Descripción adicional'} <span className="text-gray-400 font-normal">{isEN ? '(optional)' : '(opcional)'}</span></Label>
                  <Textarea
                    value={data.descripcionNEE || ''}
                    onChange={(v) => onChange({ descripcionNEE: v })}
                    rows={3}
                    placeholder={isEN ? 'Ex: One learner with Down syndrome and another with mild hearing loss...' : 'Ej: Tengo un estudiante con síndrome de Down y otro con hipoacusia leve...'}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-[30px] border border-[#d7e3df] bg-[linear-gradient(180deg,#173d37_0%,#214740_100%)] p-5 text-white shadow-[0_18px_42px_rgba(23,61,55,.14)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f3cf86]">{isEN ? 'Tips for clarity' : 'Pistas para más claridad'}</p>
          <p className="mt-2 text-xl" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 700 }}>
            {isEN
              ? 'Help students understand what to do, with what, when, and what evidence to submit.'
              : 'Haz que el estudiante entienda qué hacer, con qué, cuándo y qué evidencias debe entregar.'}
          </p>
          <div className="mt-5 space-y-3">
            {[
              isEN ? 'Show 1–2 real photos or sketches; explain in one sentence what to observe.' : 'Muestra 1–2 fotos reales o bocetos; cuenta en una frase qué deben observar.',
              isEN ? 'Clarify the minimum evidence: process photos + data/measurement + adjustment after testing.' : 'Aclara la evidencia mínima: fotos del proceso + dato/medición + ajuste después de la prueba.',
              isEN ? 'Write specific times and deliverables: "15 min to measure, 10 min to adjust".' : 'Escribe tiempos y entregables concretos: "15 min para medir, 10 min para ajustar".',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-sm leading-6 text-white/84">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

function QuickAdvancedToggle({ value, onChange, isEN }) {
  const isQuick = value !== 'advanced'
  return (
    <div className="flex items-center gap-1 rounded-full border border-[#d7e3df] bg-white p-0.5 w-fit mb-4">
      <button
        type="button"
        onClick={() => onChange('quick')}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${isQuick ? 'bg-[#2b5a52] text-white' : 'text-[#5a7069] hover:text-[#2b5a52]'}`}
      >
        <FiZap className="text-xs" /> {isEN ? 'Quick' : 'Rápido'}
      </button>
      <button
        type="button"
        onClick={() => onChange('advanced')}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${!isQuick ? 'bg-[#2b5a52] text-white' : 'text-[#5a7069] hover:text-[#2b5a52]'}`}
      >
        <FiSliders className="text-xs" /> {isEN ? 'Advanced' : 'Avanzado'}
      </button>
    </div>
  )
}

function Paso0({ data, subtemas, onChange }) {
  const isIB = data.route === 'ib_myp_design'
  const isEN = isEnglish(data)
  const isQuickIB = isIB && (data.paso0Mode || 'quick') === 'quick'
  const componente = MEN_COMPONENTES.find((c) => c.id === data.componente)
  const ibSupport = buildIBSupport(data)
  const ibSuggestions = buildIBFieldSuggestions(data)
  const ibCoherence = buildIBCoherenceReport(data)
  const stemBand = data.route === 'stem'
    ? (data.stemBand ? STEM_BANDS.find((b) => b.key === data.stemBand) || getStemBand(data.grado) : getStemBand(data.grado))
    : null
  const [localSuggestions, setLocalSuggestions] = useState([])

  if (data.route === 'stem') {
    const areaOptions = [
      { id: 'science', label: isEN ? 'Science' : 'Ciencia' },
      { id: 'technology', label: isEN ? 'Technology' : 'Tecnología' },
      { id: 'engineering', label: isEN ? 'Engineering' : 'Ingeniería' },
      { id: 'arts', label: isEN ? 'Arts/Design' : 'Artes/Diseño' },
      { id: 'math', label: isEN ? 'Math' : 'Matemáticas' },
    ]
    const roleOptions = [
      { id: 'integracion', label: isEN ? 'Integration lead' : 'Líder de integración' },
      { id: 'construccion', label: isEN ? 'Build lead' : 'Líder de construcción' },
      { id: 'evidencias', label: isEN ? 'Evidence lead' : 'Líder de evidencias' },
      { id: 'tester', label: isEN ? 'Tester / data lead' : 'Tester / datos' },
    ]
    const applyChallenge = (challenge) => {
      const bandKey = stemBand?.key || 'innovadores'
      const pkg = buildStemPackage(currentDomain, bandKey, data.language, challenge.need || data.stemNeed || '') || challenge
      const rounds = buildStemRoundsFromChallenge(bandKey, data.language, pkg)
      updateStem({
        stemNeed: pkg.need,
        subtemaPropio: pkg.need,
        stemPrototype: pkg.prototype,
        stemMetric: pkg.metric,
        stemEvidenceLink: '',
        stemRounds: rounds,
        subtema: {
          nombre: pkg.need,
          producto: pkg.prototype,
          evidencia: pkg.evidence,
          prerequisito: isEN ? 'Agree roles and safety; be ready to test twice.' : 'Acordar roles y seguridad; estar listos para probar dos veces.',
        },
        paso5: pkg.guideStudent,
        paso4: pkg.guideTeacher,
        paso1: '',
        paso2: '',
        paso3: '',
        paso6: '',
        paso7: '',
        rubrica: getStemRubrica(bandKey, data.language),
      })
      setLocalSuggestions([pkg])
    }

    const currentDomain = detectStemDomain(data.stemNeed || '')
    const generateOptions = () => {
      const pkg = buildStemPackage(currentDomain, stemBand?.key || 'innovadores', data.language, (data.stemNeed || '').trim())
      if (pkg) {
        applyChallenge(pkg)
      } else {
        const fallback = getStemSuggestedChallenges(stemBand?.key || 'innovadores', isEN)
        if (fallback[0]) applyChallenge({ ...fallback[0], need: data.stemNeed || fallback[0].need })
        setLocalSuggestions(fallback)
      }
    }
    const suggestions = localSuggestions.length > 0 ? localSuggestions : []

    const autoSuggestFromNeed = () => {
      const need = (data.stemNeed || data.subtemaPropio || '').trim()
      const baseMetric = need
        ? (isEN ? `Measure improvement for: ${need}` : `Mide mejora para: ${need}`)
        : (isEN ? 'Define a quick metric (15–30 min) linked to your need.' : 'Define una métrica rápida (15–30 min) vinculada a la necesidad.')
      const basePrototype = need
        ? (isEN ? `Minimum prototype that responds to: ${need}` : `Prototipo mínimo que responda a: ${need}`)
        : (isEN ? 'Draft a minimum viable prototype you can test twice.' : 'Define un prototipo mínimo viable para probar dos veces.')

      applyChallenge({
        title: need || (isEN ? 'STEM / STEAM challenge' : 'Reto STEM / STEAM'),
        need: need || (isEN ? 'Define a real problem to solve.' : 'Define un problema real por resolver.'),
        prototype: data.stemPrototype?.trim() || basePrototype,
        metric: data.stemMetric?.trim() || baseMetric,
      })
    }

    const updateStem = (changes = {}) => {
      const next = { ...data, ...changes }
      const bandKey = next.stemBand || stemBand?.key || 'innovadores'

      // Si cambia la necesidad o la banda, recalculamos paquete coherente y limpiamos restos.
      const needChanged = (changes.stemNeed !== undefined && (changes.stemNeed || '').trim() !== (data.stemNeed || '').trim())
      const bandChanged = changes.stemBand !== undefined && changes.stemBand !== data.stemBand
      if (needChanged || bandChanged) {
        const pkg = buildStemCoherentPackage(next.stemNeed, bandKey, next.language || data.language)
        if (pkg) {
          next.stemPrototype = pkg.prototype
          next.stemMetric = pkg.metric
          next.subtemaPropio = pkg.need
          next.subtema = {
            nombre: pkg.need,
            producto: pkg.prototype,
            evidencia: pkg.evidence,
            prerequisito: next.subtema?.prerequisito || (isEN ? 'Agreements on roles, safety and accessibility' : 'Acuerdos de roles, seguridad y accesibilidad'),
          }
          next.paso4 = pkg.guideTeacher
          next.paso5 = pkg.guideStudent
          next.rubrica = getStemRubrica(bandKey, next.language || data.language)
          next.stemRounds = buildStemRoundsFromChallenge(bandKey, next.language || data.language, pkg)
          next.paso1 = ''
          next.paso2 = ''
          next.paso3 = ''
          next.paso6 = ''
          next.paso7 = ''
        }
      }

      // Si cambia prototipo/métrica/need y no hay rondas explícitas, regenerar.
      if (!changes.stemRounds && (changes.stemNeed !== undefined || changes.stemPrototype !== undefined || changes.stemMetric !== undefined)) {
        next.stemRounds = buildStemRoundsFromChallenge(bandKey, next.language || data.language, {
          title: next.subtemaPropio,
          need: next.stemNeed || data.stemNeed,
          prototype: next.stemPrototype || data.stemPrototype,
          metric: next.stemMetric || data.stemMetric,
        }, data)
      }
      const nombre = next.subtemaPropio?.trim() || next.stemNeed?.trim() || 'Reto STEM / STEAM'
      const producto = next.stemPrototype?.trim() || (isEN ? 'Prototype to test with users' : 'Prototipo para probar con usuarios')
      const evidencia = next.stemEvidenceLink?.trim()
        || next.stemMetric?.trim()
        || (isEN ? 'Photos, data and a short note per test.' : 'Fotos, datos y una nota corta por prueba.')
      onChange(normalizeKitData({
        ...next,
        subtema: {
          nombre,
          producto,
          evidencia,
          prerequisito: next.subtema?.prerequisito || (isEN ? 'Agreements on roles, safety and accessibility' : 'Acuerdos de roles, seguridad y accesibilidad'),
        },
      }))
    }

    const isQuickStem = (data.paso0Mode || 'quick') === 'quick'

    return (
      <div className="mx-auto w-full max-w-4xl space-y-4">
        <div>
          <span className="text-xs font-bold text-[#fbb041] uppercase tracking-wide">PASO 0</span>
          <h2 className="text-lg font-bold text-[#2b5a52]">{isEN ? 'STEM / STEAM challenge canvas' : 'Canvas de reto STEM / STEAM'}</h2>
          <p className="text-sm text-[#5a7069] mt-1 leading-6">
            {isEN
              ? 'Define an authentic need, users, integration of areas and the minimum prototype you will test twice.'
              : 'Define una necesidad auténtica, usuarios, integración de áreas y el prototipo mínimo que probarás dos veces.'}
          </p>
        </div>

        <QuickAdvancedToggle value={data.paso0Mode || 'quick'} onChange={(v) => onChange({ paso0Mode: v })} isEN={isEN} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label>{isEN ? 'Band / focus' : 'Banda / enfoque'}</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {STEM_BANDS.map((b) => {
                const active = stemBand?.key === b.key
                return (
                  <button
                    key={b.key}
                    type="button"
                    onClick={() => {
                      const gradoDefault = b.grades[0]
                      const defaults = buildStemBandDefaults(gradoDefault, data.language, data)
                      updateStem({
                        stemBand: b.key,
                        grado: gradoDefault,
                        ...defaults,
                      })
                    }}
                    className={`text-left rounded-2xl border px-3 py-3 transition-colors ${active ? 'border-[#2b5a52] bg-[#2b5a52]/5 shadow-[0_6px_14px_rgba(43,90,82,.12)]' : 'border-[#d7e3df] bg-white hover:border-[#2b5a52]/30'}`}
                  >
                    <p className="text-sm font-black text-[#173d37]">{isEN ? b.label.en : b.label.es}</p>
                    <p className="text-xs text-[#5b6f69] mt-1 leading-5">{isEN ? b.desc.en : b.desc.es}</p>
                    <p className="text-[11px] text-[#8e5e12] mt-1 font-semibold uppercase tracking-wide">{b.grades.join(' · ')}</p>
                  </button>
                )
              })}
            </div>
            {stemBand && (
              <div className="rounded-xl border border-[#2b5a52]/15 bg-[#2b5a52]/5 px-3 py-2">
                <p className="text-xs font-semibold text-[#2b5a52]">{isEN ? stemBand.label.en : stemBand.label.es}</p>
                <p className="text-[11px] text-[#4b6a63] leading-5">{isEN ? stemBand.desc.en : stemBand.desc.es}</p>
                <p className="text-[11px] text-[#8e5e12] font-bold uppercase tracking-[0.12em] mt-1">{stemBand.grades.join(' · ')}</p>
              </div>
            )}
            <Label required>{isEN ? 'Need / problem' : 'Necesidad / problema'}</Label>
            <p className="text-[11px] text-[#5a7069] mt-1">{isEN ? `Detected theme: ${STEM_DOMAINS.find((d) => d.id === currentDomain)?.label.en || 'Generic'}` : `Tema detectado: ${STEM_DOMAINS.find((d) => d.id === currentDomain)?.label.es || 'Genérico'}`}</p>
            <Textarea
              value={data.stemNeed}
              onChange={(v) => { setLocalSuggestions([]); updateStem({ stemNeed: v, subtemaPropio: v, stemPrototype: '', stemMetric: '', stemEvidenceLink: '', stemRounds: [] }) }}
              rows={3}
              placeholder={isEN ? 'Ex: reduce heat and stale air in crowded classrooms…' : 'Ej: reducir calor y aire cargado en aulas concurridas…'}
            />
            <div className="mt-2 space-y-2">
              <button
                type="button"
                disabled={!(data.stemNeed || '').trim().length}
                onClick={generateOptions}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                  (data.stemNeed || '').trim().length
                    ? 'bg-[#2b5a52] text-white hover:bg-[#234a43]'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isEN ? 'Generar opciones con esta necesidad' : 'Generar opciones con esta necesidad'}
              </button>

              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((opt, idx) => (
                    <button
                      key={`${opt.title}-${idx}`}
                      type="button"
                      onClick={() => applyChallenge({
                        title: opt.title,
                        need: data.stemNeed,
                        prototype: opt.prototype,
                        metric: opt.metric,
                        evidence: opt.evidence,
                      })}
                      className="rounded-full border border-[#2b5a52]/25 bg-white px-3 py-1.5 text-[11px] font-semibold text-[#2b5a52] hover:border-[#2b5a52]/60 hover:-translate-y-0.5 transition-transform"
                    >
                      {opt.title} · {opt.prototype}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!isQuickStem && (
              <>
                <Label>{isEN ? 'Users / context' : 'Usuarios / contexto'}</Label>
                <Textarea
                  value={data.stemUsers}
                  onChange={(v) => updateStem({ stemUsers: v })}
                  rows={2}
                  placeholder={isEN ? 'Who is affected? When and where?' : '¿Quiénes se afectan? ¿Cuándo y dónde?'}
                />
              </>
            )}
          </div>

          {!isQuickStem && <div className="space-y-3">
            <Label>{isEN ? 'Areas that must converge' : 'Áreas que deben converger'}</Label>
            <div className="flex flex-wrap gap-2">
              {areaOptions.map((a) => {
                const sel = (data.stemAreas || []).includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      const current = data.stemAreas || []
                      const nextAreas = sel ? current.filter((x) => x !== a.id) : [...current, a.id]
                      updateStem({ stemAreas: nextAreas })
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      sel ? 'bg-[#2b5a52] text-white border-[#2b5a52]' : 'bg-white border-[#d7e3df] text-[#34564f]'
                    }`}
                  >
                    {a.label}
                  </button>
                )
              })}
            </div>
            <Label>{isEN ? 'Impact (inclusion/sustainability)' : 'Impacto (inclusión/sostenibilidad)'}</Label>
            <Textarea
              value={data.stemImpact}
              onChange={(v) => updateStem({ stemImpact: v })}
              rows={2}
              placeholder={isEN ? 'Ex: reduce heat for students with asthma; reuses materials.' : 'Ej: reduce calor para estudiantes con asma; reutiliza materiales.'}
            />
          </div>}
        </div>

        {!isQuickStem && <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Label>{isEN ? 'Fast metric (15–30 min)' : 'Métrica rápida (15–30 min)'}</Label>
            <Input
              value={data.stemMetric}
              onChange={(v) => updateStem({ stemMetric: v })}
              placeholder={isEN ? 'Airflow change, clarity before/after, time saved…' : 'Cambio de flujo de aire, claridad antes/después, tiempo ahorrado…'}
            />
            <Label>{isEN ? 'Minimum viable prototype' : 'Prototipo mínimo viable'}</Label>
            <Textarea
              value={data.stemPrototype}
              onChange={(v) => updateStem({ stemPrototype: v })}
              rows={3}
              placeholder={isEN ? 'What will you build first that can be tested twice?' : '¿Qué construirás primero que se pueda probar dos veces?'}
            />
          </div>
          <div className="space-y-3">
            <Label>{isEN ? 'Roles' : 'Roles'}</Label>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((r) => {
                const sel = (data.stemRoles || []).includes(r.id)
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      const current = data.stemRoles || []
                      const nextRoles = sel ? current.filter((x) => x !== r.id) : [...current, r.id]
                      updateStem({ stemRoles: nextRoles })
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      sel ? 'bg-[#fbb041] text-[#70480d] border-[#fbb041]' : 'bg-white border-[#d7e3df] text-[#34564f]'
                    }`}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>
            <Label>{isEN ? 'Evidence folder link' : 'Enlace a carpeta de evidencias'}</Label>
            <Input
              value={data.stemEvidenceLink}
              onChange={(v) => updateStem({ stemEvidenceLink: v })}
              placeholder={isEN ? 'Drive/SharePoint link' : 'Enlace de Drive/SharePoint'}
            />
          </div>
        </div>}

        {!isQuickStem && <div className="grid gap-4 md:grid-cols-2">
          {(data.stemRounds || []).map((round, idx) => (
            <div key={idx} className="rounded-2xl border border-[#d7e3df] bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2b5a52]">
                {isEN ? `Test round ${idx + 1}` : `Ronda de prueba ${idx + 1}`}
              </p>
              <Label className="mt-2">{isEN ? 'What will you test?' : '¿Qué probarás?'}</Label>
              <Textarea
                value={round.focus}
                onChange={(v) => {
                  const next = [...data.stemRounds]
                  next[idx] = { ...next[idx], focus: v }
                  updateStem({ stemRounds: next })
                }}
                rows={2}
              />
              <Label className="mt-2">{isEN ? 'Evidence/data captured' : 'Evidencia/datos capturados'}</Label>
              <Textarea
                value={round.evidence}
                onChange={(v) => {
                  const next = [...data.stemRounds]
                  next[idx] = { ...next[idx], evidence: v }
                  updateStem({ stemRounds: next })
                }}
                rows={2}
              />
              <Label className="mt-2">{isEN ? 'Adjustment after test' : 'Ajuste después de la prueba'}</Label>
              <Textarea
                value={round.adjustment}
                onChange={(v) => {
                  const next = [...data.stemRounds]
                  next[idx] = { ...next[idx], adjustment: v }
                  updateStem({ stemRounds: next })
                }}
                rows={2}
              />
              <div className="mt-2 rounded-lg bg-[#f7fbfa] border border-[#d7e3df] px-3 py-2 text-[11px] text-[#2b5a52]">
                <p className="font-semibold">{isEN ? 'Rubric focus' : 'Enfoque de rúbrica'}</p>
                {(data.rubrica?.criterios || []).slice(idx, idx + 1).map((c) => (
                  <p key={c.nombre} className="leading-5">
                    {c.nombre} · {c.pct}% — {isEN ? 'Aim for the S-level description.' : 'Apunta a la descripción de nivel S.'}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>}

        {/* Quick mode: summary card */}
        {isQuickStem && data.stemPrototype && (
          <div className="rounded-2xl border border-[#2b5a52]/15 bg-[#f8faf9] p-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#2b5a52]">{isEN ? 'Auto-generated package' : 'Paquete auto-generado'}</p>
            <p className="text-sm text-gray-700"><strong>{isEN ? 'Prototype:' : 'Prototipo:'}</strong> {data.stemPrototype}</p>
            <p className="text-sm text-gray-700"><strong>{isEN ? 'Metric:' : 'Métrica:'}</strong> {data.stemMetric}</p>
            {(data.stemRounds || []).map((r, i) => (
              <p key={i} className="text-xs text-[#5a7069]">{isEN ? `Round ${i + 1}:` : `Ronda ${i + 1}:`} {r.focus}</p>
            ))}
            <p className="text-[11px] text-[#8e5e12] mt-2 italic">
              {isEN ? 'Switch to Advanced to customize all fields.' : 'Cambia a Avanzado para personalizar todos los campos.'}
            </p>
          </div>
        )}

        <div className="p-4 rounded-2xl border border-[#2b5a52]/15 bg-[#2b5a52]/5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2b5a52] mb-2">{isEN ? 'Suggested challenges' : 'Retos sugeridos'}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {suggestions.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => applyChallenge(s)}
                className="text-left rounded-2xl border border-[#d7e3df] bg-white p-3 shadow-sm hover:border-[#2b5a52]/40 transition-colors"
              >
                <p className="text-sm font-bold text-[#173d37]">{s.title}</p>
                <p className="text-xs text-gray-600 mt-1">{s.need}</p>
                <p className="text-[11px] text-[#2b5a52] mt-1">{isEN ? 'Prototype:' : 'Prototipo:'} {s.prototype}</p>
                <p className="text-[11px] text-[#8e5e12]">{isEN ? 'Metric:' : 'Métrica:'} {s.metric}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={autoSuggestFromNeed}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#2b5a52] border border-[#2b5a52]/20 shadow-sm hover:-translate-y-0.5 transition-transform"
          >
            {isEN ? 'Propose metric and prototype from this need' : 'Proponer métrica y prototipo con esta necesidad'}
          </button>
        </div>
      </div>
    )
  }

  const syncIBSubtema = (changes = {}) => {
    const next = {
      ibNeed: data.ibNeed || '',
      ibOutcome: data.ibOutcome || '',
      ibEvidence: data.ibEvidence || '',
      ibPrereq: data.ibPrereq || '',
      subtemaPropio: data.subtemaPropio || '',
      ...changes,
    }
    const nombre = next.subtemaPropio.trim() || next.ibNeed.trim()
    return {
      ...changes,
      subtema: nombre
        ? {
          nombre,
          producto: next.ibOutcome.trim() || '[definir producto, prototipo o sistema]',
          evidencia: next.ibEvidence.trim() || '[definir evidencia del proceso y de la solucion]',
          prerequisito: next.ibPrereq.trim() || '[definir conocimientos o habilidades previas]',
        }
        : null,
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-5">
        <span className="text-xs font-bold text-[#fbb041] uppercase tracking-wide">PASO 0</span>
        <h2 className="text-lg font-bold text-[#2b5a52]">{isIB ? 'Selección del reto de diseño' : 'Menú curricular y selección de subtema'}</h2>
        <p className="text-sm text-[#5a7069] mt-1 leading-6">
          {isIB
            ? 'Define el reto o proyecto central con el que trabajarás este kit en la ruta de Diseño Escolar.'
            : 'Elige el subtema concreto con el que trabajarás este kit.'}
        </p>
      </div>

      {/* Temas del componente elegido */}
      {!isIB && componente && (
        <div className="mb-6 p-4 bg-[#2b5a52]/5 rounded-xl border border-[#2b5a52]/10">
          <p className="text-xs font-semibold text-[#2b5a52] uppercase tracking-wide mb-2">
            Temas frecuentes — {componente.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {componente.temas.map((t) => (
              <span key={t} className="text-xs bg-white border border-[#2b5a52]/20 text-gray-600 px-2 py-1 rounded-lg">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Subtemas propuestos */}
      {!isIB && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">
            Subtemas propuestos para <strong>{data.grado}</strong> — elige uno o escribe el tuyo:
          </p>
          <div className="space-y-3 mb-4">
            {subtemas.map((s, i) => {
              const sel = data.subtema?.nombre === s.nombre
              return (
                <button
                  key={i}
                  onClick={() => onChange({ subtema: s })}
                  className={`w-full text-left p-4 rounded-xl border transition-colors
                    ${sel ? 'border-[#2b5a52] bg-[#2b5a52]/5' : 'border-gray-200 hover:border-[#2b5a52]/40 bg-white'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center
                      ${sel ? 'border-[#2b5a52] bg-[#2b5a52]' : 'border-gray-300'}`}>
                      {sel && <FiCheck className="text-white text-xs" />}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{i + 1}. {s.nombre}</p>
                      <p className="text-sm leading-6 text-[#526863] mt-1">📦 Producto: {s.producto}</p>
                      <p className="text-sm leading-6 text-[#526863]">📋 Evidencia: {s.evidencia}</p>
                      <p className="text-sm leading-6 text-[#5a7069]">🔑 Prerrequisito: {s.prerequisito}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {isIB && (
        <div className="mb-4 rounded-xl border border-[#173d37]/10 bg-[linear-gradient(135deg,#fffaf1_0%,#f8fbfa_100%)] p-4 space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#8e5e12]">Ruta de Diseño Escolar</p>
            <p className="mt-2 text-sm text-gray-700 leading-relaxed">{isEN ? 'Set the curricular frame for the design brief.' : 'Define el marco curricular del reto de diseño.'}</p>
          </div>

          <QuickAdvancedToggle value={data.paso0Mode || 'quick'} onChange={(v) => onChange({ paso0Mode: v })} isEN={isEN} />

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#2b5a52] mb-2">{isEN ? 'Design criterion focus' : 'Foco de criterio de diseño'}</p>
              <div className="space-y-2">
                {IB_DESIGN_CRITERIA.map((criterion) => (
                  <button
                    key={criterion.id}
                    type="button"
                    onClick={() => onChange({ ibCriterion: criterion.id })}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                      data.ibCriterion === criterion.id ? 'border-[#2b5a52] bg-white' : 'border-[#2b5a52]/10 bg-white/70 hover:border-[#2b5a52]/30'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-800">{isEN ? criterion.label : criterion.labelEs}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{isEN ? criterion.title : criterion.titleEs}</p>
                  </button>
                ))}
              </div>
            </div>

            {!isQuickIB ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#2b5a52] mb-2">{isEN ? 'Global context' : 'Contexto global'}</p>
                  <Select
                    value={data.ibGlobalContext}
                    onChange={(v) => onChange({ ibGlobalContext: v })}
                    options={IB_GLOBAL_CONTEXTS.map((item) => ({ value: item.id, label: getIBLabel(item, isEN) }))}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#2b5a52] mb-2">{isEN ? 'Key concept' : 'Concepto clave'}</p>
                    <Select
                      value={data.ibKeyConcept}
                      onChange={(v) => onChange({ ibKeyConcept: v })}
                      options={IB_KEY_CONCEPTS.map((item) => ({ value: item.id, label: getIBLabel(item, isEN) }))}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#2b5a52] mb-2">{isEN ? 'Related concept' : 'Concepto relacionado'}</p>
                    <Select
                      value={data.ibRelatedConcept}
                      onChange={(v) => onChange({ ibRelatedConcept: v })}
                      options={IB_RELATED_CONCEPTS.map((item) => ({ value: item.id, label: getIBLabel(item, isEN) }))}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center text-xs text-[#5a7069] italic">
                {isEN ? 'Context and concepts use defaults.' : 'Contexto y conceptos usan valores predeterminados.'}
              </div>
            )}
          </div>

          {!isQuickIB && (
            <div className="rounded-xl border border-[#2b5a52]/10 bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#8e5e12] mb-2">{isEN ? 'Curricular support' : 'Apoyo curricular'}</p>
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>{isEN ? 'Focus' : 'Enfoque'}:</strong> {ibSupport.focus}</p>
                <p><strong>{isEN ? 'Guiding inquiry' : 'Pregunta orientadora'}:</strong> {ibSupport.inquiry}</p>
                <p><strong>{isEN ? 'Suggested brief' : 'Formulación sugerida'}:</strong> {ibSupport.brief}</p>
                <p><strong>{isEN ? 'Selected objective' : 'Objetivo que arrastra este criterio'}:</strong> {isEN ? ibCoherence.guide.objective : ibCoherence.guide.objectiveEs}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {isIB ? (
        <div className="space-y-4">
          {!isQuickIB && <div className="rounded-xl border border-[#2b5a52]/10 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#8e5e12] mb-2">{isEN ? 'Teaching support' : 'Apoyo al docente'}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>{isEN ? 'Focus' : 'Enfoque'}:</strong> {ibSupport.focus}</p>
              <p><strong>{isEN ? 'Guiding inquiry' : 'Pregunta orientadora'}:</strong> {ibSupport.inquiry}</p>
              <p><strong>{isEN ? 'Suggested brief' : 'Brief sugerido'}:</strong> {ibSupport.brief}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange(syncIBSubtema({ ibNeed: ibCoherence.recommendedNeed }))}
                className="rounded-lg border border-[#2b5a52]/20 bg-[#f8faf9] px-3 py-1.5 text-xs font-semibold text-[#2b5a52] hover:bg-[#eef4f2]"
              >
                {isEN ? 'Use suggested need' : 'Usar necesidad sugerida'}
              </button>
              <button
                type="button"
                onClick={() => onChange(syncIBSubtema({ ibOutcome: ibCoherence.recommendedOutcome }))}
                className="rounded-lg border border-[#2b5a52]/20 bg-[#f8faf9] px-3 py-1.5 text-xs font-semibold text-[#2b5a52] hover:bg-[#eef4f2]"
              >
                {isEN ? 'Use suggested outcome' : 'Usar producto sugerido'}
              </button>
            </div>
          </div>}

          {!isQuickIB && <div className="rounded-xl border border-[#173d37]/12 bg-[#f8faf9] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#2b5a52] mb-2">{isEN ? 'Curricular coherence filter' : 'Filtro de coherencia curricular'}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>{isEN ? 'This criterion expects' : 'Este criterio espera'}:</strong> {isEN ? ibCoherence.guide.objective : ibCoherence.guide.objectiveEs}</p>
              <p><strong>{isEN ? 'Best-fit outcome' : 'Producto que mejor encaja'}:</strong> {isEN ? ibCoherence.guide.outcome : ibCoherence.guide.outcomeEs}</p>
              <p><strong>{isEN ? 'Evidence that should appear' : 'Evidencia que deberia aparecer'}:</strong> {isEN ? ibCoherence.guide.evidence : ibCoherence.guide.evidenceEs}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange(syncIBSubtema({
                  ibNeed: hasMeaningfulText(data.ibNeed) ? data.ibNeed.trim() : ibCoherence.recommendedNeed,
                  ibOutcome: ibCoherence.recommendedOutcome,
                  ibEvidence: ibCoherence.recommendedEvidence,
                }))}
                className="rounded-lg border border-[#2b5a52]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#2b5a52] hover:bg-[#eef4f2]"
              >
                {isEN ? 'Align fields to criterion' : 'Alinear campos al criterio'}
              </button>
              <button
                type="button"
                onClick={() => onChange(syncIBSubtema({ ibOutcome: ibCoherence.recommendedOutcome }))}
                className="rounded-lg border border-[#2b5a52]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#2b5a52] hover:bg-[#eef4f2]"
              >
                {isEN ? 'Replace outcome only' : 'Reemplazar solo producto'}
              </button>
              <button
                type="button"
                onClick={() => onChange(syncIBSubtema({ ibEvidence: ibCoherence.recommendedEvidence }))}
                className="rounded-lg border border-[#2b5a52]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#2b5a52] hover:bg-[#eef4f2]"
              >
                {isEN ? 'Replace evidence only' : 'Reemplazar solo evidencia'}
              </button>
            </div>
            {ibCoherence.issues.length > 0 ? (
              <div className="mt-3 space-y-2">
                {ibCoherence.issues.map((issue, idx) => (
                  <div
                    key={`${issue.field}-${idx}`}
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      issue.severity === 'high'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {issue.severity === 'high'
                      ? (isEN ? 'Incoherent with selected objective: ' : 'No coherente con el objetivo seleccionado: ')
                      : (isEN ? 'Still weak: ' : 'Todavia debil: ')}
                    {issue.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                {isEN ? 'The current challenge, outcome and evidence are coherent with the selected design criterion.' : 'El reto, el producto y la evidencia actuales son coherentes con el criterio de diseño seleccionado.'}
              </div>
            )}
          </div>}

          {!isQuickIB && <IBProposalAssistant
            data={data}
            onApply={(proposal) => onChange(syncIBSubtema({
              ibNeed: proposal.need || data.ibNeed || '',
              subtemaPropio: proposal.need || data.subtemaPropio || '',
              ibOutcome: proposal.outcome || data.ibOutcome || '',
              ibEvidence: proposal.evidence || data.ibEvidence || '',
              ibPrereq: proposal.prereq || data.ibPrereq || '',
            }))}
          />}

          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">{isEN ? '1. Need or problem to solve' : '1. Necesidad o problema a resolver'}</p>
            <Textarea
              value={data.ibNeed || ''}
              onChange={(v) => onChange(syncIBSubtema({ ibNeed: v, subtemaPropio: v }))}
              rows={3}
              placeholder={isEN ? 'Example: Cable clutter affects safety and organization in the classroom.' : 'Ej: El desorden de cables afecta la seguridad y la organización del aula.'}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {ibSuggestions.need.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onChange(syncIBSubtema({ ibNeed: item, subtemaPropio: item }))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-[#2b5a52]/30 hover:text-[#2b5a52]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">{isEN ? '2. Expected product, prototype or system' : '2. Producto, prototipo o sistema esperado'}</p>
            <Input
              value={data.ibOutcome || ''}
              onChange={(v) => onChange(syncIBSubtema({ ibOutcome: v }))}
              placeholder={isEN ? 'Example: Modular cable organizer with reusable sections' : 'Ej: Organizador modular de cables con piezas reutilizables'}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {ibSuggestions.outcome.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onChange(syncIBSubtema({ ibOutcome: item }))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-[#2b5a52]/30 hover:text-[#2b5a52]"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          {!isQuickIB ? (
            <>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">{isEN ? '3. Evidence of process and solution' : '3. Evidencia del proceso y de la solución'}</p>
                <Input
                  value={data.ibEvidence || ''}
                  onChange={(v) => onChange(syncIBSubtema({ ibEvidence: v }))}
                  placeholder={isEN ? 'Example: Annotated sketch, prototype photos and short design reflection' : 'Ej: Boceto comentado, fotos del prototipo y reflexión breve de diseño'}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {ibSuggestions.evidence.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onChange(syncIBSubtema({ ibEvidence: item }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-[#2b5a52]/30 hover:text-[#2b5a52]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">{isEN ? '4. Prior knowledge or skills needed' : '4. Conocimientos o habilidades previas'}</p>
                <Input
                  value={data.ibPrereq || ''}
                  onChange={(v) => onChange(syncIBSubtema({ ibPrereq: v }))}
                  placeholder={isEN ? 'Example: Basic sketching, measuring and collaborative work' : 'Ej: Bocetación básica, medición simple y trabajo colaborativo'}
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {ibSuggestions.prereq.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onChange(syncIBSubtema({ ibPrereq: item }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-[#2b5a52]/30 hover:text-[#2b5a52]"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-[#2b5a52]/10 bg-[#f8faf9] p-3 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#2b5a52]">{isEN ? 'Auto-configured' : 'Auto-configurado'}</p>
              <p className="text-xs text-[#5a7069]">{isEN ? 'Evidence, prior knowledge, and design concepts are set from the coherence engine.' : 'Evidencia, prerrequisitos y conceptos de diseño configurados desde el motor de coherencia.'}</p>
              <button
                type="button"
                onClick={() => onChange(syncIBSubtema({
                  ibEvidence: ibCoherence.recommendedEvidence,
                  ibPrereq: ibSuggestions.prereq?.[0] || '',
                }))}
                className="rounded-lg border border-[#2b5a52]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#2b5a52] hover:bg-[#eef4f2]"
              >
                {isEN ? 'Auto-align evidence and prerequisites' : 'Auto-alinear evidencia y prerrequisitos'}
              </button>
              <p className="text-[11px] text-[#8e5e12] italic">{isEN ? 'Switch to Advanced to customize all fields.' : 'Cambia a Avanzado para personalizar todos los campos.'}</p>
            </div>
          )}

          {data.subtema && (
            <div className="rounded-xl border border-[#2b5a52]/15 bg-[#f8faf9] p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#2b5a52] mb-2">{isEN ? 'Generated design brief' : 'Ficha de reto generada'}</p>
              <div className="space-y-1.5 text-sm text-gray-700">
                <p><strong>{isEN ? 'Challenge' : 'Reto'}:</strong> {data.subtema.nombre}</p>
                <p><strong>{isEN ? 'Expected outcome' : 'Producto esperado'}:</strong> {data.subtema.producto}</p>
                <p><strong>{isEN ? 'Evidence' : 'Evidencia'}:</strong> {data.subtema.evidencia}</p>
                <p><strong>{isEN ? 'Prior knowledge' : 'Prerrequisito'}:</strong> {data.subtema.prerequisito}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">O escribe tu propio subtema:</p>
          <Input
            value={data.subtemaPropio || ''}
            onChange={(v) => {
              onChange({
                subtemaPropio: v,
                subtema: v.trim()
                  ? {
                    nombre: v,
                    producto: '[definir producto]',
                    evidencia: '[definir evidencia]',
                    prerequisito: '[definir prerrequisito]',
                  }
                  : data.subtema,
              })
            }}
            placeholder="Ej: Control de riego automático con sensor de humedad"
          />
        </div>
      )}

      {/* ── Bloque Simulador Maryam Math ── */}
      {data.subtema && (
        <SimuladorPromptBlock subtema={data.subtema} data={data} componenteLabel={
          MEN_COMPONENTES.find((c) => c.id === data.componente)?.label || ''
        } />
      )}
    </div>
  )
}

// ─── Bloque de prompt del Simulador Maryam Math ───────────────────────────────
function IBProposalAssistant({ data, onApply }) {
  const [copied, setCopied] = useState(false)
  const [raw, setRaw] = useState('')
  const isEN = isEnglish(data)
  const prompt = buildIBProposalPrompt(data)
  const proposals = parseAIProposalResponse(raw)

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="rounded-xl border border-[#2b5a52]/15 bg-[linear-gradient(135deg,#f8fbfa_0%,#fffaf1_100%)] p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">AI</span>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#8e5e12]">{isEN ? 'AI proposal assistant' : 'Asistente de propuestas con IA'}</p>
          <p className="mt-1 text-sm text-gray-700">{isEN ? 'Generate 3 design brief options and apply the one that best fits your class.' : 'Genera 3 opciones de brief de diseño y aplica la que mejor encaje con tu clase.'}</p>
        </div>
        <AILinks compact />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg bg-[#2b5a52] px-3 py-2 text-xs font-bold text-white hover:bg-[#234a43]"
        >
          {copied ? (isEN ? 'Prompt copied' : 'Prompt copiado') : (isEN ? 'Copy AI prompt' : 'Copiar prompt para IA')}
        </button>
      </div>

      <div className="mt-3">
        <p className="text-xs font-medium text-gray-600 mb-1">{isEN ? 'Paste the AI response here' : 'Pega aquí la respuesta de la IA'}</p>
        <Textarea
          value={raw}
          onChange={setRaw}
          rows={7}
          placeholder={isEN ? 'Paste the JSON response with proposals here' : 'Pega aquí el JSON con las propuestas'}
        />
      </div>

      {proposals.length > 0 && (
        <div className="mt-4 space-y-3">
          {proposals.map((proposal, idx) => (
            <div key={`${proposal.title || 'proposal'}-${idx}`} className="rounded-xl border border-[#2b5a52]/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[#173d37]">{proposal.title || `${isEN ? 'Proposal' : 'Propuesta'} ${idx + 1}`}</p>
                  {proposal.rationale && <p className="text-xs text-gray-500 mt-1">{proposal.rationale}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => onApply(proposal)}
                  className="rounded-lg border border-[#2b5a52]/20 bg-[#f8faf9] px-3 py-1.5 text-xs font-semibold text-[#2b5a52] hover:bg-[#eef4f2]"
                >
                  {isEN ? 'Apply' : 'Aplicar'}
                </button>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-gray-700">
                <p><strong>{isEN ? 'Need' : 'Necesidad'}:</strong> {proposal.need}</p>
                <p><strong>{isEN ? 'Outcome' : 'Producto'}:</strong> {proposal.outcome}</p>
                <p><strong>{isEN ? 'Evidence' : 'Evidencia'}:</strong> {proposal.evidence}</p>
                <p><strong>{isEN ? 'Prereq' : 'Prerrequisito'}:</strong> {proposal.prereq}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SimuladorPromptBlock({ subtema, data, componenteLabel }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(true)
  const isEN = isEnglish(data)
  const prompt = generarPromptSimulador(subtema, getLevelValue(data), componenteLabel, data)

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="mt-6 rounded-2xl overflow-hidden border-2 border-[#2b5a52]/20 shadow-sm">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-[#2b5a52] hover:bg-[#234a43] transition-colors text-left"
      >
        <span className="text-2xl flex-shrink-0">🤖</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">{isEN ? 'AI planning prompt ready to use' : 'Prompt listo para apoyo IA docente'}</p>
          <p className="text-white/70 text-xs mt-0.5">
            {isEN
              ? `Copy it into your preferred AI tool to prepare a ${data.duracionSimulador || '15-20'} min planning block`
              : `Copialo y pegalo en tu IA preferida para preparar un bloque de ${data.duracionSimulador || '15-20'} min`}
          </p>
        </div>
        <AILinks compact stopClick />
        <FiChevronRight className={`text-white/60 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {/* Prompt body */}
      {open && (
        <div className="bg-[#f8faf9]">
          {/* Tips strip */}
          <div className="flex gap-4 px-5 py-3 bg-[#2b5a52]/5 border-b border-[#2b5a52]/10 overflow-x-auto">
            {(isEN
              ? [
                '1. Copy the full prompt',
                '2. Open it in Claude, ChatGPT or Gemini',
                '3. Bring the best ideas into STEP 4 and STEP 5',
              ]
              : [
                '1. Copia el prompt completo',
                '2. Abrelo en Claude, ChatGPT o Gemini',
                '3. Lleva las mejores ideas al PASO 4 y al PASO 5',
              ]).map((tip, i) => (
              <span key={i} className="text-[10px] text-[#2b5a52] font-semibold whitespace-nowrap flex items-center gap-1">
                <span className="w-4 h-4 rounded-full bg-[#2b5a52] text-white flex items-center justify-center text-[9px] flex-shrink-0">
                  {i + 1}
                </span>
                {tip.slice(3)}
              </span>
            ))}
          </div>

          {/* Prompt text */}
          <div className="p-4">
            <textarea
              readOnly
              value={prompt}
              rows={16}
              className="w-full text-xs font-mono text-gray-700 bg-white border border-gray-200
                rounded-xl p-4 resize-none leading-relaxed focus:outline-none focus:border-[#2b5a52]/40
                selection:bg-[#2b5a52]/15"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-[10px] text-gray-400">
                {isEN
                  ? 'This prompt updates automatically with your route, language and project decisions.'
                  : 'Este prompt se actualiza automaticamente con tu ruta, idioma y decisiones del proyecto.'}
              </p>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold
                  transition-all active:scale-95
                  ${copied
          ? 'bg-green-500 text-white'
          : 'bg-[#fbb041] text-white hover:bg-[#f5a832] shadow-md shadow-[#fbb041]/25'}`}
              >
                {copied
                  ? <><FiCheck /> {isEN ? 'Copied' : 'Copiado'}</>
                  : <><FiLink /> {isEN ? 'Copy prompt' : 'Copiar prompt'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getSugerencias(pasoIdx, data) {
  const en = isEnglish(data)
  const level = getLevelValue(data)
  const recurso = data.recursos?.toLowerCase() || ''
  const restriccion = data.restricciones?.toLowerCase() || ''
  const subtema = data.subtema?.nombre || (en ? 'the selected project' : 'el subtema elegido')
  const durProyecto = data.duracionProyecto || (en ? 'not defined' : 'no definida')
  const durSim = data.duracionSimulador || '15-20'

  const maps = [
    // PASO 1: Alineación
    [
      !data.competencia?.trim() && (data.route === 'ib_myp_design'
        ? (en ? 'A base design focus was proposed. Adjust it to the expectations of your design programme.' : 'Se propuso un foco de diseño base. Ajústalo al lenguaje y a las expectativas de tu programa de diseño.')
        : (en ? 'A MEN competency was proposed. Adjust it to your school planning language if needed.' : 'Se propuso una competencia MEN. Copiala a tu plan de area o ajustala a la redaccion oficial de tu institucion.')),
      en ? `Check that the objective fits the project duration: ${durProyecto}.` : `Verifica que el objetivo sea alcanzable en la duracion del proyecto: ${durProyecto}.`,
      en ? 'Success criteria should be directly observable in class.' : 'Los criterios de exito deben ser observables directamente en clase, sin instrumentos especiales.',
    ],
    // PASO 2: Reto
    [
      (recurso.includes('arduino') || recurso.includes('micro:bit')) && (en ? 'Hardware is available. Consider making the hardware path the main version.' : 'Tienes hardware disponible. Considera que la version con hardware sea la version principal.'),
      restriccion.includes('internet') && (en ? 'Limited internet detected. Make sure the challenge and resources can work offline.' : 'Internet limitado detectado: asegurate de que el reto y sus recursos funcionen sin conexion en clase.'),
      en ? `Write the challenge in direct language for ${level}. One clear sentence is enough.` : `Formula el reto en un lenguaje directo para estudiantes de ${level}. Una sola oracion clara basta.`,
    ],
    // PASO 3: Materiales
    [
      restriccion.includes('impresora') && (en ? 'No printer available. Add the option to project the guide on the board or a screen.' : 'Sin impresora: anade la instruccion de proyectar la guia en el tablero o televisor.'),
      en ? `With ${data.maxImagenes || 3} planned images, make sure each photo has a clear purpose.` : `Con ${data.maxImagenes || 3} imágenes definidas: verifica que cada foto indicada tenga un propósito concreto.`,
      en ? 'Mark which materials can be reused with the next group or year.' : 'Marca explícitamente qué materiales pueden reutilizarse con el siguiente grupo o año.',
    ],
    // PASO 4: Guía docente
    [
      en ? `Build block: ${durSim} min. Tighten the guiding questions if class time is shorter.` : `Bloque de construcción: ${durSim} min. Ajusta las preguntas dinamizadoras si el tiempo disponible es menor.`,
      (restriccion.includes('grande') || /3[5-9]|4\d/.test(restriccion)) && (en ? 'Large groups detected. Assign clear roles to each student.' : 'Grupos grandes detectados: asigna roles claros a cada integrante.'),
      en ? 'Photo instructions should be concrete, for example: take a photo when the prototype is halfway built.' : 'Las instrucciones de foto deben ser muy concretas, por ejemplo: toma una foto cuando el prototipo esté a mitad de construcción.',
    ],
    // PASO 5: Guía estudiante
    [
      en ? `A maximum of ${data.maxImagenes || 3} images is configured. Check that the capture prompts follow that same order.` : `Máximo ${data.maxImagenes || 3} imágenes configurado. Verifica que las instrucciones de captura aparezcan en ese orden en la guía.`,
      data.puedenFotografiar
        ? (en ? 'Students can take photos, so image capture prompts are active in the guide.' : 'Tu grupo puede tomar fotos. Las instrucciones de captura están activadas en la guía.')
        : (en ? 'No photos in class. Adapt the guide so students document with sketches or written notes.' : 'Sin fotos en clase: adapta las instrucciones para que documenten con dibujos o descripciones escritas.'),
      en ? 'Students should read the self-assessment before starting the challenge, not only at the end.' : 'La autoevaluación debe leerse antes de empezar el reto, no solo al final.',
    ],
    // PASO 6: Rúbrica
    [
      en ? `Criteria are aligned to "${subtema}". Make sure they match the exact product students will submit.` : `Criterios alineados a "${subtema}". Verifica que coincidan exactamente con el producto que entregarán.`,
      en ? 'Share the rubric at the beginning of the project, not only when grading.' : 'Comparte la rúbrica con los estudiantes al inicio del proyecto, no solo al momento de evaluar.',
      recurso.includes('arduino') || recurso.includes('scratch')
        ? (en ? 'Consider adding a specific criterion about hardware or program functionality.' : 'Considera anadir un criterio especifico sobre el funcionamiento del hardware o programa.')
        : (en ? 'You can add an oral presentation criterion if students will present their work.' : 'Puedes anadir un criterio de presentacion oral si habra socializacion en clase.'),
    ],
    // PASO 7: Empaque
    [
      en ? 'This kit is reusable. For the next group, update only the group name and date.' : 'Este kit es reutilizable: para el siguiente grupo solo actualiza el nombre del grupo y la fecha.',
      data.tienelogo && data.logoUrl
        ? (en ? 'Your school logo is attached and will appear in institutional support views.' : 'Logo institucional adjunto. Aparecerá en las vistas institucionales de apoyo.')
        : (en ? 'Keep the logo space reserved so you can add it later.' : 'Reserva el espacio del logo para agregarlo cuando lo tengas disponible.'),
      en ? 'Add the shared folder link where group photo evidence will be stored.' : 'Agrega el enlace a la carpeta compartida donde se guardaran las evidencias fotograficas del grupo.',
    ],
  ]

  return maps[pasoIdx]?.filter(Boolean) || []
}

function RubricaEditor({ rubrica, onChange, data }) {
  const en = isEnglish(data)
  const updateCrit = (idx, changes) => {
    const newCrit = [...rubrica.criterios]
    newCrit[idx] = { ...newCrit[idx], ...changes }
    onChange({ rubrica: { ...rubrica, criterios: newCrit } })
  }

  const totalPct = rubrica.criterios.reduce((sum, c) => sum + (Number(c.pct) || 0), 0)

  return (
    <div className="space-y-4">
      <div className="bg-[#2b5a52]/5 p-4 rounded-xl border border-[#2b5a52]/10 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-[#2b5a52]">{en ? 'Rubric setup' : 'Configuración de la rúbrica'}</p>
          <p className="text-xs text-gray-500">{en ? 'Adjust criteria, weights and level descriptors.' : 'Ajusta los criterios, pesos y descripciones de cada nivel.'}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-black ${totalPct === 100 ? 'text-green-600' : 'text-orange-500'}`}>
            {totalPct}%
          </p>
          <p className="text-[10px] text-gray-400 uppercase font-bold">{en ? 'Total Weight' : 'Peso total'}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <th className="px-3 py-3 w-48 text-center bg-[#2b5a52]/5 text-[#2b5a52]">{en ? 'Criterion / %' : 'Criterio / %'}</th>
              <th className="px-3 py-3 bg-green-50 text-green-700 text-center">{en ? '⭐ Excellent' : '⭐ Superior'}</th>
              <th className="px-3 py-3 bg-blue-50 text-blue-700 text-center">{en ? '✅ Strong' : '✅ Alto'}</th>
              <th className="px-3 py-3 bg-yellow-50 text-yellow-700 text-center">{en ? '⚠ Developing' : '⚠ Básico'}</th>
              <th className="px-3 py-3 bg-red-50 text-red-700 text-center">{en ? '✗ Beginning' : '✗ Bajo'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rubrica.criterios.map((c, i) => (
              <tr key={i}>
                <td className="px-3 py-3 bg-[#2b5a52]/5">
                  <input
                    type="text"
                    value={c.nombre}
                    onChange={(e) => updateCrit(i, { nombre: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-bold text-gray-800 mb-1.5 focus:border-[#2b5a52]"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={c.pct}
                      onChange={(e) => updateCrit(i, { pct: parseInt(e.target.value, 10) || 0 })}
                      className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-[#2b5a52] focus:border-[#2b5a52]"
                    />
                    <span className="text-[10px] font-bold text-gray-400">%</span>
                  </div>
                </td>
                <td className="px-2 py-2">
                  <textarea
                    value={c.s}
                    onChange={(e) => updateCrit(i, { s: e.target.value })}
                    rows={4}
                    className="w-full bg-[#f8faf9] border-none rounded-lg p-2 text-[10px] text-gray-700 resize-none focus:ring-1 focus:ring-green-300"
                  />
                </td>
                <td className="px-2 py-2">
                  <textarea
                    value={c.a}
                    onChange={(e) => updateCrit(i, { a: e.target.value })}
                    rows={4}
                    className="w-full bg-[#f8faf9] border-none rounded-lg p-2 text-[10px] text-gray-700 resize-none focus:ring-1 focus:ring-blue-300"
                  />
                </td>
                <td className="px-2 py-2">
                  <textarea
                    value={c.b}
                    onChange={(e) => updateCrit(i, { b: e.target.value })}
                    rows={4}
                    className="w-full bg-[#f8faf9] border-none rounded-lg p-2 text-[10px] text-gray-700 resize-none focus:ring-1 focus:ring-yellow-300"
                  />
                </td>
                <td className="px-2 py-2">
                  <textarea
                    value={c.l}
                    onChange={(e) => updateCrit(i, { l: e.target.value })}
                    rows={4}
                    className="w-full bg-[#f8faf9] border-none rounded-lg p-2 text-[10px] text-gray-700 resize-none focus:ring-1 focus:ring-red-300"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPct !== 100 && (
        <p className="text-[10px] text-orange-600 font-bold bg-orange-50 px-3 py-2 rounded-lg flex items-center gap-2 border border-orange-100">
          <FiAlertCircle /> {en ? `The total rubric weight must add up to 100% (currently ${totalPct}%).` : `El peso total de los criterios debe sumar 100% (actualmente ${totalPct}%).`}
        </p>
      )}
    </div>
  )
}

function formatStepContent(raw = '') {
  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^=+$/.test(line))

  const blocks = []
  let current = null

  const pushCurrent = () => {
    if (current) blocks.push(current)
    current = null
  }

  lines.forEach((line) => {
    if (/^(STEP|PASO)\s+\d+/i.test(line)) {
      pushCurrent()
      current = { type: 'hero', title: line, items: [] }
      return
    }

    if (/^[A-ZÁÉÍÓÚÜÑ0-9\s/()\-]+:?$/u.test(line) && line.length > 3) {
      pushCurrent()
      current = { type: 'section', title: line.replace(/[:：]$/, ''), items: [] }
      return
    }

    if (!current) current = { type: 'body', items: [] }

    if (/^[•\-✓✔✗]/.test(line)) {
      current.items.push({ type: 'bullet', text: line.replace(/^[•\-✓✔✗]\s*/, '') })
      return
    }

    if (/^\d+\./.test(line)) {
      current.items.push({ type: 'number', text: line.replace(/^\d+\.\s*/, '') })
      return
    }

    const keyValueMatch = line.match(/^([^:]{3,}):\s+(.+)$/)
    if (keyValueMatch) {
      current.items.push({ type: 'kv', key: keyValueMatch[1], value: keyValueMatch[2] })
      return
    }

    current.items.push({ type: 'text', text: line })
  })

  pushCurrent()
  return blocks
}

function normalizeStepText(text = '') {
  return text
    .replace(/^["""']+/, '')
    .replace(/["""']+$/, '')
    .trim()
}

function prettifyStepHeading(title = '') {
  const compact = title.replace(/[:：]$/, '').trim()
  const lower = compact.toLowerCase()
  const mapped = {
    'school challenge': 'Reto escolar',
    'reto escolar': 'Reto escolar',
    'final product (technological artifact)': 'Producto final',
    'producto final (artefacto tecnológico)': 'Producto final',
    'low-resource version (without hardware)': 'Versión sin hardware',
    'versión sin hardware (con pocos recursos)': 'Versión sin hardware',
    'version con hardware (si está disponible)': 'Versión con hardware',
    'version with hardware (if available)': 'Version with hardware',
    'minimum success criteria': 'Criterios mínimos de éxito',
    'observable success criteria': 'Criterios de éxito observables',
    'minimum evidence': 'Evidencia mínima',
    'proposed visual supports': 'Apoyos visuales propuestos',
    'project scope': 'Alcance del proyecto',
    'measurable objective': 'Objetivo medible',
    'curricular framework': 'Marco curricular'
  }
  if (mapped[lower]) return mapped[lower]
  return compact.charAt(0).toUpperCase() + compact.slice(1).toLowerCase()
}

function StepContentPreview({ content, en, comfortableMode, stepNumber, stepTitle, stepDesc, collapsible = false, defaultOpen = true }) {
  const blocks = formatStepContent(content)
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-[30px] border border-[#e6d2a5] bg-[linear-gradient(180deg,#fffdf8_0%,#fffaf1_100%)] shadow-[0_18px_36px_rgba(23,61,55,.05)]">
      <div className="border-l-[6px] border-[#f0a22e] px-6 py-5">
        {collapsible ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-start gap-4 border-b border-[#eadfcb] pb-4 text-left"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#ead7b4] bg-white text-[#d97706] shadow-sm">
              <FiFileText className="text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8e5e12]">{en ? `Step ${stepNumber}` : `Paso ${stepNumber}`}</p>
              <h3 className="mt-1 text-[1.55rem] leading-tight text-[#b45309]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 800 }}>
                {stepTitle}
              </h3>
              <p className="mt-1 text-base leading-7 text-[#5d6e68]">{stepDesc}</p>
            </div>
            <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-[#ead7b4] bg-white text-[#8e5e12] shadow-sm">
              <FiChevronRight className={`transition-transform ${open ? 'rotate-90' : ''}`} />
            </div>
          </button>
        ) : (
          <div className="flex items-start gap-4 border-b border-[#eadfcb] pb-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[#ead7b4] bg-white text-[#d97706] shadow-sm">
              <FiFileText className="text-xl" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8e5e12]">{en ? `Step ${stepNumber}` : `Paso ${stepNumber}`}</p>
              <h3 className="mt-1 text-[1.55rem] leading-tight text-[#b45309]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 800 }}>
                {stepTitle}
              </h3>
              <p className="mt-1 text-base leading-7 text-[#5d6e68]">{stepDesc}</p>
            </div>
          </div>
        )}

        <div className={`${open ? 'mt-5 space-y-4' : 'hidden'}`}>
          {blocks.map((block, idx) => {
            if (block.type === 'hero') return null

            if (block.type === 'section') {
              return (
                <section key={idx} className="space-y-3">
                  <div className="rounded-r-[18px] rounded-l-[8px] border border-[#f1c27b] bg-[#fff3df] px-4 py-3">
                    <h4 className="text-[1.02rem] font-black uppercase tracking-[0.03em] text-[#b45309]">{prettifyStepHeading(block.title)}</h4>
                  </div>

                  <div className="space-y-3 px-2">
                    {block.items.map((item, lineIdx) => {
                      if (item.type === 'kv') {
                        return (
                          <div key={lineIdx} className="space-y-1">
                            <p className="text-[1rem] font-semibold leading-7 text-[#35524a]">{prettifyStepHeading(item.key)}:</p>
                            <p className={`${comfortableMode ? 'text-[1.12rem] leading-9' : 'text-[1rem] leading-8'} text-[#234842]`}>{normalizeStepText(item.value)}</p>
                          </div>
                        )
                      }

                      if (item.type === 'bullet' || item.type === 'number') {
                        return (
                          <label key={lineIdx} className="flex items-start gap-3 rounded-2xl px-2 py-1">
                            <span className="mt-1.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-[#8f8f8f] bg-white" />
                            <span className={`${comfortableMode ? 'text-[1.08rem] leading-9' : 'text-[1rem] leading-8'} text-[#234842]`}>{normalizeStepText(item.text)}</span>
                          </label>
                        )
                      }

                      return (
                        <p key={lineIdx} className={`${comfortableMode ? 'text-[1.08rem] leading-9' : 'text-[1rem] leading-8'} px-2 text-[#234842]`}>
                          {normalizeStepText(item.text)}
                        </p>
                      )
                    })}
                  </div>
                </section>
              )
            }

            return (
              <div key={idx} className="space-y-3 px-2">
                {block.items.map((item, lineIdx) => (
                  <p key={lineIdx} className={`${comfortableMode ? 'text-[1.08rem] leading-9' : 'text-[1rem] leading-8'} text-[#234842]`}>
                    {item.value ? `${prettifyStepHeading(item.key)}: ${normalizeStepText(item.value)}` : normalizeStepText(item.text)}
                  </p>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PasoEditor({ pasoIdx, data, onChange }) {
  const info = getPasosInfo(data.language)[pasoIdx]
  const field = `paso${info.num}`
  const imageKey = `imgPaso${info.num}`
  const generador = GENERADORES[pasoIdx]
  const sugerencias = getSugerencias(pasoIdx, data)
  const images = data[imageKey] || []
  const imgInputRef = useRef()
  const levelLabel = getLevelLabel(data)
  const levelValue = getLevelValue(data)
  const en = isEnglish(data)
  const [comfortableMode] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)

  const handleImageFiles = (e) => {
    const files = Array.from(e.target.files || [])
    Promise.all(
      files.slice(0, 5 - images.length).map(
        (f) => new Promise((res) => {
          const reader = new FileReader()
          reader.onload = (ev) => res({ dataUrl: ev.target.result, name: f.name })
          reader.readAsDataURL(f)
        })
      )
    ).then((newImgs) => {
      onChange({ [imageKey]: [...images, ...newImgs].slice(0, 5) })
      e.target.value = ''
    })
  }

  // Auto-generate on first visit
  useEffect(() => {
    if (!data[field]) {
      onChange({ [field]: generador(data) })
    }
  }, []) // eslint-disable-line

  const content = data[field] || generador(data)

  // Context chips: show the teacher's key decisions for this step
  const chips = [
    data.institucion && { label: data.institucion },
    { label: `${levelLabel} ${levelValue}` },
    data.subtema?.nombre && { label: data.subtema.nombre },
    data.duracionProyecto && { label: `Proyecto: ${data.duracionProyecto}` },
    data.restricciones && { label: '⚠ ' + data.restricciones.slice(0, 30) + (data.restricciones.length > 30 ? '…' : '') },
  ].filter(Boolean)

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#fbb041] uppercase tracking-wide">{en ? `STEP ${info.num}` : `PASO ${info.num}`}</span>
          <h2 className="text-[1.6rem] font-bold text-[#2b5a52] leading-tight sm:text-[1.75rem]">{info.titulo}</h2>
          <p className="mt-1 text-[1.02rem] text-[#5a7069] leading-8">{info.desc}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={() => onChange({ [field]: generador(data) })}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs text-[#5a7069] hover:text-[#2b5a52]
              border border-gray-200 rounded-xl px-3 py-2 hover:border-[#2b5a52]/40 transition-colors"
          >
            <FiRefreshCw className="text-xs" /> {en ? 'Regenerate' : 'Regenerar'}
          </button>
        </div>
      </div>

      {/* Context chips — teacher's decisions */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chips.map((c, i) => (
            <span key={i} className="text-[11px] bg-[#2b5a52]/8 text-[#2b5a52] px-2.5 py-1 rounded-full font-medium border border-[#2b5a52]/10">
              {c.label}
            </span>
          ))}
        </div>
      )}

      {/* Sugerencias contextuales */}
      {sugerencias.length > 0 && (
        <div className="bg-[#fbb041]/8 border border-[#fbb041]/25 rounded-xl px-4 py-3 mb-3">
          <p className="text-[13px] font-bold text-[#b45309] mb-2">{en ? '💡 Suggestions for this step — based on your answers' : '💡 Sugerencias para este paso — basadas en tus respuestas'}</p>
          <ul className="space-y-1.5">
            {sugerencias.map((s, i) => (
              <li key={i} className="text-[15px] text-gray-700 flex gap-2 leading-7">
                <span className="text-[#fbb041] font-bold flex-shrink-0 mt-px">→</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edit hint */}
      <div className="mb-3 grid gap-3">
        <p className="text-[14px] leading-7 text-[#2b5a52] bg-[#2b5a52]/5 rounded-lg px-4 py-3">
          {en
            ? <>✏️ The content was generated from your answers. Review the reading version first, then edit only what strengthens clarity and coherence.</>
            : <>✏️ El contenido fue generado con tus respuestas. Revisa primero la lectura del paso y edita solo lo que fortalezca claridad y coherencia.</>}
        </p>
        {info.num !== 6 && <StepContentPreview content={content} en={en} comfortableMode={comfortableMode} stepNumber={info.num} stepTitle={info.titulo} stepDesc={info.desc} />}
      </div>

      {info.num === 6 ? (
        <RubricaEditor rubrica={data.rubrica} onChange={onChange} data={data} />
      ) : (
        <div className="rounded-[28px] border border-[#d7e3df] bg-white p-4 shadow-[0_12px_28px_rgba(23,61,55,.05)]">
          <button
            type="button"
            onClick={() => setEditorOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-4 rounded-[22px] border border-[#e5eeea] bg-[linear-gradient(180deg,#fffdfa_0%,#f8fbfa_100%)] px-4 py-4 text-left hover:border-[#cfdcd7] transition-colors"
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e5e12]">{en ? 'Advanced editing' : 'Edición avanzada'}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#173d37]">
                {en
                  ? 'Open only if you need to refine wording, examples or criteria in the source text.'
                  : 'Ábrela solo si necesitas afinar redacción, ejemplos o criterios en el texto base.'}
              </p>
            </div>
            <FiChevronRight className={`text-[#5a7069] transition-transform ${editorOpen ? 'rotate-90' : ''}`} />
          </button>

          {editorOpen && (
            <div className="mt-3">
              <div className="mb-3 rounded-2xl bg-[#fff7e4] border border-[#f3d89a] px-4 py-3">
                <p className="text-sm leading-6 text-[#7a5914]">
                  {en
                    ? 'This field edits the source text used by the platform. Make focused changes and keep section titles clear.'
                    : 'Este campo edita el texto base que usa la plataforma. Haz cambios puntuales y conserva títulos y secciones claros.'}
                </p>
              </div>
              <textarea
                value={content}
                onChange={(e) => onChange({ [field]: e.target.value })}
                className={`w-full rounded-[22px] border border-[#cfdcd7] bg-[linear-gradient(180deg,#fffdfa_0%,#fafcfb_100%)] px-5 py-4 text-[#294842]
                  focus:outline-none focus:border-[#2b5a52] focus:ring-4 focus:ring-[#2b5a52]/10 resize-y ${comfortableMode ? 'text-[1.02rem] leading-8' : 'text-sm leading-7'}`}
                rows={18}
                style={{ fontFamily: 'Georgia, Times New Roman, serif' }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Imágenes complementarias ── */}
      <div className="mt-3 border border-gray-100 rounded-xl p-3 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
            <FiImage className="text-[#2b5a52]" />
            {en ? 'Supporting images' : 'Imágenes complementarias'}
            <span className="text-[#5a7069] font-normal">({images.length}/5)</span>
          </p>
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => imgInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs text-[#2b5a52] border border-[#2b5a52]/25 px-3 py-1 rounded-lg hover:bg-[#2b5a52]/5 transition-colors font-medium"
            >
              <FiUpload className="text-xs" /> {en ? 'Attach' : 'Adjuntar'}
            </button>
          )}
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageFiles}
          />
        </div>
        {images.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img
                  src={img.dataUrl}
                  alt={img.name}
                  className="h-20 w-20 object-cover rounded-lg border border-gray-200 bg-white"
                />
                <p className="text-[10px] text-[#5a7069] truncate w-20 mt-0.5 text-center">{img.name}</p>
                <button
                  onClick={() => onChange({ [imageKey]: images.filter((_, j) => j !== i) })}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs
                    flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  title={en ? 'Remove image' : 'Quitar imagen'}
                >
                  <FiX className="text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#5a7069] text-center py-2 leading-6">
            {en ? 'Attach photos, captures or diagrams that strengthen this step of the kit.' : 'Adjunta fotos, capturas o diagramas que complementen este paso del kit.'}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Bitácora post-kit ────────────────────────────────────────────────────────
function BitacoraSection({ kitId, data }) {
  const en = isEnglish(data)
  const empty = { fecha: '', queFunciono: '', queMejorar: '', engagement: 0, reutilizaria: null }
  const [open, setOpen] = useState(false)
  const [bd, setBd] = useState(() => {
    try {
      const kit = lsGetKits().find((k) => k.id === kitId)
      return kit?.bitacora || empty
    } catch { return empty }
  })
  const [saved, setSaved] = useState(false)

  const guardar = () => {
    try {
      const kits = lsGetKits()
      const idx = kits.findIndex((k) => k.id === kitId)
      if (idx >= 0) { kits[idx].bitacora = bd; localStorage.setItem(LS_KEY, JSON.stringify(kits)) }
    } catch { }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="mt-4 border border-[#2b5a52]/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 bg-[#2b5a52]/5 hover:bg-[#2b5a52]/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FiClock className="text-[#2b5a52]" />
          <span className="text-sm font-bold text-[#2b5a52]">{en ? 'Implementation logbook' : 'Bitácora de uso'}</span>
          <span className="text-xs text-gray-500">{en ? '— Record your reflection after classroom use' : '— Registra tu reflexión tras aplicarlo en aula'}</span>
        </div>
        <FiChevronRight className={`text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="p-4 space-y-4 bg-white">
          <div>
            <label htmlFor="bd-fecha" className="block text-xs font-medium text-gray-700 mb-1">📅 {en ? 'Classroom implementation date' : 'Fecha de aplicación en aula'}</label>
            <input
              id="bd-fecha"
              type="date"
              value={bd.fecha}
              onChange={(e) => setBd((p) => ({ ...p, fecha: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-full focus:outline-none focus:border-[#2b5a52]"
            />
          </div>
          <div>
            <label htmlFor="bd-funciono" className="block text-xs font-medium text-gray-700 mb-1">✅ {en ? 'What worked well?' : '¿Qué funcionó bien?'}</label>
            <textarea
              id="bd-funciono"
              value={bd.queFunciono}
              onChange={(e) => setBd((p) => ({ ...p, queFunciono: e.target.value }))}
              rows={3}
              placeholder={en ? 'Describe activities, moments or resources that worked best with the group...' : 'Describe actividades, momentos o recursos que funcionaron mejor con el grupo...'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2b5a52] resize-y"
            />
          </div>
          <div>
            <label htmlFor="bd-mejorar" className="block text-xs font-medium text-gray-700 mb-1">🔄 {en ? 'What would you improve next time?' : '¿Qué mejorarías para la próxima vez?'}</label>
            <textarea
              id="bd-mejorar"
              value={bd.queMejorar}
              onChange={(e) => setBd((p) => ({ ...p, queMejorar: e.target.value }))}
              rows={3}
              placeholder={en ? 'Timing, resources, instructions, required adaptations...' : 'Tiempos, recursos, instrucciones, adaptaciones necesarias...'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2b5a52] resize-y"
            />
          </div>
          <div>
            <label htmlFor="bd-engagement" className="block text-xs font-medium text-gray-700 mb-2">🎯 {en ? 'Student engagement level' : 'Nivel de engagement de estudiantes'}</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setBd((p) => ({ ...p, engagement: n }))}
                  className={`w-10 h-10 rounded-xl text-lg transition-all active:scale-90
                    ${bd.engagement >= n ? 'bg-[#fbb041] shadow-sm' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                >
                  ⭐
                </button>
              ))}
              {bd.engagement > 0 && (
                <span className="text-xs text-gray-500 ml-1">
                  {en ? ['', 'Very low', 'Low', 'Medium', 'High', 'Very high'][bd.engagement] : ['', 'Muy bajo', 'Bajo', 'Medio', 'Alto', 'Muy alto'][bd.engagement]}
                </span>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="bd-reutilizar" className="block text-xs font-medium text-gray-700 mb-2">🔁 {en ? 'Would you reuse this kit with another group?' : '¿Reutilizarías este kit con otro grupo?'}</label>
            <div className="flex gap-3">
              {[{ v: true, l: en ? '✅ Yes, I would reuse it' : '✅ Sí, lo reutilizaría' }, { v: false, l: en ? '⚠ It needs adjustments first' : '⚠ Necesita ajustes primero' }].map(({ v, l }) => (
                <button
                  key={String(v)}
                  onClick={() => setBd((p) => ({ ...p, reutilizaria: v }))}
                  className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition-colors
                    ${bd.reutilizaria === v
                  ? 'border-[#2b5a52] bg-[#2b5a52]/5 text-[#2b5a52]'
                  : 'border-gray-200 text-gray-600 hover:border-[#2b5a52]/30'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={guardar}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95
              ${saved ? 'bg-green-500 text-white' : 'bg-[#2b5a52] text-white hover:bg-[#234a43]'}`}
          >
            <FiSave /> {saved ? (en ? 'Logbook saved!' : '¡Bitácora guardada!') : (en ? 'Save logbook' : 'Guardar bitácora')}
          </button>
        </div>
      )}
    </div>
  )
}

function CompartirKitSection({ data }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const en = isEnglish(data)

  const ensureShareUrl = async () => {
    if (shareUrl) return shareUrl
    setLoading(true)
    const url = await createShortShareUrl(data)
    setLoading(false)
    if (url) setShareUrl(url)
    return url
  }

  const handleCopy = async () => {
    const url = await ensureShareUrl()
    if (!url) return
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="mt-4 rounded-2xl overflow-hidden border-2 border-[#2b5a52]/15 shadow-sm">
      <button
        onClick={async () => {
          const nextOpen = !open
          setOpen(nextOpen)
          if (nextOpen && !shareUrl) await ensureShareUrl()
        }}
        className="w-full flex items-center gap-3 px-5 py-4 bg-[#f0f7f6] hover:bg-[#e6f2f0] transition-colors text-left"
      >
        <FiLink className="text-xl flex-shrink-0 text-[#2b5a52]" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#2b5a52] text-sm">{en ? 'Share kit configuration' : 'Compartir configuración del kit'}</p>
          <p className="text-[#2b5a52]/60 text-xs mt-0.5">{en ? 'Reliable link for another teacher to reuse the structure' : 'Enlace confiable para que otro docente reutilice la estructura'}</p>
        </div>
        <FiChevronRight className={`text-[#2b5a52]/40 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="bg-white px-5 py-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-1">{en ? 'What does this shared view include?' : '¿Qué incluye esta vista compartida?'}</p>
            <ul className="text-xs text-gray-500 space-y-0.5">
              {(en
                ? ['Institutional setup (blocks A-D)', 'Curricular route, level and selected project', 'Declared learning support adaptations']
                : ['Configuracion institucional (Bloques A-D)', 'Ruta curricular, nivel y proyecto seleccionado', 'Adaptaciones NEE declaradas']).map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <FiCheck className="text-[#2b5a52] text-[10px] flex-shrink-0" /> {item}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-gray-400 mt-2 italic">
              {en ? '* STEP texts and images are not included. Each teacher generates those in their own version.' : '* Los textos de los PASOS e imagenes no se incluyen; cada docente genera los suyos.'}
            </p>
          </div>
          <button
            onClick={handleCopy}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all
              ${copied ? 'bg-green-500 text-white' : 'bg-[#2b5a52] text-white hover:bg-[#234a43]'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading
              ? (en ? 'Generating secure link...' : 'Generando enlace seguro...')
              : (copied
                ? <><FiCheck /> {en ? 'Secure link copied' : 'Enlace seguro copiado'}</>
                : <><FiCopy /> {en ? 'Copy secure link' : 'Copiar enlace seguro'}</>)}
          </button>
        </div>
      )}
    </div>
  )
}

function AdaptacionesNEESection({ data }) {
  const [open, setOpen] = useState(true)
  const tipos = (data.tiposNEE || []).map((id) => NEE_TIPOS.find((t) => t.id === id)).filter(Boolean)
  const subtema = data.subtema?.nombre || 'el proyecto'
  if (!data.tieneNEE || !tipos.length) return null

  return (
    <div className="mt-4 rounded-2xl overflow-hidden border-2 border-[#7c3aed]/20 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-[#7c3aed]/8 hover:bg-[#7c3aed]/12 transition-colors text-left"
      >
        <span className="text-xl flex-shrink-0">♿</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#5b21b6] text-sm">Adaptaciones para la diversidad</p>
          <p className="text-[#7c3aed]/70 text-xs mt-0.5">
            {tipos.length} tipo{tipos.length > 1 ? 's' : ''} de NEE · estrategias incluidas en el kit
          </p>
        </div>
        <FiChevronRight className={`text-[#7c3aed]/50 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="bg-white divide-y divide-gray-50 px-5 py-3 space-y-4">
          {data.descripcionNEE?.trim() && (
            <div className="py-2 text-xs text-gray-600 italic border-b border-dashed border-gray-200 pb-3">
              📝 {data.descripcionNEE}
            </div>
          )}
          {tipos.map((tipo) => (
            <div key={tipo.id} className={`rounded-xl border p-4 ${tipo.color}`}>
              <p className="font-bold text-sm flex items-center gap-2 mb-2">
                <span>{tipo.icon}</span> {tipo.label}
              </p>
              <ul className="space-y-1.5">
                {tipo.adaptaciones(subtema).map((a, i) => (
                  <li key={i} className="text-xs flex items-start gap-2 leading-relaxed">
                    <span className="flex-shrink-0 font-bold opacity-60">{i + 1}.</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CompartirEstudianteSection({ onOpenStudentView, onGoToStudentGuide, data }) {
  const [open, setOpen] = useState(false)
  const en = isEnglish(data)


  return (
    <div className="mt-4 rounded-2xl overflow-hidden border-2 border-[#fbb041]/40 shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-[#fffbeb] hover:bg-[#fef3c7] transition-colors text-left"
      >
        <span className="text-xl flex-shrink-0">🎒</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#b45309] text-sm">{en ? 'Student delivery' : 'Entrega al estudiante'}</p>
          <p className="text-[#b45309]/60 text-xs mt-0.5">{en ? 'Open the student-facing workbook in a focused view' : 'Abre la guía del estudiante en una vista enfocada'}</p>
        </div>
        <FiChevronRight className={`text-[#b45309]/40 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="bg-white px-5 py-4 space-y-4">
          <div className="bg-[#fffbeb] rounded-xl p-3 border border-[#fde68a]">
            <p className="text-xs font-semibold text-[#92400e] mb-2">
              {en ? 'Open student workbook view' : 'Abrir vista del estudiante'}
            </p>
            <p className="text-[10px] text-[#92400e]/70 mb-3 leading-relaxed">
              {en ? 'This view includes only student-facing material, without the teacher section. Use it as the clean delivery view and print only if needed.' : 'Esta vista incluye solo el material del estudiante, sin la sección docente. Úsala como entrega limpia y recurre a impresión solo si hace falta.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onOpenStudentView}
                className="flex items-center gap-2 px-4 py-2 bg-[#fbb041] text-white rounded-lg text-xs font-bold hover:bg-[#f59e0b] transition-colors"
              >
                <FiExternalLink className="text-xs" /> {en ? 'Open student view' : 'Abrir vista del estudiante'}
              </button>
              <button
                onClick={onGoToStudentGuide}
                className="flex items-center gap-2 px-4 py-2 bg-white text-[#92400e] rounded-lg text-xs font-bold border border-[#fbb041]/40 hover:bg-[#fff7ed] transition-colors"
              >
                <FiChevronRight className="text-xs" /> {en ? 'Review STEP 5' : 'Revisar PASO 5'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Final({ data, kitId, onGoTo }) {
  const en = isEnglish(data)
  const [exportsOpen, setExportsOpen] = useState(false)
  const pasosInfo = getPasosInfo(data.language)
  const componenteLabel = MEN_COMPONENTES.find((c) => c.id === data.componente)?.label || ''
  const levelLabel = getLevelLabel(data)
  const levelValue = getLevelValue(data)
  const curriculumBadge = getCurriculumBadge(data)
  const { score, pending } = calcScore(data)
  const semaforo = score >= 85
    ? { color: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '🟢', label: en ? 'High-quality teaching kit' : 'Kit de alta calidad pedagogica', sub: en ? 'Excellent work. Ready to use in class.' : 'Excelente trabajo. Listo para aplicar en aula.' }
    : score >= 65
      ? { color: 'bg-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: '🟡', label: en ? 'Functional kit, still improvable' : 'Kit funcional, puede mejorar', sub: en ? 'Complete the pending items for stronger impact.' : 'Completa los puntos pendientes para mayor impacto.' }
      : { color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '🟠', label: en ? 'Incomplete kit' : 'Kit incompleto', sub: en ? 'Review pending items before exporting or printing.' : 'Revisa los puntos pendientes antes de imprimir.' }


  const exportBlockers = getExportBlockers(data, 'full')
  const institutionMetrics = getInstitutionMetrics(lsGetKits())

  const runWithValidation = (action, mode = 'full') => {
    const blockers = mode === 'full' ? exportBlockers : getExportBlockers(data, mode)
    if (!blockers.length) return action()
    const top = blockers[0]
    alert(en
      ? `Before exporting, complete the following:\n\n- ${blockers.map((b) => b.label).join('\n- ')}`
      : `Antes de exportar, completa lo siguiente:\n\n- ${blockers.map((b) => b.label).join('\n- ')}`)
    if (onGoTo && top?.paso) onGoTo(top.paso)
  }
  const handleExportPDF = () => {
    const en = isEnglish(data)
    const localizedSubtema = getLocalizedSubtema(data)
    const year = new Date().getFullYear()
    const levelLabel = getLevelLabel(data)
    const levelValue = getLevelValue(data)
    const frameworkValue = getFrameworkValue(data)
    const competenciaLabel = data.route === 'ib_myp_design'
      ? (en ? 'Design focus' : 'Foco de diseño')
      : (en ? 'MEN competency' : 'Competencia MEN')
    const sourceLabel = getSourceLabel(data)
    const logoHtml = data.logoUrl
      ? `<img src="${data.logoUrl}" alt="Logo" style="height:44px;object-fit:contain">`
      : ''
    const mkTxt = (raw) => {
      const lines = String(raw || '').split('\n')
      let out = '', tbuf = []
      const flushTbl = () => {
        if (!tbuf.length) return
        const s = 'padding:6px;border:1px solid #ccc;font-size:8.5pt;vertical-align:top'
        out += '<table style="width:100%;border-collapse:collapse;margin:8px 0">' +
          tbuf.map(r => `<tr>${r.map(c => `<td style="${s}">${escHtml(c.trim())}</td>`).join('')}</tr>`).join('') +
          '</table>'
        tbuf = []
      }
      for (const line of lines) {
        const t = line.trim()
        if (!t) { flushTbl(); out += '<br>'; continue }
        if (/^[=\-]{4,}$/.test(t) || /^[─━═]{4,}$/.test(t)) { flushTbl(); out += '<hr>'; continue }
        if (/^[-|:\s]+$/.test(t) && t.includes('|')) continue
        const tcells = t.split('|').map(c => c.trim())
        if (tcells.length >= 3) {
          const cells = (tcells[0] === '' ? tcells.slice(1) : tcells)
          const cells2 = cells[cells.length - 1] === '' ? cells.slice(0, -1) : cells
          tbuf.push(cells2.length >= 2 ? cells2 : cells)
          continue
        }
        flushTbl()
        if (/^⏱/.test(t)) { out += `<h4>${escHtml(t)}</h4>`; continue }
        if (t.length >= 8 && !/[a-záéíóúñ]/.test(t) && /[A-ZÁÉÍÓÚÑ]/.test(t)) { out += `<h3>${escHtml(t)}</h3>`; continue }
        if (/^\[ESPACIO/.test(t)) { out += '<div class="blank">&nbsp;</div>'; continue }
        if (/^□\s/.test(t)) { out += `<div class="cb">☐ ${escHtml(t.slice(2))}</div>`; continue }
        if (/^[•·→✓✗\-]\s+/.test(t)) { out += `<li>${escHtml(t.replace(/^[•·→✓✗\-]\s+/, ''))}</li>`; continue }
        if (/^📸/.test(t)) { out += `<div class="foto-ph">📸 ${escHtml(t.replace(/^📸\s*/, ''))}</div>`; continue }
        out += `<p>${escHtml(t)}</p>`
      }
      flushTbl()
      return out || '<p>—</p>'
    }
    const secciones = pasosInfo.map((info, i) => ({
      num: info.num,
      titulo: info.titulo,
      contenido: info.num === 6 ? gen6(data) : (info.num === 5 ? ensureStudentGuideContent(data[`paso${info.num}`] || GENERADORES[i](data), data) : (data[`paso${info.num}`] || GENERADORES[i](data))),
    }))
    const cards = secciones.map(s => `
      <div class="card">
        <div class="card-title">${en ? 'STEP' : 'PASO'} ${s.num}: ${escHtml(s.titulo.toUpperCase())}</div>
        <div class="card-body">${mkTxt(s.contenido)}</div>
      </div>`).join('')
    const html = `<!DOCTYPE html><html lang="${safeLang(data.language)}"><head><meta charset="UTF-8">
<title>Kit TI — ${escHtml(data.subtema?.nombre || 'Kit')} — ${en ? 'Print version' : 'Versión impresión'}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,serif;background:#fff;color:#111;font-size:11pt;line-height:1.55}
.header{display:flex;align-items:center;gap:12px;border-bottom:3px solid #111;padding-bottom:10px;margin-bottom:14px}
.header-info h1{font-size:13pt;font-weight:bold;margin-bottom:2px}
.header-info p{font-size:9pt;color:#444}
.card{border:1px solid #ccc;border-radius:4px;margin-bottom:12px;page-break-inside:avoid}
.card-title{background:#eee;padding:7px 12px;font-size:9.5pt;font-weight:bold;letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid #ccc}
.card-body{padding:10px 12px;font-size:10pt}
.card-body h3{font-size:10pt;font-weight:bold;margin:8px 0 4px;text-decoration:underline}
.card-body h4{font-size:10pt;font-weight:bold;margin:8px 0 3px}
.card-body p{margin-bottom:5px}
.card-body li{margin-left:1.2em;margin-bottom:3px}
.card-body hr{border:none;border-top:1px solid #ccc;margin:6px 0}
.blank{border-bottom:1px solid #aaa;min-height:22px;margin:4px 0}
.cb{margin:2px 0;font-size:10pt}
.foto-ph{border:1px dashed #aaa;padding:6px 10px;font-size:9pt;color:#555;margin:4px 0;border-radius:3px}
.competencia{border:1px solid #ccc;padding:8px 10px;margin-bottom:10px;font-size:9.5pt;font-style:italic}
.footer{text-align:center;margin-top:16px;font-size:8pt;color:#888;border-top:1px solid #ddd;padding-top:8px}
@media print{@page{margin:1.5cm}body{font-size:10pt}.card{page-break-inside:avoid}}
</style></head><body>
<div class="header">${logoHtml}<div class="header-info">
  <h1>${escHtml(localizedSubtema?.nombre || (en ? 'Teaching kit' : 'Kit Didáctico'))} — ${escHtml(data.institucion || '')}</h1>
  <p>${escHtml(frameworkValue || componenteLabel)} · ${escHtml(levelLabel)} ${escHtml(levelValue)} · ${en ? 'Teacher' : 'Docente'}: ${escHtml(data.docente || (en ? '[Teacher]' : '[Docente]'))} · ${year}</p>
</div></div>
${data.competencia?.trim() ? `<div class="competencia"><strong>${competenciaLabel}:</strong> ${escHtml(data.competencia)}</div>` : ''}
${cards}
<div class="footer">${en ? 'Copiloto Docente TI' : 'Copiloto Docente TI'} · Maryam Math · ${sourceLabel} · ${en ? 'Author' : 'Autora'}: ${AUTORA.nombre}</div>
<script>window.onload=()=>window.print()<\/script>
</body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const w = window.open(url, '_blank')
    if (!w) window.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const secciones = pasosInfo.map((info, i) => ({
    num: info.num,
    titulo: info.titulo,
    desc: info.desc,
    contenido: info.num === 6 ? gen6(data) : (info.num === 5 ? ensureStudentGuideContent(data[`paso${info.num}`] || GENERADORES[i](data), data) : (data[`paso${info.num}`] || GENERADORES[i](data))),
  }))

  const handleExportRubrica = () => {
    const en = isEnglish(data)
    const localizedSubtema = getLocalizedSubtema(data)
    const subtema = localizedSubtema?.nombre || (en ? '[Project]' : '[Proyecto]')
    const levelLabel = getLevelLabel(data)
    const levelValue = getLevelValue(data)
    const frameworkValue = getFrameworkValue(data)
    const sourceLabel = getSourceLabel(data)
    const logoHtml = data.logoUrl
      ? `<img src="${data.logoUrl}" alt="Logo" style="height:52px;object-fit:contain;border-radius:6px">`
      : ''
    const rub = getRubricaForData(data)
    const crit = rub.criterios.map(c => ({
      nombre: c.nombre,
      pct: `${c.pct}%`,
      peso: c.pct / 100,
      s: c.s,
      a: c.a,
      b: c.b,
      l: c.l
    }))
    const rows = crit.map((c, i) => `
      <tr id="row-${i}">
        <td class="criterio"><strong>${escHtml(c.nombre)}</strong><br><span class="pct">${c.pct}</span></td>
        <td class="sup sel-cell" data-row="${i}" data-val="s" onclick="selectCell(${i},'s',this)">
          <label class="cell-label"><input type="radio" name="cr${i}" value="s" style="display:none">${escHtml(c.s)}</label>
        </td>
        <td class="alt sel-cell" data-row="${i}" data-val="a" onclick="selectCell(${i},'a',this)">
          <label class="cell-label"><input type="radio" name="cr${i}" value="a" style="display:none">${escHtml(c.a)}</label>
        </td>
        <td class="bas sel-cell" data-row="${i}" data-val="b" onclick="selectCell(${i},'b',this)">
          <label class="cell-label"><input type="radio" name="cr${i}" value="b" style="display:none">${escHtml(c.b)}</label>
        </td>
        <td class="baj sel-cell" data-row="${i}" data-val="l" onclick="selectCell(${i},'l',this)">
          <label class="cell-label"><input type="radio" name="cr${i}" value="l" style="display:none">${escHtml(c.l)}</label>
        </td>
        <td class="nota-td"><span id="nota-${i}" class="nota-val">—</span></td>
      </tr>`).join('')
    const jS = (val) => JSON.stringify(val)
    const pesosJson = JSON.stringify(crit.map(c => c.peso))
    const critNombresJson = JSON.stringify(crit.map(c => c.nombre))
    const critDataJson = JSON.stringify(crit.map(c => ({ nombre: c.nombre, pct: c.pct, s: c.s, a: c.a, b: c.b, l: c.l })))
    const saveKey = `rubrica_${(subtema).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
    const competenciaEsc = data.competencia?.trim() || (data.route === 'ib_myp_design'
      ? (en
        ? `The student develops and evaluates a design solution related to "${subtema}", justifying decisions and considering user, function and constraints.`
        : `El/la estudiante desarrolla y evalúa una solución de diseño relacionada con "${subtema}", justificando decisiones y considerando usuario, función y restricciones.`)
      : (en
        ? `The student applies concepts from "${subtema}" in the creation of a documented technological product.`
        : `El/la estudiante aplica conceptos de "${subtema}" en la creación de un producto tecnológico documentado.`))
    const html = `<!DOCTYPE html><html lang="${safeLang(data.language)}"><head><meta charset="UTF-8"><title>${en ? 'Rubric' : 'Rúbrica'} — ${escHtml(subtema)}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;padding:24px;color:#1a1a1a;background:#f8f9fa}
.header{display:flex;align-items:center;gap:16px;background:#2b5a52;color:#fff;padding:18px 22px;border-radius:10px;margin-bottom:14px}
.header h1{font-size:.95rem;font-weight:700;margin-bottom:3px}.header p{font-size:.75rem;opacity:.8}
.scale-bar{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 16px;margin-bottom:12px;font-size:.82rem;flex-wrap:wrap}
.scale-bar strong{color:#2b5a52;white-space:nowrap}
.scale-opt{display:flex;align-items:center;gap:5px;cursor:pointer;padding:5px 12px;border-radius:6px;border:1.5px solid #e5e7eb;transition:all .15s;font-weight:600;font-size:.78rem}
.scale-opt:has(input:checked){background:#2b5a52;color:#fff;border-color:#2b5a52}
.scale-opt input{display:none}
.estudiante-row{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:12px;font-size:.82rem}
.estudiante-row label{font-weight:700;color:#374151;white-space:nowrap}
.estudiante-row input{flex:1;border:none;border-bottom:2px solid #2b5a52;background:transparent;font-family:inherit;font-size:.88rem;padding:4px 6px;outline:none;color:#1a1a1a;min-width:0}
h2{font-size:.85rem;color:#2b5a52;font-weight:700;margin-bottom:10px;border-bottom:2px solid #2b5a52;padding-bottom:6px}
table{width:100%;border-collapse:collapse;font-size:.72rem;box-shadow:0 1px 6px rgba(0,0,0,.08);border-radius:8px;overflow:hidden;margin-bottom:14px}
th{padding:10px 12px;text-align:center;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
td{padding:10px 12px;vertical-align:top;border-bottom:1px solid #f0f0f0;line-height:1.5}
.criterio{width:18%;background:#f8f9fa;font-size:.72rem}.pct{font-size:.65rem;color:#6b7280;display:inline-block;margin-top:3px}
.sup,.sup th{background:#d1fae5;color:#065f46}.alt,.alt th{background:#dbeafe;color:#1e40af}
.bas,.bas th{background:#fef9c3;color:#854d0e}.baj,.baj th{background:#fee2e2;color:#991b1b}
.nota-td{width:8%;background:#f3f4f6;text-align:center;vertical-align:middle}
.nota-val{font-size:.85rem;font-weight:800;color:#374151}
.sel-cell{cursor:pointer;transition:all .18s;position:relative}
.sel-cell:hover{filter:brightness(.93);transform:scale(1.01)}
.sel-cell.selected::after{content:'✔';position:absolute;top:6px;right:8px;font-size:.85rem;font-weight:900;opacity:.9}
.sel-cell.selected{outline:3px solid currentColor;outline-offset:-3px;filter:brightness(.88);font-weight:700}
.cell-label{cursor:pointer;display:block}tr:last-child td{border-bottom:none}
.competencia{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:14px;margin-bottom:12px;font-size:.78rem;color:#374151;line-height:1.7}
.nota-final-box{background:#fff;border:2px solid #2b5a52;border-radius:12px;padding:14px 20px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nota-final-box .lbl{font-size:.82rem;font-weight:700;color:#374151}.nota-final-box .sub{font-size:.7rem;color:#6b7280;margin-top:2px}
.nota-final-val{font-size:2.2rem;font-weight:900;color:#2b5a52;min-width:64px;text-align:right}
.obs-section{margin-bottom:12px}
.obs-section label{font-size:.78rem;font-weight:700;color:#374151;display:block;margin-bottom:5px}
.obs-section textarea{width:100%;border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;font-family:inherit;font-size:.8rem;color:#374151;resize:vertical;min-height:70px;outline:none}
.obs-section textarea:focus{border-color:#2b5a52;box-shadow:0 0 0 3px rgba(43,90,82,.1)}
.hint{font-size:.68rem;color:#9ca3af;margin-bottom:10px;font-style:italic;text-align:center}
.toolbar{display:flex;gap:12px;align-items:center;padding:14px 24px;background:#fff;border-top:1px solid #e5e7eb;position:sticky;bottom:0;z-index:100;box-shadow:0 -4px 12px rgba(0,0,0,.05);margin:0 -24px -24px;border-radius:0 0 10px 10px}
.btn-t{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;border:none;transition:all .2s;font-family:inherit;text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,.1)}
.btn-t:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 4px 8px rgba(0,0,0,.15)}
.btn-save{background:#16a34a;color:#fff}.btn-share{background:#fbb041;color:#fff}.btn-print{background:#2b5a52;color:#fff}
.save-toast{background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:8px 16px;font-size:.8rem;color:#15803d;font-weight:700;display:none;position:fixed;top:20px;right:20px;z-index:200;box-shadow:0 4px 12px rgba(0,0,0,.1);align-items:center;gap:6px}
.resumen-sec{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;margin-bottom:16px}
.resumen-sec h3{font-size:.85rem;font-weight:700;color:#2b5a52;margin-bottom:10px}
.rtoolbar{display:flex;gap:8px;margin-bottom:10px}
.btn-sm{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:6px;font-size:.72rem;font-weight:700;cursor:pointer;border:1px solid #d1d5db;background:#fff;color:#374151;transition:all .15s;font-family:inherit}
.btn-sm:hover{background:#f3f4f6}
.rtable{width:100%;border-collapse:collapse;font-size:.72rem}
.rtable th{background:#f0f9f7;color:#1a3d37;font-weight:700;padding:7px 10px;text-align:left;border-bottom:2px solid #c6e8e0}
.rtable td{padding:7px 10px;border-bottom:1px solid #f0f0f0;color:#374151;vertical-align:top}
.rtable tr:hover td{background:#f8faf9}
.footer{text-align:center;margin-top:16px;font-size:.65rem;color:#9ca3af}
@media print{body{padding:10px;background:#fff}.sel-cell:hover{filter:none;transform:none}.toolbar,.resumen-sec,.scale-bar,.hint,.obs-section{display:none!important}}
</style></head><body>
<div class="header">${logoHtml}<div><h1>${escHtml(subtema)}</h1><p>${escHtml(frameworkValue || componenteLabel)} · ${escHtml(levelLabel)} ${escHtml(levelValue)} · ${en ? 'Teacher' : 'Docente'}: ${escHtml(data.docente || (en ? '[Teacher]' : '[Docente]'))}</p><p>${escHtml(data.institucion || (en ? '[Institution]' : '[Institucion]'))}${data.ciudad ? ' · ' + escHtml(data.ciudad) : ''}</p></div></div>
<div class="scale-bar"><strong>📊 ${en ? 'Scale' : 'Escala'}:</strong>
  <label class="scale-opt"><input type="radio" name="esc" value="5" checked onchange="cambiarEscala(5)"> /5.0</label>
  <label class="scale-opt"><input type="radio" name="esc" value="10" onchange="cambiarEscala(10)"> /10</label>
  <label class="scale-opt"><input type="radio" name="esc" value="100" onchange="cambiarEscala(100)"> /100</label>
  <span style="font-size:.7rem;color:#9ca3af;margin-left:4px">${en ? 'Values recalculate automatically' : 'Los valores se recalculan automaticamente'}</span>
</div>
<div class="estudiante-row"><label>${en ? 'Student / group' : 'Estudiante / grupo'}:</label><input type="text" id="nombre-est" placeholder="${en ? 'Write the name here...' : 'Escribe el nombre aqui...'}"></div>
<h2>${en ? 'Assessment rubric — STEP 6' : 'Rúbrica de evaluación — PASO 6'}</h2>
<div class="competencia"><strong>${en ? 'Assessed competency' : 'Competencia evaluada'}:</strong> ${competenciaEsc}</div>
<p class="hint">👆 ${en ? 'Click the cell that matches the level reached for each criterion' : 'Haz clic en la celda que corresponde al nivel alcanzado por el estudiante en cada criterio'}</p>
<table>
  <thead><tr>
    <th class="criterio">${en ? 'Criterion' : 'Criterio'}</th>
    <th class="sup">⭐ ${en ? 'Excellent' : 'Superior'} (<span id="lbl-s">5.0</span>)</th>
    <th class="alt">✅ ${en ? 'Strong' : 'Alto'} (<span id="lbl-a">4.2</span>)</th>
    <th class="bas">⚠ ${en ? 'Developing' : 'Basico'} (<span id="lbl-b">3.5</span>)</th>
    <th class="baj">✗ ${en ? 'Beginning' : 'Bajo'} (<span id="lbl-l">1.5</span>)</th>
    <th style="background:#f3f4f6;color:#374151;width:8%">${en ? 'Grade' : 'Nota'}</th>
  </tr></thead>
    <tbody id="rub-body">${rows}</tbody>
  </table>
  <div class="nota-final-box">
    <div><div class="lbl">${en ? 'Weighted final grade' : 'Nota final ponderada'}</div><div class="sub" id="sub-esc">${en ? 'Scale 1.0 - 5.0 · Weighted by criterion' : 'Escala 1.0 - 5.0 · Ponderacion segun criterio'}</div></div>
    <div class="nota-final-val" id="nota-final">—</div>
  </div>
  <div class="obs-section"><label>${en ? 'Teacher comments:' : 'Observaciones del docente:'}</label><textarea id="obs-txt" placeholder="${en ? 'Write your comments here...' : 'Escribe aqui tus comentarios...'}"></textarea></div>
  <div class="toolbar">
    <button class="btn-t btn-save" onclick="guardarNota()">💾 ${en ? 'Save grade' : 'Guardar calificación'}</button>
    <button class="btn-t btn-share" onclick="compartirEstudiante()">📤 ${en ? 'Share with students' : 'Compartir con estudiantes'}</button>
    <button class="btn-t btn-print" onclick="window.print()">🖨️ ${en ? 'Print / PDF' : 'Imprimir / PDF'}</button>
    <span class="save-toast" id="save-toast"></span>
  </div>
  <div class="resumen-sec" id="resumen-sec" style="display:none">
    <h3>📋 ${en ? 'Grade summary' : 'Resumen de calificaciones'}</h3>
    <div class="rtoolbar">
      <button class="btn-sm" onclick="copiarResumen(this)">📋 ${en ? 'Copy summary' : 'Copiar resumen'}</button>
      <button class="btn-sm" onclick="abrirResumen()">📄 ${en ? 'Open results view' : 'Abrir vista de resultados'}</button>
    </div>
    <table class="rtable" id="rtable">
      <thead><tr><th>${en ? 'Student / Group' : 'Estudiante / Grupo'}</th>${crit.map(c => `<th>${escHtml(c.nombre)}</th>`).join('')}<th>${en ? 'Grade' : 'Nota'}</th><th>${en ? 'Comments' : 'Obs.'}</th></tr></thead>
      <tbody id="rbody"></tbody>
    </table>
  </div>
  <p class="footer">Copiloto Docente TI · Maryam Math · ${sourceLabel} · ${en ? 'Author' : 'Autora'}: ${AUTORA.nombre} · ${new Date().getFullYear()}</p>
<script>
const PESOS = ${pesosJson};
const CRIT_NOMBRES = ${critNombresJson};
const CRIT_DATA = ${critDataJson};
const SAVE_KEY = ${jS(saveKey)};
const META = {
  subtema: ${jS(subtema)},
  componente: ${jS(componenteLabel)},
  levelLabel: ${jS(levelLabel)},
  levelValue: ${jS(levelValue)},
  docente: ${jS(data.docente || '[Docente]')},
  institucion: ${jS(data.institucion || '')}
};
const COMP_ESC = ${jS(competenciaEsc)};

let escMax = 5;
const sel = {}, selN = {};
let notas = []; try { notas = JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch(e) {}

function gd() { return escMax === 100 ? 0 : 1; }
function calcS(v) { 
  const r = { s: 1.0, a: 0.84, b: 0.70, l: 0.30 };
  return escMax * (r[v] || 0);
}

function cambiarEscala(m) {
  escMax = m;
  const d = gd();
  const v = {
    s: (m * 1.0).toFixed(d),
    a: (m * 0.84).toFixed(d),
    b: (m * 0.70).toFixed(d),
    l: (m * 0.30).toFixed(d)
  };
  
  document.getElementById('lbl-s').textContent = v.s;
  document.getElementById('lbl-a').textContent = v.a;
  document.getElementById('lbl-b').textContent = v.b;
  document.getElementById('lbl-l').textContent = v.l;
  document.getElementById('sub-esc').textContent = ${jS(en ? 'Scale 1 - ' : 'Escala 1 - ')} + m + ${jS(en ? ' · Weighted by criterion' : ' · Ponderacion segun criterio')};

  Object.keys(selN).forEach(rowIdx => {
    sel[rowIdx] = calcS(selN[rowIdx]);
    const el = document.getElementById('nota-' + rowIdx);
    if (el) el.textContent = sel[rowIdx].toFixed(d);
  });
  recalc();
}

function recalc() {
  const d = gd();
  let suma = 0;
  let count = 0;
  PESOS.forEach((p, i) => {
    if (sel[i] !== undefined) {
      suma += sel[i] * p;
      count++;
    }
  });
  
  const nf = document.getElementById('nota-final');
  if (nf) {
    if (count > 0) {
      nf.textContent = suma.toFixed(d);
      nf.style.color = '#2b5a52';
    } else {
      nf.textContent = '—';
    }
  }
}

function selectCell(row, val, el) {
  const rowId = 'row-' + row;
  const rowEl = document.getElementById(rowId);
  if (!rowEl) return;
  
  rowEl.querySelectorAll('.sel-cell').forEach(td => td.classList.remove('selected'));
  el.classList.add('selected');
  
  const input = el.querySelector('input');
  if (input) input.checked = true;
  
  selN[row] = val;
  sel[row] = calcS(val);
  
  const d = gd();
  const ne = document.getElementById('nota-' + row);
  if (ne) ne.textContent = sel[row].toFixed(d);
  
  recalc();
}

function addRow(e) {
  const tr = document.createElement('tr');
  tr.innerHTML = '<td><strong>' + e.nombre + '</strong><br><span style="font-size:.63rem;color:#9ca3af">' + e.fecha + ' · /' + e.escMax + '</span></td>'
    + e.cn.map(n => '<td style="text-align:center">' + n + '</td>').join('')
    + '<td style="text-align:center;font-size:1rem;font-weight:900;color:#2b5a52">' + e.nf + '</td>'
    + '<td style="font-size:.7rem;color:#6b7280;max-width:110px;word-break:break-word">' + (e.obs || '—') + '</td>';
  document.getElementById('rbody').appendChild(tr);
}

function guardarNota() {
  const nombre = document.getElementById('nombre-est').value.trim() || '(sin nombre)';
  const d = gd();
  const nfEl = document.getElementById('nota-final');
  const nf = nfEl ? nfEl.textContent : '—';
  const obs = document.getElementById('obs-txt')?.value || '';
  const cn = PESOS.map((_, i) => sel[i] !== undefined ? sel[i].toFixed(d) : '—');
  const entrada = { nombre, cn, nf, escMax, obs, fecha: new Date().toLocaleString('${en ? 'en-US' : 'es-CO'}') };
  
  notas.push(entrada);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(notas)); } catch(e) {}
  
  addRow(entrada);
  document.getElementById('resumen-sec').style.display = '';
  
  const t = document.getElementById('save-toast');
  t.textContent = '${en ? '✔ Grade saved' : '✔ Nota guardada'} — ' + nombre;
  t.style.display = 'inline-flex';
  setTimeout(() => { t.style.display = 'none'; }, 2500);
  
  // Reset
  document.getElementById('nombre-est').value = '';
  document.querySelectorAll('.sel-cell').forEach(td => td.classList.remove('selected'));
  Object.keys(sel).forEach(k => delete sel[k]);
  Object.keys(selN).forEach(k => delete selN[k]);
  document.querySelectorAll('.nota-val').forEach(el => el.textContent = '—');
  document.querySelectorAll('input[type=radio]').forEach(el => el.checked = false);
  if (nfEl) { nfEl.textContent = '—'; nfEl.style.color = '#2b5a52'; }
  if (document.getElementById('obs-txt')) document.getElementById('obs-txt').value = '';
}

function copiarResumen(btn) {
  const rows = [...document.querySelectorAll('#rtable tbody tr')];
  const hdr = '${en ? 'Student / Group' : 'Estudiante'}\t' + CRIT_NOMBRES.join('\t') + '\t${en ? 'Grade' : 'Nota'}\t${en ? 'Comments' : 'Observaciones'}';
  const txt = rows.map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent.replace(/\\n/g, ' ').trim()).join('\t')).join('\\n');
  navigator.clipboard.writeText(hdr + '\\n' + txt).then(() => {
    const p = btn.textContent;
    btn.textContent = '${en ? '✔ Copied!' : '✔ ¡Copiado!'}';
    setTimeout(() => { btn.textContent = p; }, 2000);
  });
}

function abrirResumen() {
  if (!notas.length) return;
  const heads = CRIT_NOMBRES.map(n => '<th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">' + n + '</th>').join('');
  const rows = notas.map(n => '<tr>'
    + '<td style="padding:10px;border:1px solid #e5e7eb"><strong>' + n.nombre + '</strong><br><span style="font-size:.72rem;color:#6b7280">' + n.fecha + ' · /' + n.escMax + '</span></td>'
    + (n.cn || []).map(v => '<td style="padding:10px;border:1px solid #e5e7eb;text-align:center">' + v + '</td>').join('')
    + '<td style="padding:10px;border:1px solid #e5e7eb;text-align:center;font-weight:800;color:#2b5a52">' + n.nf + '</td>'
    + '<td style="padding:10px;border:1px solid #e5e7eb">' + (n.obs || '—') + '</td>'
    + '</tr>').join('');
  const h = '<!DOCTYPE html><html lang="${safeLang(data.language)}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>${en ? 'Rubric results' : 'Resultados de rúbrica'}</title>'
    + '<style>body{font-family:Inter,system-ui,sans-serif;padding:20px;color:#1f2937;background:#f8fafc}table{width:100%;border-collapse:collapse;background:#fff}th,td{font-size:.8rem;vertical-align:top}h1{font-size:1rem;color:#2b5a52;margin-bottom:10px}</style>'
    + '</head><body><h1>${en ? 'Results' : 'Resultados'} - ' + META.subtema + '</h1><table><thead><tr><th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">${en ? 'Student / Group' : 'Estudiante / Grupo'}</th>'
    + heads
    + '<th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">${en ? 'Grade' : 'Nota'}</th><th style="padding:10px;border:1px solid #e5e7eb;background:#f8fafc">${en ? 'Comments' : 'Observaciones'}</th>'
    + '</tr></thead><tbody>' + rows + '</tbody></table></body></html>';
  const blob = new Blob([h], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
function compartirEstudiante() {
  const d = gd();
  const v = {
    s: (escMax * 1.0).toFixed(d),
    a: (escMax * 0.84).toFixed(d),
    b: (escMax * 0.70).toFixed(d),
    l: (escMax * 0.30).toFixed(d)
  };
  const trows = CRIT_DATA.map(c => '<tr>'
    + '<td style="padding:10px 12px;background:#f8f9fa;font-size:.78rem;vertical-align:top"><strong>' + c.nombre + '</strong><br><span style="font-size:.65rem;color:#6b7280">' + c.pct + '</span></td>'
    + '<td style="padding:10px 12px;background:#d1fae5;color:#065f46;font-size:.76rem;vertical-align:top">' + c.s + '</td>'
    + '<td style="padding:10px 12px;background:#dbeafe;color:#1e40af;font-size:.76rem;vertical-align:top">' + c.a + '</td>'
    + '<td style="padding:10px 12px;background:#fef9c3;color:#854d0e;font-size:.76rem;vertical-align:top">' + c.b + '</td>'
    + '<td style="padding:10px 12px;background:#fee2e2;color:#991b1b;font-size:.76rem;vertical-align:top">' + c.l + '</td>'
    + '</tr>').join('');
  const nombre = document.getElementById('nombre-est')?.value?.trim() || '(sin nombre)';
  const nf = document.getElementById('nota-final')?.textContent || '—';
  const obs = document.getElementById('obs-txt')?.value?.trim() || '';
  const hasCurrent = Object.keys(selN).length > 0;
  if (hasCurrent) {
    const hg = '<!DOCTYPE html><html lang="${safeLang(data.language)}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${en ? 'Graded rubric' : 'Rúbrica calificada'}</title>'
      + '<style>body{font-family:Inter,system-ui,sans-serif;background:#f0f4f3;padding:20px;color:#1a1a1a}.card{background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:20px}h1{font-size:1rem;color:#2b5a52;margin-bottom:8px}p{font-size:.82rem;color:#374151;line-height:1.6}.nf{display:inline-block;padding:6px 10px;border-radius:8px;background:#ecfdf5;color:#065f46;font-weight:800;margin:8px 0}</style>'
      + '</head><body><div class="card"><h1>${en ? 'Graded rubric' : 'Rúbrica calificada'}</h1><p><strong>${en ? 'Student / group' : 'Estudiante / grupo'}:</strong> ' + nombre + '</p><p><strong>${en ? 'Project' : 'Proyecto'}:</strong> ' + META.subtema + '</p><p><strong>${en ? 'Assessed competency' : 'Competencia evaluada'}:</strong> ' + COMP_ESC + '</p><div class="nf">${en ? 'Final grade' : 'Nota final'}: ' + nf + ' / ' + escMax + '</div>'
      + (obs ? '<p><strong>${en ? 'Teacher comments' : 'Observaciones del docente'}:</strong><br>' + obs + '</p>' : '')
      + '</div></body></html>';
    const blobG = new Blob([hg], { type: 'text/html;charset=utf-8' });
    const urlG = URL.createObjectURL(blobG);
    window.open(urlG, '_blank');
    setTimeout(() => URL.revokeObjectURL(urlG), 10000);
    return;
  }
    
  const h = '<!DOCTYPE html><html lang="${safeLang(data.language)}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>${en ? 'Assessment criteria' : 'Criterios de evaluación'}</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900\u0026family=Inter:wght@400;500;600;700\u0026display=swap" rel="stylesheet">'
    + '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Inter",sans-serif;background:#f0f4f3;padding:20px;color:#1a1a1a}'
    + '.hdr{background:#2b5a52;color:#fff;padding:18px 22px;border-radius:12px;margin-bottom:16px}'
    + '.hdr h1{font-family:"Nunito",sans-serif;font-size:1rem;font-weight:900;margin-bottom:3px}.hdr p{font-size:.75rem;opacity:.8}'
    + '.intro{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px;margin-bottom:14px;font-size:.82rem;color:#7c5a20;line-height:1.7}'
    + '.card{background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:14px}'
    + 'h2{font-size:.85rem;color:#2b5a52;font-weight:700;margin-bottom:10px;border-bottom:2px solid #2b5a52;padding-bottom:6px}'
    + '.comp{background:#f0f9f7;border:1px solid #c6e8e0;border-radius:8px;padding:12px 14px;margin-bottom:12px;font-size:.78rem;color:#1a3d37;line-height:1.7}'
    + '.leyenda{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}'
    + '.lb{font-size:.72rem;font-weight:700;padding:3px 10px;border-radius:12px}'
    + 'table{width:100%;border-collapse:collapse;font-size:.72rem;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb}'
    + 'th{padding:10px 12px;text-align:center;font-size:.7rem;font-weight:700;text-transform:uppercase}'
    + 'td{border-bottom:1px solid #f0f0f0;line-height:1.5;vertical-align:top}'
    + '.footer{text-align:center;margin-top:16px;font-size:.65rem;color:#9ca3af}'
    + '@media print{body{background:#fff;padding:8px}.card{box-shadow:none}}'
    +'</style></head><body>'
    +'<div class="hdr"><h1>📋 ${en ? 'Assessment Criteria' : 'Criterios de evaluación'}</h1>'
    +'<p>' + META.subtema + ' · ' + META.componente + ' · ' + META.levelLabel + ' ' + META.levelValue + ' · ' + META.institucion + '</p></div>'
    +'<div class="intro">ℹ️ <strong>${en ? 'Hello, student!' : 'Hola, estudiante!'}</strong> ${en ? 'This rubric shows exactly how your project will be assessed.' : 'Esta rúbrica define exactamente cómo será evaluado tu proyecto.'}</div>'
    +'<div class="card"><h2>${en ? 'Assessment rubric' : 'Rúbrica de evaluación'}</h2>'
    +'<div class="comp"><strong>${en ? 'Assessed competency' : 'Competencia evaluada'}:</strong> ' + COMP_ESC + '</div>'
    +'<div class="leyenda">'
    +'<span class="lb" style="background:#d1fae5;color:#065f46">⭐ ${en ? 'Excellent' : 'Superior'}: ' + v.s + '/' + escMax + '</span>'
    +'<span class="lb" style="background:#dbeafe;color:#1e40af">✅ ${en ? 'Strong' : 'Alto'}: ' + v.a + '/' + escMax + '</span>'
    +'<span class="lb" style="background:#fef9c3;color:#854d0e">⚠ ${en ? 'Developing' : 'Basico'}: ' + v.b + '/' + escMax + '</span>'
    +'<span class="lb" style="background:#fee2e2;color:#991b1b">✗ ${en ? 'Beginning' : 'Bajo'}: ' + v.l + '/' + escMax + '</span>'
    +'</div>'
    +'<table><thead><tr>'
    +'<th style="background:#f8f9fa;color:#374151;text-align:left;width:18%">${en ? 'Criterion' : 'Criterio'}</th>'
    +'<th style="background:#d1fae5;color:#065f46">⭐ ${en ? 'Excellent' : 'Superior'}<br><small>' + v.s + '/' + escMax + '</small></th>'
    +'<th style="background:#dbeafe;color:#1e40af">✅ ${en ? 'Strong' : 'Alto'}<br><small>' + v.a + '/' + escMax + '</small></th>'
    +'<th style="background:#fef9c3;color:#854d0e">⚠ ${en ? 'Developing' : 'Basico'}<br><small>' + v.b + '/' + escMax + '</small></th>'
    +'<th style="background:#fee2e2;color:#991b1b">✗ ${en ? 'Beginning' : 'Bajo'}<br><small>' + v.l + '/' + escMax + '</small></th>'
    +'</tr></thead><tbody>' + trows + '</tbody></table></div>'
    +'<div class="footer">Copiloto Docente TI · Maryam Math · ' + ${jS(en ? 'Teacher' : 'Docente')} + ': ' + META.docente + '</div>'
    + '</body></html>';
    
  const blob = new Blob([h], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

window.addEventListener('DOMContentLoaded', () => {
  if (notas.length > 0) {
    notas.forEach(n => addRow(n));
    document.getElementById('resumen-sec').style.display = '';
  }
  cambiarEscala(5);
});
<\/script>
</body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }


  const handleExportHTML = () => {
    const pasosInfo = getPasosInfo(data.language)
    const year = new Date().getFullYear()
    const levelLabel = getLevelLabel(data)
    const levelValue = getLevelValue(data)
    const frameworkValue = getFrameworkValue(data)
    const badge = getCurriculumBadge(data)
    const logoHtml = data.logoUrl
      ? `<img src="${data.logoUrl}" alt="Logo institucional" style="height:56px;object-fit:contain;border-radius:6px">`
      : ''

    const PASO_ICONS = ['📐', '🎯', '📦', '👩‍🏫', '📝', '⭐', '🏫']
    const PASO_COLORS_D = ['#1e6b5e', '#2b5a52', '#234a43', '#1a3d37', '#2b5a52', '#b45309', '#2b5a52']

    // ── Text → HTML converter ──────────────────────────────────────────────
    let _pid = 0
    const AUTOEVAL_ROWS = [
      'Entendí el reto y la tarea',
      'Participé activamente en el equipo',
      'Entrego el producto requerido',
      'Puedo explicar lo que aprendí',
    ]
    const mkAutoeval = (interactive) => {
      if (interactive) {
        const rows = AUTOEVAL_ROWS.map((r, i) => `
          <tr>
            <td style="padding:10px 12px;font-size:.82rem;color:#374151;border-bottom:1px solid #f3f4f6">${escHtml(r)}</td>
            <td style="text-align:center;border-bottom:1px solid #f3f4f6"><label style="cursor:pointer"><input type="radio" name="ae${i}" value="si" style="accent-color:#16a34a;width:16px;height:16px"> ✔</label></td>
            <td style="text-align:center;border-bottom:1px solid #f3f4f6"><label style="cursor:pointer"><input type="radio" name="ae${i}" value="proc" style="accent-color:#d97706;width:16px;height:16px"> ~</label></td>
            <td style="text-align:center;border-bottom:1px solid #f3f4f6"><label style="cursor:pointer"><input type="radio" name="ae${i}" value="no" style="accent-color:#dc2626;width:16px;height:16px"> ✗</label></td>
          </tr>`).join('')
        return `<div style="margin:.8rem 0;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#fbb041;color:#fff">
              <th style="padding:10px 12px;text-align:left;font-size:.78rem;font-weight:700">Criterio</th>
              <th style="padding:10px 8px;text-align:center;font-size:.78rem;font-weight:700;width:80px">✔ Logrado</th>
              <th style="padding:10px 8px;text-align:center;font-size:.78rem;font-weight:700;width:90px">~ En proceso</th>
              <th style="padding:10px 8px;text-align:center;font-size:.78rem;font-weight:700;width:70px">✗ Aún no</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
      }
      const rows = AUTOEVAL_ROWS.map(r => `
        <tr>
          <td style="padding:9px 12px;font-size:.8rem;color:#374151;border-bottom:1px solid #f3f4f6">${escHtml(r)}</td>
          <td style="text-align:center;border-bottom:1px solid #f3f4f6;width:80px"><span style="font-size:1.1rem">□</span></td>
          <td style="text-align:center;border-bottom:1px solid #f3f4f6;width:90px"><span style="font-size:1.1rem">□</span></td>
          <td style="text-align:center;border-bottom:1px solid #f3f4f6;width:70px"><span style="font-size:1.1rem">□</span></td>
        </tr>`).join('')
      return `<div style="margin:.8rem 0;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#2b5a52;color:#fff">
            <th style="padding:9px 12px;text-align:left;font-size:.76rem;font-weight:700">Criterio</th>
            <th style="padding:9px 8px;text-align:center;font-size:.76rem;font-weight:700;width:80px">✔ Logrado</th>
            <th style="padding:9px 8px;text-align:center;font-size:.76rem;font-weight:700;width:90px">~ En proceso</th>
            <th style="padding:9px 8px;text-align:center;font-size:.76rem;font-weight:700;width:70px">✗ Aún no</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
    }

    const CHECKPOINT_ITEMS = (cpNum, route, lang) => {
      const en = lang === 'en'
      if (cpNum === 1) return [
        en ? 'We understand the challenge and know what to deliver.' : 'Entendemos el reto y sabemos qué entregar.',
        en ? 'We have a sketch or initial idea.' : 'Tenemos un boceto o idea inicial.',
        en ? 'Roles assigned and materials ready.' : 'Roles asignados y materiales listos.',
      ]
      const item2 = route === 'stem'
        ? (en ? 'We completed at least one test round with data.' : 'Completamos al menos una ronda de prueba con datos.')
        : route === 'ib_myp_design'
          ? (en ? 'We tested with the user or context and documented our adjustment.' : 'Probamos con el usuario o contexto y documentamos qué ajustamos.')
          : (en ? 'We tested at least once and adjusted something.' : 'Probamos al menos una vez y ajustamos algo.')
      return [
        en ? 'Our prototype/product works or is nearly ready.' : 'Nuestro prototipo/producto funciona o está casi listo.',
        item2,
        en ? 'We can explain our decisions in 2 minutes.' : 'Podemos explicar nuestras decisiones en 2 minutos.',
      ]
    }

    const mkCheckpoint = (cpNum, interactive) => {
      const en = isEN
      const items = CHECKPOINT_ITEMS(cpNum, data.route, data.language)
      const title = cpNum === 1
        ? (en ? 'Checkpoint 1: Planning check' : 'Punto de chequeo 1: Verificación de planeación')
        : (en ? 'Checkpoint 2: Progress check' : 'Punto de chequeo 2: Verificación de progreso')
      const hdr = en ? ['Ready', 'In progress', 'Stuck'] : ['Listo', 'En proceso', 'Atascado']
      const colors = ['#16a34a', '#d97706', '#dc2626']
      const icons = ['🟢', '🟡', '🔴']

      if (interactive) {
        const rows = items.map((r, i) => `
          <tr>
            <td style="padding:10px 12px;font-size:.82rem;color:#374151;border-bottom:1px solid #f3f4f6">${escHtml(r)}</td>
            ${icons.map((ic, j) => `<td style="text-align:center;border-bottom:1px solid #f3f4f6"><label style="cursor:pointer"><input type="radio" name="cp${cpNum}_${i}" value="${j}" style="accent-color:${colors[j]};width:16px;height:16px"> ${ic}</label></td>`).join('')}
          </tr>`).join('')
        return `<div style="margin:1rem 0;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          <div style="background:#2b5a52;color:#fff;padding:10px 14px;font-size:.78rem;font-weight:700">⏱ ${escHtml(title)}</div>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:#f0fdf4">
              <th style="padding:8px 12px;text-align:left;font-size:.75rem;font-weight:600;color:#374151">${en ? 'Statement' : 'Afirmación'}</th>
              ${hdr.map((h, j) => `<th style="padding:8px 6px;text-align:center;font-size:.75rem;font-weight:600;color:${colors[j]};width:80px">${icons[j]} ${h}</th>`).join('')}
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`
      }
      const rows = items.map(r => `
        <tr>
          <td style="padding:9px 12px;font-size:.8rem;color:#374151;border-bottom:1px solid #f3f4f6">${escHtml(r)}</td>
          ${icons.map(() => `<td style="text-align:center;border-bottom:1px solid #f3f4f6;width:80px"><span style="font-size:1.1rem">○</span></td>`).join('')}
        </tr>`).join('')
      return `<div style="margin:1rem 0;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb">
        <div style="background:#2b5a52;color:#fff;padding:9px 14px;font-size:.76rem;font-weight:700">⏱ ${escHtml(title)}</div>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f0fdf4">
            <th style="padding:8px 12px;text-align:left;font-size:.73rem;font-weight:600;color:#374151">${en ? 'Statement' : 'Afirmación'}</th>
            ${hdr.map((h, j) => `<th style="padding:8px 6px;text-align:center;font-size:.73rem;font-weight:600;color:${colors[j]};width:80px">${icons[j]} ${h}</th>`).join('')}
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
    }

    const mkHtml = (raw, interactive = false) => {
      const lines = String(raw || '').split('\n')
      let out = '', buf = [], ord = false
      let tbuf = [], thashead = false
      const flush = () => {
        if (!buf.length) return
        out += `<${ord ? 'ol' : 'ul'}>${buf.join('')}</${ord ? 'ol' : 'ul'}>`
        buf = []; ord = false
      }
      const flushTbl = () => {
        if (!tbuf.length) return
        const cs = 'padding:8px 11px;text-align:left;border-bottom:1px solid #e5e7eb;font-size:.8rem;line-height:1.55;vertical-align:top'
        const hs = `${cs};background:linear-gradient(135deg,#f0f9f7,#e8f5f2);color:#1a3d37;font-weight:700;font-family:'Nunito',sans-serif;border-bottom:2px solid #c6e8e0`
        const toRow = (cells, tag) => `<tr>${cells.map(c => `<${tag} style="${tag === 'th' ? hs : cs}">${escHtml(c.trim()) || '&nbsp;'}</${tag}>`).join('')}</tr>`
        const valid = tbuf.filter(r => r.some(c => c.trim()))
        let thead = '', tbody = ''
        if (thashead && valid.length > 0) {
          thead = `<thead>${toRow(valid[0], 'th')}</thead>`
          tbody = `<tbody>${valid.slice(1).map(r => toRow(r, 'td')).join('')}</tbody>`
        } else {
          tbody = `<tbody>${valid.map(r => toRow(r, 'td')).join('')}</tbody>`
        }
        out += `<div style="overflow-x:auto;margin:.8rem 0;border-radius:10px;border:1px solid #e5e7eb;box-shadow:0 1px 6px rgba(0,0,0,.06)"><table style="width:100%;border-collapse:collapse">${thead}${tbody}</table></div>`
        tbuf = []; thashead = false
      }
      const blank = (t) => interactive
        ? escHtml(t).replace(/_{3,}/g, '<input type="text" class="fi" placeholder="Escribe aquí...">')
        : escHtml(t).replace(/_{3,}/g, '<span class="bu"></span>')
      for (const line of lines) {
        const t = line.trim()
        if (!t) { flush(); flushTbl(); continue }
        // Separador de tabla (---|---|---): marca fila anterior como encabezado
        if (/^[-|:\s]+$/.test(t) && t.includes('|') && t.includes('-') && t.length >= 5) {
          if (tbuf.length) thashead = true
          continue
        }
        // Fila de tabla: línea con 2+ separadores | (≥3 celdas)
        const tcells = t.split('|').map(c => c.trim())
        if (tcells.length >= 3) {
          flush()
          // Eliminar celdas vacías al inicio/fin (formato |cell|cell|)
          const cells = (tcells[0] === '' ? tcells.slice(1) : tcells)
          const cells2 = cells[cells.length - 1] === '' ? cells.slice(0, -1) : cells
          tbuf.push(cells2.length >= 2 ? cells2 : cells)
          continue
        }
        // Línea no-tabla → volcar buffer de tabla pendiente
        flushTbl()
        // Separadores: =====, -----, ─────, ━━━━━, box chars
        if (/^[=\-]{4,}$/.test(t) || /^[─━═]{4,}$/.test(t) || /^[┌└│├╔╚║╠]{1}/.test(t)) {
          flush(); out += '<hr>'; continue
        }
        // Marcador especial autoevaluación
        if (t === '##AUTOEVAL##') { flush(); out += mkAutoeval(interactive); continue }
        if (t === '##CHECKPOINT1##') { flush(); out += mkCheckpoint(1, interactive); continue }
        if (t === '##CHECKPOINT2##') { flush(); out += mkCheckpoint(2, interactive); continue }
        // Instrucción foto/captura
        if (/^(📸|FOTO\s*\d+\s*[:.]|FOTO[/]?CAPTURA\s*:)/i.test(t)) {
          flush()
          const desc = t.replace(/^(📸\s*(?:FOTO\s*\d*\s*[:.]?)?|FOTO\s*\d*\s*[:.]|FOTO[/]?CAPTURA\s*:)\s*/i, '').trim() || t.replace(/^📸\s*/, '')
          if (interactive) {
            _pid++
            out += `<div class="upa"><p class="upi">📸 ${escHtml(desc)}</p><label class="upb" for="p${_pid}">📷 ${en ? 'Add photo' : 'Agregar foto'}</label><input id="p${_pid}" type="file" accept="image/*" onchange="prevImg(this,'p${_pid}v')"><img id="p${_pid}v" class="upv" alt=""></div>`
          } else {
            out += `<div class="pn">📸 ${escHtml(desc)}</div>`
          }
          continue
        }
        // ⏱ encabezado de subtarea cronometrada
        if (/^⏱/.test(t)) { flush(); out += `<h5>${escHtml(t)}</h5>`; continue }
        // ALL CAPS heading (≥8 chars, sin minúsculas)
        if (t.length >= 8 && !/[a-záéíóúñ]/.test(t) && /[A-ZÁÉÍÓÚÑ]/.test(t)) { flush(); out += `<h4>${escHtml(t)}</h4>`; continue }
        // [SPACE ...] editable box
        if (/^\[[^\]]+\]$/.test(t)) {
          flush()
          const ph = t.replace(/^\[/, '').replace(/\]$/, '').trim() || (data.language === 'en' ? 'Write your answer here...' : 'Escribe aquí tu respuesta...')
          out += interactive
            ? `<div class="sa" contenteditable="true" data-ph="${escHtml(ph)}"></div>`
            : `<div class="bb">${escHtml(ph)}</div>`
          continue
        }
        // □ checkbox
        if (/^□\s/.test(t)) {
          flush()
          const lbl = t.slice(2).trim()
          out += interactive
            ? `<label class="cr"><input type="checkbox"><span>${escHtml(lbl)}</span></label>`
            : `<div class="cr"><span>□</span><span>${escHtml(lbl)}</span></div>`
          continue
        }
        // bullet •·→✓✗-
        const bm = t.match(/^[•·→✓✗\-]\s+(.*)/)
        if (bm) { if (ord) { flush(); ord = false }; buf.push(`<li>${blank(bm[1])}</li>`); continue }
        // numbered list
        const nm = t.match(/^\d+\.\s+(.*)/)
        if (nm) { if (!ord) { flush(); ord = true }; buf.push(`<li>${blank(nm[1])}</li>`); continue }
        // plain paragraph
        flush()
        out += `<p>${blank(t)}</p>`
      }
      flush()
      flushTbl()
      return out || '<p>—</p>'
    }

    // ── NEE section for export ─────────────────────────────────────────────
    const neeHtml = (() => {
      if (!data.tieneNEE) return ''
      const tipos = (data.tiposNEE || []).map(id => NEE_TIPOS.find(t => t.id === id)).filter(Boolean)
      if (!tipos.length) return ''
      const sub = data.subtema?.nombre || (data.language === 'en' ? 'the project' : 'el proyecto')
      return `<div class="doc-card" style="border-left:4px solid #7c3aed">
        <div class="doc-title"><span class="paso-icon">♿</span>
          <div><span class="paso-label" style="color:#5b21b6">${data.language === 'en' ? 'DIVERSITY ADAPTATIONS (SEN)' : 'ADAPTACIONES PARA LA DIVERSIDAD (NEE)'}</span>
          <span class="paso-desc">${data.language === 'en' ? `${tipos.length} special educational need type${tipos.length > 1 ? 's' : ''} — Decree 1421/2017 · UDL principle` : `${tipos.length} tipo${tipos.length > 1 ? 's' : ''} de necesidad educativa especial — Decreto 1421/2017 · Principio DUA`}</span></div>
        </div>
        ${data.descripcionNEE?.trim() ? `<div style="font-size:.78rem;color:#6b7280;font-style:italic;padding:8px 10px;background:#f5f0ff;border-radius:6px;margin-bottom:12px;border:1px dashed #c4b5fd">📝 ${data.language === 'en' ? 'Teacher context' : 'Contexto del docente'}: ${escHtml(data.descripcionNEE)}</div>` : ''}
        ${tipos.map(tipo => `<div style="border-radius:10px;border:1px solid #e0d0f7;background:#f8f0ff;padding:12px 14px;margin-bottom:10px">
          <p style="font-weight:800;font-size:.82rem;color:#5b21b6;margin-bottom:6px">${tipo.icon} ${escHtml(tipo.label)}</p>
          <ul style="margin-left:1.2rem;font-size:.8rem;color:#374151;line-height:1.7">
            ${tipo.adaptaciones(sub).map(a => `<li style="margin-bottom:.25rem">${escHtml(a)}</li>`).join('')}
          </ul>
        </div>`).join('')}
      </div>`
    })()


    const renderCards = (indices, cardClass = '') =>
      indices.map((i) => {
        const info = pasosInfo[i]
        const contenido = info.num === 6 ? gen6(data) : (info.num === 5 ? ensureStudentGuideContent(data[`paso${info.num}`] || GENERADORES[i](data), data) : (data[`paso${info.num}`] || GENERADORES[i](data)))
        const isStudent = cardClass === 'e-card'
        const imgs = (data[`imgPaso${info.num}`] || [])
          .map((img) => `<div style="margin-top:12px"><img src="${img.dataUrl}" alt="${escHtml(img.name)}"
            style="max-width:100%;max-height:240px;object-fit:contain;border-radius:10px;border:1px solid #e5e7eb;display:block"></div>`)
          .join('')
        const accentColor = isStudent ? '#fbb041' : (PASO_COLORS_D[i] || '#2b5a52')
        return `<div class="doc-card ${cardClass}" style="border-left:4px solid ${accentColor}" id="paso-${info.num}">
          <div class="doc-title">
            <span class="paso-icon">${PASO_ICONS[i]}</span>
            <div><span class="paso-label">${data.language === 'en' ? 'STEP' : 'PASO'} ${info.num}: ${escHtml(info.titulo.toUpperCase())}</span>
            <span class="paso-desc">${escHtml(info.desc)}</span></div>
          </div>
          <div class="doc-content">${mkHtml(contenido, isStudent)}</div>
          ${imgs}
        </div>`
      }).join('')

    const tocItems = [0, 1, 2, 3, 5, 6].map(i =>
      `<li><a href="#paso-${pasosInfo[i].num}">${PASO_ICONS[i]} ${data.language === 'en' ? 'STEP' : 'PASO'} ${pasosInfo[i].num}: ${escHtml(pasosInfo[i].titulo)}</a></li>`
    ).join('')

    const html = `<!DOCTYPE html>
<html lang="${safeLang(data.language)}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kit TI — ${escHtml(data.subtema?.nombre || (data.language === 'en' ? 'Teaching kit' : 'Kit Docente'))} — ${escHtml(data.institucion || '')}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#f0f4f3;color:#1a1a1a;min-height:100vh;font-size:15px;-webkit-font-smoothing:antialiased}
.header{background:linear-gradient(135deg,#2b5a52 0%,#1a3d37 100%);color:#fff;padding:24px 36px;display:flex;align-items:center;gap:20px}
.header-info h1{font-family:'Nunito',sans-serif;font-size:1.15rem;font-weight:800;margin-bottom:4px;letter-spacing:-.02em}
.header-info p{font-size:.78rem;opacity:.75;margin-bottom:2px}
.badge{display:inline-flex;align-items:center;gap:6px;background:rgba(251,176,65,.25);border:1px solid rgba(251,176,65,.4);border-radius:20px;padding:4px 14px;font-size:.7rem;font-weight:700;margin-top:8px;color:#fde68a;letter-spacing:.01em}
.tabs{display:flex;background:#fff;border-bottom:2px solid #e5e7eb;position:sticky;top:0;z-index:20;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.tab{flex:1;padding:15px;text-align:center;font-size:.88rem;font-weight:700;cursor:pointer;border:none;background:transparent;color:#6b7280;transition:all .2s;border-bottom:3px solid transparent;margin-bottom:-2px;letter-spacing:-.01em;font-family:'Nunito',sans-serif}
.tab:hover{background:#f9fafb;color:#374151}
.tab.docente.active{color:#2b5a52;border-bottom-color:#2b5a52;background:#f0f9f7}
.tab.estudiante.active{color:#b45309;border-bottom-color:#fbb041;background:#fffbeb}
.section{display:none;padding:32px 36px;max-width:920px;margin:0 auto}
.section.visible{display:block}
.cover{background:#fff;border-radius:18px;border:1px solid #e5e7eb;padding:30px 34px;margin-bottom:20px;box-shadow:0 4px 20px rgba(43,90,82,.08)}
.cover-header{display:flex;align-items:flex-start;gap:20px;margin-bottom:18px}
.cover h2{font-family:'Nunito',sans-serif;color:#2b5a52;font-size:1.5rem;font-weight:900;margin-bottom:6px;letter-spacing:-.03em;line-height:1.2}
.cover .subtema-badge{display:inline-block;background:#fbb041;color:#fff;font-size:.72rem;font-weight:800;border-radius:20px;padding:4px 12px;margin-bottom:10px;letter-spacing:.02em}
.cover .meta-row{display:flex;flex-wrap:wrap;gap:16px;margin-top:14px;padding-top:14px;border-top:1px solid #f0f0f0}
.cover .meta-item{font-size:.8rem;color:#374151;display:flex;align-items:center;gap:6px}
.cover .meta-item strong{color:#2b5a52;font-weight:700}
.toc{background:linear-gradient(135deg,#f8faf9,#f0f9f7);border:1px solid #c6e8e0;border-radius:14px;padding:18px 22px;margin-bottom:20px}
.toc h3{font-family:'Nunito',sans-serif;font-size:.78rem;font-weight:800;color:#2b5a52;text-transform:uppercase;letter-spacing:.1em;margin-bottom:12px}
.toc ul{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:6px}
.toc li a{font-size:.8rem;color:#374151;text-decoration:none;display:flex;align-items:center;gap:7px;padding:4px 0;font-weight:500}
.toc li a:hover{color:#2b5a52}
.doc-card{background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:24px 26px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,.05);page-break-inside:avoid}
.doc-title{display:flex;align-items:flex-start;gap:12px;padding-bottom:14px;border-bottom:2px solid #f0f0f0;margin-bottom:16px}
.paso-icon{font-size:1.5rem;flex-shrink:0;margin-top:2px}
.paso-label{font-family:'Nunito',sans-serif;font-size:.82rem;font-weight:900;color:#2b5a52;letter-spacing:-.01em;display:block;text-transform:uppercase}
.e-card .paso-label{color:#b45309}
.paso-desc{font-size:.7rem;color:#6b7280;display:block;margin-top:2px;font-weight:500}
.doc-content{font-size:.88rem;line-height:1.8;color:#374151}
.doc-content h4{font-family:'Nunito',sans-serif;font-size:.9rem;font-weight:800;color:#2b5a52;letter-spacing:-.01em;margin:1.2rem 0 .5rem;padding:.4rem .8rem;background:linear-gradient(135deg,#f0f9f7,#e8f5f2);border-radius:8px;border-left:3px solid #2b5a52}
.doc-content h5{font-family:'Nunito',sans-serif;font-size:.85rem;font-weight:800;color:#1a3d37;background:#fff7ed;border:1px solid #fde68a;border-radius:8px;padding:6px 12px;display:inline-flex;align-items:center;gap:6px;margin:.8rem 0 .4rem}
.doc-content p{margin-bottom:.6rem;line-height:1.75}
.doc-content ul,.doc-content ol{margin:.4rem 0 .8rem 1.5rem}
.doc-content li{margin-bottom:.4rem;line-height:1.7}
.doc-content hr{border:none;border-top:2px dashed #e0ece9;margin:.9rem 0}
.pn{display:flex;align-items:center;gap:10px;background:#fff7ed;border:1px solid #fde68a;border-left:4px solid #fbb041;border-radius:10px;padding:10px 14px;font-size:.82rem;font-weight:600;color:#b45309;margin:.7rem 0}
.bb{background:#fafafa;border:2px dashed #d1d5db;border-radius:10px;padding:14px;font-size:.8rem;font-style:italic;color:#9ca3af;margin:.5rem 0;min-height:48px;display:flex;align-items:center}
.bu{display:inline-block;border-bottom:2px solid #6b7280;min-width:130px;margin:0 5px;vertical-align:bottom;height:1.1em}
.cr{display:flex;align-items:flex-start;gap:10px;margin:.4rem 0;font-size:.86rem;padding:4px 0}
.fi{border:none;border-bottom:2.5px solid #fbb041;background:rgba(251,176,65,.07);font-family:inherit;font-size:inherit;color:#1a1a1a;padding:3px 8px;outline:none;min-width:140px;border-radius:4px 4px 0 0;transition:border-color .2s,background .2s;vertical-align:middle}
.fi:focus{border-color:#f59e0b;background:rgba(251,176,65,.18);box-shadow:0 2px 0 #f59e0b}
.sa{min-height:80px;background:#fffbeb;border:2px dashed #fbb041;border-radius:10px;padding:12px 14px;margin:.7rem 0;font-size:.86rem;color:#1a1a1a;transition:all .2s;line-height:1.7}
.sa:empty:before{content:attr(data-ph);color:#c9a85a;font-style:italic;pointer-events:none}
.sa:focus{outline:none;background:#fff8e1;border-color:#f59e0b;box-shadow:0 0 0 3px rgba(251,176,65,.15)}
.upa{background:#fffbeb;border:2px dashed #fbb041;border-radius:12px;padding:16px;margin:.9rem 0}
.upi{font-size:.82rem;font-weight:700;color:#b45309;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.upb{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#fbb041,#f59e0b);color:#fff;border-radius:10px;padding:9px 18px;font-size:.82rem;font-weight:800;cursor:pointer;box-shadow:0 2px 8px rgba(251,176,65,.3);transition:all .2s}
.upb:hover{background:linear-gradient(135deg,#f59e0b,#d97706);transform:translateY(-1px)}
input[type=file]{display:none}
.upv{max-width:100%;max-height:220px;object-fit:contain;border-radius:10px;display:none;margin-top:12px;border:2px solid #fde68a;box-shadow:0 2px 8px rgba(0,0,0,.08)}
label.cr{cursor:pointer;transition:background .15s;padding:5px 8px;border-radius:8px}
label.cr:hover{background:#fef9c3}
label.cr input[type=checkbox]{width:18px;height:18px;accent-color:#fbb041;flex-shrink:0;margin-top:1px;cursor:pointer}
.e-header{background:linear-gradient(135deg,#fbb041 0%,#f59e0b 100%);color:#fff;border-radius:16px;padding:20px 26px;margin-bottom:18px;display:flex;align-items:center;gap:16px;box-shadow:0 4px 16px rgba(251,176,65,.3)}
.e-header h3{font-family:'Nunito',sans-serif;font-size:1.05rem;font-weight:900;letter-spacing:-.02em}
.e-header p{font-size:.78rem;opacity:.88;margin-top:3px;font-weight:500}
.e-toolbar{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.e-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;border:none;transition:all .2s;font-family:'Inter',sans-serif}
.e-btn-save{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;box-shadow:0 2px 8px rgba(22,163,74,.25)}
.e-btn-save:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(22,163,74,.3)}
.e-btn-print{background:#fff;color:#374151;border:1.5px solid #d1d5db}
.e-btn-print:hover{background:#f9fafb;border-color:#9ca3af}
.e-btn-dl{background:linear-gradient(135deg,#fbb041,#f59e0b);color:#fff;box-shadow:0 2px 8px rgba(251,176,65,.3)}
.e-btn-dl:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(251,176,65,.4)}
.save-ok{background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:8px 14px;font-size:.78rem;color:#15803d;font-weight:700;display:none}
.competencia-box{background:linear-gradient(135deg,#f0f9f7,#e8f5f2);border:1px solid #c6e8e0;border-radius:12px;padding:16px 20px;margin-bottom:18px}
.competencia-box p{font-size:.82rem;color:#1a3d37;line-height:1.75}
.competencia-box strong{color:#2b5a52;font-weight:700}
.footer{text-align:center;padding:24px;font-size:.68rem;color:#9ca3af;border-top:1px solid #e5e7eb;margin-top:8px;font-weight:500}
@media print{
  .tabs,.footer,.e-toolbar,.save-ok,.upa{display:none!important}
  .section{display:block!important;padding:8px}
  #s-estudiante{page-break-before:always}
  .doc-card{box-shadow:none;border:1px solid #ddd;page-break-inside:avoid}
  body{background:#fff;font-size:12px}
  .header{padding:14px 20px}
  .section{padding:12px}
  .sa{background:#fff;border:none;border-bottom:1.5px solid #aaa;border-radius:0;min-height:56px;padding:4px 0}
  .sa::before{content:none}
  .fi{background:transparent;border-bottom:1.5px solid #aaa;border-radius:0}
  .fi::placeholder{color:transparent}
  .bb{background:#fff;border:1px solid #ccc;color:#444}
  .bu{border-bottom:1.5px solid #aaa}
}
</style>
</head>
<body>
<div class="header">
  ${logoHtml}
  <div class="header-info">
    <h1>${escHtml(data.institucion || (data.language === 'en' ? 'Reusable Teaching Kit' : 'Kit Didáctico Reutilizable'))}${data.ciudad ? ' · ' + escHtml(data.ciudad) : ''}</h1>
    <p>${escHtml(badge)}</p>
    <div class="badge">👩‍🏫 ${escHtml(data.docente || (data.language === 'en' ? '[Teacher]' : '[Docente]'))} &nbsp;|&nbsp; ${escHtml(levelLabel)} ${escHtml(levelValue)} &nbsp;|&nbsp; ${year}</div>
  </div>
</div>

<div class="tabs">
  <button class="tab docente active" onclick="show('docente')">📋 ${data.language === 'en' ? 'Teacher section' : 'Sección Docente'}</button>
  <button class="tab estudiante" onclick="show('estudiante')">🎒 ${data.language === 'en' ? 'Student workbook' : 'Taller Estudiante'}</button>
</div>

<div id="s-docente" class="section visible">
  <div class="cover">
    <div class="cover-header">
      ${logoHtml ? `<div style="flex-shrink:0">${logoHtml}</div>` : ''}
      <div>
        <span class="subtema-badge">${escHtml(frameworkValue || componenteLabel)}</span>
        <h2>${escHtml(data.subtema?.nombre || '[Proyecto]')}</h2>
        <p style="font-size:.82rem;color:#6b7280">${escHtml(data.subtema?.producto || '')}</p>
      </div>
    </div>
    <div class="meta-row">
      <div class="meta-item">🏫 <strong>${escHtml(data.institucion || (data.language === 'en' ? '[Institution]' : '[Institución]'))}</strong>${data.ciudad ? ' · ' + escHtml(data.ciudad) : ''}</div>
      <div class="meta-item">👩‍🏫 <strong>${data.language === 'en' ? 'Teacher' : 'Docente'}:</strong> ${escHtml(data.docente || (data.language === 'en' ? '[Teacher]' : '[Docente]'))}</div>
      <div class="meta-item">📚 <strong>${escHtml(levelLabel)}:</strong> ${escHtml(levelValue)}</div>
      <div class="meta-item">📅 <strong>${data.language === 'en' ? 'Year' : 'Año'}:</strong> ${year}</div>
    </div>
  </div>
  ${data.competencia?.trim() ? `<div class="competencia-box"><p><strong>🎯 ${data.route === 'ib_myp_design' ? (data.language === 'en' ? 'Design focus' : 'Foco de diseño') : (data.language === 'en' ? 'MEN competency' : 'Competencia MEN')}:</strong> ${escHtml(data.competencia)}</p></div>` : ''}
  <div class="toc">
    <h3>📋 ${data.language === 'en' ? 'Teaching kit index' : 'Índice del kit docente'}</h3>
    <ul>${tocItems}</ul>
  </div>
  ${renderCards([0, 1, 2, 3, 5, 6])}
  ${neeHtml}
</div>

<div id="s-estudiante" class="section">
  <div class="e-header">
    <span style="font-size:2.2rem">🎒</span>
    <div>
      <h3>${data.language === 'en' ? 'Student workbook' : 'Taller del Estudiante'}</h3>
      <p>${escHtml(data.subtema?.nombre || '[Proyecto]')} · ${escHtml(levelLabel)} ${escHtml(levelValue)}</p>
    </div>
  </div>
  <div class="e-toolbar">
    <button class="e-btn e-btn-back" onclick="volver()">
      ← ${data.language === 'en' ? 'Back to kit' : 'Volver al kit'}
    </button>
    <button class="e-btn e-btn-save" onclick="guardarRespuestas()">💾 ${data.language === 'en' ? 'Save answers' : 'Guardar respuestas'}</button>
    <button class="e-btn e-btn-dl" onclick="window.print()">📄 ${data.language === 'en' ? 'Open print view' : 'Abrir vista de impresión'}</button>
    <button class="e-btn e-btn-print" onclick="window.print()">🖨️ ${data.language === 'en' ? 'Print workbook' : 'Imprimir taller'}</button>
    <span class="save-ok" id="save-ok">✔ ${data.language === 'en' ? 'Answers saved on this device' : 'Respuestas guardadas en este dispositivo'}</span>
  </div>
  <div style="background:linear-gradient(135deg,#fffbeb,#fff7ed);border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:.82rem;color:#7c5a20;border:1px solid #fde68a;display:flex;align-items:center;gap:10px">
    <span style="font-size:1.3rem">✏️</span>
    <div><strong>${data.language === 'en' ? 'Hello, student!' : '¡Hola, estudiante!'}</strong> ${data.language === 'en' ? 'Write in the yellow fields, mark completed steps and upload your photos with 📷. Use 💾 to save your progress on this device and 🖨️ only if you need a printed copy.' : 'Escribe en las casillas amarillas, marca los pasos completados y sube tus fotos con el botón 📷. Usa 💾 para guardar tu avance en este dispositivo y 🖨️ solo si necesitas copia impresa.'}</div>
  </div>
  ${renderCards([4, 5], 'e-card')}
</div>

<div class="footer">${data.language === 'en' ? 'Kit generated with' : 'Kit generado con'} Copiloto Docente TI · Maryam Math Plataforma Educativa · ${badge} · ${data.language === 'en' ? 'Author' : 'Autora'}: ${AUTORA.nombre}</div>

<script>
const SAVE_KEY = 'kit_${escHtml(data.subtema?.nombre || 'taller').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}';

function show(t){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('visible'));
  document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
  document.getElementById('s-'+t).classList.add('visible');
  document.querySelector('.tab.'+t).classList.add('active');
}

function volver(){
  if (window.opener && !window.opener.closed) {
    window.close();
    return;
  }
  if (document.referrer) {
    window.history.back();
  } else {
    window.location.href = '/kit-docente';
  }
}

function prevImg(input,pid){
  const f=input.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=e=>{
    const img=document.getElementById(pid);
    if(img){img.src=e.target.result; img.style.display='block';}
  };
  r.readAsDataURL(f);
}

function guardarRespuestas(){
  const estado = {};
  // Guardar contenido de áreas editables
  document.querySelectorAll('.sa').forEach((el,i)=>{ estado['sa_'+i]=el.innerHTML; });
  // Guardar inputs de texto
  document.querySelectorAll('.fi').forEach((el,i)=>{ estado['fi_'+i]=el.value; });
  // Guardar checkboxes
  document.querySelectorAll('input[type=checkbox]').forEach((el,i)=>{ estado['cb_'+i]=el.checked; });
  // Guardar radio buttons (autoevaluación)
  document.querySelectorAll('input[type=radio]').forEach((el,i)=>{ if(el.checked) estado['rb_'+el.name+'_'+el.value]=true; });
  // Guardar imágenes (solo las que fueron cargadas)
  const imgs={}; document.querySelectorAll('.upv').forEach((img,i)=>{ if(img.style.display!=='none'&&img.src) imgs['img_'+i]=img.src; });
  Object.assign(estado, imgs);
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(estado));
    const ok = document.getElementById('save-ok');
    if(ok){ ok.style.display='inline-flex'; setTimeout(()=>{ ok.style.display='none'; },3000); }
  } catch(e){ alert('No se pudieron guardar las respuestas. El almacenamiento del navegador puede estar lleno.'); }
}

function restaurarRespuestas(){
  try {
    const est = JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
    if(!Object.keys(est).length) return;
    document.querySelectorAll('.sa').forEach((el,i)=>{ if(est['sa_'+i]!==undefined) el.innerHTML=est['sa_'+i]; });
    document.querySelectorAll('.fi').forEach((el,i)=>{ if(est['fi_'+i]!==undefined) el.value=est['fi_'+i]; });
    document.querySelectorAll('input[type=checkbox]').forEach((el,i)=>{ if(est['cb_'+i]!==undefined) el.checked=est['cb_'+i]; });
    document.querySelectorAll('input[type=radio]').forEach(el=>{ if(est['rb_'+el.name+'_'+el.value]) el.checked=true; });
    document.querySelectorAll('.upv').forEach((img,i)=>{ if(est['img_'+i]){img.src=est['img_'+i];img.style.display='block';} });
  } catch(e){}
}

// Auto-guardar cada 60 segundos mientras hay actividad
let _autoGuardado = null;
function _resetTimer(){
  clearTimeout(_autoGuardado);
  _autoGuardado = setTimeout(guardarRespuestas, 60000);
}
document.addEventListener('input', _resetTimer);
document.addEventListener('change', _resetTimer);

// Al cargar, restaurar respuestas guardadas
window.addEventListener('DOMContentLoaded', ()=>{
  restaurarRespuestas();
  document.querySelectorAll('.sa').forEach(el=>{
    el.addEventListener('focus',()=>{ el.style.borderColor='#f59e0b'; el.style.boxShadow='0 0 0 3px rgba(251,176,65,.15)'; });
    el.addEventListener('blur',()=>{ el.style.borderColor='#fbb041'; el.style.boxShadow=''; });
  });
});

</script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const handleExportEstudiante = () => {
    const en = isEnglish(data)
    const localizedSubtema = getLocalizedSubtema(data)
    const subtema = localizedSubtema?.nombre || (en ? '[Project]' : '[Proyecto]')
    const levelLabel = getLevelLabel(data)
    const levelValue = getLevelValue(data)
    const sourceLabel = getSourceLabel(data)
    const logoHtml = data.logoUrl
      ? `<img src="${data.logoUrl}" alt="Logo" style="height:44px;object-fit:contain;border-radius:6px">`
      : ''
    let _pid = 0
    const AEVAL = en
      ? ['I understood the challenge and the task', 'I participated actively in the team', 'I submitted the required product', 'I can explain what I learned']
      : ['Entendí el reto y la tarea', 'Participé activamente en el equipo', 'Entrego el producto requerido', 'Puedo explicar lo que aprendí']
    const mkAutoeval = () => {
      const rows = AEVAL.map((r, i) => `<tr><td style="padding:10px 12px;font-size:.82rem;color:#374151;border-bottom:1px solid #f3f4f6">${escHtml(r)}</td><td style="text-align:center;border-bottom:1px solid #f3f4f6"><label style="cursor:pointer"><input type="radio" name="ae${i}" value="si" style="accent-color:#16a34a;width:16px;height:16px"> ✔</label></td><td style="text-align:center;border-bottom:1px solid #f3f4f6"><label style="cursor:pointer"><input type="radio" name="ae${i}" value="proc" style="accent-color:#d97706;width:16px;height:16px"> ~</label></td><td style="text-align:center;border-bottom:1px solid #f3f4f6"><label style="cursor:pointer"><input type="radio" name="ae${i}" value="no" style="accent-color:#dc2626;width:16px;height:16px"> ✗</label></td></tr>`).join('')
      return `<div style="margin:.8rem 0;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#fbb041;color:#fff"><th style="padding:10px 12px;text-align:left;font-size:.78rem;font-weight:700">${en ? 'Criterion' : 'Criterio'}</th><th style="padding:10px 8px;text-align:center;font-size:.78rem;font-weight:700;width:80px">✔ ${en ? 'Met' : 'Logrado'}</th><th style="padding:10px 8px;text-align:center;font-size:.78rem;font-weight:700;width:90px">~ ${en ? 'In progress' : 'En proceso'}</th><th style="padding:10px 8px;text-align:center;font-size:.78rem;font-weight:700;width:70px">✗ ${en ? 'Not yet' : 'Aún no'}</th></tr></thead><tbody>${rows}</tbody></table></div>`
    }
    const mkHtml = (raw) => {
      const lines = String(raw || '').split('\n'); let out = '', buf = []
      const flush = () => { if (!buf.length) return; out += `<ul>${buf.join('')}</ul>`; buf = [] }
      const blank = (t) => escHtml(t).replace(/_{3,}/g, '<input type="text" class="fi" placeholder="Escribe aquí...">')
      for (const line of lines) {
        const t = line.trim()
        if (!t) { flush(); continue }
        if (/^[=\-]{4,}$/.test(t) || /^[─━═]{4,}$/.test(t)) { flush(); out += '<hr>'; continue }
        if (t === '##AUTOEVAL##') { flush(); out += mkAutoeval(); continue }
        if (t === '##CHECKPOINT1##') { flush(); out += mkCheckpoint(1, false); continue }
        if (t === '##CHECKPOINT2##') { flush(); out += mkCheckpoint(2, false); continue }
        if (/^(📸|FOTO\s*\d+\s*[:.])/.test(t)) {
          flush(); _pid++
          const desc = t.replace(/^(📸\s*(?:FOTO\s*\d*\s*[:.]?)?|FOTO\s*\d*\s*[:.:])\s*/, '').trim() || t.replace(/^📸\s*/, '')
          out += `<div class="upa"><p class="upi">📸 ${escHtml(desc)}</p><label class="upb" for="p${_pid}">📷 ${data.language === 'en' ? 'Add photo' : 'Agregar foto'}</label><input id="p${_pid}" type="file" accept="image/*" onchange="prevImg(this,'p${_pid}v')"><img id="p${_pid}v" class="upv" alt=""></div>`
          continue
        }
        if (/^⏱/.test(t)) { flush(); out += `<h5>${escHtml(t)}</h5>`; continue }
        if (t.length >= 8 && !/[a-záéíóúñ]/.test(t) && /[A-ZÁÉÍÓÚÑ]/.test(t)) { flush(); out += `<h4>${escHtml(t)}</h4>`; continue }
        if (/^\[[^\]]+\]$/.test(t)) { flush(); const ph = t.replace(/^\[/, '').replace(/\]$/, '').trim() || (en ? 'Write here...' : 'Escribe aquí...'); out += `<div class="sa" contenteditable="true" data-ph="${escHtml(ph)}"></div>`; continue }
        if (/^□\s/.test(t)) { flush(); out += `<label class="cr"><input type="checkbox"><span>${escHtml(t.slice(2))}</span></label>`; continue }
        const bm = t.match(/^[•·→✓✗\-]\s+(.*)/)
        if (bm) { buf.push(`<li>${blank(bm[1])}</li>`); continue }
        flush(); out += `<p>${blank(t)}</p>`
      }
      flush(); return out || '<p>—</p>'
    }
    const imgs = (data.imgPaso5 || []).map(img => `<div style="margin-top:12px"><img src="${img.dataUrl}" alt="${escHtml(img.name)}" style="max-width:100%;max-height:240px;object-fit:contain;border-radius:10px;border:1px solid #e5e7eb;display:block"></div>`).join('')
    const rub = getRubricaForData(data)
    const studentRubricaHtml = `<div class="rubrica-wrap">
      <table class="rubrica-table">
        <thead>
          <tr>
            <th class="crit-col">${en ? 'Criterion (weight)' : 'Criterio (ponderación)'}</th>
            <th class="lvl sup">⭐ ${en ? 'Excellent' : 'Superior'} (5.0)</th>
            <th class="lvl alt">✅ ${en ? 'High' : 'Alto'} (4.2)</th>
            <th class="lvl bas">⚠ ${en ? 'Basic' : 'Básico'} (3.5)</th>
            <th class="lvl low">✗ ${en ? 'Low' : 'Bajo'} (1.5)</th>
          </tr>
        </thead>
        <tbody>
          ${rub.criterios.map((c) => `<tr>
            <td class="crit-col"><strong>${escHtml(c.nombre)}</strong><br><span class="crit-pct">${escHtml(String(c.pct || 0))}%</span></td>
            <td>${escHtml(c.s)}</td>
            <td>${escHtml(c.a)}</td>
            <td>${escHtml(c.b)}</td>
            <td>${escHtml(c.l)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <p class="rubrica-note">${en ? 'Read this rubric before submitting: these are the criteria that will be used to assess your work.' : 'Lee esta rúbrica antes de entregar: aquí están los criterios con los que se evaluará tu trabajo.'}</p>
    </div>`
    const SAVE_KEY = `kit_${(subtema).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}_est`
    const html = `<!DOCTYPE html><html lang="${safeLang(data.language)}"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${en ? 'Student workbook' : 'Taller Estudiante'} — ${escHtml(subtema)}</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',system-ui,sans-serif;background:#fffbeb;color:#1a1a1a;min-height:100vh;font-size:15px;-webkit-font-smoothing:antialiased}
.header{background:linear-gradient(135deg,#fbb041 0%,#f59e0b 100%);color:#fff;padding:20px 28px;display:flex;align-items:center;gap:16px;box-shadow:0 4px 16px rgba(251,176,65,.3)}
.header h1{font-family:'Nunito',sans-serif;font-size:1.05rem;font-weight:900;margin-bottom:3px}
.header p{font-size:.78rem;opacity:.9}
.section{padding:24px 28px;max-width:820px;margin:0 auto}
.e-toolbar{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.e-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:10px;font-size:.82rem;font-weight:700;cursor:pointer;border:none;transition:all .2s;font-family:'Inter',sans-serif}
.e-btn-save{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff}
.e-btn-save:hover{transform:translateY(-1px)}
.e-btn-print{background:#fff;color:#374151;border:1.5px solid #d1d5db}
.e-btn-back{background:#fff;color:#1f2937;border:1.5px solid #d1d5db}
.e-btn-back:hover{transform:translateY(-1px);background:#f9fafb}
.e-btn-dl{background:linear-gradient(135deg,#fbb041,#f59e0b);color:#fff}
.e-btn-dl:hover{transform:translateY(-1px)}
.save-ok{background:#dcfce7;border:1px solid #86efac;border-radius:8px;padding:8px 14px;font-size:.78rem;color:#15803d;font-weight:700;display:none}
.hint-box{background:linear-gradient(135deg,#fffbeb,#fff7ed);border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:.82rem;color:#7c5a20;border:1px solid #fde68a;display:flex;align-items:center;gap:10px}
.doc-card{background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:24px 26px;box-shadow:0 2px 12px rgba(0,0,0,.05);border-left:4px solid #fbb041}
.doc-title{display:flex;align-items:flex-start;gap:12px;padding-bottom:14px;border-bottom:2px solid #f0f0f0;margin-bottom:16px}
.paso-icon{font-size:1.5rem;flex-shrink:0;margin-top:2px}
.paso-label{font-family:'Nunito',sans-serif;font-size:.82rem;font-weight:900;color:#b45309;display:block;text-transform:uppercase}
.paso-desc{font-size:.7rem;color:#6b7280;display:block;margin-top:2px}
.doc-content{font-size:.88rem;line-height:1.8;color:#374151}
.doc-content h4{font-family:'Nunito',sans-serif;font-size:.9rem;font-weight:800;color:#b45309;margin:1.2rem 0 .5rem;padding:.4rem .8rem;background:#fff7ed;border-radius:8px;border-left:3px solid #fbb041}
.doc-content h5{font-family:'Nunito',sans-serif;font-size:.85rem;font-weight:800;color:#1a3d37;background:#fff7ed;border:1px solid #fde68a;border-radius:8px;padding:6px 12px;display:inline-flex;align-items:center;gap:6px;margin:.8rem 0 .4rem}
.doc-content p{margin-bottom:.6rem;line-height:1.75}
.doc-content ul{margin:.4rem 0 .8rem 1.5rem}
.doc-content li{margin-bottom:.4rem}
.doc-content hr{border:none;border-top:2px dashed #fde68a;margin:.9rem 0}
.rubrica-wrap{margin-top:.4rem}
.rubrica-table{width:100%;border-collapse:collapse;font-size:.78rem;line-height:1.45;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden}
.rubrica-table th,.rubrica-table td{padding:10px 9px;border:1px solid #ececec;vertical-align:top}
.rubrica-table thead th{font-family:'Nunito',sans-serif;font-weight:800;text-align:left}
.rubrica-table .crit-col{min-width:170px;background:#fafafa}
.rubrica-table .crit-pct{font-size:.66rem;color:#6b7280}
.rubrica-table .sup{background:#dcfce7;color:#166534}
.rubrica-table .alt{background:#dbeafe;color:#1d4ed8}
.rubrica-table .bas{background:#fef9c3;color:#a16207}
.rubrica-table .low{background:#fee2e2;color:#b91c1c}
.rubrica-note{font-size:.72rem;color:#6b7280;margin-top:8px}
.fi{border:none;border-bottom:2.5px solid #fbb041;background:rgba(251,176,65,.07);font-family:inherit;font-size:inherit;color:#1a1a1a;padding:3px 8px;outline:none;min-width:140px;border-radius:4px 4px 0 0;transition:border-color .2s;vertical-align:middle}
.fi:focus{border-color:#f59e0b;background:rgba(251,176,65,.18)}
.sa{min-height:80px;background:#fffbeb;border:2px dashed #fbb041;border-radius:10px;padding:12px 14px;margin:.7rem 0;font-size:.86rem;color:#1a1a1a;transition:all .2s;line-height:1.7}
.sa:empty:before{content:attr(data-ph);color:#c9a85a;font-style:italic;pointer-events:none}
.sa:focus{outline:none;background:#fff8e1;border-color:#f59e0b;box-shadow:0 0 0 3px rgba(251,176,65,.15)}
.upa{background:#fffbeb;border:2px dashed #fbb041;border-radius:12px;padding:16px;margin:.9rem 0}
.upi{font-size:.82rem;font-weight:700;color:#b45309;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.upb{display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#fbb041,#f59e0b);color:#fff;border-radius:10px;padding:9px 18px;font-size:.82rem;font-weight:800;cursor:pointer;transition:all .2s}
.upb:hover{background:linear-gradient(135deg,#f59e0b,#d97706);transform:translateY(-1px)}
input[type=file]{display:none}
.upv{max-width:100%;max-height:220px;object-fit:contain;border-radius:10px;display:none;margin-top:12px;border:2px solid #fde68a}
label.cr{cursor:pointer;transition:background .15s;padding:5px 8px;border-radius:8px;display:flex;align-items:flex-start;gap:10px;margin:.4rem 0;font-size:.86rem}
label.cr:hover{background:#fef9c3}
label.cr input[type=checkbox]{width:18px;height:18px;accent-color:#fbb041;flex-shrink:0;margin-top:1px;cursor:pointer}
.footer{text-align:center;padding:20px;font-size:.68rem;color:#9ca3af;border-top:1px solid #e5e7eb;margin-top:8px}
@media print{.e-toolbar,.save-ok,.upa{display:none!important}.doc-card{box-shadow:none}body{background:#fff;font-size:12px}.sa{background:#fff;border:none;border-bottom:1.5px solid #aaa;border-radius:0;min-height:56px}.fi{background:transparent;border-bottom:1.5px solid #aaa;border-radius:0}.fi::placeholder{color:transparent}}
</style></head><body>
<div class="header">${logoHtml}<div><h1>🎒 ${en ? 'Student Workbook' : 'Taller del Estudiante'}</h1><p>${escHtml(subtema)} · ${escHtml(levelLabel)} ${escHtml(levelValue)} · ${escHtml(data.institucion || '')}</p></div></div>
<div class="section">
  <div class="e-toolbar">
    <button class="e-btn e-btn-save" onclick="guardarRespuestas()">💾 ${en ? 'Save answers' : 'Guardar respuestas'}</button>
    <button class="e-btn e-btn-dl" onclick="window.print()">📄 ${en ? 'Open print view' : 'Abrir vista de impresión'}</button>
    <button class="e-btn e-btn-print" onclick="window.print()">🖨️ ${en ? 'Print workbook' : 'Imprimir taller'}</button>
    <span class="save-ok" id="save-ok">✔ ${en ? 'Answers saved' : 'Respuestas guardadas'}</span>
  </div>
  <div class="hint-box"><span style="font-size:1.3rem">✏️</span><div><strong>${en ? 'Hello, student!' : '¡Hola, estudiante!'}</strong> ${en ? 'Write in the yellow fields, mark the completed steps and upload your photos. Use 💾 to save your progress and 🖨️ only if a print copy is needed.' : 'Escribe en las casillas amarillas, marca los pasos completados y sube tus fotos. Usa 💾 para guardar tu avance y 🖨️ solo si necesitas copia impresa.'}</div></div>
  <div class="doc-card">
    <div class="doc-title"><span class="paso-icon">📝</span><div><span class="paso-label">${en ? 'STEP 5: STUDENT GUIDE' : 'PASO 5: GUÍA DEL ESTUDIANTE'}</span><span class="paso-desc">${en ? 'Instructions, learning log and self-assessment — Editable and returnable' : 'Instrucciones, bitácora y autoevaluación — Editable y retornable'}</span></div></div>
    <div class="doc-content">${mkHtml(ensureStudentGuideContent(data.paso5 || GENERADORES[4](data), data))}</div>
    ${imgs}
  </div>
  <div class="doc-card" style="margin-top:20px;border-left-color:#b45309">
    <div class="doc-title"><span class="paso-icon">⭐</span><div><span class="paso-label" style="color:#b45309">${en ? 'STEP 6: ASSESSMENT RUBRIC' : 'PASO 6: RÚBRICA DE EVALUACIÓN'}</span><span class="paso-desc">${en ? 'Quality criteria — This is how your project will be assessed' : 'Criterios de calidad — Así será evaluado tu proyecto'}</span></div></div>
    <div class="doc-content">${studentRubricaHtml}</div>
  </div>
</div>
<div class="footer">${en ? 'Student Workbook' : 'Taller del Estudiante'} · Copiloto Docente TI · Maryam Math · ${sourceLabel} · ${en ? 'Author' : 'Autora'}: ${AUTORA.nombre}</div>
<script>
const SAVE_KEY='${SAVE_KEY}';
function prevImg(input,pid){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{const img=document.getElementById(pid);if(img){img.src=e.target.result;img.style.display='block';}};r.readAsDataURL(f);}
function guardarRespuestas(){const estado={};document.querySelectorAll('.sa').forEach((el,i)=>{estado['sa_'+i]=el.innerHTML;});document.querySelectorAll('.fi').forEach((el,i)=>{estado['fi_'+i]=el.value;});document.querySelectorAll('input[type=checkbox]').forEach((el,i)=>{estado['cb_'+i]=el.checked;});document.querySelectorAll('input[type=radio]').forEach((el)=>{if(el.checked)estado['rb_'+el.name+'_'+el.value]=true;});const imgs={};document.querySelectorAll('.upv').forEach((img,i)=>{if(img.style.display!=='none'&&img.src)imgs['img_'+i]=img.src;});Object.assign(estado,imgs);try{localStorage.setItem(SAVE_KEY,JSON.stringify(estado));const ok=document.getElementById('save-ok');if(ok){ok.style.display='inline-flex';setTimeout(()=>{ok.style.display='none';},3000);}}catch(e){alert('${en ? 'Answers could not be saved.' : 'No se pudieron guardar las respuestas.'}');}}
function restaurarRespuestas(){try{const est=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');if(!Object.keys(est).length)return;document.querySelectorAll('.sa').forEach((el,i)=>{if(est['sa_'+i]!==undefined)el.innerHTML=est['sa_'+i];});document.querySelectorAll('.fi').forEach((el,i)=>{if(est['fi_'+i]!==undefined)el.value=est['fi_'+i];});document.querySelectorAll('input[type=checkbox]').forEach((el,i)=>{if(est['cb_'+i]!==undefined)el.checked=est['cb_'+i];});document.querySelectorAll('input[type=radio]').forEach(el=>{if(est['rb_'+el.name+'_'+el.value])el.checked=true;});document.querySelectorAll('.upv').forEach((img,i)=>{if(est['img_'+i]){img.src=est['img_'+i];img.style.display='block';}});}catch(e){}}
let _ag=null;function _rt(){clearTimeout(_ag);_ag=setTimeout(guardarRespuestas,60000);}document.addEventListener('input',_rt);document.addEventListener('change',_rt);
window.addEventListener('DOMContentLoaded',()=>{restaurarRespuestas();document.querySelectorAll('.sa').forEach(el=>{el.addEventListener('focus',()=>{el.style.borderColor='#f59e0b';el.style.boxShadow='0 0 0 3px rgba(251,176,65,.15)';});el.addEventListener('blur',()=>{el.style.borderColor='#fbb041';el.style.boxShadow='';});});});
</script></body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  const handleExportFamilias = () => {
    const en = isEnglish(data)
    const localizedSubtema = getLocalizedSubtema(data)
    const subtema = localizedSubtema?.nombre || (en ? '[Project]' : '[Proyecto]')
    const producto = localizedSubtema?.producto || (en ? '[Final product]' : '[Producto final]')
    const evidencia = localizedSubtema?.evidencia || (en ? '[Expected evidence]' : '[Evidencia esperada]')
    const levelLabel = getLevelLabel(data)
    const levelValue = getLevelValue(data)
    const sourceLabel = getSourceLabel(data)
    const aprendizajeBase = data.route === 'ib_myp_design'
      ? (en
        ? 'Development of a design solution with inquiry, justified decisions and product evaluation.'
        : 'Desarrollo de una solucion de diseño, con investigacion, justificacion de decisiones y evaluacion del producto.')
      : (en
        ? 'Application of Technology and Computing concepts in a practical project.'
        : 'Aplicacion de conceptos de Tecnologia e Informatica en un proyecto practico.')
    const html = `<!DOCTYPE html><html lang="${safeLang(data.language)}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${en ? 'Family summary' : 'Resumen para familias'}</title>
<style>
*{box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#f8fafc;color:#1f2937;padding:20px;line-height:1.6}
.card{max-width:760px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}
.h{background:#2b5a52;color:#fff;padding:18px 20px}.h h1{margin:0 0 4px;font-size:1rem}.h p{margin:0;font-size:.78rem;opacity:.9}
.b{padding:18px 20px}.sec{margin-bottom:14px}.sec h2{font-size:.85rem;color:#2b5a52;margin:0 0 6px}.sec p,.sec li{font-size:.86rem}
ul{margin:0 0 0 18px}.foot{padding:12px 20px;border-top:1px solid #e5e7eb;font-size:.72rem;color:#6b7280}
@media print{body{padding:0;background:#fff}.card{border:none;border-radius:0}}
</style></head><body>
<div class="card"><div class="h"><h1>${en ? 'Project summary for families' : 'Resumen del proyecto para familias'}</h1><p>${escHtml(data.institucion || '')} · ${escHtml(levelLabel)} ${escHtml(levelValue)} · ${escHtml(subtema)}</p></div>
<div class="b">
<div class="sec"><h2>${en ? 'What is your child learning?' : '¿Qué está aprendiendo su hijo/a?'}</h2><p>${escHtml(data.competencia?.trim() || aprendizajeBase)}</p></div>
<div class="sec"><h2>${en ? 'What must they submit?' : '¿Qué debe entregar?'}</h2><p><strong>${en ? 'Product' : 'Producto'}:</strong> ${escHtml(producto)}</p><p><strong>${en ? 'Evidence' : 'Evidencia'}:</strong> ${escHtml(evidencia)}</p></div>
<div class="sec"><h2>${en ? 'How will it be assessed?' : '¿Cómo será evaluado?'}</h2><p>${en ? 'With a clear rubric shared with the student from the beginning of the project.' : 'Con una rúbrica de criterios claros compartida con el estudiante (comprensión del reto, calidad del producto, evidencias y trabajo en equipo).'}</p></div>
<div class="sec"><h2>${en ? 'How to support from home (10–15 min)' : '¿Cómo apoyar desde casa (10–15 min)?'}</h2><ul><li>${en ? 'Ask what problem was solved and how it was approached.' : 'Preguntar qué problema resolvió y cómo lo hizo.'}</li><li>${en ? 'Check that evidence is complete (photos, reflection and product).' : 'Revisar que complete evidencias (fotos, reflexión y producto).'}</li><li>${en ? 'Invite them to rehearse a short 2-minute explanation.' : 'Acompañar una breve explicación oral de 2 minutos.'}</li></ul></div>
</div><div class="foot">Copiloto Docente TI · ${en ? 'Family summary' : 'Resumen para familias'} · ${sourceLabel}</div></div>
<script>window.onload=()=>window.print()<\/script></body></html>`
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 lg:px-6">
      {/* Pantalla */}
      <div className="mb-6 no-print">
        <div className="mb-5 overflow-hidden rounded-[32px] border border-[#d7e3df] bg-[radial-gradient(circle_at_top_left,#fff0cf_0%,transparent_24%),linear-gradient(135deg,#fffdfa_0%,#f5faf8_58%,#edf4f1_100%)] p-5 shadow-[0_18px_50px_rgba(23,61,55,.07)]">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_.95fr]">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#fbb041]/15 text-[#b45309] text-xs font-bold px-2.5 py-1 rounded-full mb-2">
                <FiCheck /> {en ? 'Kit complete' : 'Kit completo'}
              </div>
              <h2 className="text-[2.2rem] leading-[1.02] text-[#173d37] md:text-[2.7rem]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 800 }}>{en ? 'Operational centre of the kit' : 'Centro operativo del kit'}</h2>
              <p className="mt-2 max-w-3xl text-[1.02rem] leading-8 text-[#536a63]">
                {en ? 'Review, share and record the kit before using printable backups.' : 'Revisa, comparte y registra el kit antes de usar respaldos imprimibles.'}
              </p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#55726b]">{en ? 'Main promise' : 'Promesa principal'}: <span className="text-[#173d37]">{en ? 'platform-first workflow' : 'flujo primero en plataforma'}</span></p>
              {exportBlockers.length > 0 && (
                <p className="text-[11px] text-orange-600 mt-1">{en ? `Complete ${exportBlockers.length} key item(s) before exporting.` : `Completa ${exportBlockers.length} dato(s) clave para exportar.`}</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {[
                { k: en ? 'Quality score' : 'Puntaje de calidad', v: `${score}/100`, s: semaforo.label },
                { k: en ? 'Curricular route' : 'Ruta curricular', v: curriculumBadge, s: getFrameworkValue(data) || componenteLabel },
                { k: en ? 'Current level' : 'Nivel actual', v: `${levelLabel}: ${levelValue}`, s: data.institucion || (en ? 'Institution pending' : 'Institución pendiente') },
              ].map((item) => (
                <div key={item.k} className="rounded-[24px] border border-white/80 bg-white/88 px-4 py-4 shadow-[0_10px_24px_rgba(23,61,55,.05)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8e5e12]">{item.k}</p>
                  <p className="mt-1 text-[1.15rem] font-black leading-7 text-[#173d37]">{item.v}</p>
                  <p className="mt-1 text-[13px] leading-6 text-[#728680]">{item.s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={`mt-4 p-5 rounded-[28px] border shadow-[0_14px_30px_rgba(23,61,55,.05)] ${semaforo.bg}`}>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{semaforo.icon}</span>
              <div>
                <p className={`text-sm font-bold ${semaforo.text}`}>{semaforo.label}</p>
                <p className="text-xs text-gray-500">{semaforo.sub}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-2xl font-black ${semaforo.text}`}>{score}</span>
              <span className="text-xs text-gray-400 font-medium">/100</span>
            </div>
          </div>
          <div className="bg-white/60 rounded-full h-2 mb-3" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label={en ? 'Kit quality score' : 'Puntaje de calidad del kit'}>
            <div
              className={`h-2 rounded-full transition-all duration-700 ${score >= 85 ? 'bg-green-500' : score >= 65 ? 'bg-yellow-400' : 'bg-orange-500'}`}
              style={{ width: `${score}%` }}
            />
          </div>
          {pending.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1.5">{en ? 'Pending items:' : 'Puntos pendientes:'}</p>
              <ul className="space-y-1">
                {pending.map((p, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <FiAlertCircle className="text-orange-400 flex-shrink-0 mt-px text-[11px]" />
                    {p.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RutaMejoraSection data={data} pending={pending} onGoTo={onGoTo} />
        </div>

        <div id="kit-print" className="mt-6 space-y-5">
          <div className="overflow-hidden rounded-[32px] border border-[#d6e4df] bg-white shadow-[0_18px_40px_rgba(23,61,55,.06)]">
            <div className="border-b border-[#e6efeb] bg-[linear-gradient(135deg,#f7fbfa_0%,#eef5f2_100%)] px-6 py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7e8f89]">
                {en ? 'Review' : 'Revisión'}
              </p>
              <h2
                className="mt-2 text-[1.75rem] leading-tight text-[#173d37] md:text-[2rem]"
                style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 800 }}
              >
                {en ? 'Review the kit' : 'Revisa el kit'}
              </h2>
              <p className="mt-2 max-w-4xl text-[1.02rem] leading-8 text-[#556962]">
                {en
                  ? 'Use this reading view to verify coherence, sequence and clarity before deciding how to share or deploy the kit.'
                  : 'Usa esta lectura para verificar coherencia, secuencia y claridad antes de decidir cómo compartir o implementar el kit.'}
              </p>
            </div>
            <div className="grid gap-3 border-t border-[#f2f5f4] px-6 py-4 text-[15px] leading-7 text-[#264740] md:grid-cols-2 xl:grid-cols-4">
              <p><strong>{data.institucion || (en ? '[Institution]' : '[Institución]')}</strong>{data.ciudad ? ` · ${data.ciudad}` : ''}</p>
              <p><strong>{en ? 'Teacher' : 'Docente'}:</strong> {data.docente || (en ? '[Teacher]' : '[Docente]')}</p>
              <p><strong>{levelLabel}:</strong> {levelValue}</p>
              <p><strong>{en ? 'Year' : 'Año'}:</strong> {new Date().getFullYear()}</p>
            </div>
          </div>

          {secciones.map((s) => (
            <div key={s.num} className="page-break-before">
              <StepContentPreview
                content={s.contenido}
                en={en}
                comfortableMode
                stepNumber={s.num}
                stepTitle={s.titulo}
                stepDesc={s.desc}
                collapsible
                defaultOpen={s.num === 1}
              />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8e5e12]">
            {en ? 'Next' : 'Sigue'}
          </p>
          <h3 className="mt-2 text-[1.35rem] leading-tight text-[#173d37]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 800 }}>
            {en ? 'Share or use the kit' : 'Comparte o usa el kit'}
          </h3>
          <p className="mt-1 text-sm leading-7 text-[#60726c]">
            {en ? 'First deliver and share. Use support outputs only when the context truly requires them.' : 'Primero entrega y comparte. Usa las salidas de apoyo solo si el contexto realmente las necesita.'}
          </p>
        </div>

        {/* ── Compartir con estudiantes ── */}
        <CompartirEstudianteSection
          data={data}
          onOpenStudentView={() => runWithValidation(handleExportEstudiante, 'student')}
          onGoToStudentGuide={() => onGoTo?.(10)}
        />

        {/* ── Compartir kit con colega ── */}
        <CompartirKitSection data={data} />

        {/* ── Salidas institucionales ── */}
        <div className="mt-4 rounded-[28px] overflow-hidden border border-[#d7e3df] shadow-[0_16px_34px_rgba(23,61,55,.05)]">
          <button
            onClick={() => setExportsOpen((o) => !o)}
            className="w-full flex items-center gap-3 px-5 py-4 bg-[linear-gradient(180deg,#fffdfa_0%,#f7fbfa_100%)] hover:bg-gray-50 transition-colors text-left"
          >
            <span className="text-xl flex-shrink-0">🖨️</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#2b5a52] text-sm">{en ? 'Institutional outputs' : 'Salidas institucionales'}</p>
              <p className="text-gray-500 text-xs mt-0.5">{en ? 'Use support views only when the school or classroom context truly requires them.' : 'Usa las vistas de apoyo solo cuando el contexto escolar o de aula realmente las requiera.'}</p>
            </div>
            <FiChevronRight className={`text-gray-400 flex-shrink-0 transition-transform ${exportsOpen ? 'rotate-90' : ''}`} />
          </button>

          {exportsOpen && (
            <div className="bg-[#f8faf9] px-5 py-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => runWithValidation(handleExportPDF)}
                  className="flex items-start gap-3 px-4 py-3 bg-[#2b5a52] text-white rounded-xl
                    text-left hover:bg-[#234a43] active:scale-[0.98] transition-all shadow-md shadow-[#2b5a52]/20"
                >
                  <FiPrinter className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{en ? 'Print / PDF' : 'Imprimir / PDF'}</p>
                    <p className="text-[11px] text-white/70 leading-4 mt-0.5">{en ? 'Compact version — use Ctrl+P to save as PDF' : 'Versión compacta — usa Ctrl+P para guardar como PDF'}</p>
                  </div>
                </button>
                <button
                  onClick={() => runWithValidation(handleExportHTML)}
                  className="flex items-start gap-3 px-4 py-3 bg-white text-[#2b5a52] rounded-xl
                    text-left hover:bg-[#eef4f2] active:scale-[0.98] transition-all border border-[#2b5a52]/25"
                >
                  <FiFileText className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{en ? 'Interactive kit' : 'Kit interactivo'}</p>
                    <p className="text-[11px] text-[#5a7069] leading-4 mt-0.5">{en ? 'Full kit with tabs — teacher guide + student guide' : 'Kit completo con pestañas — guía docente + guía estudiante'}</p>
                  </div>
                </button>
                <button
                  onClick={() => runWithValidation(handleExportRubrica)}
                  className="flex items-start gap-3 px-4 py-3 bg-white text-[#2b5a52] rounded-xl
                    text-left hover:bg-[#2b5a52]/5 active:scale-[0.98] transition-all border border-[#2b5a52]/30"
                >
                  <FiAward className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{en ? 'Grading rubric' : 'Rúbrica de calificación'}</p>
                    <p className="text-[11px] text-[#5a7069] leading-4 mt-0.5">{en ? 'Click to grade, auto-calculates, saves scores' : 'Haz clic para calificar, calcula automático, guarda notas'}</p>
                  </div>
                </button>
                <button
                  onClick={() => runWithValidation(handleExportFamilias)}
                  className="flex items-start gap-3 px-4 py-3 bg-white text-[#b45309] rounded-xl
                    text-left hover:bg-[#fffbeb] active:scale-[0.98] transition-all border border-[#fbb041]/50"
                >
                  <FiUsers className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold">{en ? 'Family summary' : 'Resumen para familias'}</p>
                    <p className="text-[11px] text-[#8e5e12] leading-4 mt-0.5">{en ? 'One page — what the project is and what to expect' : 'Una página — qué es el proyecto y qué esperar'}</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8e5e12]">
            {en ? 'Support' : 'Apoyos'}
          </p>
          <h3 className="mt-2 text-[1.2rem] leading-tight text-[#173d37]" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontWeight: 800 }}>
            {en ? 'Helpful references' : 'Referencias útiles'}
          </h3>
        </div>

        {/* ── Simulador Maryam Math ── */}
        <div className="mt-4 rounded-[28px] overflow-hidden border border-[#d7e3df] shadow-[0_16px_34px_rgba(23,61,55,.05)]">
          <div className="flex items-start gap-3 bg-[#2b5a52] px-5 py-3">
            <span className="text-xl mt-0.5">🤖</span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">{en ? 'AI support for lesson preparation' : 'Apoyo IA para preparacion pedagogica'}</p>
              <p className="text-white/70 text-xs mt-0.5">{en ? 'Use the STEP 0 prompt in Claude, ChatGPT or Gemini' : 'Pega el prompt del PASO 0 en Claude, ChatGPT o Gemini'}</p>
            </div>
            <AILinks compact stopClick />
          </div>
          <div className="bg-[#f8faf9] px-5 py-4">
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {en
                ? <>The tailored prompt for this kit lives in <strong>STEP 0</strong>. Use it to get:</>
                : <>El prompt personalizado para este kit esta en el <strong>PASO 0</strong>. Usalo para obtener:</>}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { e: '📚', t: en ? `Key concepts explained for ${levelLabel.toLowerCase()}` : `Conceptos clave explicados para tu ${levelLabel.toLowerCase()}` },
                { e: '🇨🇴', t: en ? (data.route === 'ib_myp_design' ? 'Design and use contexts for the project' : 'Examples grounded in Colombian school context') : (data.route === 'ib_myp_design' ? 'Contextos de diseño y uso para el proyecto' : 'Ejemplos del contexto colombiano') },
                { e: '❓', t: en ? 'Ready-to-use guiding questions for class' : 'Preguntas dinamizadoras listas para clase' },
                { e: '⚠️', t: en ? 'Frequent mistakes and how to prevent them' : 'Errores frecuentes y como prevenirlos' },
              ].map(({ e, t }) => (
                <div key={t} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-base flex-shrink-0 leading-tight">{e}</span>
                  <span className="leading-snug">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <a
          href={data.route === 'ib_myp_design' ? IB_MYP_DESIGN_URL : MEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl border border-[#2b5a52]/20 hover:bg-[#2b5a52]/5 transition-colors group"
        >
          <FiBook className="text-[#2b5a52] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#2b5a52]">{data.route === 'ib_myp_design' ? 'Diseño Escolar' : (en ? 'MEN Curriculum Guidelines 2022' : 'Orientaciones Curriculares MEN 2022')}</p>
            <p className="text-[10px] text-gray-500">{en ? (data.route === 'ib_myp_design' ? 'Official reference for the school design route' : 'Official reference for Technology and Computing in Colombia') : (data.route === 'ib_myp_design' ? 'Marco oficial de referencia para la ruta de diseño escolar' : 'Documento oficial de referencia para el area de Tecnologia e Informatica')}</p>
          </div>
          <FiExternalLink className="text-gray-400 group-hover:text-[#2b5a52] transition-colors flex-shrink-0 text-xs" />
        </a>

        <AdaptacionesNEESection data={data} />

        <div className="mt-4 rounded-[28px] border border-[#cfe0db] bg-[linear-gradient(135deg,#eef6f4_0%,#f6fbfa_100%)] p-5 shadow-[0_14px_30px_rgba(23,61,55,.05)]">
          <p className="text-xs font-bold text-[#2b5a52] uppercase tracking-wide mb-2">{en ? 'Minimum institutional panel' : 'Panel institucional minimo'}</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-lg border border-[#2b5a52]/10 p-2 text-center">
              <p className="text-lg font-black text-[#2b5a52]">{institutionMetrics.total}</p>
              <p className="text-[10px] text-gray-500">{en ? 'Generated kits' : 'Kits generados'}</p>
            </div>
            <div className="bg-white rounded-lg border border-[#2b5a52]/10 p-2 text-center">
              <p className="text-lg font-black text-[#2b5a52]">{institutionMetrics.avgMin} min</p>
              <p className="text-[10px] text-gray-500">{en ? 'Average planning time' : 'Planeacion promedio'}</p>
            </div>
            <div className="bg-white rounded-lg border border-[#2b5a52]/10 p-2 text-center">
              <p className="text-lg font-black text-[#2b5a52]">{institutionMetrics.pctCompleto}%</p>
              <p className="text-[10px] text-gray-500">{en ? 'Guide + rubric complete' : 'Guia + rubrica completas'}</p>
            </div>
          </div>
        </div>
      </div>

      {kitId && (
        <div className="mt-5 no-print">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8e5e12]">
            {en ? 'Logbook' : 'Bitácora'}
          </p>
          <BitacoraSection kitId={kitId} data={data} />
        </div>
      )}

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #kit-print { padding: 0; }
          .page-break-before { page-break-before: always; }
        }
      `}</style>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
const INITIAL = {
  route: 'men',
  language: 'es',
  institucion: '', ciudad: '', tienelogo: false, logoUrl: '', logoFileName: '',
  docente: '',
  grado: '7°', mypYear: 'Año 1', componente: '', competencia: '',
  duracionProyecto: '', duracionSimulador: '15–20', recursos: '', restricciones: '',
  incluyeImagenes: false, tiposVisual: [], maxImagenes: 3, puedenFotografiar: false,
  tieneNEE: false, tiposNEE: [], descripcionNEE: '',
  subtema: null, subtemaPropio: '', ibNeed: '', ibOutcome: '', ibEvidence: '', ibPrereq: '', ibCriterion: 'A', ibGlobalContext: 'innovation', ibKeyConcept: 'systems', ibRelatedConcept: 'innovation',
  stemNeed: '', stemUsers: '', stemAreas: ['science', 'technology', 'engineering'], stemImpact: '', stemMetric: '', stemPrototype: '', stemEvidenceLink: '',
  stemRounds: [{ focus: '', evidence: '', adjustment: '' }, { focus: '', evidence: '', adjustment: '' }],
  stemRoles: ['integracion', 'evidencias', 'tester'],
  paso0Mode: 'quick',
  checkpoints: { cp1: ['', '', ''], cp2: ['', '', ''] },
  paso1: '', paso2: '', paso3: '', paso4: '', paso5: '', paso6: '', paso7: '',
  imgPaso1: [], imgPaso2: [], imgPaso3: [], imgPaso4: [], imgPaso5: [], imgPaso6: [], imgPaso7: [],
  rubrica: {
    ...buildDefaultRubrica('men')
  }
}

// Steps: 0=welcome, 1=A, 2=B, 3=C, 4=D, 5=PASO0, 6-12=PASO1-7, 13=Final
const TOTAL_STEPS = 13
const ALLOWED_ROUTES = ['men', 'ib_myp_design', 'stem']

function isValidData(d) {
  if (!d || typeof d !== 'object') return false
  if (!ALLOWED_ROUTES.includes(d.route)) return false
  return Array.isArray(d.rubrica?.criterios) && d.rubrica.criterios.length > 0 && Number.isFinite(d.rubrica.escala)
}

// ─── Panel docente de evolución ──────────────────────────────────────────────
function PanelDocente({ onClose, onLoad, language = 'es', route = 'men' }) {
  const en = language === 'en'
  const [kits, setKits] = useState(() => lsGetKits())
  const routeLabel = route === 'ib_myp_design' ? 'Diseño Escolar' : (en ? 'MEN Kit - Technology and Computing' : 'Kit MEN - Tecnología e Informática')

  const kitData = kits
    .filter((k) => (k?.data?.route || 'men') === route)
    .map((k) => {
      const { score } = calcScore(k.data || {})
      const sem = score >= 85
        ? { color: '#22c55e', label: en ? 'Ready' : 'Listo' }
        : score >= 65
          ? { color: '#fbb041', label: en ? 'In progress' : 'En progreso' }
          : { color: '#f97316', label: en ? 'Incomplete' : 'Incompleto' }
      return { ...k, score, sem }
    })

  const avgScore = kitData.length
    ? Math.round(kitData.reduce((s, k) => s + k.score, 0) / kitData.length)
    : 0
  const withBitacora = kitData.filter((k) => k.bitacora?.fecha).length

  const handleDelete = (id) => {
    lsDeleteKit(id)
    setKits(lsGetKits())
  }

  const semColor = avgScore >= 85 ? 'text-green-500' : avgScore >= 65 ? 'text-amber-500' : 'text-orange-500'

  return (
    <div role="dialog" aria-modal="true" aria-label={en ? 'My saved kits' : 'Mis kits guardados'} className="fixed inset-0 z-50 flex items-start justify-end no-print" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div
        className="bg-white h-full w-full max-w-sm shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#2b5a52] px-5 py-4 flex items-center gap-3 flex-shrink-0">
          <span className="text-xl">📊</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">{en ? 'My saved kits' : 'Mis kits guardados'}</p>
            <p className="text-white/70 text-xs">{en ? `History and progress for ${routeLabel}` : `Historial y progreso de ${routeLabel}`}</p>
          </div>
          <button onClick={onClose} aria-label={en ? 'Close' : 'Cerrar'} className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <FiX />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4">
          {[
            { n: kitData.length, label: en ? 'Kits created' : 'Kits creados', color: 'text-[#2b5a52]' },
            { n: avgScore, label: en ? 'Avg. score' : 'Punt. promedio', color: semColor },
            { n: withBitacora, label: en ? 'With logbook' : 'Con bitácora', color: 'text-[#2b5a52]' },
          ].map(({ n, label, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className={`text-2xl font-black ${color}`}>{n}</p>
              <p className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="px-4 mb-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{en ? `Kits in ${routeLabel}` : `Kits en ${routeLabel}`}</p>
        </div>

        {/* Kit list */}
        {kitData.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-400 text-sm flex-1">
            <p className="text-3xl mb-3">📂</p>
            <p>{en ? `You do not have saved kits yet in ${routeLabel}.` : `Aún no tienes kits guardados en ${routeLabel}.`}</p>
            <p className="text-xs mt-1">{en ? 'Create the first one in this route and come back here.' : 'Crea el primero en esta ruta y vuelve aquí.'}</p>
          </div>
        ) : (
          <div className="px-4 pb-6 space-y-3 flex-1">
            {kitData.map((kit) => (
              <div key={kit.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Kit header row */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: kit.sem.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{kit.preview.institucion}</p>
                    <p className="text-xs text-gray-500 truncate">{kit.preview.route || 'MEN'} · {kit.preview.grado} · {kit.preview.subtema}</p>
                  </div>
                  <span className="text-base font-black flex-shrink-0" style={{ color: kit.sem.color }}>{kit.score}</span>
                </div>

                {/* Progress + meta */}
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2b5a52] transition-all"
                        style={{ width: `${Math.round((kit.step / 13) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{en ? `Step ${kit.step}/13` : `Paso ${kit.step}/13`}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{fmtDate(kit.savedAt)}</span>
                    {kit.bitacora?.fecha
                      ? <span className="text-[10px] text-green-600 font-semibold flex items-center gap-1"><FiCheck className="text-[9px]" /> {en ? 'Logbook saved' : 'Bitácora guardada'}</span>
                      : <span className="text-[10px] text-gray-300">{en ? 'No logbook yet' : 'Sin bitácora'}</span>
                    }
                  </div>

                  {/* Próximos pasos abreviados */}
                  {kit.score < 100 && (() => {
                    const { pending: pend } = calcScore(kit.data || {})
                    const top = pend.slice(0, 2)
                    if (!top.length) return null
                    return (
                      <div className="mt-2 space-y-1">
                        {top.map((p) => {
                          const ruta = getRouteGuidance(p, kit.data || {})
                          return (
                            <div key={p.key} className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                              <FiAlertCircle className="flex-shrink-0 text-amber-400" />
                              <span className="truncate">{ruta ? ruta.accion : p.label}</span>
                              <span className="ml-auto flex-shrink-0 font-bold">+{p.pts}pts</span>
                            </div>
                          )
                        })}
                        {pend.length > 2 && (
                          <p className="text-[10px] text-gray-400 px-1">{en ? `and ${pend.length - 2} more...` : `y ${pend.length - 2} más…`}</p>
                        )}
                      </div>
                    )
                  })()}

                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => { onLoad(kit); onClose() }}
                      className="flex-1 py-1.5 bg-[#2b5a52] text-white rounded-xl text-xs font-bold hover:bg-[#234a43] transition-colors"
                    >
                      {en ? 'Continue' : 'Continuar'}
                    </button>
                    <button
                      onClick={() => handleDelete(kit.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors border border-gray-100"
                      title={en ? 'Delete' : 'Eliminar'}
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal de créditos y referentes ──────────────────────────────────────────
function CreditosModal({ onClose, data }) {
  const isIB = data?.route === 'ib_myp_design'
  const en = isEnglish(data)
  const referentes = getReferentesByRoute(data?.route)

  return (
    <div role="dialog" aria-modal="true" aria-label={en ? 'About this application' : 'Acerca de esta aplicación'} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={onClose} onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="font-bold text-[#2b5a52] text-base">{en ? 'About this application' : 'Acerca de esta aplicación'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Copiloto Docente TI · Maryam Math Plataforma Educativa</p>
            <p className="text-[11px] text-[#2b5a52] mt-1 font-medium">{isIB ? (en ? 'Active route: School Design' : 'Ruta activa: Diseño Escolar') : (en ? 'Active route: MEN Kit - Technology and Computing' : 'Ruta activa: Kit MEN - Tecnología e Informática')}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={en ? 'Close' : 'Cerrar'}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <FiX />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Autora */}
          <div className="bg-[#2b5a52]/5 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">👩‍🏫</span>
            <div>
              <p className="text-[10px] text-[#2b5a52]/60 uppercase font-semibold tracking-wide mb-0.5">{en ? 'Author' : 'Autora'}</p>
              <p className="font-bold text-[#2b5a52]">{AUTORA.nombre}</p>
              <p className="text-sm text-gray-600">{AUTORA.titulo}</p>
            </div>
          </div>

          {/* Referentes */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide mb-3">
              {en ? 'Pedagogical and policy references' : 'Referentes pedagógicos y normativos'}
            </p>
            <ul className="space-y-3">
              {referentes.map((r) => (
                <li key={r.cita} className="flex gap-3 items-start">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 h-fit whitespace-nowrap ${r.color}`}>
                    {r.tag}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800 leading-snug">{r.titulo}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{r.cita}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pie */}
          <p className="text-center text-xs text-gray-400 pt-2 border-t border-gray-100">
            {isIB
              ? (en ? 'Designed for teachers working with the school design cycle' : 'Diseñado para docentes que trabajan con el ciclo de diseño escolar')
              : (en ? 'Designed for Colombian Technology and Computing teachers' : 'Diseñado para docentes colombianos de Tecnología e Informática')} · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}

export function KitDocente() {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem('mm_last_data')
      if (!raw) return INITIAL
      const parsed = JSON.parse(raw)
      const normalized = normalizeKitData(parsed)
      return isValidData(normalized) ? normalized : INITIAL
    } catch {
      return INITIAL
    }
  })
  const [step, setStep] = useState(() => {
    const s = localStorage.getItem('mm_last_step')
    const n = s ? parseInt(s, 10) : 0
    if (!Number.isFinite(n) || n < 0 || n > TOTAL_STEPS) return 0
    // Si no hay institución, no tiene sentido restaurar — volver al inicio
    const raw = localStorage.getItem('mm_last_data')
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (!parsed.institucion?.trim()) return 0
      } catch { return 0 }
    }
    return n
  })
  const [error, setError] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [sharedKit, setSharedKit] = useState(null)
  const [showCreditos, setShowCreditos] = useState(false)
  const [kitId, setKitId] = useState(null)
  const [guidedTour, setGuidedTour] = useState(null) // null | { track: 'create'|'evaluate'|'student'|'full'|'products' }
  const [tourMenu, setTourMenu] = useState(false)
  const [tourComplete, setTourComplete] = useState(null) // null | completedTrackKey
  const [isExample, setIsExample] = useState(false)
  const topRef = useRef()
  const en = isEnglish(data)

  const update = (changes) => setData((prev) => normalizeKitData({ ...prev, ...changes }))

  // Si el estado quedó corrupto en sesiones previas, resetea una vez al montar.
  useEffect(() => {
    if (!isValidData(data)) {
      localStorage.removeItem('mm_last_data')
      localStorage.removeItem('mm_last_step')
      setData(INITIAL)
      setStep(0)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Título del documento (para que al imprimir no aparezca el título del sitio) ──
  useEffect(() => {
    const prev = document.title
    document.title = 'Copiloto Docente TI · Maryam Math'
    return () => { document.title = prev }
  }, [])

  useEffect(() => {
    let active = true
    kitFromUrlParam().then((kit) => {
      if (active && kit) setSharedKit(kit)
    })
    return () => { active = false }
  }, [])

  // ── Auto-save (no guarda si estamos en modo ejemplo/tour) ────
  useEffect(() => {
    if (isExample) return
    if (step > 0) {
      localStorage.setItem('mm_last_step', step.toString())
      localStorage.setItem('mm_last_data', JSON.stringify(data))
    }
    if (step > 0 && kitId) {
      lsSaveKit(kitId, step, data)
    }
  }, [data, step, kitId, isExample])

  // ── Cargar kit guardado ────────────────────────────────────────
  const handleLoad = (savedKit) => {
    setKitId(savedKit.id)
    setData(normalizeKitData(savedKit.data || INITIAL))
    setStep(savedKit.step || 1)
    setError('')
    topRef.current?.scrollTo(0, 0)
  }

  const enriched = {
    ...data,
    componenteLabel: getFrameworkValue(data),
    subtema: getLocalizedSubtema(data),
  }

  const validate = (candidate = data) => {
    if (step === 1 && !candidate.institucion.trim()) return isEnglish(candidate) ? 'Enter the institution name.' : 'Ingresa el nombre de la institución.'
    if (step === 1 && !candidate.docente.trim()) return isEnglish(candidate) ? 'Enter the facilitating teacher name.' : 'Ingresa el nombre del docente facilitador(a).'
    if (step === 2 && candidate.route === 'men' && !candidate.componente) return isEnglish(candidate) ? 'Select a MEN component.' : 'Selecciona un componente MEN.'
    if (step === 2 && candidate.route === 'ib_myp_design' && !candidate.mypYear) return isEnglish(candidate) ? 'Select the design year.' : 'Selecciona el año de diseño.'
    if (step === 5 && candidate.route === 'ib_myp_design') {
      const ibSubtema = buildIBSubtemaFromData(candidate)
      const coherence = buildIBCoherenceReport(candidate)
      if (!hasMeaningfulText(candidate.ibNeed)) return isEnglish(candidate) ? 'Define a meaningful design need before continuing.' : 'Define una necesidad de diseño con sentido antes de continuar.'
      if (!hasMeaningfulText(candidate.ibOutcome)) return isEnglish(candidate) ? 'Define a meaningful product, prototype or system before continuing.' : 'Define un producto, prototipo o sistema con sentido antes de continuar.'
      if (!hasMeaningfulText(candidate.ibEvidence)) return isEnglish(candidate) ? 'Define meaningful process evidence before continuing.' : 'Define una evidencia de proceso con sentido antes de continuar.'
      if (!ibSubtema?.nombre) return isEnglish(candidate) ? 'Define at least the design need or challenge before continuing.' : 'Define al menos la necesidad o el reto de diseño para continuar.'
      if (coherence.blockers.length) {
        return isEnglish(candidate)
          ? 'The selected criterion and your proposed outcome/evidence are not coherent yet. Use the curricular coherence filter in STEP 0 before continuing.'
          : 'El criterio seleccionado y tu producto/evidencia aun no son coherentes. Usa el filtro de coherencia curricular del PASO 0 antes de continuar.'
      }
    }
    if (step === 5 && candidate.route !== 'ib_myp_design' && !candidate.subtema) return isEnglish(candidate) ? 'Select or write the project topic.' : 'Selecciona o escribe el subtema del proyecto.'
    return ''
  }

  const next = () => {
    const candidate = step === 5 && data.route === 'ib_myp_design'
      ? (() => {
        const ibSubtema = buildIBSubtemaFromData(data)
        return ibSubtema
          ? { ...data, subtemaPropio: ibSubtema.nombre, subtema: ibSubtema }
          : data
      })()
      : step === 5 && data.route === 'stem'
        ? (() => {
          const defaults = buildStemBandDefaults(data.grado, data.language, data)
          return normalizeKitData({
            ...data,
            subtema: data.subtema || defaults.subtema,
            rubrica: getRubricaForData({ ...data, rubrica: data.rubrica || defaults.rubrica }),
            stemRounds: (data.stemRounds && data.stemRounds.length) ? data.stemRounds : (defaults.stemRounds || []),
            paso4: data.paso4 || defaults.paso4,
            paso5: data.paso5 || defaults.paso5,
          })
        })()
        : data

    const err = validate(candidate)
    if (err) { setError(err); return }
    setError('')
    if (candidate !== data) setData(candidate)
    // Generate kit ID when starting the flow for the first time
    if (step === 0 && !kitId) setKitId(`kit_${Date.now()}`)
    // Pre-generate PASO content before entering the editor
    if (step >= 5 && step <= 11) {
      const field = `paso${step - 4}`
      if (!data[field]) update({ [field]: GENERADORES[step - 5]?.(enriched) || '' })
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
    topRef.current?.scrollTo(0, 0)
  }

  const back = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
    topRef.current?.scrollTo(0, 0)
  }

  const reset = () => {
    setStep(0); setData(INITIAL); setError(''); setKitId(null); setIsExample(false)
    setGuidedTour(null); setTourMenu(false); setTourComplete(null)
    localStorage.removeItem('mm_last_step')
    localStorage.removeItem('mm_last_data')
  }

  const scrollToTop = () => topRef.current?.scrollTo(0, 0)
  const renderContent = () => {
    if (step === 0) return <Welcome data={data} onChange={update} onStart={next} onLoad={handleLoad} onOpenPanel={() => setShowPanel(true)} onStartTour={() => { setIsExample(true); setTourMenu(true) }} />
    if (step === 1) return <BlockA data={data} onChange={update} />
    if (step === 2) return <BlockB data={data} onChange={update} />
    if (step === 3) return <BlockC data={data} onChange={update} />
    if (step === 4) return <BlockD data={data} onChange={update} />
    if (step === 5) return <Paso0 data={data} subtemas={generarSubtemas(data.componente, data.route)} onChange={update} />
    if (step >= 6 && step <= 12) return <PasoEditor pasoIdx={step - 6} data={enriched} onChange={update} />
    if (step === 13) return <Final data={enriched} kitId={kitId} onGoTo={setStep} />
    return null
  }

  const isLast = step === TOTAL_STEPS
  const showNav = step > 0

  return (
    <div className="flex flex-col bg-gradient-to-br from-[#2b5a52]/5 to-[#fbb041]/5 min-h-screen">
      {/* Header */}
      <div className="border-b border-[#d9e5e0] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfc_100%)] px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0 no-print shadow-[0_6px_18px_rgba(23,61,55,.04)]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img src={logoMM} alt="Maryam Math" className="h-7 sm:h-8 flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-[#173d37] text-sm sm:text-base leading-tight whitespace-nowrap overflow-hidden text-ellipsis">Copiloto Docente TI</h1>
            <p className="text-[10px] sm:text-xs text-gray-400 leading-tight hidden md:block">
              {en ? 'Your assistant for Technology and Computing kits' : 'Tu asistente para kits de Tecnología e Informática'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowCreditos(true)}
            className="text-gray-400 hover:text-[#2b5a52] p-1.5 rounded-lg hover:bg-[#2b5a52]/8 transition-colors"
            title={en ? 'About this application — author and references' : 'Acerca de esta aplicación — autora y referentes'}
          >
            <FiInfo className="text-sm" />
          </button>
          <button
            onClick={() => setShowPanel(true)}
            className="flex items-center gap-1.5 text-xs px-1.5 sm:px-3 py-1.5 rounded-xl border
              border-[#2b5a52]/25 text-[#2b5a52] hover:bg-[#2b5a52]/8 transition-colors font-medium"
            title={en ? 'View planning dashboard' : 'Ver panel de planeación'}
          >
            <FiAward className="text-xs" />
            <span className="hidden sm:inline">{en ? 'Dashboard' : 'Panel'}</span>
          </button>
          <a
            href={data.route === 'ib_myp_design' ? IB_MYP_DESIGN_URL : (data.route === 'stem' ? STEM_REF_URL : MEN_URL)}
            target={data.route === 'stem' ? '_self' : '_blank'}
            rel={data.route === 'stem' ? undefined : 'noopener noreferrer'}
            className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border
              border-[#2b5a52]/25 text-[#2b5a52] hover:bg-[#2b5a52]/8 transition-colors font-medium"
            title={
              data.route === 'ib_myp_design'
                ? 'Diseño Escolar'
                : data.route === 'stem'
                  ? (en ? 'STEM / STEAM reference (internal)' : 'Referencia STEM / STEAM (interna)')
                  : (en ? 'MEN Curriculum Guidelines 2022' : 'Orientaciones Curriculares MEN 2022')
            }
          >
            <FiBook className="text-xs" />
            <span>
              {data.route === 'ib_myp_design'
                ? 'Diseño Escolar'
                : data.route === 'stem'
                  ? (en ? 'STEM / STEAM ref' : 'Referencia STEM / STEAM')
                  : (en ? 'MEN Guidelines' : 'Orientaciones MEN')}
            </span>
            <FiExternalLink className="text-[10px] opacity-60" />
          </a>
          {step > 0 && isExample && (
            <button
              onClick={reset}
              className="text-xs font-bold text-white bg-[#fbb041] hover:bg-[#e5a038] flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg shadow-sm"
            >
              <FiChevronLeft className="text-xs" /> {en ? 'Back to start' : 'Volver al inicio'}
            </button>
          )}
          {step > 0 && !isExample && (
            <button
              onClick={reset}
              className="text-xs text-gray-400 hover:text-[#2b5a52] flex items-center gap-1 transition-colors border border-transparent hover:border-gray-200 px-2 py-1.5 rounded-lg"
              title={en ? 'Restart from the beginning' : 'Reiniciar desde el principio'}
            >
              <FiRefreshCw className="text-xs" /><span className="hidden sm:inline"> {en ? 'Restart' : 'Reiniciar'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {step > 0 && <ProgressBar current={step} total={TOTAL_STEPS} />}

      {/* Content */}
      <div ref={topRef} className="flex-1 overflow-y-auto px-4 py-8">
        {renderContent()}
      </div>

      {/* Navigation */}
      {showNav && (
        <div className="border-t border-[#d9e5e0] bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfc_100%)] px-4 py-3 flex-shrink-0 no-print shadow-[0_-10px_28px_rgba(23,61,55,.05)]">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={back}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2b5a52] transition-colors px-4 py-2.5 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-[#dbe7e2]"
            >
              <FiChevronLeft /> {en ? 'Back' : 'Atrás'}
            </button>

            {error && <p className="text-xs text-red-500 text-center flex-1 bg-red-50 border border-red-100 rounded-2xl px-4 py-2">{error}</p>}

            {!isLast && (
              <button
                onClick={next}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-sm
                  ${step >= 6 && step <= 12
                ? 'bg-[#fbb041] text-white hover:bg-[#f5a832] shadow-[#fbb041]/30'
                : 'bg-[#2b5a52] text-white hover:bg-[#234a43] shadow-[#2b5a52]/20'}`}
              >
                {step >= 6 && step <= 12 ? (
                  <><FiCheck /> {en ? 'Validate and continue' : 'Aprobar y continuar'}</>
                ) : step === 5 ? (
                  <>{data.route === 'ib_myp_design'
                    ? (en ? 'Confirm design challenge' : 'Confirmar reto de diseño')
                    : (en ? 'Confirm project topic' : 'Confirmar subtema')} <FiChevronRight /></>
                ) : (
                  <>{en ? 'Continue' : 'Siguiente'} <FiChevronRight /></>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Menú de selección de recorrido */}
      {tourMenu && (
        <TourMenu
          language={data.language}
          onSelect={(track) => {
            setTourMenu(false)
            setGuidedTour({ track })
            // Jump to first step of the track
            const enrichedData = { ...data, componenteLabel: getFrameworkValue(data), subtema: getLocalizedSubtema(data) }
            const firstStep = track === 'create' ? 0 : track === 'products' ? 6 : track === 'student' ? 10 : track === 'evaluate' ? 11 : 0
            for (let s = 0; s <= firstStep; s++) {
              if (s >= 5 && s <= 11) {
                const field = `paso${s - 4}`
                if (!data[field]) {
                  const gen = GENERADORES[s - 5]
                  if (gen) update({ [field]: gen(enrichedData) })
                }
              }
            }
            setStep(firstStep)
            topRef.current?.scrollTo(0, 0)
          }}
          onDismiss={() => setTourMenu(false)}
        />
      )}

      {/* Tour guiado activo */}
      {guidedTour && (
        <GuidedTour
          language={data.language}
          track={guidedTour.track}
          currentStep={step}
          onNext={(targetStep) => {
            const enrichedData = { ...data, componenteLabel: getFrameworkValue(data), subtema: getLocalizedSubtema(data) }
            for (let s = step; s <= targetStep; s++) {
              if (s >= 5 && s <= 11) {
                const field = `paso${s - 4}`
                if (!data[field]) {
                  const gen = GENERADORES[s - 5]
                  if (gen) update({ [field]: gen(enrichedData) })
                }
              }
            }
            setStep(targetStep)
            topRef.current?.scrollTo(0, 0)
          }}
          onDismiss={() => setGuidedTour(null)}
          onReset={reset}
          onShowMenu={() => {
            setTourComplete(guidedTour.track)
            setGuidedTour(null)
          }}
        />
      )}

      {/* Modal post-tour: ¿otro recorrido? */}
      {tourComplete && (
        <TourCompleteMenu
          language={data.language}
          completedTrack={tourComplete}
          onSelect={(track) => {
            setTourComplete(null)
            setGuidedTour({ track })
            const firstStep = track === 'create' ? 0 : track === 'products' ? 6 : track === 'student' ? 10 : track === 'evaluate' ? 11 : 0
            const enrichedData = { ...data, componenteLabel: getFrameworkValue(data), subtema: getLocalizedSubtema(data) }
            for (let s = 0; s <= firstStep; s++) {
              if (s >= 5 && s <= 11) {
                const field = `paso${s - 4}`
                if (!data[field]) {
                  const gen = GENERADORES[s - 5]
                  if (gen) update({ [field]: gen(enrichedData) })
                }
              }
            }
            setStep(firstStep)
            topRef.current?.scrollTo(0, 0)
          }}
          onCreateKit={() => { setTourComplete(null); reset() }}
        />
      )}

      {/* Modal créditos */}
      {showCreditos && <CreditosModal onClose={() => setShowCreditos(false)} data={data} />}

      {/* Panel de evolución docente */}
      {showPanel && (
        <PanelDocente onClose={() => setShowPanel(false)} onLoad={handleLoad} language={data.language} route={data.route} />
      )}

      {/* Banner: kit compartido recibido */}
      {sharedKit && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 no-print">
          <div className="max-w-lg mx-auto bg-[#2b5a52] text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📤</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Kit compartido recibido</p>
              <p className="text-white/70 text-xs mt-0.5">
                {sharedKit.institucion || 'Sin institución'} · {getLevelValue(sharedKit)} · {sharedKit.subtema?.nombre || 'sin subtema'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setData(normalizeKitData({ ...INITIAL, ...sharedKit }))
                  setStep(1)
                  setSharedKit(null)
                  window.history.replaceState({}, '', '/kit-docente')
                  scrollToTop()
                }}
                className="text-xs bg-[#fbb041] text-white px-3 py-1.5 rounded-xl font-bold hover:bg-[#f5a832] transition-colors"
              >
                Cargar kit
              </button>
              <button
                onClick={() => { setSharedKit(null); window.history.replaceState({}, '', '/kit-docente') }}
                className="text-white/60 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <FiX />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}








