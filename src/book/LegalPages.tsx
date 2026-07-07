import { BOOK_STORE_COPY } from './bookCopy'

export type LegalSlug =
  | 'politica-de-envios'
  | 'cambios-devoluciones-cancelaciones'
  | 'aviso-de-privacidad'
  | 'terminos-y-condiciones'
  | 'contacto'

type LegalPageCopy = {
  title: string
  intro: string
  sections: Array<{
    title: string
    body: string
  }>
}

const LEGAL_PAGES: Record<LegalSlug, LegalPageCopy> = {
  'politica-de-envios': {
    title: 'Política de envíos',
    intro:
      'Esta política aplica para la compra del libro físico Hazlo Magnífico en ozcreativo.com/libro.',
    sections: [
      {
        title: 'México',
        body:
          'El envío dentro de México es gratis para el cliente. Después de la confirmación de pago por Stripe, Oz Creativo prepara el pedido y comparte el rastreo por correo cuando la guía esté disponible.',
      },
      {
        title: 'Tiempos',
        body:
          'Los tiempos pueden variar por ciudad, paquetería y temporada. Si existe alguna incidencia con dirección, cobertura o entrega, te contactaremos con los datos que dejaste en el checkout.',
      },
      {
        title: 'Internacional',
        body:
          'Las compras fuera de México se cotizan antes del pago. El costo, tiempo y disponibilidad se confirman manualmente para cada país.',
      },
    ],
  },
  'cambios-devoluciones-cancelaciones': {
    title: 'Cambios, devoluciones y cancelaciones',
    intro:
      'Queremos que el proceso sea claro: se vende un libro físico, pagado con Stripe y enviado desde México.',
    sections: [
      {
        title: 'Cancelaciones',
        body:
          'Si necesitas cancelar, escribe lo antes posible a soporte. Si el pedido todavía no fue entregado a paquetería, revisaremos la cancelación y el posible reembolso por el mismo método de pago.',
      },
      {
        title: 'Cambios o daños',
        body:
          'Si el libro llega dañado o con un problema atribuible al envío, contáctanos con fotos del empaque, del libro y tu número de pedido para revisar reposición o solución aplicable.',
      },
      {
        title: 'Devoluciones',
        body:
          'Por tratarse de un libro físico, las devoluciones se revisan caso por caso. Los cargos de envío de retorno, cuando apliquen, se confirmarán antes de cualquier movimiento.',
      },
    ],
  },
  'aviso-de-privacidad': {
    title: 'Aviso de privacidad',
    intro:
      'Oz Creativo usa tus datos únicamente para procesar la compra, entregar el libro y darte soporte.',
    sections: [
      {
        title: 'Datos que solicitamos',
        body:
          'Podemos solicitar nombre, correo, teléfono, dirección de envío, referencias de entrega, cantidad comprada, pedido y estado de pago.',
      },
      {
        title: 'Uso de datos',
        body:
          'Usamos la información para crear el checkout de Stripe, confirmar el pago, preparar el envío, enviar correos transaccionales y atender dudas relacionadas con tu compra.',
      },
      {
        title: 'Proveedores',
        body:
          'Stripe procesa el pago de forma segura. También podemos compartir datos necesarios con proveedores de correo y paquetería para confirmar y entregar el pedido.',
      },
    ],
  },
  'terminos-y-condiciones': {
    title: 'Términos y condiciones',
    intro:
      'Al comprar Hazlo Magnífico aceptas estas condiciones para una venta directa de libro físico.',
    sections: [
      {
        title: 'Producto y precio',
        body:
          'El producto vendido es el libro físico Hazlo Magnífico. El precio público es $499 MXN por unidad, con envío gratis dentro de México. La disponibilidad puede cambiar sin publicar stock en tiempo real.',
      },
      {
        title: 'Pago',
        body:
          'El pago se realiza mediante Stripe. La orden se considera en preparación cuando el pago queda confirmado por Stripe y el sistema genera la referencia correspondiente.',
      },
      {
        title: 'Soporte e incidencias',
        body:
          'Si hay un problema con pago, dirección, entrega o rastreo, el comprador debe contactar a soporte con su número de pedido y correo usado en la compra.',
      },
    ],
  },
  contacto: {
    title: 'Contacto',
    intro: 'Para dudas sobre tu compra de Hazlo Magnífico, usa el correo de soporte.',
    sections: [
      {
        title: 'Soporte',
        body: `Escríbenos a ${BOOK_STORE_COPY.supportEmail}. Incluye tu número de pedido si ya compraste.`,
      },
      {
        title: 'Facturación y aclaraciones',
        body:
          'Si necesitas información adicional, envía tus datos y el contexto de tu compra. Te responderemos con los siguientes pasos disponibles.',
      },
      {
        title: 'Compras internacionales',
        body:
          'Para envíos fuera de México, solicita cotización desde la página del libro o envía país, ciudad, código postal y cantidad de libros.',
      },
    ],
  },
}

export function LegalPage({ slug }: { slug: LegalSlug }) {
  const page = LEGAL_PAGES[slug]

  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="container-x py-20">
        <a href="/libro" className="link-underline text-sm font-semibold text-yellow">
          Volver al libro
        </a>
        <p className="mt-12 text-xs uppercase tracking-[0.3em] text-yellow">Hazlo Magnífico</p>
        <h1 className="mt-5 font-display text-5xl font-semibold uppercase leading-none text-paper [letter-spacing:0] md:text-7xl">
          {page.title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{page.intro}</p>

        <div className="mt-10 grid max-w-4xl gap-5">
          {page.sections.map((section) => (
            <section key={section.title} className="border-l border-yellow/70 bg-white/[0.03] p-5">
              <h2 className="font-display text-2xl font-semibold uppercase text-paper [letter-spacing:0]">
                {section.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted">{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  )
}
