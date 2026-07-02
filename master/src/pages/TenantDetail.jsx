import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft,
  Users,
  Activity,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Key,
  Pause,
  Play,
  Edit2,
  Save,
  X,
  AlertTriangle,
  Store,
  BarChart3,
} from 'lucide-react'

export default function TenantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  const [cashiers, setCashiers] = useState([])
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTenantData()
    }
  }, [id])

  async function fetchTenantData() {
    try {
      const [tenantRes, cashiersRes, usersRes, transactionsRes] = await Promise.all([
        supabase.from('tenants').select('*').eq('id', id).single(),
        supabase.from('cashiers').select('*').eq('tenant_id', id),
        supabase.from('users').select('*').eq('tenant_id', id),
        supabase.from('transactions').select('*').eq('tenant_id', id).order('created_at', { ascending: false }),
      ])

      if (tenantRes.error) throw tenantRes.error
      setTenant(tenantRes.data)
      setFormData(tenantRes.data)
      setCashiers(cashiersRes.data || [])
      setUsers(usersRes.data || [])
      setTransactions(transactionsRes.data || [])
    } catch (error) {
      console.error('Error fetching tenant:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          address: formData.address,
        })
        .eq('id', id)

      if (error) throw error
      setTenant({ ...tenant, ...formData })
      setEditing(false)
    } catch (error) {
      console.error('Error updating tenant:', error)
    } finally {
      setSaving(false)
    }
  }

  async function toggleTenantStatus() {
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active'
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error
      setTenant({ ...tenant, status: newStatus })
    } catch (error) {
      console.error('Error toggling status:', error)
    }
  }

  const stats = {
    totalTransactions: transactions.length,
    approvedTransactions: transactions.filter((t) => t.status === 'approved').length,
    pendingTransactions: transactions.filter((t) => t.status === 'pending').length,
    totalAmount: transactions.filter((t) => t.status === 'approved').reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Tenant no encontrado</p>
        <button
          onClick={() => navigate('/dashboard/master/tenants')}
          className="mt-4 text-primary-600 hover:underline"
        >
          Volver a Tenants
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/master/tenants')}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
            <p className="text-slate-500">Detalle del Tenant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTenantStatus}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
              tenant.status === 'active'
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {tenant.status === 'active' ? (
              <>
                <Pause className="h-4 w-4" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Activar
              </>
            )}
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            {editing ? 'Cancelar' : 'Editar'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Transacciones</p>
              <p className="text-xl font-bold text-slate-900">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Aprobadas</p>
              <p className="text-xl font-bold text-green-600">{stats.approvedTransactions}</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pendientes</p>
              <p className="text-xl font-bold text-orange-600">{stats.pendingTransactions}</p>
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Aprobado</p>
              <p className="text-xl font-bold text-slate-900">${stats.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="lg:col-span-2 bento-card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Información del Tenant</h2>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Contacto</label>
                  <input
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={formData.contact_phone || ''}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData(tenant)
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />}
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-slate-400" />
                <span className="text-slate-600">{tenant.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <span className="text-slate-600">{tenant.contact_email || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <span className="text-slate-600">{tenant.contact_phone || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-slate-400" />
                <span className="text-slate-600">{tenant.address || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-slate-400" />
                <code className="text-sm bg-slate-100 px-2 py-1 rounded">{tenant.api_key}</code>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <span className="text-slate-600">
                  Creado: {new Date(tenant.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Cashiers Card */}
        <div className="bento-card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Cajeros ({cashiers.length})</h2>
          {cashiers.length === 0 ? (
            <p className="text-sm text-slate-500">No hay cajeros registrados</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {cashiers.map((cashier) => (
                <div
                  key={cashier.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                      <span className="text-xs font-medium text-primary-700">
                        {cashier.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{cashier.name}</p>
                      <p className="text-xs text-slate-500">{cashier.code}</p>
                    </div>
                  </div>
                  <span className={`badge ${cashier.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {cashier.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bento-card">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Transacciones Recientes</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No hay transacciones</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Referencia</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Monto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 10).map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 text-sm text-slate-600">{tx.reference}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">${parseFloat(tx.amount).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${tx.status === 'approved' ? 'badge-success' : tx.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
