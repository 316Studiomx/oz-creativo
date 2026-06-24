export type LeadForProposal = {
  servicioPrincipal: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  tipoOrganizacion: string
  institucion: string
  serviciosInteres: string[]
  formatoEvento: string
  temaInteres: string
  planViaje: string
  paqueteMentoria: string
  productoConsultoria: string
  lugarFecha: string
  comoTeEnteraste: string
  objetivo: string
  contextoProyecto: string
}

export type ExchangeRateSnapshot = {
  rate: number
  rateDate: string
}

export type PrivateProposal = {
  folio: string
  token: string
  createdAt: string
  validUntil: string
  proposalUrl: string
  serviceTitle: string
  serviceSubtitle: string
  clientName: string
  institution: string
  email: string
  phone: string
  investment: {
    label: string
    amount: string
    note: string
    breakdown: Array<{ label: string; value: string }>
  }
  scope: Array<{ title: string; body: string }>
  requirements: string[]
  nextSteps: string[]
  payment:
    | {
        status: 'enabled'
        method: 'transfer'
        reference: string
        bank: string
        beneficiary: string
        clabe: string
        account: string
        whatsappUrl: string
        note: string
      }
    | {
        status: 'discovery'
        calendarUrl: string
        note: string
      }
}

const EVENT_BASE_PRICE_MXN = 19000
const EVENT_EXTRA_TRAVEL_DAY_MXN = 5000
const CONSULTING_STARTS_AT_USD = 9000
const WHATSAPP_NUMBER = '528181199759'
const DISCOVERY_CALENDAR_URL = 'https://calendar.app.google/YUtUYehnhJyt1Wsz5'

const TRAVEL_OPTIONS: Record<string, { label: string; extraDays: number }> = {
  'same-day': { label: 'Ir y volver el mismo día', extraDays: 0 },
  'arrive-day-before': { label: 'Viajar un día antes', extraDays: 1 },
  'return-day-after': { label: 'Regresar un día después', extraDays: 1 },
  'arrive-and-return-extra': {
    label: 'Viajar un día antes y regresar un día después',
    extraDays: 2,
  },
}

const MENTORING_PACKAGES: Record<string, { label: string; priceUsd: number; sessions: string }> = {
  one: { label: 'Sesión de Estrategia Magnífica 1:1', priceUsd: 249, sessions: '1 sesión' },
  four: { label: 'Paquete de Estrategia Magnífica 1:1', priceUsd: 849, sessions: '4 sesiones' },
  twelve: { label: 'Acompañamiento Estrategia Magnífica 1:1', priceUsd: 1990, sessions: '12 sesiones' },
}

const BANK_DETAILS = {
  bank: 'Santander',
  beneficiary: 'Jorge Oswaldo Valadez Rivera',
  clabe: '014822605719781690',
  account: '60-57197816-9',
}

export function proposalStorageKey(folio: string, token: string): string {
  return `proposals/${cleanSegment(folio)}-${cleanSegment(token)}.json`
}

export function buildPrivateProposal(
  lead: LeadForProposal,
  options: {
    origin: string
    now?: Date
    token: string
    exchangeRate?: ExchangeRateSnapshot | null
  },
): PrivateProposal {
  const now = options.now ?? new Date()
  const token = cleanSegment(options.token)
  const folio = createFolio(now, token)
  const validUntil = addDays(now, 7).toISOString()
  const proposalUrl = `${options.origin.replace(/\/$/, '')}/propuesta/${folio}/${token}`
  const clientName = `${lead.nombre} ${lead.apellido}`.trim()

  const base = {
    folio,
    token,
    createdAt: now.toISOString(),
    validUntil,
    proposalUrl,
    clientName,
    institution: lead.institucion,
    email: lead.email,
    phone: lead.telefono,
  }

  if (lead.servicioPrincipal === 'conference' || lead.servicioPrincipal === 'workshop') {
    return withPaymentReference({
      ...base,
      ...eventProposalParts(lead),
    })
  }

  if (lead.servicioPrincipal === 'mentoring') {
    return withPaymentReference({
      ...base,
      ...mentoringProposalParts(lead, options.exchangeRate),
    })
  }

  return withPaymentReference({
    ...base,
    ...consultingProposalParts(lead),
  })
}

