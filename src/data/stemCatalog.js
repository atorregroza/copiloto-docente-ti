// STEM/STEAM catálogo determinístico por dominio, banda y idioma

export const STEM_DOMAINS = [
  { id: 'agua', keywords: ['agua', 'hidrat', 'turbidez', 'claridad', 'filtro'], label: { es: 'Agua / hidratación', en: 'Water / hydration' } },
  { id: 'ruido', keywords: ['ruido', 'bulla', 'sonido', 'claridad'], label: { es: 'Ruido / claridad', en: 'Noise / clarity' } },
  { id: 'fila', keywords: ['fila', 'turno', 'cola', 'espera', 'prioridad', 'orden'], label: { es: 'Fila / turnos', en: 'Queue / turns' } },
  { id: 'calor', keywords: ['calor', 'ventila', 'aire', 'temperatura', 'ventilador', 'sombr'], label: { es: 'Calor / ventilación', en: 'Heat / ventilation' } },
  { id: 'espacio', keywords: ['maleta', 'mochila', 'almac', 'espacio', 'segurid', 'ubicar'], label: { es: 'Espacio / seguridad', en: 'Space / safety' } },
  { id: 'luz', keywords: ['luz', 'ilumin', 'clar', 'nublado', 'oscuro'], label: { es: 'Luz / visibilidad', en: 'Light / visibility' } },
  { id: 'generico', keywords: [], label: { es: 'Genérico', en: 'Generic' } },
]

const t = (es, en, lang) => (lang === 'en' ? en : es)

