import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import TransactionListener from './TransactionListener'
import {
  CreditCard,
  History,
  LogOut,
  Home,
  Download,
} from 'lucide-react'

const tabs = [
  {
    name: 'Registrar',
    href: '/dashboard/cashier',
    icon: CreditCard,
  },
  {
    name: 'Historial',
    href: '/dashboard/cashier/history',
    icon: History,
  },
]

export default function Layout() {
  const [toast, setToast] = useState(null)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const location = useLocation()
  const { profile, signOut } = useAuth()

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setIsInstallable(false)
    }
  }

  const handleTransactionConfirmed = (tx) => {
    setToast({
      id: tx.id,
      amount: tx.amount,
      reference: tx.reference,
    })

    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACAf39/f3+AgICAgH9/f39/gICAgIB/f39/f4CAgICAf39/f3+AgICAgA==')
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch {}

    setTimeout(() => setToast(null), 5000)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <TransactionListener onTransactionConfirmed={handleTransactionConfirmed} />

      {toast && (
        <div className="fixed top-0 left-0 right-0 z-[60] p-4 animate-slide-down">
          <div className="bg-green-600 text-white p-4 rounded-odoo shadow-odoo-lg flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">Pago Confirmado!</p>
              <p className="text-sm text-green-100">
                ${Number(toast.amount).toLocaleString()} - Ref: {toast.reference}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="flex-shrink-0 p-1 hover:bg-white/20 rounded-lg"
            >
              <span className="text-white text-lg">&times;</span>
            </button>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Pago-M</h1>
              <p className="text-xs text-slate-500">Cajero</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={handleInstallPWA}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Instalar</span>
              </button>
            )}

            <div className="relative group">
              <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                  <span className="text-sm font-medium text-primary-700">
                    {profile?.email?.charAt(0).toUpperCase() || 'C'}
                  </span>
                </div>
              </button>

              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-odoo-lg border border-slate-200 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900 truncate">{profile?.email}</p>
                  <p className="text-xs text-slate-500">Rol: Cajero</p>
                </div>
                {isInstallable && (
                  <button
                    onClick={handleInstallPWA}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary-600 hover:bg-slate-50"
                  >
                    <Home className="h-4 w-4" />
                    Anadir a pantalla de inicio
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-danger hover:bg-slate-50 rounded-b-lg"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesion
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.href
            return (
              <Link
                key={tab.name}
                to={tab.href}
                className={`flex flex-col items-center gap-1 py-3 px-6 transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon className={`h-6 w-6 ${isActive ? 'text-primary-600' : ''}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-primary-600' : ''}`}>
                  {tab.name}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
