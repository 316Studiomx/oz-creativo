import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  CONTACT_FORM_ENDPOINT,
  ORGANIZATION_OPTIONS,
  REFERRAL_OPTIONS,
  type ContactFormPayload,
} from '../config/contactForm'
import {
  CONSULTING_PRODUCTS,
  EVENT_TOPICS,
  EVENT_TRAVEL_OPTIONS,
  MENTORING_PACKAGES,
} from '../config/quotes'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'
type ServiceKey = 'conference' | 'workshop' | 'mentoring' | 'consulting'
type SelectOption = string | { value: string; label: string }

const SERVICES: Array<{
  key: ServiceKey
  number: string
  title: string
  description: string
}> = [
  {
    key: 'conference',
    number: '01',
    title: 'Conferencias / masterclasses',
    description: 'Sesión escénica de alto impacto con Q&A, fotografías y convivencia breve.',
  },
  {
    key: 'workshop',
    number: '02',
    title: 'Workshops para equipos',
    description: 'Trabajo práctico de 4 a 8 horas para aterrizar marketing, ventas o IA.',
  },
  {
    key: 'mentoring',
    number: '03',
    title: 'Mentoría 1:1',
    description: 'Sesión de Estrategia Magnífica para ordenar oferta, marca y crecimiento.',
  },
  {
    key: 'consulting',
    number: '04',
    title: 'Consultoría',
    description: 'Diagnóstico, plan de acción, ejecución, entregables y capacitación.',
  },
]

const initialForm: ContactFormPayload = {
  servicioPrincipal: '',
  nombre: '',
  apellido: '',
  telefono: '',
  email: '',
  tipoOrganizacion: '',
  institucion: '',
  serviciosInteres: [],
  formatoEvento: '',
  temaInteres: '',
  planViaje: 'same-day',
  paqueteMentoria: 'one',
  productoConsultoria: '',
  lugarFecha: '',
  comoTeEnteraste: '',
  presupuesto: '',
  objetivo: '',
  contextoProyecto: '',
  cotizacionResumen: '',
  cotizacionMonto: '',
  cotizacionMoneda: '',
  website: '',
}

