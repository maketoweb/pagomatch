import { motion } from 'framer-motion';
import { Scan, Link2, CheckCircle2, ArrowRight } from 'lucide-react';

const processes = [
  {
    id: 'capture',
    icon: Scan,
    title: 'Captura Inteligente',
    subtitle: 'Motor RegEx Avanzado',
    description:
      'Nuestro motor de expresiones regulares analiza cada notificación SMS en tiempo real, extrayendo automáticamente monto, referencia y banco sin intervención manual.',
    details: [
      'Patrones personalizados por banco',
      'Detección multi-banco simultánea',
      'Filtrado inteligente de spam',
      'Procesamiento en <100ms',
    ],
    color: 'from-electric-blue to-cyan-400',
    bgColor: 'bg-electric-blue/10',
    borderColor: 'border-electric-blue/20',
    code: '// Ejemplo de patrón RegEx\nconst pattern = /Pago de Bs\\. ([\\d,.]+).*Ref\\. (\\d+)/i;',
  },
  {
    id: 'sync',
    icon: Link2,
    title: 'Sincronización API',
    subtitle: 'Validación en Tiempo Real',
    description:
      'Cada captura se envía instantáneamente a nuestra API de validación, que verifica la integridad del pago y lo asocia al tenant correspondiente.',
    details: [
      'WebSocket para updates en vivo',
      'Duplicados detectados y bloqueados',
      'Enrutamiento automático por Device ID',
      'Logs de auditoría completos',
    ],
    color: 'from-lime to-emerald-400',
    bgColor: 'bg-lime/10',
    borderColor: 'border-lime/20',
    code: '// Payload enviado a la API\n{ amount: 150.00, ref: "123456789", bank: "Mercantil" }',
  },
  {
    id: 'match',
    icon: CheckCircle2,
    title: 'Match Automático',
    subtitle: 'Conciliación Instantánea',
    description:
      'El sistema compara automáticamente la referencia de la transacción capturada con los pagos registrados por el cajero, marcando el estado como aprobado en tiempo real.',
    details: [
      'Comparación por referencia única',
      'Estado en tiempo real vía Realtime',
      'Notificación al cajero al confirmar',
      'Historial de conciliaciones',
    ],
    color: 'from-violet-500 to-purple-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    code: '// Match result\n{ status: "approved", confidence: 99.8, timestamp: "2026-07-02T10:30:00Z" }',
  },
];

export default function ProcessSection() {
  return (
    <section id="process" className="py-24 bg-gray-950 relative overflow-hidden">
      {/* Fondo sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-electric-blue/5 via-transparent to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-lime/10 border border-lime/20 text-lime text-sm font-medium mb-4">
            Transparencia Total
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-display">
            Cómo{' '}
            <span className="bg-gradient-to-r from-electric-blue to-lime bg-clip-text text-transparent">
              trabajamos
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-body">
            Cada paso es visible y auditable. Sabemos que la confianza se gana con transparencia.
          </p>
        </motion.div>

        {/* Procesos - Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {processes.map((process, index) => (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative group rounded-3xl ${process.bgColor} border ${process.borderColor} p-8 hover:scale-[1.02] transition-all duration-300`}
            >
              {/* Número de paso */}
              <div className="absolute top-6 right-6 text-6xl font-bold text-white/5 font-display">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Icono */}
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${process.color} mb-6`}
              >
                <process.icon className="w-7 h-7 text-white" />
              </div>

              {/* Contenido */}
              <h3 className="text-xl font-bold text-white mb-2 font-display">
                {process.title}
              </h3>
              <p className="text-sm font-medium text-electric-blue mb-3">
                {process.subtitle}
              </p>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed font-body">
                {process.description}
              </p>

              {/* Lista de detalles */}
              <ul className="space-y-3 mb-6">
                {process.details.map((detail, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-lime shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              {/* Código */}
              <div className="rounded-xl bg-gray-900/50 border border-white/5 p-4">
                <code className="text-xs text-gray-400 font-mono leading-relaxed block">
                  {process.code}
                </code>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Conexión entre procesos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-4 py-8"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-electric-blue/30 to-transparent" />
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Scan className="w-4 h-4 text-electric-blue" />
            <ArrowRight className="w-4 h-4 text-gray-500" />
            <Link2 className="w-4 h-4 text-lime" />
            <ArrowRight className="w-4 h-4 text-gray-500" />
            <CheckCircle2 className="w-4 h-4 text-violet-500" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-lime/30 to-transparent" />
        </motion.div>

        {/* Nota de confianza */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-electric-blue/10 to-lime/10 border border-white/10">
            <CheckCircle2 className="w-5 h-5 text-lime" />
            <span className="text-sm text-gray-300 font-body">
              <span className="font-semibold text-white">99.8% de precisión</span> en conciliaciones automáticas
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
