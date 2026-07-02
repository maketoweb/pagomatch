import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Smartphone,
  Users,
  Receipt,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  CreditCard,
  Download,
  Home,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Vincular Dispositivo',
    href: '/dashboard/admin/devices',
    icon: Smartphone,
  },
  {
    name: 'Cajeros',
    href: '/dashboard/admin/cashiers',
    icon: Users,
  },
  {
    name: 'Cierre de Caja',
    href: '/dashboard/admin/cash-closing',
    icon: Receipt,
  },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
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
    window.deferredPrompt = null

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

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
          <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Pago-M</h1>
            <p className="text-xs text-slate-500">Panel Admin</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full">
              <span className="text-sm font-medium text-primary-700">
                {profile?.email?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {profile?.email || 'Admin'}
              </p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 lg:hidden"
            >
              <Menu className="h-6 w-6 text-slate-600" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-3">
              {isInstallable && (
                <button
                  onClick={handleInstallPWA}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-odoo text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  Instalar App
                </button>
              )}

              <button className="relative p-2 rounded-lg hover:bg-slate-100">
                <Bell className="h-5 w-5 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                    <span className="text-sm font-medium text-primary-700">
                      {profile?.email?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-slate-700">
                    {profile?.email || 'Admin'}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-odoo-lg border border-slate-200 z-50">
                      <div className="p-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900">{profile?.email}</p>
                        <p className="text-xs text-slate-500">Rol: Admin</p>
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
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {isInstallable && (
          <div className="bg-primary-50 border-b border-primary-100 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Home className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary-900">
                    Instala Pago-M en tu dispositivo
                  </p>
                  <p className="text-xs text-primary-700">
                    Accede rapidamente desde tu pantalla de inicio
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleInstallPWA}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Instalar
                </button>
                <button
                  onClick={() => setIsInstallable(false)}
                  className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