// Plantillas completas por dominio y banda
// Campos: need, prototype, metric, evidence, rounds (array), guideStudent (breve), guideTeacher (breve), rubricHint
export const STEM_TEMPLATES = {
  agua: {
    exploradores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Punto de agua con pictograma y bandeja absorbente.', 'Water spot with pictogram and absorbent tray.', lang),
      metric: t('¿Derrames en 10–15 min? sí/no.', 'Spills in 10–15 min? yes/no.', lang),
      evidence: t('Foto antes/después y nota de derrames.', 'Photo before/after and spill note.', lang),
      rounds: roundsBasic(lang, need, t('¿Se usa sin derramar?', 'Used without spilling?', lang)),
      rubric: t('Evidencia simple de uso y mejora.', 'Simple evidence of use and improvement.', lang),
    }),
    constructores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Estación de agua + cartel de orden + tapete.', 'Water station + order sign + mat.', lang),
      metric: t('Derrames/min o turnos ordenados en 20 min.', 'Spills/min or orderly turns in 20 min.', lang),
      evidence: t('Foto estación + tabla de derrames/turnos.', 'Station photo + spills/turns table.', lang),
      rounds: roundsStd(lang, need, t('¿Menos derrames y más orden?', 'Fewer spills and more order?', lang)),
      rubric: t('Evalúa orden, uso correcto y mejora tras pruebas.', 'Assess order, correct use and improvement after tests.', lang),
    }),
    innovadores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Filtro simple + señal de fila + bandeja de goteo.', 'Simple filter + queue sign + drip tray.', lang),
      metric: t('Claridad/turbidez y tiempo de recarga.', 'Clarity/turbidity and refill time.', lang),
      evidence: t('Tabla antes/después y foto de prueba.', 'Before/after table and test photo.', lang),
      rounds: roundsStd(lang, need, t('¿Mejora claridad y tiempo?', 'Improves clarity and time?', lang)),
      rubric: t('Integración de áreas, datos de prueba y ajuste.', 'Area integration, test data and adjustment.', lang),
    }),
    arquitectos: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Piloto de servicio prioritario con registro manual/sensor.', 'Priority service pilot with manual/sensor log.', lang),
      metric: t('% prioridad cumplida + turbidez o tiempo.', '% priority met + turbidity or time.', lang),
      evidence: t('Registro de datos por ronda + foto.', 'Per-round data log + photo.', lang),
      rounds: roundsAdv(lang, need, t('¿Cumple prioridad y mejora calidad?', 'Meets priority and improves quality?', lang)),
      rubric: t('Pensamiento sistémico, datos y trade-offs.', 'Systems thinking, data and trade-offs.', lang),
    }),
  },
  ruido: {
    exploradores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Tarjeta verde/amarilla/roja para ruido.', 'Green/Yellow/Red noise card.', lang),
      metric: t('Ruido 1–3 antes/después 10 min.', 'Noise 1–3 before/after 10 min.', lang),
      evidence: t('Foto del uso + nota del nivel.', 'Usage photo + level note.', lang),
      rounds: roundsBasic(lang, need, t('¿Bajó a 1–2?', 'Did it drop to 1–2?', lang)),
      rubric: t('Comprende la regla y la aplica.', 'Understands and applies the rule.', lang),
    }),
    constructores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Semáforo de ruido o panel absorbente.', 'Noise light or absorbent panel.', lang),
      metric: t('dB o escala 1–3 antes/después 20 min.', 'dB or 1–3 before/after 20 min.', lang),
      evidence: t('Foto y lectura de ruido antes/después.', 'Noise reading + photo before/after.', lang),
      rounds: roundsStd(lang, need, t('¿Bajó el ruido y se entiende mejor?', 'Lower noise and better clarity?', lang)),
      rubric: t('Calidad del prototipo y evidencia de prueba.', 'Prototype quality and test evidence.', lang),
    }),
    innovadores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Tablero ruido+turno junto al servicio.', 'Noise+turn board near service.', lang),
      metric: t('Ruido y conflictos cada 20 min.', 'Noise and conflicts each 20 min.', lang),
      evidence: t('Tabla de ruido y conflictos por ronda.', 'Noise/conflict table per round.', lang),
      rounds: roundsStd(lang, need, t('¿Menos ruido y conflictos?', 'Less noise and conflicts?', lang)),
      rubric: t('Integración de áreas, datos y mejora.', 'Integration of areas, data, improvement.', lang),
    }),
    arquitectos: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Sistema de control de ruido con registro y ajustes.', 'Noise control system with log and tweaks.', lang),
      metric: t('Tendencia de ruido + incidentes.', 'Noise trend + incidents.', lang),
      evidence: t('Registro de datos + gráfica.', 'Data log + chart.', lang),
      rounds: roundsAdv(lang, need, t('¿Disminuye tendencia e incidentes?', 'Trend and incidents down?', lang)),
      rubric: t('Trade-offs, datos y reflexión de impacto.', 'Trade-offs, data, impact reflection.', lang),
    }),
  },
  fila: {
    exploradores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Marcas de piso + distintivo “primero pequeños”.', 'Floor marks + “young first” badge.', lang),
      metric: t('Conflictos en 10–15 min (sí/no).', 'Conflicts in 10–15 min (yes/no).', lang),
      evidence: t('Foto de la fila y conteo.', 'Queue photo and count.', lang),
      rounds: roundsBasic(lang, need, t('¿Hay menos conflictos?', 'Fewer conflicts?', lang)),
      rubric: t('Comprensión y aplicación simple.', 'Simple understanding and application.', lang),
    }),
    constructores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Fichas de turno por color + cartel de orden.', 'Color turn tokens + order sign.', lang),
      metric: t('Tiempo de espera jóvenes vs otros.', 'Wait time young vs others.', lang),
      evidence: t('Tabla de tiempos y foto.', 'Time table and photo.', lang),
      rounds: roundsStd(lang, need, t('¿Se reduce tiempo y conflictos?', 'Reduced time/conflicts?', lang)),
      rubric: t('Prototipo funcional y evidencia de prueba.', 'Functional prototype and test evidence.', lang),
    }),
    innovadores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Kit de fila justa: dispensador + contador visual.', 'Fair-queue kit: dispenser + visual counter.', lang),
      metric: t('Tiempo y errores de turno por ronda.', 'Time and turn errors per round.', lang),
      evidence: t('Log de errores + foto.', 'Error log + photo.', lang),
      rounds: roundsStd(lang, need, t('¿Menos errores y espera?', 'Fewer errors and wait?', lang)),
      rubric: t('Integración de datos y mejora.', 'Data integration and improvement.', lang),
    }),
    arquitectos: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Política de prioridad + carril visual + registro.', 'Priority policy + visual lane + log.', lang),
      metric: t('% cumplimiento + tiempo de espera.', '% compliance + wait time.', lang),
      evidence: t('Tabla de cumplimiento y tiempos.', 'Compliance/time table.', lang),
      rounds: roundsAdv(lang, need, t('¿Aumenta cumplimiento y baja espera?', 'Higher compliance, lower wait?', lang)),
      rubric: t('Pensamiento sistémico y trade-offs.', 'Systems thinking and trade-offs.', lang),
    }),
  },
  calor: {
    exploradores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Tela para sombra + flecha de ventilador.', 'Shade cloth + fan arrow.', lang),
      metric: t('Confort 1–3 tras 10 min.', 'Comfort 1–3 after 10 min.', lang),
      evidence: t('Foto antes/después y voto.', 'Photo before/after and vote.', lang),
      rounds: roundsBasic(lang, need, t('¿Subió el confort?', 'Comfort up?', lang)),
      rubric: t('Aplicación básica y ajuste.', 'Basic application and tweak.', lang),
    }),
    constructores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Deflector de aire + ventilador pequeño.', 'Air deflector + small fan.', lang),
      metric: t('Cambio temp/aire en 20 min.', 'Temp/air change in 20 min.', lang),
      evidence: t('Foto de prueba + lectura.', 'Test photo + reading.', lang),
      rounds: roundsStd(lang, need, t('¿Mejora temp/aire?', 'Temp/air better?', lang)),
      rubric: t('Calidad del prototipo y medición.', 'Prototype quality and measurement.', lang),
    }),
    innovadores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Ventilación + sombra + hidratación.', 'Ventilation + shade + hydration.', lang),
      metric: t('Temp/aire + confort por ronda.', 'Temp/air + comfort per round.', lang),
      evidence: t('Tabla temp/aire + foto.', 'Temp/air table + photo.', lang),
      rounds: roundsStd(lang, need, t('¿Mejora confort y datos?', 'Comfort and data improved?', lang)),
      rubric: t('Integración de datos y mejora.', 'Data integration and improvement.', lang),
    }),
    arquitectos: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Enfriamiento eficiente: temporizador + deflector.', 'Efficient cooling: timer + deflector.', lang),
      metric: t('Energía/tiempo vs confort.', 'Energy/time vs comfort.', lang),
      evidence: t('Registro energía/confort.', 'Energy/comfort log.', lang),
      rounds: roundsAdv(lang, need, t('¿Mejor trade-off energía/confort?', 'Better energy/comfort trade-off?', lang)),
      rubric: t('Trade-offs y datos comparativos.', 'Trade-offs and comparative data.', lang),
    }),
  },
  espacio: {
    exploradores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Señal y caja baja para mochilas.', 'Sign and low box for backpacks.', lang),
      metric: t('Uso correcto en 10 min: sí/no.', 'Correct use in 10 min: yes/no.', lang),
      evidence: t('Foto del punto y uso.', 'Photo of spot and use.', lang),
      rounds: roundsBasic(lang, need, t('¿Se usan correctamente?', 'Used correctly?', lang)),
      rubric: t('Aplicación simple y orden.', 'Simple application and order.', lang),
    }),
    constructores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Zona marcada + instructivo + rol guía.', 'Marked zone + how-to + guide role.', lang),
      metric: t('Usos correctos / 15 min.', 'Correct uses / 15 min.', lang),
      evidence: t('Foto antes/después y conteo.', 'Photo before/after and count.', lang),
      rounds: roundsStd(lang, need, t('¿Más orden y menos estorbo?', 'More order, less blocking?', lang)),
      rubric: t('Prototipo funcional y evidencia de uso.', 'Functional prototype and usage evidence.', lang),
    }),
    innovadores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Módulo organizado + señal + rol de evidencias.', 'Organized module + sign + evidence role.', lang),
      metric: t('Usos correctos y tiempo de acceso.', 'Correct uses and access time.', lang),
      evidence: t('Log de usos + foto.', 'Use log + photo.', lang),
      rounds: roundsStd(lang, need, t('¿Mejora acceso y orden?', 'Better access and order?', lang)),
      rubric: t('Integración de roles y mejora.', 'Role integration and improvement.', lang),
    }),
    arquitectos: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Mapa de flujo + ubicación priorizada + registro.', 'Flow map + prioritized placement + log.', lang),
      metric: t('% uso correcto + tiempo de acceso.', '% correct use + access time.', lang),
      evidence: t('Registro por ronda y foto.', 'Per-round log and photo.', lang),
      rounds: roundsAdv(lang, need, t('¿Sube uso correcto y baja tiempo?', 'Higher correct use, lower time?', lang)),
      rubric: t('Pensamiento sistémico y datos.', 'Systems thinking and data.', lang),
    }),
  },
  luz: {
    exploradores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Lámpara o luz portátil con pictograma de uso.', 'Portable lamp with usage pictogram.', lang),
      metric: t('¿Se usa para leer? sí/no en 10 min.', 'Used for reading? yes/no in 10 min.', lang),
      evidence: t('Foto usando la luz + nota breve.', 'Photo using light + brief note.', lang),
      rounds: roundsBasic(lang, need, t('¿Ven mejor con la luz?', 'Do they see better?', lang)),
      rubric: t('Uso intencional y cuidado de la luz.', 'Intentional use and care of light.', lang),
    }),
    constructores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Kit de iluminación simple + señal de ubicación.', 'Simple lighting kit + location sign.', lang),
      metric: t('Claridad percibida antes/después 15 min.', 'Perceived clarity before/after 15 min.', lang),
      evidence: t('Foto antes/después y nota de claridad.', 'Photo before/after and clarity note.', lang),
      rounds: roundsStd(lang, need, t('¿Mejora la visibilidad?', 'Visibility improved?', lang)),
      rubric: t('Prototipo funciona y evidencia de mejora.', 'Prototype works and shows improvement.', lang),
    }),
    innovadores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Iluminación distribuida + señal visual + tabla de datos.', 'Distributed lighting + visual sign + data table.', lang),
      metric: t('Lux o claridad percibida por ronda.', 'Lux or perceived clarity per round.', lang),
      evidence: t('Tabla de lux/claridad + foto.', 'Lux/clarity table + photo.', lang),
      rounds: roundsStd(lang, need, t('¿Sube luz y claridad?', 'Light and clarity up?', lang)),
      rubric: t('Integración de datos y ajustes.', 'Data integration and tweaks.', lang),
    }),
    arquitectos: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Mapa de luz + redistribución + registro.', 'Light map + redistribution + log.', lang),
      metric: t('Lux distribuidos y confort visual.', 'Distributed lux and visual comfort.', lang),
      evidence: t('Registro por zonas + foto.', 'Zone log + photo.', lang),
      rounds: roundsAdv(lang, need, t('¿Distribución y confort mejoran?', 'Distribution and comfort improve?', lang)),
      rubric: t('Pensamiento sistémico y trade-offs de luz.', 'Systems thinking and light trade-offs.', lang),
    }),
  },
  generico: {
    exploradores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Cartel claro + demostración breve.', 'Clear sign + short demo.', lang),
      metric: t('¿Se entiende en 10 min? sí/no.', 'Understood in 10 min? yes/no.', lang),
      evidence: t('Foto y nota de uso.', 'Photo and usage note.', lang),
      rounds: roundsBasic(lang, need, t('¿Entienden y siguen?', 'Understand and follow?', lang)),
      rubric: t('Comprensión y acción básica.', 'Basic understanding and action.', lang),
    }),
    constructores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Prototipo simple probado dos veces.', 'Simple prototype tested twice.', lang),
      metric: t('Resultado prueba 1 vs prueba 2.', 'Result test 1 vs test 2.', lang),
      evidence: t('Fotos y nota de ajuste.', 'Photos and adjustment note.', lang),
      rounds: roundsStd(lang, need, t('¿Mejora en prueba 2?', 'Improves in test 2?', lang)),
      rubric: t('Funciona y mejora tras pruebas.', 'Works and improves after tests.', lang),
    }),
    innovadores: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Prototipo low-fi + señal visual + tabla de datos.', 'Low-fi prototype + visual sign + data table.', lang),
      metric: t('Métrica antes/después cada ronda.', 'Metric before/after each round.', lang),
      evidence: t('Tabla y fotos por ronda.', 'Table and photos per round.', lang),
      rounds: roundsStd(lang, need, t('¿Datos muestran mejora?', 'Data show improvement?', lang)),
      rubric: t('Datos, integración y mejora.', 'Data, integration, improvement.', lang),
    }),
    arquitectos: (lang, need) => baseTemplate(lang, need, {
      prototype: t('Dos variantes A/B con registro de datos.', 'Two variants A/B with data log.', lang),
      metric: t('Comparar métrica A vs B.', 'Compare metric A vs B.', lang),
      evidence: t('Tabla comparativa y gráfica.', 'Comparative table and chart.', lang),
      rounds: roundsAdv(lang, need, t('¿Qué variante funciona mejor?', 'Which variant works better?', lang)),
      rubric: t('Trade-offs y decisión basada en datos.', 'Trade-offs and data-driven decision.', lang),
    }),
  },
}

