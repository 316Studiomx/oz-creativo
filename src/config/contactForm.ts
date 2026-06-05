export const CONTACT_FORM_ENDPOINT = '/api/contact'

export const ORGANIZATION_OPTIONS = [
  'Pequeña o mediana empresa',
  'Corporativo',
  'Gobierno, asociación civil o religiosa',
] as const

export const SERVICE_OPTIONS = [
  'Conferencias y masterclasses',
  'Workshops para equipos',
  'Mentorías 1 a 1',
  'Consultoría',
  'Otro',
] as const

export const REFERRAL_OPTIONS = [
  'Redes sociales',
  'Recomendación',
  'Google',
  'Evento o conferencia',
  'Prensa o medios',
  'Otro',
] as const

export const BUDGET_OPTIONS = [
  'Por definir',
  'Menos de $50,000 MXN',
  '$50,000 a $100,000 MXN',
  '$100,000 a $250,000 MXN',
  'Más de $250,000 MXN',
] as const

export type ContactFormPayload = {
  nombre: string
  apellido: string
  telefono: string
  email: string
  tipoOrganizacion: string
  institucion: string
  serviciosInteres: string[]
  lugarFecha: string
  comoTeEnteraste: string
  presupuesto: string
  objetivo: string
  website?: string
}
