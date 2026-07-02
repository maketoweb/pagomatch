import { useState } from 'react'
import {
  Book,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  Shield,
  Smartphone,
  Globe,
  Terminal,
  FileText,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Key,
  Database,
  Code as CodeIcon,
} from 'lucide-react'

const sections = [
  {
    id: 'getting-started',
    title: 'Primeros Pasos',
    icon: Book,
    content: [
      {
        title: '¿Qué es Pago-M?',
        content: 'Pago-M es un sistema de conciliación bancaria SaaS que permite a las tiendas y comercios reconciliar automáticamente sus transacciones con los extractos bancarios. El sistema detecta pagos, los clasifica y genera reportes en tiempo real.',
      },
      {
        title: 'Requisitos del Sistema',
        content: '• Navegador web moderno (Chrome, Firefox, Safari, Edge)\n• Conexión a internet estable\n• Credenciales de acceso proporcionadas por el administrador\n• Para móvil: Android 8+ o iOS 14+',
      },
      {
        title: 'Primer Acceso',
        content: '1. Navega a la URL del panel de administración\n2. Ingresa tu correo electrónico y contraseña\n3. El sistema verificará tus credenciales y tu rol\n4. Serás redirigido al dashboard según tu rol',
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard Principal',
    icon: BarChart3,
    content: [
      {
        title: 'KPIs Principales',
        content: 'El dashboard muestra 4 indicadores clave:\n• Total Tiendas: Número total de tenants registrados\n• Tiendas Activas: Tenants con suscripción activa\n• Transacciones: Total de transacciones procesadas\n• Pendientes: Transacciones esperando aprobación',
      },
      {
        title: 'Gráfico de Transacciones',
        content: 'El gráfico de área muestra la tendencia de transacciones en los últimos 7 días. La línea azul representa el total de transacciones y la verde las aprobadas. Pasa el cursor sobre los puntos para ver detalles.',
      },
      {
        title: 'Filtros y Búsqueda',
        content: 'Usa la barra de búsqueda para filtrar por nombre, plan o cualquier campo. Los filtros de estado te permiten ver solo tenants activos o inactivos.',
      },
    ],
  },
  {
    id: 'tenants',
    title: 'Gestión de Tenants',
    icon: Users,
    content: [
      {
        title: '¿Qué es un Tenant?',
        content: 'Un tenant es una tienda o comercio registrado en el sistema. Cada tenant tiene su propia configuración, usuarios, transacciones y suscripción.',
      },
      {
        title: 'Crear Tenant',
        content: '1. Ve a la sección "Tenants"\n2. Haz clic en "Nuevo Tenant"\n3. Completa la información requerida (nombre, email, teléfono)\n4. Selecciona el plan de suscripción\n5. El sistema generará automáticamente una API Key',
      },
      {
        title: 'Gestionar Tenant',
        content: '• Ver Detalles: Haz clic en el ícono de detalles para ver información completa\n• Activar/Desactivar: Usa el botón de estado para pausar o reactivar\n• Editar: Modifica la información del tenant desde el panel de edición\n• Ver Cajeros: Consulta la cantidad y estado de cajeros del tenant',
      },
      {
        title: 'API Key',
        content: 'Cada tenant tiene una API Key única que se usa para autenticar las peticiones a la API. Compártela de forma segura con el tenant. Si se compromete, puedes regenerarla desde el panel.',
      },
    ],
  },
  {
    id: 'users',
    title: 'Gestión de Usuarios',
    icon: Users,
    content: [
      {
        title: 'Roles del Sistema',
        content: '• Master: Control total del sistema. Puede gestionar todos los tenants, usuarios y configuraciones.\n• Admin: Administrador del tenant. Puede gestionar usuarios y cajeros de su tenant.\n• Cajero: Usuario que procesa transacciones. Tiene acceso limitado.',
      },
      {
        title: 'Crear Usuario',
        content: '1. Ve a "Gestión de Usuarios"\n2. Haz clic en "Nuevo Usuario"\n3. Ingresa el email, nombre y teléfono\n4. Selecciona el rol (Admin o Cajero)\n5. Activa o desactiva el usuario según sea necesario\n6. Guarda los cambios',
      },
      {
        title: 'Pausar/Activar Usuario',
        content: 'Haz clic en el ícono de pausa/play junto al usuario. Un usuario pausado no puede iniciar sesión pero conserva sus datos.',
      },
      {
        title: 'Eliminar Usuario',
        content: 'Haz clic en el ícono de eliminar. Se te pedirá confirmación. Esta acción es irreversible.',
      },
    ],
  },
  {
    id: 'subscriptions',
    title: 'Suscripciones y Planes',
    icon: CreditCard,
    content: [
      {
        title: 'Planes Disponibles',
        content: '• Básico: $29.99/mes - 3 usuarios, 5 cajeros, 500 transacciones\n• Profesional: $79.99/mes - 10 usuarios, 25 cajeros, 2000 transacciones\n• Empresarial: $199.99/mes - 50 usuarios, 100 cajeros, 10000 transacciones\n• Enterprise: $499.99/mes - 200 usuarios, 500 cajeros, 50000 transacciones',
      },
      {
        title: 'Crear Plan Personalizado',
        content: '1. Haz clic en "Nuevo Plan"\n2. Define el nombre y descripción\n3. Establece el precio y ciclo de facturación\n4. Configura los límites (usuarios, cajeros, transacciones)\n5. Guarda el plan',
      },
      {
        title: 'Gestionar Suscripciones',
        content: '• Crear: Asocia un tenant a un plan\n• Pausar: Detiene temporalmente el acceso\n• Reactivar: Restaura el acceso del tenant\n• Cancelar: Termina la suscripción permanentemente',
      },
      {
        title: 'Alertas de Vencimiento',
        content: 'El sistema envía alertas automáticas:\n• 5 días antes del vencimiento: Alerta naranja\n• Día del vencimiento: Alerta roja\n• Después del vencimiento: Tenant pausado automáticamente',
      },
    ],
  },
  {
    id: 'messages',
    title: 'Mensajes y Recordatorios',
    icon: MessageSquare,
    content: [
      {
        title: 'Tipos de Mensajes',
        content: '• Recordatorio: Para fechas de pago o eventos programados\n• Alerta: Para situaciones que requieren atención inmediata\n• Notificación: Informativos generales\n• Sistema: Generados automáticamente por el sistema',
      },
      {
        title: 'Crear Mensaje',
        content: '1. Haz clic en "Nuevo Mensaje"\n2. Selecciona el tenant (o deja vacío para todos)\n3. Elige el tipo y prioridad\n4. Escribe el título y contenido\n5. Programa una fecha de envío (opcional)\n6. Envía o guarda como borrador',
      },
      {
        title: 'Programar Envíos',
        content: 'Puedes programar mensajes paraenviarse automáticamente en una fecha y hora específica. El sistema los enviará cuando toque el momento.',
      },
    ],
  },
  {
    id: 'api',
    title: 'APIs e Integración',
    icon: CodeIcon,
    content: [
      {
        title: 'Tipos de API',
        content: '• REST API: Acceso directo a los datos vía HTTP\n• SDK JavaScript: Para aplicaciones web y Node.js\n• SDK Python: Para scripts y backends en Python\n• SDK PHP: Para aplicaciones PHP\n• React Native: Para apps móviles multiplataforma',
      },
      {
        title: 'Autenticación',
        content: 'Todas las peticiones requieren:\n• API Key: En el header "apikey"\n• Token de autorización: En el header "Authorization: Bearer TOKEN"\n• Content-Type: "application/json"',
      },
      {
        title: 'Endpoints Principales',
        content: '• GET /transactions - Listar transacciones\n• POST /transactions - Crear transacción\n• GET /tenants - Información del tenant\n• GET /users - Usuarios del tenant\n• GET /subscriptions - Estado de suscripción',
      },
      {
        title: 'Códigos de Error',
        content: '• 200: Éxito\n• 201: Creado exitosamente\n• 400: Solicitud inválida\n• 401: No autorizado\n• 403: Prohibido\n• 404: No encontrado\n• 406: Not Acceptable (resultado vacío)\n• 500: Error del servidor',
      },
    ],
  },
  {
    id: 'security',
    title: 'Seguridad',
    icon: Shield,
    content: [
      {
        title: 'Autenticación',
        content: 'El sistema usa Supabase Auth con:\n• Correo electrónico y contraseña\n• Tokens JWT con expiración\n• Refresh tokens automáticos\n• Sesiones seguras',
      },
      {
        title: 'Row Level Security (RLS)',
        content: 'Todas las tablas tienen RLS activado. Los usuarios solo pueden ver y modificar datos según su rol:\n• Master: Acceso completo a todo\n• Admin: Acceso a su tenant\n• Cajero: Solo lectura de transacciones',
      },
      {
        title: 'API Keys',
        content: 'Cada tenant tiene una API Key única. Nunca la compartas en código fuente o repositorios públicos. Usa variables de entorno.',
      },
      {
        title: 'Buenas Prácticas',
        content: '• Usa contraseñas fuertes\n• Activa la autenticación de dos factores cuando esté disponible\n• Revisa los logs de acceso regularmente\n• Reporta cualquier actividad sospechosa',
      },
    ],
  },
  {
    id: 'faq',
    title: 'Preguntas Frecuentes',
    icon: HelpCircle,
    content: [
      {
        title: '¿Olvidé mi contraseña?',
        content: 'Contacta a tu administrador para que restablezca tu contraseña desde el panel de gestión de usuarios.',
      },
      {
        title: '¿Cómo cambio mi plan?',
        content: 'El administrador master puede cambiar tu plan desde la sección de Suscripciones. Se actualizarán los límites inmediatamente.',
      },
      {
        title: '¿Por qué no puedo acceder?',
        content: 'Posibles causas:\n• Tu cuenta está pausada o desactivada\n• Tu suscripción ha vencido\n• Credenciales incorrectas\n• Problemas de conexión a internet',
      },
      {
        title: '¿Cómo registro una transacción?',
        content: 'Usa la API REST o el SDK para crear una transacción. Necesitas tu Tenant ID y API Key.',
      },
      {
        title: '¿Qué hago si detecto un error?',
        content: '1. Revisa los logs del sistema\n2. Verifica tu conexión a internet\n3. Contacta al soporte técnico\n4. Incluye capturas de pantalla y descripción del error',
      },
    ],
  },
]

export default function Instructions() {
  const [expandedSection, setExpandedSection] = useState(null)
  const [expandedItem, setExpandedItem] = useState(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Instructivo del Sistema</h1>
        <p className="text-slate-500 mt-1">Guía completa de uso del sistema Pago-M</p>
      </div>

      {/* Quick Navigation */}
      <div className="bento-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Navegación Rápida</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => {
                setExpandedSection(expandedSection === section.id ? null : section.id)
                setExpandedItem(null)
              }}
              className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium transition-colors ${
                expandedSection === section.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <section.icon className="h-4 w-4" />
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.id} className="bento-card overflow-hidden">
            <button
              onClick={() => {
                setExpandedSection(expandedSection === section.id ? null : section.id)
                setExpandedItem(null)
              }}
              className="w-full flex items-center justify-between p-0"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <section.icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
              </div>
              {expandedSection === section.id ? (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-500" />
              )}
            </button>

            {expandedSection === section.id && (
              <div className="mt-4 space-y-2">
                {section.content.map((item, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedItem(expandedItem === `${section.id}-${i}` ? null : `${section.id}-${i}`)}
                      className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <span className="font-medium text-slate-900 text-left">{item.title}</span>
                      {expandedItem === `${section.id}-${i}` ? (
                        <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />
                      )}
                    </button>
                    {expandedItem === `${section.id}-${i}` && (
                      <div className="p-4 border-t border-slate-200">
                        <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {item.content}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact Support */}
      <div className="bento-card bg-primary-50 border border-primary-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">¿Necesitas ayuda?</h3>
            <p className="text-sm text-slate-600 mt-1">
              Si tienes preguntas adicionales o necesitas soporte técnico, contacta a nuestro equipo de soporte.
            </p>
            <p className="text-sm text-primary-600 mt-2">
              Email: soporte@pago-m.com | Teléfono: +1 (800) 123-4567
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
