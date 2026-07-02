import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Smartphone,
  Download,
  Globe,
  Monitor,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  BarChart3,
  Apple,
  Android,
} from 'lucide-react'

const ITEMS_PER_PAGE = 15

export function filterDownloads(downloads, { searchTerm, deviceFilter }) {
  let filtered = [...downloads]

  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter(
      (d) =>
        d.tenant_name?.toLowerCase().includes(term) ||
        d.user_email?.toLowerCase().includes(term) ||
        d.ip_address?.toLowerCase().includes(term)
    )
  }

  if (deviceFilter !== 'all') {
    filtered = filtered.filter((d) => d.device_type === deviceFilter)
  }

  return filtered
}

export default function AppDownloads() {
  const [downloads, setDownloads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchDownloads()
  }, [])

  async function fetchDownloads() {
    try {
      const { data, error } = await supabase
        .from('app_downloads')
        .select('*, tenants(name), users(email)')
        .order('downloaded_at', { ascending: false })

      if (error) throw error

      const enriched = (data || []).map((d) => ({
        ...d,
        tenant_name: d.tenants?.name || 'N/A',
        user_email: d.users?.email || 'N/A',
      }))

      setDownloads(enriched)
    } catch (error) {
      console.error('Error fetching downloads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredDownloads = filterDownloads(downloads, { searchTerm, deviceFilter })
  const totalPages = Math.ceil(filteredDownloads.length / ITEMS_PER_PAGE)
  const paginatedDownloads = filteredDownloads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = {
    total: downloads.length,
    android: downloads.filter((d) => d.device_type === 'android').length,
    ios: downloads.filter((d) => d.device_type === 'ios').length,
    web: downloads.filter((d) => d.device_type === 'web').length,
  }

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'android':
        return <Android className="h-5 w-5 text-green-600" />
      case 'ios':
        return <Apple className="h-5 w-5 text-slate-800" />
      case 'web':
        return <Globe className="h-5 w-5 text-blue-600" />
      default:
        return <Smartphone className="h-5 w-5 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Descargas de App</h1>
        <p className="text-slate-500 mt-1">Quienes han descargado la aplicación</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Download className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Descargas</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Android className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Android</p>
              <p className="text-2xl font-bold text-green-600">{stats.android}</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-100 rounded-lg">
              <Apple className="h-5 w-5 text-slate-800" />
            </div>
            <div>
              <p className="text-sm text-slate-500">iOS</p>
              <p className="text-2xl font-bold text-slate-900">{stats.ios}</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Web App</p>
              <p className="text-2xl font-bold text-purple-600">{stats.web}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bento-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por tenant, email o IP..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" />
            <select
              value={deviceFilter}
              onChange={(e) => { setDeviceFilter(e.target.value); setCurrentPage(1) }}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
            >
              <option value="all">Todos</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="web">Web</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Dispositivo</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Tenant</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">IP</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : paginatedDownloads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron descargas
                  </td>
                </tr>
              ) : (
                paginatedDownloads.map((dl) => (
                  <tr key={dl.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(dl.device_type)}
                        <div>
                          <p className="font-medium text-slate-900 capitalize">{dl.device_type}</p>
                          <p className="text-xs text-slate-500">{dl.device_info?.os_version || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{dl.tenant_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{dl.user_email}</td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded">{dl.ip_address || 'N/A'}</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {dl.downloaded_at ? new Date(dl.downloaded_at).toLocaleDateString('es-ES') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredDownloads.length)} de{' '}
              {filteredDownloads.length}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50">
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600">Página {currentPage} de {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50">
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
