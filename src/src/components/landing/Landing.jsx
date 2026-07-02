import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import Hero from './Hero';
import ProcessSection from './ProcessSection';
import InstallerSection from './InstallerSection';
import PricingSection from './PricingSection';

const Footer = () => (
  <footer className="py-12 bg-gray-950 border-t border-white/5">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electric-blue to-lime flex items-center justify-center">
              <span className="text-white font-bold text-lg font-display">P</span>
            </div>
            <span className="text-xl font-bold text-white font-display">PagoMatch</span>
          </div>
          <p className="text-gray-400 text-sm max-w-sm font-body">
            Sistema de conciliación bancaria que detecta pagos automáticamente desde las notificaciones de tu celular.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-semibold mb-4 font-display">Producto</h4>
          <ul className="space-y-2">
            {['Características', 'Precios', 'Documentación', 'API'].map((link) => (
              <li key={link}>
                <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors font-body">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4 font-display">Soporte</h4>
          <ul className="space-y-2">
            {['Centro de Ayuda', 'Contacto', 'Estado del Sistema', 'Changelog'].map((link) => (
              <li key={link}>
                <a href="#" className="text-gray-400 text-sm hover:text-white transition-colors font-body">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-gray-500 text-sm font-body">
          © 2026 PagoMatch. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors font-body">
            Términos
          </a>
          <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors font-body">
            Privacidad
          </a>
        </div>
      </div>
    </div>
  </footer>
);

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-electric-blue to-lime flex items-center justify-center">
            <span className="text-white font-bold text-sm font-display">P</span>
          </div>
          <span className="text-lg font-bold text-white font-display">PagoMatch</span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#process" className="text-sm text-gray-400 hover:text-white transition-colors font-body">
            Cómo Funciona
          </a>
          <a href="#installer" className="text-sm text-gray-400 hover:text-white transition-colors font-body">
            Instalador
          </a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors font-body">
            Precios
          </a>
        </div>

        {/* CTA */}
        <a
          href="#installer"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-electric-blue to-lime text-white text-sm font-semibold hover:shadow-lg hover:shadow-electric-blue/25 transition-all duration-300"
        >
          Empezar
        </a>
      </div>
    </div>
  </nav>
);

export default function Landing() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <main>
        <Hero />
        <ProcessSection />
        <InstallerSection />
        <PricingSection />
      </main>

      <Footer />

      {/* Scroll to top */}
      <motion.button
        onClick={scrollToTop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed bottom-8 right-8 p-3 rounded-full bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
