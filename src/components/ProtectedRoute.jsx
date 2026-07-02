import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, ShieldOff, CreditCard } from 'lucide-react'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="text-center max-w-md">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-4">
            <ShieldOff className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h1>
          <p className="text-slate-500 mb-6">
            No tienes permisos para acceder a esta sección.
            Tu rol actual es <span className="font-medium text-slate-700">{profile?.role}</span>
            {' '}y se requiere rol de <span className="font-medium text-slate-700">{requiredRole}</span>.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Volver al Login
            </a>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    )
  }

  return children
}
