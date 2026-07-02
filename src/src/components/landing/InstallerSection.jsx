import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Smartphone,
  MessageSquare,
  Bell,
  Wifi,
  CheckCircle2,
  ArrowRight,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Settings,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Descarga la APK',
    description: 'Haz clic en el botón de descarga. El archivo se guardará automáticamente en tu dispositivo Android.',
    icon: Download,
    color: 'from-electric-blue to-cyan-400',
  },
  {
    number: '02',
    title: 'Instalación Segura',
    description: 'Android preguntará si permitir instalación desde fuentes desconocidas. Activa esta opción en ajustes.',
    icon: Smartphone,
    color: 'from-lime to-emerald-400',
    details: [
      'Ve a Ajustes de tu celular',
      'Busca "Fuentes desconocidas" o "Instalar apps desconocidas"',
      'Activa la opción para tu navegador o explorador de archivos',
      'Toca "Instalar" en el APK descargado',
    ],
  },
  {
    number: '03',
    title: 'Permiso de SMS',
    description: 'Selecciona "Permitir siempre" cuando la app solicite acceso a tus mensajes de texto.',
    icon: MessageSquare,
    color: 'from-violet-500 to-purple-400',
    details: [
      'Al abrir la app, aparecerá un popup de permisos',
      'Selecciona "Permitir siempre" (NO solo "Durante la uso")',
      'Este permiso es OBLIGATORIO para detectar pagos bancarios',
      'Sin este permiso, la app no puede leer notificaciones de pago',
    ],
    warning: 'Sin este permiso, el sistema no funcionará. Los SMS son la fuente principal de detección de pagos.',
  },
  {
    number: '04',
    title: 'Permiso de Notificaciones',
    description: 'Activa el acceso a notificaciones del sistema para capturar alertas de apps bancarias.',
    icon: Bell,
    color: 'from-orange-500 to-amber-400',
    details: [
      'La app mostrará un banner naranja si el permiso está pendiente',
      'Toca "Dar Acceso en Ajustes"',
      'Android te redirigirá a "Acceso a notificaciones"',
      'Busca "Puente" en la lista y activa el interruptor',
      'Acepta la advertencia de seguridad',
    ],
    warning: 'Este permiso permite leer notificaciones push de apps como Banesco, Mercantil, BDV, etc.',
  },
  {
    number: '05',
    title: 'Vincula tu Cuenta',
    description: 'Ingresa el código de 6 dígitos que te proporciona tu administrador para conectar la app.',
    icon: Wifi,
    color: 'from-pink-500 to-rose-400',
    details: [
      'Ve al Panel Admin de tu tienda',
      'Navega a "Dispositivos" o "Vinculación"',
      'Genera un código nuevo (dura 10 minutos)',
      'Ingresa el código en la app Puente',
      'Toca "Vincular Ahora"',
    ],
  },
];

function StepCard({ step, index }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = step.details && step.details.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
    >
      <div
        className={`p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-electric-blue/30 hover:bg-white/[0.07] transition-all duration-300 ${
          hasDetails ? 'cursor-pointer' : ''
        }`}
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Número de paso */}
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center`}
          >
            <span className="text-white font-bold text-sm font-display">{step.number}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <step.icon className="w-5 h-5 text-electric-blue" />
                <h3 className="text-lg font-bold text-white font-display">{step.title}</h3>
              </div>
              {hasDetails && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </motion.div>
              )}
            </div>
            <p className="text-gray-400 text-sm leading-relaxed font-body mt-2">{step.description}</p>

            {/* Warning */}
            {step.warning && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-orange-400 text-xs font-body">{step.warning}</p>
              </div>
            )}
          </div>
        </div>

        {/* Details expandable */}
        <AnimatePresence>
          {isExpanded && hasDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 ml-16 space-y-2">
                {step.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-lime shrink-0 mt-0.5" />
                    <span className="text-gray-300 text-sm font-body">{detail}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Indicador de progreso */}
      {index < steps.length - 1 && (
        <div className="absolute -bottom-4 left-10 w-px h-4 bg-gradient-to-b from-electric-blue/50 to-transparent" />
      )}
    </motion.div>
  );
}

export default function InstallerSection() {
  return (
    <section id="installer" className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-electric-blue/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-electric-blue/10 border border-electric-blue/20 text-electric-blue text-sm font-medium mb-4">
            Descarga Directa
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-display">
            Instalación en{' '}
            <span className="bg-gradient-to-r from-electric-blue to-lime bg-clip-text text-transparent">
              5 minutos
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-body">
            Descarga la APK directamente desde esta página. Sin Android Studio, sin complicaciones.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Contenido izquierdo - Descarga */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:sticky lg:top-24"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-sm font-medium mb-4">
              El Puente
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 font-display">
              Tu celular es el{' '}
              <span className="bg-gradient-to-r from-electric-blue to-lime bg-clip-text text-transparent">
                puente perfecto
              </span>
            </h3>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed font-body">
              Nuestra app Android funciona como un puente entre tus notificaciones de pago y
              nuestro sistema de conciliación. Sin intervención manual, sin demoras.
            </p>

            {/* Beneficios */}
            <div className="space-y-4 mb-8">
              {[
                'Funciona en segundo plano',
                'Compatible con todos los bancos venezolanos',
                'Sin costo adicional por transacción',
                'Actualizaciones automáticas',
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-lime shrink-0" />
                  <span className="text-gray-300 font-body">{benefit}</span>
                </motion.div>
              ))}
            </div>

            {/* Botón de descarga */}
            <motion.a
              href="/puente.apk"
              download
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-electric-blue to-lime text-white font-semibold rounded-2xl shadow-lg shadow-electric-blue/25 hover:shadow-electric-blue/40 transition-all duration-300"
            >
              <Download className="w-5 h-5" />
              <span>Descargar APK v2.0</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.a>

            <p className="text-xs text-gray-500 mt-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Archivo verificado. Sin malware. Tamaño: ~5MB
            </p>

            {/* Requisitos */}
            <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="text-white font-semibold text-sm mb-2 font-display flex items-center gap-2">
                <Settings className="w-4 h-4 text-electric-blue" />
                Requisitos del Sistema
              </h4>
              <ul className="space-y-1 text-xs text-gray-400 font-body">
                <li>• Android 8.0 (Oreo) o superior</li>
                <li>• Conexión a Internet (WiFi o datos móviles)</li>
                <li>• Línea telefónica para recibir SMS bancarios</li>
              </ul>
            </div>
          </motion.div>

          {/* Pasos - Bento Grid */}
          <div className="grid gap-6">
            {steps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}

            {/* Card de seguridad */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="p-6 rounded-3xl bg-gradient-to-r from-lime/10 to-electric-blue/10 border border-lime/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-lime/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-lime" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm font-display">100% Seguro</p>
                  <p className="text-gray-400 text-xs font-body">
                    La app solo lee notificaciones de pago. No accede a tus datos personales ni contactos.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
