export const translations = {
  es: {
    // Common
    common: {
      cancel: 'Cancelar',
      delete: 'Eliminar',
      save: 'Guardar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      warning: 'Advertencia',
      back: 'Atrás',
      close: 'Cerrar',
      edit: 'Editar',
      view: 'Ver',
      email: 'Correo electrónico',
      password: 'Contraseña',
      name: 'Nombre',
      url: 'URL',
      status: 'Estado',
      created: 'Creado',
      updated: 'Actualizado',
      organization: 'Organización',
      organizations: 'Organizaciones',
      sites: 'Sitios',
      site: 'Sitio',
      pages: 'Páginas',
      page: 'Página',
      settings: 'Configuración',
      logout: 'Cerrar sesión',
    },

    // Auth
    auth: {
      login: 'Iniciar sesión',
      register: 'Registrarse',
      signIn: 'Ingresar',
      signUp: 'Crear cuenta',
      email: 'Correo electrónico',
      password: 'Contraseña',
      name: 'Nombre completo',
      continueWithGoogle: 'Continuar con Google',
      dontHaveAccount: '¿No tienes cuenta?',
      alreadyHaveAccount: '¿Ya tienes cuenta?',
      registerHere: 'Regístrate aquí',
      loginHere: 'Inicia sesión aquí',
      invalidCredentials: 'Credenciales inválidas',
      passwordMinLength: 'La contraseña debe tener al menos 6 caracteres',
      invalidEmail: 'Correo electrónico inválido',
      userAlreadyExists: 'Este usuario ya existe',
      registerSuccess: 'Registro exitoso',
      loginSuccess: 'Sesión iniciada',
      loginTitle: 'Iniciar sesión',
      loginSubtitle: 'Accede a tus organizaciones y auditorías.',
      registerTitle: 'Crear cuenta',
      registerSubtitle: 'Empieza a auditar tu sitio en minutos.',
      confirmPassword: 'Confirmar contraseña',
      optional: 'Opcional',
      passwordHint: 'Mínimo 6 caracteres',
      passwordsDoNotMatch: 'Las contraseñas no coinciden',
      or: 'o',
      namePlaceholder: 'Ana García',
      emailPlaceholder: 'tu@empresa.com',
      organizationPlaceholder: 'Mi empresa',
    },

    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Bienvenido',
      totalSites: 'Sitios totales',
      role: 'Rol',
      yourEmail: 'Tu correo',
      yourSites: 'Tus sitios',
      noSites: 'No hay sitios aún. Comienza explorando un sitio web.',
      goCrawler: 'Ir al explorador →',
      viewDetails: 'Ver detalles →',
      switchOrg: 'Cambiar organización',
      createNewSite: 'Crear nuevo sitio',
      crawlNewSite: 'Explorar nuevo sitio',
      owner: 'Propietario',
      admin: 'Administrador',
      member: 'Miembro',
    },

    // Crawler
    crawler: {
      title: 'Explorador de sitios',
      enterUrl: 'Ingresa la URL del sitio',
      startCrawl: 'Comenzar exploración',
      crawling: 'Explorando...',
      crawlSuccess: 'Exploración exitosa',
      crawlError: 'Error durante la exploración',
      invalidUrl: 'URL inválida',
      pages: 'Páginas encontradas',
      progress: 'Progreso',
    },

    // Sites
    sites: {
      title: 'Mis sitios',
      url: 'URL',
      pages: 'Páginas',
      status: 'Estado',
      created: 'Creado',
      actions: 'Acciones',
      view: 'Ver →',
      delete: 'Eliminar',
      deleteConfirm: 'Estás seguro de que quieres eliminar este sitio?',
      crawlStatus: {
        pending: 'Pendiente',
        inProgress: 'En progreso',
        completed: 'Completado',
        failed: 'Fallido',
      },
    },

    // Delete Site Dialog
    deleteSiteDialog: {
      title: 'Eliminar sitio',
      description: 'Esta acción no se puede deshacer. Por favor, sé cuidadoso.',
      warning: '⚠️ Se perderán todos los datos. No se puede revertir.',
      willDelete: 'Se eliminará permanentemente',
      deleteButton: 'Eliminar sitio',
      deleting: 'Eliminando...',
      deletedSuccess: 'Sitio eliminado exitosamente',
      deletedError: 'Error al eliminar el sitio',
    },

    // Delete Organization Dialog
    deleteOrgDialog: {
      title: 'Eliminar organización',
      description: 'Esta acción no se puede deshacer. Por favor, sé cuidadoso.',
      warning: '⚠️ Se perderán todos los datos. No se puede revertir.',
      willDeleteAll: 'Se eliminará permanentemente junto con todos los sitios asociados y sugerencias.',
      typeToConfirm: 'Escribe el nombre de la organización para confirmar la eliminación:',
      deleteButton: 'Eliminar organización',
      deleting: 'Eliminando...',
      deletedSuccess: 'Organización eliminada exitosamente',
      deletedError: 'Error al eliminar la organización',
    },

    // Generate All (bulk SEO generation)
    generateAll: {
      button: 'Generar todo',
      dialogTitle: 'Generar todo',
      dialogDescription:
        'Se generarán metadatos SEO para las {{count}} páginas disponibles de este sitio. Esta acción puede tardar unos momentos.',
      starting: 'Iniciando...',
      confirmButton: 'Generar todo',
      error: 'Error al generar los metadatos',
      missingJob: 'No se encontró el proceso de generación. Vuelve a intentarlo desde la pestaña Páginas.',
      alreadyRunning: 'Ya hay una generación en curso para este sitio. Te mostramos su progreso.',
      generating: 'Generando sugerencias para todas las páginas...',
      resultsTitle: 'Resultados de generación masiva',
      fields: {
        title: 'Título',
        slug: 'Slug',
        description: 'Descripción',
        canonicalUrl: 'URL canónica',
      },
      saveAll: 'Guardar cambios',
      saveSuccess: 'Cambios guardados correctamente',
      saveError: 'Error al guardar los cambios',
      savePartialError: 'No se pudieron guardar {{failed}} de {{total}} resultados',
      unsaved: 'Sin guardar',
      exportAll: 'Exportar todo',
    },

    // Organization Settings
    organizationSettings: {
      title: 'Configuración de organización',
      name: 'Nombre de la organización',
      members: 'Miembros',
      role: 'Rol',
      owner: 'Propietario',
      admin: 'Administrador',
      member: 'Miembro',
      editName: 'Editar nombre',
      createSuccess: 'Organización creada exitosamente',
      updateSuccess: 'Organización actualizada',
      updateError: 'Error al actualizar la organización',
      deleteOrganization: 'Eliminar organización',
    },

    // User Settings
    userSettings: {
      title: 'Configuración de usuario',
      preferences: 'Preferencias',
      theme: 'Tema',
      language: 'Idioma',
      notifications: 'Notificaciones',
      emailNotifications: 'Notificaciones por correo',
      weeklyReport: 'Reporte semanal',
      saveSettings: 'Guardar configuración',
      saved: 'Configuración guardada',
    },

    // Pages
    pages: {
      title: 'Páginas',
      pageTitle: 'Título',
      url: 'URL',
      status: 'Estado',
      headings: 'Encabezados',
      metaTags: 'Etiquetas meta',
      links: 'Enlaces',
      images: 'Imágenes',
      suggestions: 'Sugerencias',
      viewDetails: 'Ver detalles',
    },

    // Validation
    validation: {
      required: 'Este campo es requerido',
      invalidEmail: 'Correo electrónico inválido',
      invalidUrl: 'URL inválida',
      minLength: 'Mínimo {{min}} caracteres',
      maxLength: 'Máximo {{max}} caracteres',
    },

    // Errors
    errors: {
      unauthorized: 'No autorizado',
      forbidden: 'Acceso denegado',
      notFound: 'No encontrado',
      serverError: 'Error del servidor',
      tryAgain: 'Intenta de nuevo',
      goHome: 'Ir al inicio',
      sessionExpired: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
      unauthorizedContent: 'No tienes autorización para ver este contenido.',
    },

    // Headers
    header: {
      logout: 'Cerrar sesión',
      login: 'Iniciar sesión',
      signup: 'Registrarse',
      dashboard: 'Dashboard',
    },

    // Site Details
    geo: {
      sections: { profile: 'Perfil de negocio', structuredData: 'Datos estructurados', llmsTxt: 'llms.txt' },
      recrawl: 'Este sitio se crawleó antes de las revisiones GEO. Vuelve a crawlearlo para obtener JSON-LD, links y texto.',
      needsProfile: 'Configura primero el perfil de negocio.',
      copy: 'Copiar',
      copied: 'Copiado al portapapeles',
      download: 'Descargar',
      save: 'Guardar perfil',
      saved: 'Perfil guardado',
      loadError: 'No se pudo cargar la información GEO',
      profile: {
        intro: 'El perfil es la fuente de verdad para generar JSON-LD y llms.txt. Nada factual se inventa: revisa y confirma los valores sugeridos.',
        suggest: 'Sugerir perfil desde el crawl',
        suggesting: 'Analizando el sitio...',
        resuggest: 'Volver a sugerir',
        draft: 'Borrador sugerido: revisa, confirma y guarda.',
        businessKind: 'Tipo de negocio',
        kinds: { hotel: 'Hotel independiente', 'hotel-chain': 'Cadena hotelera', 'local-business': 'Negocio local', organization: 'Organización' },
        defaultLanguage: 'Idioma por defecto',
        languages: 'Idiomas del sitio (separados por coma)',
        entities: 'Entidades',
        external: 'Externa',
        type: 'Tipo',
        scope: 'Scope (prefijo de URL)',
        parent: 'Organización padre',
        none: 'Ninguna',
        remove: 'Descartar',
        addExternal: 'Agregar entidad externa',
        addProperty: 'Agregar propiedad',
        facts: 'Datos factuales',
        texts: 'Textos por idioma',
        confirm: 'Confirmar',
        confirmAll: 'Confirmar todo',
        sources: { user: 'Confirmado', 'existing-jsonld': 'JSON-LD del sitio', extracted: 'Extraído: por confirmar', generated: 'Generado: por confirmar' },
        fields: {
          name: 'Nombre', url: 'URL', telephone: 'Teléfono', email: 'Email', streetAddress: 'Calle y número',
          addressLocality: 'Ciudad', addressRegion: 'Estado / región', postalCode: 'Código postal', addressCountry: 'País (ISO)',
          latitude: 'Latitud', longitude: 'Longitud', logo: 'Logo (URL)', image: 'Imagen (URL)', sameAs: 'Redes y perfiles (uno por línea)',
          openingHours: 'Horario', priceRange: 'Rango de precios', checkinTime: 'Check-in', checkoutTime: 'Check-out',
          starRating: 'Estrellas', numberOfRooms: 'Número de habitaciones', petsAllowed: 'Acepta mascotas',
          description: 'Descripción', alternateName: 'Nombres alternativos (separados por coma)', amenities: 'Amenidades (una por línea)',
        },
      },
      structuredData: {
        summary: 'Resumen por página',
        statuses: { missing: 'Sin JSON-LD', invalid: 'Inválido', 'wrong-type': 'Tipo incorrecto', incomplete: 'Incompleto', inconsistent: 'Inconsistente', ok: 'Correcto' },
        noProfile: 'Sin perfil solo se revisan existencia, validez y completitud.',
        languageIds: 'Entidades con @id distinto por idioma: conviene unificarlas.',
        recommended: 'Recomendado',
        pages: 'Páginas',
        missing: 'Faltan',
        suggestions: 'Sugerencias opcionales',
        blocks: 'Bloques para pegar en tu sitio',
        destinations: {
          global: 'Global: pégalo en el layout del sitio (todas las páginas)',
          entity: 'Por entidad: pégalo en la plantilla de las páginas de esta propiedad',
          page: 'Por página: esta página declara su propia variante',
        },
        conflicts: 'Conflictos',
        keep: 'Mantener existente',
        useProfile: 'Usar perfil',
        apply: 'Aplicar decisiones',
        applied: 'Bloques actualizados',
        added: 'agregado',
        kept: 'sin cambios',
        conflict: 'conflicto',
        preserved: 'conservado',
        newBlock: 'Bloque nuevo',
        completed: 'Completa el JSON-LD de',
      },
      llms: {
        statuses: { missing: 'No existe', invalid: 'Inválido', ok: 'Correcto', unknown: 'Desconocido' },
        problems: 'Problemas',
        warnings: 'Advertencias',
        brokenLinks: 'Links rotos',
        current: 'Archivo actual',
        generate: 'Generar llms.txt',
        generating: 'Generando...',
        language: 'Idioma',
        preview: 'Vista previa',
        publish: 'Publícalo en la raíz del dominio: https://tu-dominio/llms.txt',
      },
    },
    siteDetails: {
      backToDashboard: '← Volver al Dashboard',
      totalPages: 'Total de páginas',
      status: 'Estado',
      pageTitle: 'Título de página',
      tabs: {
        serp: 'Vista previa SERP',
        pages: 'Páginas',
        meta: 'Etiquetas meta',
        geo: 'GEO',
      },
      noPagesMessage: 'Sin páginas crawleadas aún.',
      noMetaTagsMessage: 'Sin etiquetas meta disponibles. Ejecuta un crawl para ver las etiquetas de la página de inicio.',
      metaTagsFrom: 'Etiquetas meta de la página de inicio',
    },

    // SERP Preview
    serpPreview: {
      title: 'Vista previa SERP',
      subtitle: 'Visualiza cómo aparecerá tu página en los resultados de búsqueda',
      desktop: 'Desktop (1200px)',
      mobile: 'Mobile (400px)',
      charCount: 'caracteres',
      optimal: 'Óptimo',
      tooShort: 'Muy corto',
      tooLong: 'Muy largo',
      titleLabel: 'Título',
      descriptionLabel: 'Descripción',
      noDatabMessage: 'Sin datos de SERP disponibles. Ejecuta un crawl primero.',
    },

    // Landing
    home: {
      hero: {
        badge: 'Auditoría SEO y GEO con IA',
        title: 'Haz que Google y la IA entiendan tu sitio',
        subtitle:
          'Rastrea tu sitio, detecta problemas de SEO, genera sugerencias con IA y prepara tus datos estructurados y tu llms.txt para los buscadores con IA.',
        ctaPrimaryGuest: 'Empezar gratis',
        ctaSecondaryGuest: 'Iniciar sesión',
        ctaPrimaryUser: 'Ir al rastreador',
        ctaSecondaryUser: 'Ver panel',
      },
      stats: {
        tools: { value: '7', title: 'Herramientas', desc: 'Del rastreo al llms.txt' },
        languages: { value: '2', title: 'Idiomas', desc: 'Interfaz en español e inglés' },
        steps: { value: '4', title: 'Pasos', desc: 'De la URL a los cambios listos' },
        formats: { value: 'JSON-LD', title: 'Formatos estándar', desc: 'Schema.org y llms.txt, sin formatos propietarios' },
      },
      howItWorks: {
        title: 'Cómo funciona',
        subtitle: 'De una URL a un sitio optimizado en cuatro pasos.',
        steps: [
          { title: 'Rastrea', desc: 'Ingresa tu URL: descubrimos el sitemap y renderizamos cada página, incluso las hechas con JavaScript.' },
          { title: 'Analiza', desc: 'Revisa títulos, descripciones, meta tags y cómo se ve cada página en Google.' },
          { title: 'Optimiza', desc: 'Genera sugerencias con IA página por página o para todo el sitio de una vez.' },
          { title: 'Aplica', desc: 'Copia los textos, el JSON-LD y el llms.txt listos para publicar en tu sitio.' },
        ],
      },
      tools: {
        title: 'Todo lo que necesitas para posicionar tu sitio',
        subtitle: 'Herramientas para el SEO de siempre y para los nuevos buscadores con IA.',
        items: {
          crawler: {
            name: 'Rastreo del sitio',
            desc: 'Descubre tus páginas desde el sitemap y las renderiza como un navegador para no perder contenido cargado con JavaScript.',
          },
          serp: {
            name: 'Vista previa SERP',
            desc: 'Mira cómo aparece cada página en Google en escritorio y móvil, con alertas de longitud del título y la descripción.',
          },
          meta: {
            name: 'Auditoría de meta tags',
            desc: 'Encuentra títulos, descripciones y canonicals ausentes o duplicados en todo el sitio.',
          },
          ai: {
            name: 'Sugerencias con IA',
            desc: 'Obtén propuestas de título, descripción y palabras clave para cada página, listas para revisar.',
            badge: 'IA',
          },
          bulk: {
            name: 'Generación masiva',
            desc: 'Genera sugerencias para todas las páginas del sitio en un solo proceso y sigue su avance.',
            badge: 'IA',
          },
          geo: {
            name: 'GEO: JSON-LD y llms.txt',
            desc: 'Define el perfil de tu negocio, revisa y completa tus datos estructurados y genera tu llms.txt para ChatGPT, Perplexity y AI Overviews.',
            badge: 'GEO',
          },
          orgs: {
            name: 'Multi-organización',
            desc: 'Gestiona varios clientes o marcas desde una sola cuenta, con miembros y roles por organización.',
          },
        },
      },
      useCases: {
        title: 'Ejemplos de uso',
        subtitle: 'Así se ve SEOAudit resolviendo casos reales.',
        tabs: {
          seo: 'SEO clásico',
          geo: 'IA y GEO',
          agencies: 'Agencias',
        },
        seo: {
          title: 'Mejora cómo apareces en Google',
          desc: 'Un hotel descubre que el título de su página principal es demasiado corto y no menciona la ciudad. La vista previa SERP lo muestra al instante y la IA propone una alternativa.',
          points: [
            'Detecta títulos y descripciones fuera de rango',
            'Compara escritorio y móvil',
            'Acepta o ajusta la sugerencia antes de publicarla',
          ],
          before: 'Antes',
          after: 'Después',
        },
        geo: {
          title: 'Prepárate para los buscadores con IA',
          desc: 'Los asistentes como ChatGPT o Perplexity citan a los negocios que describen bien quiénes son. SEOAudit completa tu JSON-LD a partir de tu perfil y genera un llms.txt con tus páginas clave.',
          points: [
            'Revisa si tu JSON-LD existe, es válido y está completo',
            'Nunca inventa datos: dirección y teléfono salen de tu sitio',
            'Genera el llms.txt en formato estándar',
          ],
          jsonLdLabel: 'JSON-LD',
          llmsLabel: 'llms.txt',
        },
        agencies: {
          title: 'Un panel para todos tus clientes',
          desc: 'Una agencia separa a cada cliente en su propia organización, invita a su equipo y revisa todos los sitios desde un mismo lugar.',
          points: [
            'Organizaciones independientes por cliente',
            'Roles de propietario, administrador y miembro',
            'Interfaz en español e inglés para cada usuario',
          ],
          windowTitle: 'Organizaciones',
          sitesLabel: 'sitios',
        },
      },
      faq: {
        title: 'Preguntas frecuentes',
        items: [
          {
            q: '¿Qué necesito para empezar?',
            a: 'Solo crear una cuenta e ingresar la URL de tu sitio. No hace falta instalar nada en tu servidor.',
          },
          {
            q: '¿Funciona con sitios hechos en JavaScript?',
            a: 'Sí. El rastreador renderiza cada página como un navegador antes de analizarla, así que ve el mismo contenido que tus visitantes.',
          },
          {
            q: '¿Qué es GEO y por qué me importa?',
            a: 'GEO (Generative Engine Optimization) es preparar tu sitio para que los buscadores con IA lo entiendan y lo citen. Los datos estructurados y el llms.txt son dos de sus piezas principales.',
          },
          {
            q: '¿La IA inventa datos de mi negocio?',
            a: 'No. Los datos factuales como la dirección o el teléfono se toman de tu sitio o los confirmas tú. La IA solo redacta textos, y se marcan como generados.',
          },
          {
            q: '¿SEOAudit modifica mi sitio automáticamente?',
            a: 'No. Te entrega sugerencias y bloques listos para copiar; tú decides qué publicar y dónde.',
          },
          {
            q: '¿Puedo gestionar varios sitios o clientes?',
            a: 'Sí. Puedes crear varias organizaciones, cada una con sus sitios y sus miembros.',
          },
        ],
      },
      finalCta: {
        title: '¿Listo para auditar tu sitio?',
        subtitle: 'Crea tu cuenta y obtén tu primer análisis en minutos.',
      },
      footer: {
        tagline: 'Auditoría SEO y GEO para equipos de marketing y agencias.',
        product: 'Producto',
        account: 'Cuenta',
        tools: 'Herramientas',
        howItWorks: 'Cómo funciona',
        faq: 'Preguntas frecuentes',
      },
      languageAlert: {
        message: 'Esta página también está disponible en español.',
        action: 'Ver en español',
        close: 'Cerrar aviso',
      },
      languageSwitcher: {
        label: 'Idioma',
      },
    },
  },

  en: {
    // Common
    common: {
      cancel: 'Cancel',
      delete: 'Delete',
      save: 'Save',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      back: 'Back',
      close: 'Close',
      edit: 'Edit',
      view: 'View',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      url: 'URL',
      status: 'Status',
      created: 'Created',
      updated: 'Updated',
      organization: 'Organization',
      organizations: 'Organizations',
      sites: 'Sites',
      site: 'Site',
      pages: 'Pages',
      page: 'Page',
      settings: 'Settings',
      logout: 'Logout',
    },

    // Auth
    auth: {
      login: 'Sign In',
      register: 'Sign Up',
      signIn: 'Sign In',
      signUp: 'Create Account',
      email: 'Email',
      password: 'Password',
      name: 'Full Name',
      continueWithGoogle: 'Continue with Google',
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: 'Already have an account?',
      registerHere: 'Register here',
      loginHere: 'Sign in here',
      invalidCredentials: 'Invalid credentials',
      passwordMinLength: 'Password must be at least 6 characters',
      invalidEmail: 'Invalid email address',
      userAlreadyExists: 'This user already exists',
      registerSuccess: 'Registration successful',
      loginSuccess: 'Logged in successfully',
      loginTitle: 'Sign in',
      loginSubtitle: 'Access your organizations and audits.',
      registerTitle: 'Create account',
      registerSubtitle: 'Start auditing your site in minutes.',
      confirmPassword: 'Confirm password',
      optional: 'Optional',
      passwordHint: 'At least 6 characters',
      passwordsDoNotMatch: 'Passwords do not match',
      or: 'or',
      namePlaceholder: 'Jane Smith',
      emailPlaceholder: 'you@company.com',
      organizationPlaceholder: 'My company',
    },

    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      totalSites: 'Total Sites',
      role: 'Role',
      yourEmail: 'Your Email',
      yourSites: 'Your Sites',
      noSites: 'No sites yet. Start by crawling a website.',
      goCrawler: 'Go to crawler →',
      viewDetails: 'View details →',
      switchOrg: 'Switch Organization',
      createNewSite: 'Create New Site',
      crawlNewSite: 'Crawl New Site',
      owner: 'Owner',
      admin: 'Admin',
      member: 'Member',
    },

    // Crawler
    crawler: {
      title: 'Website Crawler',
      enterUrl: 'Enter website URL',
      startCrawl: 'Start Crawl',
      crawling: 'Crawling...',
      crawlSuccess: 'Crawl completed successfully',
      crawlError: 'Error during crawl',
      invalidUrl: 'Invalid URL',
      pages: 'Pages found',
      progress: 'Progress',
    },

    // Sites
    sites: {
      title: 'My Sites',
      url: 'URL',
      pages: 'Pages',
      status: 'Status',
      created: 'Created',
      actions: 'Actions',
      view: 'View →',
      delete: 'Delete',
      deleteConfirm: 'Are you sure you want to delete this site?',
      crawlStatus: {
        pending: 'Pending',
        inProgress: 'In Progress',
        completed: 'Completed',
        failed: 'Failed',
      },
    },

    // Delete Site Dialog
    deleteSiteDialog: {
      title: 'Delete Site',
      description: 'This action cannot be undone. Please be certain.',
      warning: '⚠️ All data will be lost. This cannot be reversed.',
      willDelete: 'This site will permanently delete',
      deleteButton: 'Delete Site',
      deleting: 'Deleting...',
      deletedSuccess: 'Site deleted successfully',
      deletedError: 'Failed to delete site',
    },

    // Delete Organization Dialog
    deleteOrgDialog: {
      title: 'Delete Organization',
      description: 'This action cannot be undone. Please be certain.',
      warning: '⚠️ All data will be lost. This cannot be reversed.',
      willDeleteAll: 'This will permanently delete and all associated sites and suggestions.',
      typeToConfirm: 'Type the organization name to confirm deletion:',
      deleteButton: 'Delete Organization',
      deleting: 'Deleting...',
      deletedSuccess: 'Organization deleted successfully',
      deletedError: 'Failed to delete organization',
    },

    // Generate All (bulk SEO generation)
    generateAll: {
      button: 'Generate All',
      dialogTitle: 'Generate All',
      dialogDescription:
        'SEO metadata will be generated for the {{count}} available pages on this site. This may take a few moments.',
      starting: 'Starting...',
      confirmButton: 'Generate All',
      error: 'Error generating metadata',
      missingJob: 'The generation job was not found. Try again from the Pages tab.',
      alreadyRunning: 'A generation is already running for this site. Showing its progress.',
      generating: 'Generating suggestions for all pages...',
      resultsTitle: 'Bulk Generation Results',
      fields: {
        title: 'Title',
        slug: 'Slug',
        description: 'Description',
        canonicalUrl: 'Canonical URL',
      },
      saveAll: 'Save Changes',
      saveSuccess: 'Changes saved successfully',
      saveError: 'Error saving changes',
      savePartialError: 'Could not save {{failed}} of {{total}} results',
      unsaved: 'Unsaved',
      exportAll: 'Export All',
    },

    // Organization Settings
    organizationSettings: {
      title: 'Organization Settings',
      name: 'Organization Name',
      members: 'Members',
      role: 'Role',
      owner: 'Owner',
      admin: 'Admin',
      member: 'Member',
      editName: 'Edit Name',
      createSuccess: 'Organization created successfully',
      updateSuccess: 'Organization updated',
      updateError: 'Failed to update organization',
      deleteOrganization: 'Delete Organization',
    },

    // User Settings
    userSettings: {
      title: 'User Settings',
      preferences: 'Preferences',
      theme: 'Theme',
      language: 'Language',
      notifications: 'Notifications',
      emailNotifications: 'Email Notifications',
      weeklyReport: 'Weekly Report',
      saveSettings: 'Save Settings',
      saved: 'Settings saved',
    },

    // Pages
    pages: {
      title: 'Pages',
      pageTitle: 'Title',
      url: 'URL',
      status: 'Status',
      headings: 'Headings',
      metaTags: 'Meta Tags',
      links: 'Links',
      images: 'Images',
      suggestions: 'Suggestions',
      viewDetails: 'View details',
    },

    // Validation
    validation: {
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      invalidUrl: 'Invalid URL',
      minLength: 'Minimum {{min}} characters',
      maxLength: 'Maximum {{max}} characters',
    },

    // Errors
    errors: {
      unauthorized: 'Unauthorized',
      forbidden: 'Access denied',
      notFound: 'Not found',
      serverError: 'Server error',
      tryAgain: 'Try again',
      goHome: 'Go home',
      sessionExpired: 'Your session has expired. Please sign in again.',
      unauthorizedContent: 'You do not have permission to view this content.',
    },

    // Headers
    header: {
      logout: 'Sign Out',
      login: 'Sign In',
      signup: 'Sign Up',
      dashboard: 'Dashboard',
    },

    // Site Details
    geo: {
      sections: { profile: 'Business profile', structuredData: 'Structured data', llmsTxt: 'llms.txt' },
      recrawl: 'This site was crawled before GEO checks existed. Crawl it again to capture JSON-LD, links and text.',
      needsProfile: 'Set up the business profile first.',
      copy: 'Copy',
      copied: 'Copied to clipboard',
      download: 'Download',
      save: 'Save profile',
      saved: 'Profile saved',
      loadError: 'Could not load GEO data',
      profile: {
        intro: 'The profile is the source of truth for JSON-LD and llms.txt. Nothing factual is invented: review and confirm suggested values.',
        suggest: 'Suggest profile from crawl',
        suggesting: 'Analyzing the site...',
        resuggest: 'Suggest again',
        draft: 'Suggested draft: review, confirm and save.',
        businessKind: 'Business type',
        kinds: { hotel: 'Independent hotel', 'hotel-chain': 'Hotel chain', 'local-business': 'Local business', organization: 'Organization' },
        defaultLanguage: 'Default language',
        languages: 'Site languages (comma separated)',
        entities: 'Entities',
        external: 'External',
        type: 'Type',
        scope: 'Scope (URL prefix)',
        parent: 'Parent organization',
        none: 'None',
        remove: 'Discard',
        addExternal: 'Add external entity',
        addProperty: 'Add property',
        facts: 'Facts',
        texts: 'Texts per language',
        confirm: 'Confirm',
        confirmAll: 'Confirm all',
        sources: { user: 'Confirmed', 'existing-jsonld': 'Site JSON-LD', extracted: 'Extracted: to confirm', generated: 'Generated: to confirm' },
        fields: {
          name: 'Name', url: 'URL', telephone: 'Phone', email: 'Email', streetAddress: 'Street address',
          addressLocality: 'City', addressRegion: 'State / region', postalCode: 'Postal code', addressCountry: 'Country (ISO)',
          latitude: 'Latitude', longitude: 'Longitude', logo: 'Logo (URL)', image: 'Image (URL)', sameAs: 'Social profiles (one per line)',
          openingHours: 'Opening hours', priceRange: 'Price range', checkinTime: 'Check-in', checkoutTime: 'Check-out',
          starRating: 'Stars', numberOfRooms: 'Number of rooms', petsAllowed: 'Pets allowed',
          description: 'Description', alternateName: 'Alternate names (comma separated)', amenities: 'Amenities (one per line)',
        },
      },
      structuredData: {
        summary: 'Per-page summary',
        statuses: { missing: 'No JSON-LD', invalid: 'Invalid', 'wrong-type': 'Wrong type', incomplete: 'Incomplete', inconsistent: 'Inconsistent', ok: 'OK' },
        noProfile: 'Without a profile only existence, validity and completeness are checked.',
        languageIds: 'Entities with a different @id per language: unify them.',
        recommended: 'Recommended',
        pages: 'Pages',
        missing: 'Missing',
        suggestions: 'Optional suggestions',
        blocks: 'Blocks to paste into your site',
        destinations: {
          global: 'Global: paste it in the site layout (every page)',
          entity: 'Per entity: paste it in the template for this property pages',
          page: 'Per page: this page declares its own variant',
        },
        conflicts: 'Conflicts',
        keep: 'Keep existing',
        useProfile: 'Use profile',
        apply: 'Apply decisions',
        applied: 'Blocks updated',
        added: 'added',
        kept: 'unchanged',
        conflict: 'conflict',
        preserved: 'preserved',
        newBlock: 'New block',
        completed: 'Completes the JSON-LD of',
      },
      llms: {
        statuses: { missing: 'Missing', invalid: 'Invalid', ok: 'OK', unknown: 'Unknown' },
        problems: 'Problems',
        warnings: 'Warnings',
        brokenLinks: 'Broken links',
        current: 'Current file',
        generate: 'Generate llms.txt',
        generating: 'Generating...',
        language: 'Language',
        preview: 'Preview',
        publish: 'Publish it at the domain root: https://your-domain/llms.txt',
      },
    },
    siteDetails: {
      backToDashboard: '← Back to Dashboard',
      totalPages: 'Total Pages',
      status: 'Status',
      pageTitle: 'Page Title',
      tabs: {
        serp: 'SERP Preview',
        pages: 'Pages',
        meta: 'Meta Tags',
        geo: 'GEO',
      },
      noPagesMessage: 'No pages crawled yet.',
      noMetaTagsMessage: 'No meta tags available. Run a crawl to see home page meta tags.',
      metaTagsFrom: 'Meta tags from home page',
    },

    // SERP Preview
    serpPreview: {
      title: 'SERP Preview',
      subtitle: 'See how your page appears in search results',
      desktop: 'Desktop (1200px)',
      mobile: 'Mobile (400px)',
      charCount: 'characters',
      optimal: 'Optimal',
      tooShort: 'Too short',
      tooLong: 'Too long',
      titleLabel: 'Title',
      descriptionLabel: 'Description',
      noDatabMessage: 'No SERP data available. Run a crawl first.',
    },

    // Landing
    home: {
      hero: {
        badge: 'AI-powered SEO and GEO audits',
        title: 'Make Google and AI understand your site',
        subtitle:
          'Crawl your site, find SEO issues, generate AI suggestions, and get your structured data and llms.txt ready for AI search engines.',
        ctaPrimaryGuest: 'Get started free',
        ctaSecondaryGuest: 'Sign in',
        ctaPrimaryUser: 'Go to crawler',
        ctaSecondaryUser: 'View dashboard',
      },
      stats: {
        tools: { value: '7', title: 'Tools', desc: 'From crawling to llms.txt' },
        languages: { value: '2', title: 'Languages', desc: 'Interface in Spanish and English' },
        steps: { value: '4', title: 'Steps', desc: 'From a URL to ready-to-ship changes' },
        formats: { value: 'JSON-LD', title: 'Standard formats', desc: 'Schema.org and llms.txt, no proprietary formats' },
      },
      howItWorks: {
        title: 'How it works',
        subtitle: 'From a URL to an optimized site in four steps.',
        steps: [
          { title: 'Crawl', desc: 'Enter your URL: we discover the sitemap and render every page, even JavaScript-built ones.' },
          { title: 'Analyze', desc: 'Review titles, descriptions, meta tags, and how each page looks on Google.' },
          { title: 'Optimize', desc: 'Generate AI suggestions page by page or for the whole site at once.' },
          { title: 'Ship', desc: 'Copy the texts, JSON-LD, and llms.txt ready to publish on your site.' },
        ],
      },
      tools: {
        title: 'Everything you need to rank your site',
        subtitle: 'Tools for classic SEO and for the new AI search engines.',
        items: {
          crawler: {
            name: 'Site crawler',
            desc: 'Discovers your pages from the sitemap and renders them like a browser so no JavaScript-loaded content is missed.',
          },
          serp: {
            name: 'SERP preview',
            desc: 'See how each page shows up on Google on desktop and mobile, with length warnings for title and description.',
          },
          meta: {
            name: 'Meta tag audit',
            desc: 'Find missing or duplicate titles, descriptions, and canonicals across your whole site.',
          },
          ai: {
            name: 'AI suggestions',
            desc: 'Get title, description, and keyword proposals for every page, ready for you to review.',
            badge: 'AI',
          },
          bulk: {
            name: 'Bulk generation',
            desc: 'Generate suggestions for every page on your site in a single run and track its progress.',
            badge: 'AI',
          },
          geo: {
            name: 'GEO: JSON-LD and llms.txt',
            desc: 'Define your business profile, review and complete your structured data, and generate your llms.txt for ChatGPT, Perplexity, and AI Overviews.',
            badge: 'GEO',
          },
          orgs: {
            name: 'Multi-organization',
            desc: 'Manage several clients or brands from one account, with members and roles per organization.',
          },
        },
      },
      useCases: {
        title: 'Use cases',
        subtitle: 'See SEOAudit solving real-world scenarios.',
        tabs: {
          seo: 'Classic SEO',
          geo: 'AI and GEO',
          agencies: 'Agencies',
        },
        seo: {
          title: 'Improve how you show up on Google',
          desc: 'A hotel finds out its homepage title is too short and never mentions the city. The SERP preview shows it instantly and AI suggests a better alternative.',
          points: [
            'Spot titles and descriptions out of range',
            'Compare desktop and mobile',
            'Accept or tweak the suggestion before publishing',
          ],
          before: 'Before',
          after: 'After',
        },
        geo: {
          title: 'Get ready for AI search engines',
          desc: 'Assistants like ChatGPT and Perplexity cite businesses that clearly describe who they are. SEOAudit completes your JSON-LD from your profile and generates an llms.txt with your key pages.',
          points: [
            'Checks whether your JSON-LD exists, is valid, and is complete',
            'Never makes up data: address and phone come from your site',
            'Generates llms.txt in the standard format',
          ],
          jsonLdLabel: 'JSON-LD',
          llmsLabel: 'llms.txt',
        },
        agencies: {
          title: 'One dashboard for all your clients',
          desc: 'An agency keeps each client in its own organization, invites their team, and reviews every site from one place.',
          points: [
            'Separate organizations per client',
            'Owner, admin, and member roles',
            'Spanish and English interface for each user',
          ],
          windowTitle: 'Organizations',
          sitesLabel: 'sites',
        },
      },
      faq: {
        title: 'Frequently asked questions',
        items: [
          {
            q: 'What do I need to get started?',
            a: 'Just create an account and enter your site URL. There is nothing to install on your server.',
          },
          {
            q: 'Does it work with JavaScript-built sites?',
            a: 'Yes. The crawler renders each page like a browser before analyzing it, so it sees the same content your visitors do.',
          },
          {
            q: 'What is GEO and why does it matter?',
            a: 'GEO (Generative Engine Optimization) means preparing your site so AI search engines understand and cite it. Structured data and llms.txt are two of its key pieces.',
          },
          {
            q: 'Does the AI make up data about my business?',
            a: 'No. Factual data such as your address or phone number comes from your site or is confirmed by you. AI only drafts copy, and it is marked as generated.',
          },
          {
            q: 'Does SEOAudit change my site automatically?',
            a: 'No. It gives you suggestions and ready-to-copy blocks; you decide what to publish and where.',
          },
          {
            q: 'Can I manage several sites or clients?',
            a: 'Yes. You can create several organizations, each with its own sites and members.',
          },
        ],
      },
      finalCta: {
        title: 'Ready to audit your site?',
        subtitle: 'Create your account and get your first analysis in minutes.',
      },
      footer: {
        tagline: 'SEO and GEO audits for marketing teams and agencies.',
        product: 'Product',
        account: 'Account',
        tools: 'Tools',
        howItWorks: 'How it works',
        faq: 'FAQ',
      },
      languageAlert: {
        message: 'This page is also available in English.',
        action: 'View in English',
        close: 'Dismiss notice',
      },
      languageSwitcher: {
        label: 'Language',
      },
    },
  },
} as const;

export type Language = 'es' | 'en';

export const getTranslations = (lang: Language = 'es') => {
  return translations[lang];
};

export const t = (lang: Language, path: string, defaultValue = '') => {
  const keys = path.split('.');
  let value: unknown = translations[lang];

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return defaultValue;
    }
  }

  return typeof value === 'string' ? value : defaultValue;
};
