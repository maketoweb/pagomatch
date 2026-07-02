import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Building2 } from 'lucide-react';
import PaymentModal from './PaymentModal';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfecto para empezar',
    price: 29,
    period: '/mes',
    icon: Zap,
    color: 'from-electric-blue to-cyan-400',
    borderColor: 'border-electric-blue/20',
    features: [
      '1 dispositivo Android',
      'Hasta 500 transacciones/mes',
      'Soporte por email',
      'Dashboard básico',
      'Conciliación automática',
    ],
    cta: 'Empezar Ahora',
    popular: false,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Para negocios en crecimiento',
    price: 79,
    period: '/mes',
    icon: Crown,
    color: 'from-lime to-emerald-400',
    borderColor: 'border-lime/20',
    features: [
      '5 dispositivos Android',
      'Transacciones ilimitadas',
      'Soporte prioritario 24/7',
      'Dashboard avanzado + reportes',
      'API de integración',
      'Multi-cajero',
    ],
    cta: 'Elegir Business',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes operaciones',
    price: 199,
    period: '/mes',
    icon: Building2,
    color: 'from-violet-500 to-purple-400',
    borderColor: 'border-violet-500/20',
    features: [
      'Dispositivos ilimitados',
      'Transacciones ilimitadas',
      'Soporte dedicado',
      'SLA garantizado 99.9%',
      'Integración personalizada',
      'On-premise disponible',
      'Auditoría completa',
    ],
    cta: 'Contactar Ventas',
    popular: false,
  },
];

export default function PricingSection() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <>
      <section id="pricing" className="py-24 bg-gray-950 relative overflow-hidden">
        {/* Fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-lime/5 via-transparent to-transparent" />

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
              Planes Flexibles
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 font-display">
              Elige tu{' '}
              <span className="bg-gradient-to-r from-lime to-electric-blue bg-clip-text text-transparent">
                plan perfecto
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto font-body">
              Sin contratos a largo plazo. Cancela cuando quieras. Soporte incluido en todos los planes.
            </p>
          </motion.div>

          {/* Cards de precios */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative rounded-3xl bg-white/5 border ${
                  plan.popular
                    ? 'border-lime/40 shadow-lg shadow-lime/10'
                    : plan.borderColor
                } p-8 hover:scale-[1.02] transition-all duration-300`}
              >
                {/* Badge popular */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-lime to-emerald-400 text-gray-900 text-xs font-bold uppercase tracking-wider">
                      Más Popular
                    </span>
                  </div>
                )}

                {/* Icono */}
                <div
                  className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} mb-6`}
                >
                  <plan.icon className="w-6 h-6 text-white" />
                </div>

                {/* Nombre y precio */}
                <h3 className="text-xl font-bold text-white mb-2 font-display">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4 font-body">{plan.description}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white font-display">${plan.price}</span>
                  <span className="text-gray-400 text-sm">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                      <Check className="w-5 h-5 text-lime shrink-0 mt-0.5" />
                      <span className="font-body">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-lime to-emerald-400 text-gray-900 shadow-lg shadow-lime/25'
                      : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>

          {/* Nota */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center text-gray-500 text-sm mt-12 font-body"
          >
            Todos los precios en USD. Impuestos no incluidos. Soporte técnico incluido.
          </motion.p>
        </div>
      </section>

      {/* Modal de pago */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        plan={selectedPlan}
      />
    </>
  );
}