// Helpers
function baseTemplate(lang, need, { prototype, metric, evidence, rounds, rubric }) {
  return {
    need,
    prototype,
    metric,
    evidence,
    rounds,
    rubric,
    guideStudent: buildGuideStudent(lang, need, prototype, metric, evidence),
    guideTeacher: buildGuideTeacher(lang, need, prototype, metric, evidence),
  }
}

function roundsBasic(lang, need, focus) {
  const en = lang === 'en'
  return [
    {
      focus,
      evidence: en ? 'Foto y nota del resultado.' : 'Foto y nota del resultado.',
      adjustment: en ? 'Un cambio sencillo después de probar.' : 'Un cambio sencillo después de probar.',
    },
  ]
}

function roundsStd(lang, need, focus) {
  const en = lang === 'en'
  return [
    {
      focus,
      evidence: en ? 'Foto + dato antes/después.' : 'Foto + dato antes/después.',
      adjustment: en ? 'Un ajuste con base en el dato.' : 'Un ajuste con base en el dato.',
    },
    {
      focus: en ? 'Test 2: mejora con el ajuste' : 'Prueba 2: mejora con el ajuste',
      evidence: en ? 'Foto + dato tras ajuste.' : 'Foto + dato tras ajuste.',
      adjustment: en ? 'Anota siguiente mejora.' : 'Anota siguiente mejora.',
    },
  ]
}

