import { supabase } from '../../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle2, Loader2, Phone, CreditCard, Building2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

export default function PaymentModal({ isOpen, onClose, plan }) {
  const [formData, setFormData] = useState({
    amount: '',
    reference: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const paymentInfo = {
    phone: '04143420573',
    ci: '15190703',
    bank: 'Banco Mercantil',
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('transactions').insert({
        amount: parseFloat(formData.amount),
        reference: formData.reference,
        phone: formData.phone || paymentInfo.phone,
        bank: paymentInfo.bank,
        status: 'pending',
        plan_id: plan?.id,
      });

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFormData({ amount: '', reference: '', phone: '' });
      }, 3000);
    } catch (error) {
      console.error('Error al registrar transacción:', error);
      alert('Error al procesar. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!plan) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-gray-900/80 backdrop-blur-xl border border-white/10 shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div className="p-8">
              {isSuccess ? (
                /* Estado de éxito */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lime/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-lime" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 font-display">
                    ¡Pago Registrado!
                  </h3>
                  <p className="text-gray-400 font-body">
                    Tu transacción está siendo verificada. Recibirás una confirmación en minutos.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Header del plan */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2 font-display">
                      Contratar {plan.name}
                    </h3>
                    <p className="text-gray-400 font-body">
                      Realiza el pago por <span className="text-white font-semibold">${plan.price} USD</span> y envía tu comprobante.
                    </p>
                  </div>

                  {/* Datos de pago */}
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-electric-blue/10 to-lime/10 border border-white/10">
                    <h4 className="text-sm font-semibold text-white mb-3 font-display">
                      Datos para el Pago
                    </h4>
                    <div className="space-y-3">
                      {/* Teléfono */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-electric-blue" />
                          <span className="text-gray-400 text-sm">Teléfono:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm">{paymentInfo.phone}</span>
                          <button
                            onClick={() => handleCopy(paymentInfo.phone, 'phone')}
                            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            {copiedField === 'phone' ? (
                              <CheckCircle2 className="w-4 h-4 text-lime" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Cédula */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-lime" />
                          <span className="text-gray-400 text-sm">C.I:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-sm">{paymentInfo.ci}</span>
                          <button
                            onClick={() => handleCopy(paymentInfo.ci, 'ci')}
                            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                          >
                            {copiedField === 'ci' ? (
                              <CheckCircle2 className="w-4 h-4 text-lime" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Banco */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-violet-500" />
                          <span className="text-gray-400 text-sm">Banco:</span>
                        </div>
                        <span className="text-white font-mono text-sm">{paymentInfo.bank}</span>
                      </div>
                    </div>
                  </div>

                  {/* Formulario */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 font-body">
                        Monto Pagado (USD)
                      </label>
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder={plan.price.toString()}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue/50 focus:ring-2 focus:ring-electric-blue/20 transition-all font-body"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 font-body">
                        Referencia del Pago
                      </label>
                      <input
                        type="text"
                        name="reference"
                        value={formData.reference}
                        onChange={handleChange}
                        placeholder="Ej: 123456789"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue/50 focus:ring-2 focus:ring-electric-blue/20 transition-all font-body"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2 font-body">
                        Tu Teléfono (opcional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder={paymentInfo.phone}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-electric-blue/50 focus:ring-2 focus:ring-electric-blue/20 transition-all font-body"
                      />
                    </div>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full py-4 rounded-2xl bg-gradient-to-r from-electric-blue to-lime text-white font-semibold shadow-lg shadow-electric-blue/25 hover:shadow-electric-blue/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <span>Enviar Comprobante</span>
                      )}
                    </motion.button>
                  </form>

                  <p className="text-xs text-gray-500 text-center mt-4 font-body">
                    Tu pago será verificado automáticamente por nuestro sistema.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
