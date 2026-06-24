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
      { label: 'Escenarios', href: '#escenarios' },
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
    companies: [
      {
        name: '316Studio',
        description: 'Agencia creativa que construye marketing, contenido y sistemas comerciales para marcas ambiciosas.',
        href: 'https://316studio.com.mx',
      },
      {
        name: 'Cúspide Mx',
        description: 'Plataforma de eventos empresariales para líderes, emprendedores y equipos en crecimiento.',
        href: 'https://expocuspide.com',
      },
      {
        name: 'Plexx',
        description: 'Proyecto enfocado en experiencias, comunidad y nuevas formas de crear valor.',
        href: '#hablemos',
      },
      {
        name: 'Propulsor',
        description: 'Iniciativa para impulsar ideas, negocios y personas con estrategia accionable.',
        href: '#hablemos',
      },
    ],
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
    title: 'Escenarios',
    intro: 'Pruebas visuales de proyectos, escenarios y momentos que han marcado el camino.',
    proofItems: [
      {
        label: '316 Studio',
        caption: 'Equipo creativo, operativo y estratégico detrás de más de 12 años construyendo marcas.',
        src: '/assets/track/316-studio-equipo.jpg',
        alt: 'Oz Creativo junto al equipo de 316 Studio frente al muro amarillo de la agencia.',
        href: 'https://316studio.com.mx',
      },
      {
        label: 'Producción en vivo',
        caption: 'Dirección y coordinación de experiencias empresariales en escenarios reales.',
        src: '/assets/track/produccion-evento-iies.jpg',
        alt: 'Producción de evento con iluminación azul y morada mientras el equipo coordina en sala.',
        href: '#hablemos',
      },
      {
        label: 'Cúspide Mx',
        caption: 'Eventos empresariales con audiencias masivas y conferencistas de alto impacto.',
        src: '/assets/track/cuspide-marco-antonio-regil.jpg',
        alt: 'Auditorio lleno durante una conferencia de Marco Antonio Regil en Cúspide Mx.',
        href: 'https://expocuspide.com',
      },
      {
        label: 'Formación',
        caption: 'Aprendizaje constante en negocio, liderazgo y emprendimiento.',
        src: '/assets/track/harvard-oz.jpg',
        alt: 'Oz Creativo sonriendo con sudadera de Harvard frente a una pared de madera.',
        href: '#acreditaciones',
      },
      {
        label: 'Hazlo Magnífico',
        caption: 'Libro y metodología para emprender con visión, disciplina y grandeza.',
        src: '/assets/track/hazlo-magnifico-libro.jpg',
        alt: 'Libro amarillo Hazlo Magnífico de Oz Creativo sobre una mesa de madera.',
        href: '#hablemos',
      },
    ],
    accreditations: [
      {
        label: 'Harvard Business School',
        caption: 'Certificado en emprendimiento por Harvard Business School.',
        src: '/assets/track/harvard-oz.jpg',
        alt: 'Oz Creativo con sudadera de Harvard como referencia visual de formación ejecutiva.',
        href: '#hablemos',
      },
      {
        label: 'StartUp México',
        caption: 'Mentor activo para emprendedores y proyectos en etapa de crecimiento.',
        src: '/assets/track/produccion-evento-iies.jpg',
        alt: 'Escenario de evento empresarial como referencia visual de mentoría y emprendimiento.',
        href: '#hablemos',
      },
      {
        label: 'Meta Marketing Digital',
        caption: 'Certificado por Meta en fundamentos y estrategia de marketing digital.',
        src: '/assets/track/316-studio-equipo.jpg',
        alt: 'Equipo de marketing de 316 Studio como referencia visual de ejecución digital.',
        href: '#hablemos',
      },
      {
        label: 'Hora Cero',
        caption: 'Columnista con ideas sobre negocio, marca, liderazgo y emprendimiento.',
        src: '/assets/track/hazlo-magnifico-libro.jpg',
        alt: 'Libro Hazlo Magnífico como referencia visual de contenido y pensamiento publicado.',
        href: '#hablemos',
      },
      {
        label: 'Forbes 2026',
        caption: 'Reconocido por Forbes como figura clave del marketing en 2026.',
        src: '/assets/track/cuspide-marco-antonio-regil.jpg',
        alt: 'Auditorio de alto impacto como referencia visual de reconocimiento público.',
        href: '#hablemos',
      },
      {
        label: 'Lead Summit',
        caption: 'Ganador en concurso de pitch en Lead Summit de John Maxwell.',
        src: '/assets/track/produccion-evento-iies.jpg',
        alt: 'Escenario iluminado de evento empresarial como referencia visual de pitch y liderazgo.',
        href: '#hablemos',
      },
      {
        label: 'Mejor Q’ Ayer',
        caption: 'Embajador de una comunidad enfocada en mejora personal y crecimiento.',
        src: '/assets/track/harvard-oz.jpg',
        alt: 'Retrato de Oz Creativo como referencia visual de liderazgo y crecimiento personal.',
        href: '#hablemos',
      },
      {
        label: '+$1M USD en anuncios',
        caption: 'Más de un millón de dólares invertidos en pauta digital y aprendizaje real.',
        src: '/assets/track/316-studio-equipo.jpg',
        alt: 'Equipo de 316 Studio como referencia visual de operaciones de marketing y pauta digital.',
        href: '#hablemos',
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
