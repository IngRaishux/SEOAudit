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
    siteDetails: {
      backToDashboard: '← Volver al Dashboard',
      totalPages: 'Total de páginas',
      status: 'Estado',
      pageTitle: 'Título de página',
      tabs: {
        serp: 'Vista previa SERP',
        pages: 'Páginas',
        meta: 'Etiquetas meta',
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
      userAlreadyExists: 'User already exists',
      registerSuccess: 'Registration successful',
      loginSuccess: 'Logged in successfully',
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
    siteDetails: {
      backToDashboard: '← Back to Dashboard',
      totalPages: 'Total Pages',
      status: 'Status',
      pageTitle: 'Page Title',
      tabs: {
        serp: 'SERP Preview',
        pages: 'Pages',
        meta: 'Meta Tags',
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
  },
} as const;

export type Language = 'es' | 'en';

export const getTranslations = (lang: Language = 'es') => {
  return translations[lang];
};

export const t = (lang: Language, path: string, defaultValue = '') => {
  const keys = path.split('.');
  let value: any = translations[lang];

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return typeof value === 'string' ? value : defaultValue;
};
