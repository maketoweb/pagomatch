import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'

const ITEMS_PER_PAGE = 15

const errorTypes = {
  regex: { label: 'RegEx Error', icon: AlertTriangle, color: 'text-orange-500' },
  system: { label: 'System Alert', icon: AlertCircle, color: 'text-red-500' },
  info: { label: 'Info', icon: Info, color: 'text-blue-500' },
}

export function filterLogs(logs, { searchTerm, typeFilter }) {
  let filtered = [...logs]

  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter(
      (l) =>
        l.message?.toLowerCase().includes(term) ||
        l.source?.toLowerCase().includes(term) ||
        l.tenant_name?.toLowerCase().includes(term)
    )
  }

  if (typeFilter !== 'all') {
    filtered = filtered.filter((l) => l.type === typeFilter)
  }

  return filtered
}

export default function LogsView() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    try {
      // In a real app, this would fetch from a logs table or edge function
      // For demo purposes, we'll simulate some data
      const mockLogs = [
        {
          id: 1,
          type: 'regex',
          message: 'Patrón RegEx no válido para banco XYZ',
          source: 'Edge Function /ingest',
          tenant_name: 'Tienda Central',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
          id: 2,
          type: 'system',
          message: 'Dispositivo DESKTOP-ABC123 no encontrado en tabla devices',
          source: 'Edge Function /ingest',
          tenant_name: 'Tienda Norte',
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          id: 3,
          type: 'info',
          message: 'Nuevo tenant registrado: Tienda Sur',
          source: 'Sistema',
          tenant_name: 'Tienda Sur',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: 4,
          type: 'regex',
          message: 'Error al parsear notificación SMS del banco Banorte',
          source: 'Puente Android',
          tenant_name: 'Tienda Central',
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          id: 5,
          type: 'system',
          message: 'Timeout al conectar con webhook de tienda online',
          source: 'Edge Function /webhook-out',
          tenant_name: 'Tienda Express',
          created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
      ]

      setLogs(mockLogs)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = filterLogs(logs, { searchTerm, typeFilter })
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getErrorIcon = (type) => {
    const errorType = errorTypes[type] || errorTypes.info
    const Icon = errorType.icon
    return <Icon className={`h-5 w-5 ${errorType.color}`} />
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Logs de Errores</h1>
          <p className="text-slate-500 mt-1">Monitoreo de errores RegEx y alertas del sistema</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="bento-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
            >
              <option value="all">Todos</option>
              <option value="regex">RegEx Errors</option>
              <option value="system">System Alerts</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bento-card overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No se encontraron logs
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">{getErrorIcon(log.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{log.message}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Fuente:</span> {log.source}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Tienda:</span> {log.tenant_name}
                    </span>
                    <span>{formatDate(log.created_at)}</span>
                  </div>
                </div>
                <span className={`badge ${
                  log.type === 'regex' ? 'badge-warning' :
                  log.type === 'system' ? 'badge-danger' :
                  'badge-info'
                }`}>
                  {errorTypes[log.type]?.label || 'Info'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)} de{' '}
              {filteredLogs.length} resultados
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
