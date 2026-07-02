import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  MessageSquare,
  Plus,
  Send,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertTriangle,
  Bell,
  Clock,
  CheckCircle,
  Mail,
  Eye,
  Calendar,
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

export function filterMessages(messages, { searchTerm, typeFilter, statusFilter }) {
  let filtered = [...messages]

  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter(
      (m) =>
        m.title?.toLowerCase().includes(term) ||
        m.content?.toLowerCase().includes(term) ||
        m.tenant_name?.toLowerCase().includes(term)
    )
  }

  if (typeFilter !== 'all') {
    filtered = filtered.filter((m) => m.type === typeFilter)
  }

  if (statusFilter !== 'all') {
    if (statusFilter === 'sent') filtered = filtered.filter((m) => m.is_sent)
    if (statusFilter === 'pending') filtered = filtered.filter((m) => !m.is_sent)
    if (statusFilter === 'read') filtered = filtered.filter((m) => m.is_read)
  }

  return filtered
}

export default function Messages() {
  const [messages, setMessages] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    tenant_id: '',
    type: 'reminder',
    title: '',
    content: '',
    priority: 'medium',
    scheduled_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [msgsRes, tenantsRes] = await Promise.all([
        supabase
          .from('messages')
          .select('*, tenants(name)')
          .order('created_at', { ascending: false }),
        supabase.from('tenants').select('id, name'),
      ])

      if (msgsRes.error) throw msgsRes.error

      const enriched = (msgsRes.data || []).map((m) => ({
        ...m,
        tenant_name: m.tenants?.name || 'Todos',
      }))

      setMessages(enriched)
      setTenants(tenantsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase.from('messages').insert({
        tenant_id: formData.tenant_id || null,
        type: formData.type,
        title: formData.title,
        content: formData.content,
        priority: formData.priority,
        scheduled_at: formData.scheduled_at || null,
      })
      if (error) throw error
      setShowModal(false)
      setFormData({ tenant_id: '', type: 'reminder', title: '', content: '', priority: 'medium', scheduled_at: '' })
      fetchData()
    } catch (error) {
      setError(error.message || 'Error al crear mensaje')
    } finally {
      setSaving(false)
    }
  }

  async function sendMessage(msgId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_sent: true, sent_at: new Date().toISOString() })
        .eq('id', msgId)
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  async function markAsRead(msgId) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', msgId)
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  async function handleDelete(msgId) {
    try {
      const { error } = await supabase.from('messages').delete().eq('id', msgId)
      if (error) throw error
      setDeleteConfirm(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }

  const filteredMessages = filterMessages(messages, { searchTerm, typeFilter, statusFilter })
  const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE)
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const stats = {
    total: messages.length,
    sent: messages.filter((m) => m.is_sent).length,
    pending: messages.filter((m) => !m.is_sent).length,
    unread: messages.filter((m) => !m.is_read).length,
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'reminder':
        return <span className="badge bg-blue-100 text-blue-800">Recordatorio</span>
      case 'alert':
        return <span className="badge-warning">Alerta</span>
      case 'notification':
        return <span className="badge-info">Notificación</span>
      case 'system':
        return <span className="badge bg-purple-100 text-purple-800">Sistema</span>
      default:
        return <span className="badge bg-slate-100 text-slate-600">{type}</span>
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="badge-danger">Urgente</span>
      case 'high':
        return <span className="badge-warning">Alta</span>
      case 'medium':
        return <span className="badge-info">Media</span>
      case 'low':
        return <span className="badge bg-slate-100 text-slate-600">Baja</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mensajes y Recordatorios</h1>
          <p className="text-slate-500 mt-1">Gestiona notificaciones y recordatorios</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo Mensaje</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Send className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Enviados</p>
              <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pendientes</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Bell className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">No Leídos</p>
              <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
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
              placeholder="Buscar por título, contenido o tenant..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" />
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1) }} className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
              <option value="all">Todos los tipos</option>
              <option value="reminder">Recordatorio</option>
              <option value="alert">Alerta</option>
              <option value="notification">Notificación</option>
              <option value="system">Sistema</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }} className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
              <option value="all">Todos</option>
              <option value="sent">Enviados</option>
              <option value="pending">Pendientes</option>
              <option value="read">Leídos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bento-card text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          </div>
        ) : paginatedMessages.length === 0 ? (
          <div className="bento-card text-center py-12 text-slate-500">
            No se encontraron mensajes
          </div>
        ) : (
          paginatedMessages.map((msg) => (
            <div key={msg.id} className={`bento-card ${!msg.is_read ? 'border-l-4 border-primary-500' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {getTypeBadge(msg.type)}
                    {getPriorityBadge(msg.priority)}
                    {msg.is_sent && <span className="badge-success">Enviado</span>}
                    {!msg.is_sent && <span className="badge-warning">Pendiente</span>}
                    {msg.tenant_name !== 'Todos' && (
                      <span className="badge bg-slate-100 text-slate-600">{msg.tenant_name}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900">{msg.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{msg.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(msg.created_at).toLocaleDateString('es-ES')}
                    </span>
                    {msg.sent_at && (
                      <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" />
                        Enviado: {new Date(msg.sent_at).toLocaleDateString('es-ES')}
                      </span>
                    )}
                    {msg.scheduled_at && !msg.is_sent && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Programado: {new Date(msg.scheduled_at).toLocaleDateString('es-ES')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!msg.is_sent && (
                    <button onClick={() => sendMessage(msg.id)} className="p-2 rounded-lg hover:bg-green-50" title="Enviar ahora">
                      <Send className="h-4 w-4 text-green-600" />
                    </button>
                  )}
                  {!msg.is_read && (
                    <button onClick={() => markAsRead(msg.id)} className="p-2 rounded-lg hover:bg-blue-50" title="Marcar como leído">
                      <Eye className="h-4 w-4 text-blue-600" />
                    </button>
                  )}
                  <button onClick={() => setDeleteConfirm(msg)} className="p-2 rounded-lg hover:bg-red-50" title="Eliminar">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredMessages.length)} de{' '}
            {filteredMessages.length}
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-odoo shadow-odoo-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Nuevo Mensaje</h2>
              <button onClick={() => { setShowModal(false); setError(null) }} className="p-2 rounded-lg hover:bg-slate-100">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenant (vacío = todos)</label>
                <select value={formData.tenant_id} onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                  <option value="">Todos los tenants</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                    <option value="reminder">Recordatorio</option>
                    <option value="alert">Alerta</option>
                    <option value="notification">Notificación</option>
                    <option value="system">Sistema</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Título del mensaje" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contenido *</label>
                <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" rows={3} placeholder="Contenido del mensaje" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Programar para (opcional)</label>
                <input type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !formData.title || !formData.content} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />}
                Crear Mensaje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-odoo shadow-odoo-lg w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Eliminar Mensaje</h3>
              <p className="text-sm text-slate-500 mb-6">
                ¿Eliminar <strong>{deleteConfirm.title}</strong>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
                <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
