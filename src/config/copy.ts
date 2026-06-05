/**
 * All site copy in one place. Edit text here — components read from this object.
 */
export const COPY = {
  brand: {
    name: 'OZ CREATIVO',
    star: '✳',
    domain: 'OZCREATIVO.COM',
  },

  nav: {
    links: [
      { label: 'Inicio', href: '#inicio' },
      { label: 'Sobre mí', href: '#sobre-mi' },
      { label: 'Lo que hago', href: '#lo-que-hago' },
      { label: 'Trayectoria', href: '#trayectoria' },
      { label: 'Hablemos', href: '#hablemos' },
    ],
    cta: 'Hagámoslo magnífico',
  },

  hero: {
    eyebrow: 'MARKETING · VENTAS · EMPRENDIMIENTO · IA',
    title: 'Convierto ideas en marcas, y marcas en negocios que venden.',
    subtitle:
      'Soy Oz Creativo. Más de 12 años ayudando a empresas y marcas personales a comunicar mejor, vender más y construir algo que trascienda. Sin humo. Con estrategia.',
    ctaPrimary: 'Hagámoslo magnífico',
    ctaSecondary: 'Conoce cómo trabajo',
    // Easter egg microcopy shown when hovering the yellow glasses on the portrait
    glassesEasterEgg: 'Veo oportunidades donde otros ven ruido. 👓',
  },

  stats: [
    { value: 100, prefix: '+', label: 'conferencias' },
    { value: 100, suffix: 'K', prefix: '~', label: 'en comunidad' },
    { value: 12, prefix: '+', label: 'años de trayectoria' },
    { value: 100, prefix: '~', label: 'eventos empresariales dirigidos' },
  ],

  about: {
    title: 'Mucho gusto, soy Oz.',
    paragraphs: [
      'No empecé sabiendo dirigir eventos para cientos de personas ni cobrar por una estrategia. Empecé resolviendo problemas, equivocándome más de lo que me gustaría admitir, y aprendiendo a ponerle precio a lo que antes hacía por instinto. De ahí salió todo lo demás.',
      'Hoy soy fundador de 316 Studio (agencia de marketing, +12 años) y de Cúspide Mx, donde he dirigido cerca de 100 eventos empresariales. He liderado proyectos de marca en México y Latinoamérica, dado más de 100 conferencias y compartido escenario con figuras como Marco Antonio Regil, Marcus Dantus, John Maxwell y Karla Berman. Soy autor del libro Hazlo Magnífico, escribo en Hora Cero, y Forbes me incluyó entre las figuras de liderazgo e innovación para "marcar el sendero de 2026".',
    ],
    quote: {
      text: '¿Has visto a alguien diligente en su trabajo? Delante de reyes estará.',
      cite: 'Proverbios 22:29',
    },
  },

  services: {
    title: 'Lo que hago',
    items: [
      {
        n: '01',
        title: 'Conferencias y Masterclasses',
        body: 'Subo a un escenario a mover a la gente, no a aburrirla. Marketing, ventas, emprendimiento, innovación, creatividad y desarrollo personal.',
        cta: 'Hablemos de esto',
      },
      {
        n: '02',
        title: 'Workshops para equipos',
        body: 'Ventas Magníficas y Marketing Magnífico: tu equipo deja de improvisar y empieza a operar por sistema.',
        cta: 'Hablemos de esto',
      },
      {
        n: '03',
        title: 'Mentorías 1 a 1',
        body: 'Un sparring que te dice las cosas como son. Tu marca, tu mensaje, tu oferta y tu estrategia de crecimiento, con foco en lo que mueve la aguja.',
        cta: 'Hablemos de esto',
      },
      {
        n: '04',
        title: 'Consultoría',
        body: 'Tu Fábrica de Ventas (sistematizo tu proceso comercial) y Tu Agencia de Marketing In House (construyo o profesionalizo tu motor de marketing interno con la experiencia de 316 Studio).',
        cta: 'Hablemos de esto',
      },
    ],
  },

  track: {
    title: 'Trayectoria',
    intro: 'Escenarios, marcas y reconocimientos que han marcado el camino.',
    badges: [
      'Forbes',
      'Hora Cero',
      'Autor: Hazlo Magnífico',
      'ThePowerMBA',
      'Harvard (Emprendimiento)',
    ],
    // Editable placeholders — replace with real logos/testimonios.
    logos: ['316 Studio', 'Cúspide Mx', 'Logo 03', 'Logo 04', 'Logo 05', 'Logo 06'],
    testimonials: [
      { name: 'Nombre Apellido', role: 'Cargo', company: 'Empresa', quote: 'Resultado concreto que logramos trabajando juntos. [placeholder editable]' },
      { name: 'Nombre Apellido', role: 'Cargo', company: 'Empresa', quote: 'Otro testimonio con un resultado medible. [placeholder editable]' },
      { name: 'Nombre Apellido', role: 'Cargo', company: 'Empresa', quote: 'Un tercer testimonio que refuerce la autoridad. [placeholder editable]' },
    ],
  },

  contact: {
    title: 'Tu próximo capítulo no se va a escribir solo.',
    body: 'Tienes el talento, el producto o la visión. Lo que falta es la estrategia para que el mundo lo vea y lo compre. Yo ya recorrí ese camino — caminémoslo juntos.',
    quote: {
      text: 'Y todo lo que hagan, háganlo de corazón.',
      cite: 'Colosenses 3:23',
    },
    cta: 'Agenda una llamada conmigo',
    ctaHref: '#formulario',
  },

  footer: {
    domain: 'OZCREATIVO.COM',
    socials: [
      { label: 'IG @ozcreativo', href: 'https://instagram.com/ozcreativo' },
      { label: 'FB Oz Creativo', href: 'https://facebook.com/ozcreativo' },
    ],
  },
} as const
