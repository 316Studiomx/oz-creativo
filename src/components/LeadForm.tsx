import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  BUDGET_OPTIONS,
  CONTACT_FORM_ENDPOINT,
  ORGANIZATION_OPTIONS,
  REFERRAL_OPTIONS,
  SERVICE_OPTIONS,
  type ContactFormPayload,
} from '../config/contactForm'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

const initialForm: ContactFormPayload = {
  nombre: '',
  apellido: '',
  telefono: '',
  email: '',
  tipoOrganizacion: '',
  institucion: '',
  serviciosInteres: [],
  lugarFecha: '',
  comoTeEnteraste: '',
  presupuesto: '',
  objetivo: '',
  website: '',
}

export function LeadForm() {
  const [form, setForm] = useState<ContactFormPayload>(initialForm)
  const [state, setState] = useState<SubmitState>('idle')
  const [error, setError] = useState('')

  const whatsappHref = useMemo(() => {
    const text = 'Hola Oz, acabo de llenar el formulario en ozcreativo.com y me gustaría dar seguimiento.'
    return `https://wa.me/528181199759?text=${encodeURIComponent(text)}`
  }, [])

  const update = (field: keyof ContactFormPayload, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleService = (service: string) => {
    setForm((current) => {
      const exists = current.serviciosInteres.includes(service)
      return {
        ...current,
        serviciosInteres: exists
          ? current.serviciosInteres.filter((item) => item !== service)
          : [...current.serviciosInteres, service],
      }
    })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (form.serviciosInteres.length === 0) {
      setState('error')
      setError('Selecciona al menos un servicio de interés.')
      return
    }

    setState('submitting')
    setError('')

    try {
      const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
      className="mx-auto max-h-[88svh] max-w-5xl overflow-y-auto border border-white/10 bg-ink/95 p-5 text-left shadow-[0_0_60px_rgba(255,212,0,0.14)] backdrop-blur md:p-8"
    >
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-yellow">/ Formulario</span>
          <h3 className="mt-3 font-display text-3xl font-semibold uppercase leading-none md:text-5xl">
            Hagámoslo magnífico.
          </h3>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Cuéntame el contexto y te responderé con el siguiente paso más útil.
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
        <SelectField
          label="Presupuesto considerado para este proyecto"
          name="presupuesto"
          value={form.presupuesto}
          options={BUDGET_OPTIONS}
          onChange={update}
          required
        />

        <TextField
          label="Lugar y fecha"
          name="lugarFecha"
          value={form.lugarFecha}
          onChange={update}
          placeholder="En caso de requerir presencial"
          className="md:col-span-2"
        />
      </div>

      <fieldset className="mt-6">
        <legend className="mb-3 text-sm font-medium text-paper">Servicio de interés</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {SERVICE_OPTIONS.map((service) => (
            <label
              key={service}
              className="flex min-h-12 items-center gap-3 border border-white/10 px-4 py-3 text-sm text-paper/85 transition-colors hover:border-yellow/50"
            >
              <input
                type="checkbox"
                checked={form.serviciosInteres.includes(service)}
                onChange={() => toggleService(service)}
                className="h-4 w-4 accent-yellow"
              />
              {service}
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-6 block">
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

      {state === 'error' && (
        <p className="mt-5 border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}

      {state === 'success' && (
        <div className="mt-5 border border-yellow/40 bg-yellow/10 px-4 py-4 text-sm text-paper">
          <p>Gracias. Recibí tu información y también te llegará una copia por correo.</p>
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
        <p className="max-w-xl text-sm text-muted">
          Tus datos se usarán únicamente para responder a esta solicitud.
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
  options: readonly string[]
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
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