function eventProposalParts(lead: LeadForProposal) {
  const travel = TRAVEL_OPTIONS[lead.planViaje] ?? TRAVEL_OPTIONS['same-day']
  const extraTravelMxn = travel.extraDays * EVENT_EXTRA_TRAVEL_DAY_MXN
  const totalMxn = EVENT_BASE_PRICE_MXN + extraTravelMxn
  const isWorkshop = lead.servicioPrincipal === 'workshop'
  const serviceTitle = isWorkshop ? 'Workshop para equipos' : 'Conferencia / masterclass'
  const format = lead.formatoEvento || (isWorkshop ? 'Workshop de 4 a 8 horas' : 'Conferencia de 60 a 90 minutos')

  return {
    serviceTitle,
    serviceSubtitle: `${format} · ${lead.temaInteres || 'Temario por definir'}`,
    investment: {
      label: 'Inversión estimada',
      amount: formatMxn(totalMxn),
      note:
        'Estimado sujeto a disponibilidad, sede, logística final y condiciones no contempladas en la solicitud.',
      breakdown: [
        { label: 'Base de conferencia/workshop', value: formatMxn(EVENT_BASE_PRICE_MXN) },
        { label: travel.label, value: extraTravelMxn > 0 ? formatMxn(extraTravelMxn) : 'Sin cargo extra' },
        { label: 'Viáticos', value: 'No incluidos' },
      ],
    },
    scope: [
      {
        title: isWorkshop ? 'Sesión de trabajo' : 'Conferencia principal',
        body: isWorkshop
          ? 'Workshop de 4 a 8 horas con ejercicios aplicados, conversación estratégica y cierre con próximos pasos.'
          : 'Conferencia o masterclass de 60 a 90 minutos, con interacción, Q&A breve, meet and greet y fotografías cuando aplique.',
      },
      {
        title: 'Temario',
        body: lead.temaInteres || 'Temario a seleccionar o ajustar según objetivo, audiencia y contexto del evento.',
      },
      {
        title: 'Coordinación previa',
        body: 'Alineación de objetivo, audiencia, horario, sede y requisitos técnicos antes de confirmar la fecha.',
      },
    ],
    requirements: [
      'Los viáticos se cubren para Oz y un acompañante.',
      'Se solicita hotel de cadena y viaje aéreo, salvo indicación distinta del equipo de Oz Creativo.',
      'No se viaja ni se imparten conferencias en domingo.',
    ],
    nextSteps: [
      'Revisar esta propuesta privada.',
      'Confirmar fecha, ciudad, sede y logística.',
      'Realizar pago total para bloquear fecha y continuar con contrato/coordinación.',
    ],
    payment: paymentDetails('Pago total para bloquear la fecha. Usa el folio como referencia.'),
  } satisfies Omit<PrivateProposal, 'folio' | 'token' | 'createdAt' | 'validUntil' | 'proposalUrl' | 'clientName' | 'institution' | 'email' | 'phone'>
}

function mentoringProposalParts(lead: LeadForProposal, exchangeRate?: ExchangeRateSnapshot | null) {
  const selected = MENTORING_PACKAGES[lead.paqueteMentoria] ?? MENTORING_PACKAGES.one
  const mxnEstimate = exchangeRate ? ` / ${formatMxn(selected.priceUsd * exchangeRate.rate)} aprox.` : ''

  return {
    serviceTitle: selected.label,
    serviceSubtitle: selected.sessions,
    investment: {
      label: 'Inversión',
      amount: `${formatUsd(selected.priceUsd)} USD${mxnEstimate}`,
      note: exchangeRate
        ? `Equivalente MXN calculado con tipo de cambio FIX Banxico del ${exchangeRate.rateDate}.`
        : 'El equivalente en MXN se confirma con el tipo de cambio vigente al momento de pago.',
      breakdown: [
        { label: 'Paquete seleccionado', value: selected.sessions },
        { label: 'Pago', value: 'Pago total' },
      ],
    },
    scope: [
      {
        title: 'Diagnóstico estratégico',
        body: 'Revisión del reto principal, contexto, objetivos y fricciones que están frenando el avance.',
      },
      {
        title: 'Ruta accionable',
        body: 'Definición de prioridades, decisiones clave y siguientes movimientos para avanzar con foco.',
      },
      {
        title: 'Límite sano de la sesión',
        body: 'La mentoría entrega claridad y dirección; la ejecución acompañada, implementación o seguimiento profundo vive en paquetes posteriores.',
      },
    ],
    requirements: [
      'La agenda se libera después de confirmar el pago.',
      'La sesión se enfoca en estrategia, no en implementación operativa completa.',
      'Si el reto requiere acompañamiento, se propondrá continuidad después de la sesión inicial.',
    ],
    nextSteps: [
      'Revisar la propuesta privada.',
      'Realizar pago total del paquete seleccionado.',
      'Enviar comprobante por WhatsApp y agendar el bloque correspondiente.',
    ],
    payment: paymentDetails('Pago total para liberar agenda. Usa el folio como referencia.'),
  } satisfies Omit<PrivateProposal, 'folio' | 'token' | 'createdAt' | 'validUntil' | 'proposalUrl' | 'clientName' | 'institution' | 'email' | 'phone'>
}