function roundsAdv(lang, need, focus) {
  const en = lang === 'en'
  return [
    {
      focus,
      evidence: en ? 'Datos y foto inicial.' : 'Datos y foto inicial.',
      adjustment: en ? 'Ajuste 1 basado en datos.' : 'Ajuste 1 basado en datos.',
    },
    {
      focus: en ? 'Test 2: iterar con cambios' : 'Prueba 2: iterar con cambios',
      evidence: en ? 'Datos y foto tras cambio.' : 'Datos y foto tras cambio.',
      adjustment: en ? 'Ajuste 2 priorizado.' : 'Ajuste 2 priorizado.',
    },
    {
      focus: en ? 'Test 3: validar impacto' : 'Prueba 3: validar impacto',
      evidence: en ? 'Tabla/gráfico de tendencia.' : 'Tabla/gráfico de tendencia.',
      adjustment: en ? 'Decide siguiente iteración.' : 'Decide siguiente iteración.',
    },
  ]
}

function buildGuideStudent(lang, need, prototype, metric, evidence) {
  const en = lang === 'en'
  return en
    ? `CHALLENGE: ${need}\nPrototype: ${prototype}\nMetric: ${metric}\nEvidence: ${evidence}\nSteps:\n1) Plan and sketch.\n2) Build.\n3) Test twice.\n4) Record photos and data.\n5) Adjust and present (2 min).`
    : `RETO: ${need}\nPrototipo: ${prototype}\nMétrica: ${metric}\nEvidencia: ${evidence}\nPasos:\n1) Planear y bocetar.\n2) Construir.\n3) Probar dos veces.\n4) Registrar fotos y datos.\n5) Ajustar y presentar (2 min).`
}

function buildGuideTeacher(lang, need, prototype, metric, evidence) {
  const en = lang === 'en'
  return en
    ? `Guide: clarify need and constraints; let students pick roles; ensure ${prototype}; require metric: ${metric}; minimum evidence: ${evidence}.`
    : `Guía: aclarar necesidad y restricciones; asignar roles; asegurar ${prototype}; exigir métrica: ${metric}; evidencia mínima: ${evidence}.`
}

export function detectStemDomain(need = '') {
  const text = need.toLowerCase()
  for (const dom of STEM_DOMAINS) {
    if (dom.id === 'generico') continue
    if (dom.keywords.some((k) => text.includes(k))) return dom.id
  }
  return 'generico'
}

export function buildStemPackage(domain = 'generico', bandKey = 'innovadores', language = 'es', need = '') {
  const fn = STEM_TEMPLATES[domain]?.[bandKey] || STEM_TEMPLATES.generico?.[bandKey]
  return fn ? fn(language, need) : null
}

