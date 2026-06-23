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
    cta: 'Solicitar propuesta',
  },

  hero: {
    eyebrow: 'MARKETING · VENTAS · EMPRENDIMIENTO · IA',
    title: 'Convierto ideas en marcas, y marcas en negocios que venden.',
    subtitle:
      'Soy Oz Creativo. Más de 12 años ayudando a empresas y marcas personales a comunicar mejor, vender más y construir algo que trascienda. Sin humo. Con estrategia.',
    ctaPrimary: 'Solicitar propuesta',
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
        cta: 'Solicitar propuesta',
      },
      {
        n: '02',
        title: 'Workshops para equipos',
        body: 'Ventas Magníficas y Marketing Magnífico: tu equipo deja de improvisar y empieza a operar por sistema.',
        cta: 'Solicitar propuesta',
      },
      {
        n: '03',
        title: 'Mentorías 1 a 1',
        body: 'Un sparring que te dice las cosas como son. Tu marca, tu mensaje, tu oferta y tu estrategia de crecimiento, con foco en lo que mueve la aguja.',
        cta: 'Solicitar propuesta',
      },
      {
        n: '04',
        title: 'Consultoría',
        body: 'Tu Fábrica de Ventas (sistematizo tu proceso comercial) y Tu Agencia de Marketing In House (construyo o profesionalizo tu motor de marketing interno con la experiencia de 316 Studio).',
        cta: 'Solicitar propuesta',
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
    proofItems: [
      {
        label: '316 Studio',
        caption: 'Equipo creativo, operativo y estratégico detrás de más de 12 años construyendo marcas.',
        src: '/assets/track/316-studio-equipo.jpg',
        alt: 'Oz Creativo junto al equipo de 316 Studio frente al muro amarillo de la agencia.',
      },
      {
        label: 'Producción en vivo',
        caption: 'Dirección y coordinación de experiencias empresariales en escenarios reales.',
        src: '/assets/track/produccion-evento-iies.jpg',
        alt: 'Producción de evento con iluminación azul y morada mientras el equipo coordina en sala.',
      },
      {
        label: 'Cúspide Mx',
        caption: 'Eventos empresariales con audiencias masivas y conferencistas de alto impacto.',
        src: '/assets/track/cuspide-marco-antonio-regil.jpg',
        alt: 'Auditorio lleno durante una conferencia de Marco Antonio Regil en Cúspide Mx.',
      },
      {
        label: 'Formación',
        caption: 'Aprendizaje constante en negocio, liderazgo y emprendimiento.',
        src: '/assets/track/harvard-oz.jpg',
        alt: 'Oz Creativo sonriendo con sudadera de Harvard frente a una pared de madera.',
      },
      {
        label: 'Hazlo Magnífico',
        caption: 'Libro y metodología para emprender con visión, disciplina y grandeza.',
        src: '/assets/track/hazlo-magnifico-libro.jpg',
        alt: 'Libro amarillo Hazlo Magnífico de Oz Creativo sobre una mesa de madera.',
      },
    ],
  },

  contact: {
    title: 'Tu próximo capítulo no se va a escribir solo.',
    body: 'Tienes el talento, el producto o la visión. Lo que falta es la estrategia para que el mundo lo vea y lo compre. Yo ya recorrí ese camino — caminémoslo juntos.',
    quote: {
      text: 'Y todo lo que hagan, háganlo de corazón.',
      cite: 'Colosenses 3:23',
    },
    cta: 'Solicitar propuesta',
  },

  footer: {
    domain: 'OZCREATIVO.COM',
    socials: [
      { label: 'IG @ozcreativo', href: 'https://instagram.com/ozcreativo' },
      { label: 'FB Oz Creativo', href: 'https://facebook.com/ozcreativo' },
    ],
  },
} as const