function consultingProposalParts(lead: LeadForProposal) {
  return {
    serviceTitle: lead.productoConsultoria || 'Consultoría estratégica',
    serviceSubtitle: 'Diagnóstico antes de propuesta formal',
    investment: {
      label: 'Inversión',
      amount: `Desde ${formatUsd(CONSULTING_STARTS_AT_USD)} USD`,
      note:
        'La inversión final depende de diagnóstico, alcance, fases, entregables, ejecución y capacitación requerida.',
      breakdown: [
        { label: 'Reunión de descubrimiento', value: 'Máximo 30 minutos' },
        { label: 'Cotización formal', value: 'Después del diagnóstico' },
      ],
    },
    scope: [
      {
        title: 'Análisis y diagnóstico',
        body: 'Revisión del contexto comercial, marketing, equipo, activos actuales y objetivos de crecimiento.',
      },
      {
        title: 'Plan de acción',
        body: 'Definición de ruta estratégica, prioridades, fases y entregables antes de comprometer una inversión final.',
      },
      {
        title: 'Ejecución y capacitación',
        body: 'La consultoría puede incluir implementación por nuestra parte, entregables y capacitación según el alcance validado.',
      },
    ],
    requirements: [
      'Los servicios de consultoría comienzan en $9,000 USD.',
      'La inversión se define después de analizar alcance y complejidad.',
      'El siguiente paso es una reunión de descubrimiento de máximo 30 minutos.',
    ],
    nextSteps: [
      'Agendar reunión de descubrimiento.',
      'Validar fit, urgencia, equipo involucrado y objetivo principal.',
      'Preparar propuesta formal con alcance, fases, inversión y condiciones.',
    ],
    payment: {
      status: 'discovery',
      calendarUrl: DISCOVERY_CALENDAR_URL,
      note: 'Agenda primero la reunión de descubrimiento; el pago se habilita cuando exista una propuesta formal.',
    },
  } satisfies Omit<PrivateProposal, 'folio' | 'token' | 'createdAt' | 'validUntil' | 'proposalUrl' | 'clientName' | 'institution' | 'email' | 'phone'>
}

function paymentDetails(note: string): PrivateProposal['payment'] {
  return {
    status: 'enabled',
    method: 'transfer',
    reference: '',
    ...BANK_DETAILS,
    whatsappUrl: '',
    note,
  }
}

function withPaymentReference(proposal: PrivateProposal): PrivateProposal {
  if (proposal.payment.status !== 'enabled') {
    return proposal
  }

  const message = encodeURIComponent(
    `Hola Oz, ya revisé mi propuesta privada y quiero confirmar el pago del folio ${proposal.folio}.`,
  )

  return {
    ...proposal,
    payment: {
      ...proposal.payment,
      reference: proposal.folio,
      whatsappUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`,
    },
  }
}

function createFolio(now: Date, token: string): string {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '')
  return `OZ-${stamp}-${token.slice(0, 6).toUpperCase()}`
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function formatMxn(amount: number): string {
  return `${new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Math.round(amount))} MXN`
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function cleanSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64)
}
