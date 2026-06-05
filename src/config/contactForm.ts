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
  '$500 USD a $999',
  '$1,000 a $1,999',
  '$2,000 a $4,999 USD',
  '$4,999 a $9,999 USD',
  '$10,000 USD a $100,000 USD',
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