export function LeadForm() {
  const [form, setForm] = useState<ContactFormPayload>(initialForm)
  const [state, setState] = useState<SubmitState>('idle')
  const [error, setError] = useState('')

  const selectedService = form.servicioPrincipal as ServiceKey | ''

  const whatsappHref = `https://wa.me/528181199759?text=${encodeURIComponent(
    `Hola Oz, acabo de llenar la solicitud de propuesta en ozcreativo.com para ${serviceLabel(selectedService)}. Me gustaría dar seguimiento.`,
  )}`

  const update = (field: keyof ContactFormPayload, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const selectService = (service: ServiceKey) => {
    const selected = SERVICES.find((item) => item.key === service)
    setState('idle')
    setError('')
    setForm((current) => ({
      ...current,
      servicioPrincipal: service,
      serviciosInteres: selected ? [selected.title] : [],
      formatoEvento:
        service === 'conference'
          ? 'Conferencia / masterclass de 60 a 90 minutos'
          : service === 'workshop'
            ? 'Workshop de 4 a 8 horas'
            : '',
      productoConsultoria:
        service === 'consulting' && !current.productoConsultoria
          ? CONSULTING_PRODUCTS[0]
          : current.productoConsultoria,
      presupuesto: '',
      cotizacionResumen: '',
      cotizacionMonto: '',
      cotizacionMoneda: '',
    }))
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedService) {
      setState('error')
      setError('Selecciona primero el servicio que te interesa.')
      return
    }

    setState('submitting')
    setError('')

    const payload: ContactFormPayload = {
      ...form,
      presupuesto: '',
      cotizacionResumen: '',
      cotizacionMonto: '',
      cotizacionMoneda: '',
    }

    try {
      const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || 'No se pudo enviar el formulario.')
      }

      setState('success')
      setForm(initialForm)
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'No se pudo enviar el formulario.')
    }
  }

  return (
    <form
      id="formulario"
      onSubmit={submit}
      className="mx-auto max-w-6xl border border-white/10 bg-ink/95 p-5 text-left shadow-[0_0_60px_rgba(255,212,0,0.14)] backdrop-blur md:p-8"
    >
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-yellow">/ Solicitud de propuesta</span>
          <h3 className="mt-3 font-display text-3xl font-semibold uppercase leading-none md:text-5xl">
            Cuéntame qué necesitas y preparo la ruta correcta.
          </h3>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-muted">
          La inversión se enviará por correo en una propuesta privada, con alcance, condiciones,
          siguiente paso y link a la página de cotización cuando corresponda.
        </p>
      </div>

      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(event) => update('website', event.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <fieldset>
        <legend className="mb-3 text-sm font-medium text-paper">Servicio de interés</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {SERVICES.map((service) => {
            const selected = selectedService === service.key
            return (
              <button
                key={service.key}
                type="button"
                onClick={() => selectService(service.key)}
                className={`min-h-32 border px-4 py-4 text-left transition-colors ${
                  selected
                    ? 'border-yellow bg-yellow/10 text-paper shadow-[0_0_28px_rgba(255,212,0,0.14)]'
                    : 'border-white/10 bg-white/[0.03] text-paper/85 hover:border-yellow/50'
                }`}
              >
                <span className="text-xs font-semibold text-yellow">{service.number}</span>
                <span className="mt-2 block font-display text-xl uppercase leading-tight">
                  {service.title}
                </span>
                <span className="mt-3 block text-sm leading-relaxed text-muted">
                  {service.description}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="space-y-6">
          {selectedService && (
            <ServiceQuestions
              form={form}
              service={selectedService}
              update={update}
            />
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <TextField label="Nombre" name="nombre" value={form.nombre} onChange={update} required />
            <TextField label="Apellido" name="apellido" value={form.apellido} onChange={update} required />
            <TextField label="Teléfono" name="telefono" type="tel" value={form.telefono} onChange={update} required />
            <TextField label="Email" name="email" type="email" value={form.email} onChange={update} required />

            <SelectField
              label="Cómo describiría su organización"
              name="tipoOrganizacion"
              value={form.tipoOrganizacion}
              options={ORGANIZATION_OPTIONS}
              onChange={update}
              required
            />
            <TextField
              label="Nombre de institución"
              name="institucion"
              value={form.institucion}
              onChange={update}
              required
            />

            <SelectField
              label="Cómo te enteraste de mí"
              name="comoTeEnteraste"
              value={form.comoTeEnteraste}
              options={REFERRAL_OPTIONS}
              onChange={update}
              required
            />
            <TextField
              label="Lugar y fecha"
              name="lugarFecha"
              value={form.lugarFecha}
              onChange={update}
              placeholder="Ciudad, sede y fecha tentativa"
            />
          </div>

          <label className="block">
            <span className="text-sm font-medium text-paper">
              ¿Cuál es el objetivo que te gustaría alcanzar con este proyecto?
            </span>
            <textarea
              value={form.objetivo}
              onChange={(event) => update('objetivo', event.target.value)}
              required
              rows={5}
              className="mt-2 w-full resize-y border border-white/10 bg-white/[0.03] px-4 py-3 text-paper outline-none transition-colors placeholder:text-muted focus:border-yellow"
            />
          </label>
        </div>

        <ProposalPanel
          selectedService={selectedService}
          whatsappHref={whatsappHref}
        />
      </div>

      {state === 'error' && (
        <p className="mt-5 border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      {state === 'success' && (
        <div className="mt-5 border border-yellow/40 bg-yellow/10 px-4 py-4 text-sm text-paper">
          <p>
            Gracias. Recibí tu información; el siguiente paso será revisar el contexto y enviarte
            una propuesta privada por correo.
          </p>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full bg-yellow px-5 py-2.5 font-semibold text-ink"
          >
            Dar seguimiento por WhatsApp
          </a>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl text-sm text-muted">
          Al enviar, recibiremos tu solicitud para revisar disponibilidad, alcance y siguientes pasos.
        </p>
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="inline-flex justify-center rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-ink transition-transform hover:scale-[1.03] disabled:cursor-wait disabled:opacity-70 md:text-base"
        >
          {state === 'submitting' ? 'Enviando...' : 'Enviar solicitud'}
        </button>
      </div>
    </form>
  )
}

function ServiceQuestions({
  form,
  service,
  update,
}: {
  form: ContactFormPayload
  service: ServiceKey
  update: (field: keyof ContactFormPayload, value: string) => void
}) {
  if (service === 'conference' || service === 'workshop') {
    const formatOptions =
      service === 'conference'
        ? ['Conferencia / masterclass de 60 a 90 minutos', 'Conferencia + Q&A + fotografías', 'Formato por definir']
        : ['Workshop de 4 horas', 'Workshop de 6 horas', 'Workshop de 8 horas', 'Formato por definir']

    return (
      <div className="border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <h4 className="font-display text-xl font-semibold uppercase text-paper">
          Datos para conferencia o workshop
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          No se programan viajes ni eventos en domingo. Los viáticos no están incluidos:
          se consideran para Oz y un acompañante, con hotel de cadena y traslado aéreo salvo
          que el equipo de Oz Creativo indique otra cosa.
        </p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <SelectField
            label="Formato"
            name="formatoEvento"
            value={form.formatoEvento}
            options={formatOptions}
            onChange={update}
            required
          />
          <SelectField
            label="Temario de interés"
            name="temaInteres"
            value={form.temaInteres}
            options={EVENT_TOPICS}
            onChange={update}
            required
          />
          <SelectField
            label="Logística de viaje"
            name="planViaje"
            value={form.planViaje}
            options={Object.entries(EVENT_TRAVEL_OPTIONS).map(([value, option]) => ({
              value,
              label: option.label,
            }))}
            onChange={update}
            required
          />
          <TextField
            label="Notas de agenda o sede"
            name="contextoProyecto"
            value={form.contextoProyecto}
            onChange={update}
            placeholder="Horario, ciudad, público esperado o restricciones"
          />
        </div>
      </div>
    )
  }

  if (service === 'mentoring') {
    return (
      <div className="border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <h4 className="font-display text-xl font-semibold uppercase text-paper">
          Sesión de Estrategia Magnífica 1:1
        </h4>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Selecciona el formato que te interesa. Después de revisar tu solicitud recibirás por
          correo la propuesta privada con forma de pago y el siguiente paso para agendar.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {MENTORING_PACKAGES.map((item) => {
            const selected = form.paqueteMentoria === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => update('paqueteMentoria', item.id)}
                className={`min-h-36 border px-4 py-4 text-left transition-colors ${
                  selected
                    ? 'border-yellow bg-yellow/10 text-paper'
                    : 'border-white/10 bg-ink/70 text-paper/85 hover:border-yellow/50'
                }`}
              >
                <span className="block text-sm text-muted">{item.label}</span>
                <span className="mt-3 block text-xs leading-relaxed text-muted">{item.note}</span>
              </button>
            )
          })}
        </div>
        <TextField
          label="Principal reto para la mentoría"
          name="contextoProyecto"
          value={form.contextoProyecto}
          onChange={update}
          placeholder="Oferta, ventas, marca personal, equipo, contenido, etc."
          className="mt-5 block"
        />
      </div>
    )
  }

  return (
    <div className="border border-white/10 bg-white/[0.03] p-4 md:p-5">
      <h4 className="font-display text-xl font-semibold uppercase text-paper">
        Consultoría estratégica
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        La consultoría requiere diagnóstico. Con tus respuestas se prepara una ruta inicial y,
        si hay fit, se agenda una reunión de descubrimiento de máximo 30 minutos.
      </p>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <SelectField
          label="Tipo de consultoría"
          name="productoConsultoria"
          value={form.productoConsultoria}
          options={CONSULTING_PRODUCTS}
          onChange={update}
          required
        />
        <TextField
          label="Tamaño del equipo o área involucrada"
          name="contextoProyecto"
          value={form.contextoProyecto}
          onChange={update}
          placeholder="Ej. dirección, ventas, marketing, operación"
        />
      </div>
    </div>
  )
}

function ProposalPanel({
  selectedService,
  whatsappHref,
}: {
  selectedService: ServiceKey | ''
  whatsappHref: string
}) {
  const selected = proposalSummary(selectedService)

  return (
    <aside className="border border-yellow/30 bg-yellow/10 p-5 text-paper lg:sticky lg:top-6 lg:self-start">
      <span className="text-xs uppercase tracking-[0.25em] text-yellow">Proceso privado</span>
      <h4 className="mt-3 font-display text-2xl font-semibold uppercase leading-tight">
        {selected.title}
      </h4>
      <p className="mt-4 text-sm leading-relaxed text-paper/85">{selected.summary}</p>

      <div className="mt-5 space-y-3 text-sm text-muted">
        {selected.details.map((detail) => (
          <p key={detail}>{detail}</p>
        ))}
      </div>

      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-paper hover:border-yellow hover:text-yellow"
      >
        WhatsApp
      </a>
    </aside>
  )
}

type ProposalSummary = {
  title: string
  summary: string
  details: string[]
}

function proposalSummary(service: ServiceKey | ''): ProposalSummary {
  if (service === 'conference' || service === 'workshop') {
    return {
      title: service === 'conference' ? 'Conferencia / masterclass' : 'Workshop para equipos',
      summary:
        'Con estos datos se revisa disponibilidad, logística, temario y alcance antes de enviar la propuesta.',
      details: [
        'Recibirás un correo con overview y botón a la página privada de propuesta.',
        'La página de propuesta incluirá alcance, condiciones, logística y forma de pago.',
        'Después de aceptar y pagar, se continúa con contrato y coordinación del evento.',
      ],
    }
  }

  if (service === 'mentoring') {
    return {
      title: 'Sesión de Estrategia Magnífica 1:1',
      summary:
        'La propuesta se envía por correo con el paquete recomendado, link de pago y pasos para liberar agenda.',
      details: [
        'El usuario primero revisa la propuesta privada.',
        'La agenda se libera después del pago.',
        'Los paquetes permiten acompañamiento y seguimiento posterior a la primera sesión.',
      ],
    }
  }

  if (service === 'consulting') {
    return {
      title: 'Consultoría estratégica',
      summary:
        'Primero se valida fit, diagnóstico y alcance; después se prepara la propuesta formal.',
      details: [
        'Fábrica de Clientes y Agencia In-House requieren una revisión más profunda.',
        'Si hay fit, se agenda una reunión de descubrimiento.',
        'La página privada de propuesta incluirá entregables, fases, inversión y condiciones.',
      ],
    }
  }

  return {
    title: 'Selecciona un servicio',
    summary: 'Primero elige el servicio que te interesa para preparar una ruta de propuesta.',
    details: [
      'La web no publica precios ni rangos finales.',
      'La propuesta se envía por correo con un link privado.',
      'El pago, contrato y agenda viven después de aceptar la propuesta.',
    ],
  }
}

function serviceLabel(service: ServiceKey | '') {
  if (service === 'conference') return 'conferencia / masterclass'
  if (service === 'workshop') return 'workshop'
  if (service === 'mentoring') return 'mentoría 1:1'
  if (service === 'consulting') return 'consultoría'
  return 'un servicio de Oz Creativo'
}

function TextField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder,
  className = '',
}: {
  label: string
  name: keyof ContactFormPayload
  value: string | undefined
  onChange: (field: keyof ContactFormPayload, value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  className?: string
}) {
  return (
    <label className={className}>
      <span className="text-sm font-medium text-paper">{label}</span>
      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full border border-white/10 bg-white/[0.03] px-4 py-3 text-paper outline-none transition-colors placeholder:text-muted focus:border-yellow"
      />
    </label>
  )
}

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
  required = false,
}: {
  label: string
  name: keyof ContactFormPayload
  value: string
  options: readonly SelectOption[]
  onChange: (field: keyof ContactFormPayload, value: string) => void
  required?: boolean
}) {
  return (
    <label>
      <span className="text-sm font-medium text-paper">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        required={required}
        className="mt-2 w-full border border-white/10 bg-[#111] px-4 py-3 text-paper outline-none transition-colors focus:border-yellow"
      >
        <option value="">Selecciona una opción</option>
        {options.map((option) => {
          const optionValue = typeof option === 'string' ? option : option.value
          const optionLabel = typeof option === 'string' ? option : option.label
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
    </label>
  )
}
