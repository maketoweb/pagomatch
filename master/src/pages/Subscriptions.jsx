import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Pause,
  Play,
  Clock,
} from 'lucide-react'

const ITEMS_PER_PAGE = 10

export function filterSubscriptions(subscriptions, { searchTerm, statusFilter }) {
  let filtered = [...subscriptions]

  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.tenant_name?.toLowerCase().includes(term) ||
        s.plan_name?.toLowerCase().includes(term)
    )
  }

  if (statusFilter !== 'all') {
    filtered = filtered.filter((s) => s.status === statusFilter)
  }

  return filtered
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [plans, setPlans] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    billing_cycle: 'monthly',
    max_users: '',
    max_cashiers: '',
    max_transactions: '',
  })
  const [showSubModal, setShowSubModal] = useState(false)
  const [subForm, setSubForm] = useState({
    tenant_id: '',
    plan_id: '',
    amount: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [subsRes, plansRes, tenantsRes] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('*, tenants(name), plans(name, price)')
          .order('created_at', { ascending: false }),
        supabase.from('plans').select('*').order('price'),
        supabase.from('tenants').select('id, name'),
      ])

      if (subsRes.error) throw subsRes.error
      if (plansRes.error) throw plansRes.error

      const subs = (subsRes.data || []).map((s) => ({
        ...s,
        tenant_name: s.tenants?.name || 'Desconocido',
        plan_name: s.plans?.name || 'Sin plan',
      }))

      setSubscriptions(subs)
      setPlans(plansRes.data || [])
      setTenants(tenantsRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSavePlan() {
    setSaving(true)
    setError(null)
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update({
            name: planForm.name,
            description: planForm.description,
            price: parseFloat(planForm.price),
            billing_cycle: planForm.billing_cycle,
            max_users: parseInt(planForm.max_users) || 5,
            max_cashiers: parseInt(planForm.max_cashiers) || 10,
            max_transactions: parseInt(planForm.max_transactions) || 1000,
          })
          .eq('id', editingPlan.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('plans').insert({
          name: planForm.name,
          description: planForm.description,
          price: parseFloat(planForm.price),
          billing_cycle: planForm.billing_cycle,
          max_users: parseInt(planForm.max_users) || 5,
          max_cashiers: parseInt(planForm.max_cashiers) || 10,
          max_transactions: parseInt(planForm.max_transactions) || 1000,
        })
        if (error) throw error
      }
      setShowPlanModal(false)
      setEditingPlan(null)
      setPlanForm({ name: '', description: '', price: '', billing_cycle: 'monthly', max_users: '', max_cashiers: '', max_transactions: '' })
      fetchData()
    } catch (error) {
      setError(error.message || 'Error al guardar plan')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeletePlan(planId) {
    try {
      const { error } = await supabase.from('plans').delete().eq('id', planId)
      if (error) throw error
      setDeleteConfirm(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting plan:', error)
    }
  }

  async function handleCreateSub() {
    setSaving(true)
    setError(null)
    try {
      const plan = plans.find((p) => p.id === subForm.plan_id)
      if (!plan) throw new Error('Selecciona un plan')

      const now = new Date()
      const periodEnd = new Date(now)
      if (plan.billing_cycle === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1)
      else if (plan.billing_cycle === 'quarterly') periodEnd.setMonth(periodEnd.getMonth() + 3)
      else periodEnd.setFullYear(periodEnd.getFullYear() + 1)

      const { error } = await supabase.from('subscriptions').insert({
        tenant_id: subForm.tenant_id,
        plan_id: subForm.plan_id,
        amount: parseFloat(subForm.amount || plan.price),
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        status: 'active',
      })
      if (error) throw error

      await supabase
        .from('tenants')
        .update({
          plan_id: subForm.plan_id,
          subscription_status: 'active',
          subscription_end_date: periodEnd.toISOString(),
        })
        .eq('id', subForm.tenant_id)

      setShowSubModal(false)
      setSubForm({ tenant_id: '', plan_id: '', amount: '' })
      fetchData()
    } catch (error) {
      setError(error.message || 'Error al crear suscripción')
    } finally {
      setSaving(false)
    }
  }

  async function toggleSubStatus(subId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus })
        .eq('id', subId)
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error toggling subscription:', error)
    }
  }

  async function cancelSubscription(subId) {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
        })
        .eq('id', subId)
      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error cancelling subscription:', error)
    }
  }

  function openEditPlan(plan) {
    setEditingPlan(plan)
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      max_users: plan.max_users,
      max_cashiers: plan.max_cashiers,
      max_transactions: plan.max_transactions,
    })
    setShowPlanModal(true)
  }

  const filteredSubs = filterSubscriptions(subscriptions, { searchTerm, statusFilter })
  const totalPages = Math.ceil(filteredSubs.length / ITEMS_PER_PAGE)
  const paginatedSubs = filteredSubs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const getExpiryWarning = (endDate) => {
    if (!endDate) return null
    const end = new Date(endDate)
    const now = new Date()
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    if (daysLeft <= 0) return { text: 'Vencida', color: 'text-red-600', urgent: true }
    if (daysLeft <= 5) return { text: `${daysLeft} días restantes`, color: 'text-orange-600', urgent: true }
    if (daysLeft <= 15) return { text: `${daysLeft} días restantes`, color: 'text-yellow-600', urgent: false }
    return { text: `${daysLeft} días restantes`, color: 'text-green-600', urgent: false }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Suscripciones y Planes</h1>
          <p className="text-slate-500 mt-1">Gestiona planes, suscripciones y pagos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditingPlan(null)
              setPlanForm({ name: '', description: '', price: '', billing_cycle: 'monthly', max_users: '', max_cashiers: '', max_transactions: '' })
              setShowPlanModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo Plan</span>
          </button>
          <button
            onClick={() => setShowSubModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nueva Suscripción</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bento-card relative">
            <div className="absolute top-4 right-4 flex gap-1">
              <button
                onClick={() => openEditPlan(plan)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <Edit2 className="h-4 w-4 text-slate-500" />
              </button>
              <button
                onClick={() => setDeleteConfirm({ type: 'plan', item: plan })}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
            <div className="mt-4">
              <span className="text-3xl font-bold text-primary-600">${plan.price}</span>
              <span className="text-sm text-slate-500">/{plan.billing_cycle === 'monthly' ? 'mes' : plan.billing_cycle === 'quarterly' ? 'trimestre' : 'año'}</span>
            </div>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <p>{plan.max_users} usuarios</p>
              <p>{plan.max_cashiers} cajeros</p>
              <p>{plan.max_transactions} transacciones</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bento-card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por tenant o plan..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
            >
              <option value="all">Todos</option>
              <option value="active">Activas</option>
              <option value="past_due">Vencidas</option>
              <option value="paused">Pausadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bento-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Tenant</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Plan</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Estado</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Monto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Vencimiento</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
                  </td>
                </tr>
              ) : paginatedSubs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron suscripciones
                  </td>
                </tr>
              ) : (
                paginatedSubs.map((sub) => {
                  const warning = getExpiryWarning(sub.current_period_end)
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{sub.tenant_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="badge-info">{sub.plan_name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${sub.status === 'active' ? 'badge-success' : sub.status === 'past_due' ? 'badge-danger' : sub.status === 'paused' ? 'badge-warning' : 'bg-slate-100 text-slate-600'}`}>
                          {sub.status === 'active' ? 'Activa' : sub.status === 'past_due' ? 'Vencida' : sub.status === 'paused' ? 'Pausada' : 'Cancelada'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900">${parseFloat(sub.amount).toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-slate-600">
                            {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('es-ES') : 'N/A'}
                          </p>
                          {warning && (
                            <p className={`text-xs font-medium ${warning.color} flex items-center gap-1`}>
                              {warning.urgent && <AlertTriangle className="h-3 w-3" />}
                              {warning.text}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {sub.status === 'active' && (
                            <>
                              <button
                                onClick={() => toggleSubStatus(sub.id, sub.status)}
                                className="p-2 rounded-lg hover:bg-slate-100"
                                title="Pausar"
                              >
                                <Pause className="h-4 w-4 text-orange-500" />
                              </button>
                              <button
                                onClick={() => cancelSubscription(sub.id)}
                                className="p-2 rounded-lg hover:bg-slate-100"
                                title="Cancelar"
                              >
                                <XCircle className="h-4 w-4 text-red-500" />
                              </button>
                            </>
                          )}
                          {sub.status === 'paused' && (
                            <button
                              onClick={() => toggleSubStatus(sub.id, sub.status)}
                              className="p-2 rounded-lg hover:bg-slate-100"
                              title="Reactivar"
                            >
                              <Play className="h-4 w-4 text-green-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredSubs.length)} de{' '}
              {filteredSubs.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              <span className="text-sm text-slate-600">Página {currentPage} de {totalPages}</span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-odoo shadow-odoo-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
              </h2>
              <button onClick={() => { setShowPlanModal(false); setEditingPlan(null); setError(null) }} className="p-2 rounded-lg hover:bg-slate-100">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input type="text" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Precio *</label>
                  <input type="number" step="0.01" value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ciclo</label>
                  <select value={planForm.billing_cycle} onChange={(e) => setPlanForm({ ...planForm, billing_cycle: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Usuarios</label>
                  <input type="number" value={planForm.max_users} onChange={(e) => setPlanForm({ ...planForm, max_users: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Cajeros</label>
                  <input type="number" value={planForm.max_cashiers} onChange={(e) => setPlanForm({ ...planForm, max_cashiers: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Trans.</label>
                  <input type="number" value={planForm.max_transactions} onChange={(e) => setPlanForm({ ...planForm, max_transactions: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <button onClick={() => { setShowPlanModal(false); setEditingPlan(null) }} className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={handleSavePlan} disabled={saving || !planForm.name || !planForm.price} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Save className="h-4 w-4" />}
                {editingPlan ? 'Guardar' : 'Crear Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Modal */}
      {showSubModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-odoo shadow-odoo-lg w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Nueva Suscripción</h2>
              <button onClick={() => { setShowSubModal(false); setError(null) }} className="p-2 rounded-lg hover:bg-slate-100">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Tenant *</label>
                <select value={subForm.tenant_id} onChange={(e) => setSubForm({ ...subForm, tenant_id: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                  <option value="">Seleccionar tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plan *</label>
                <select value={subForm.plan_id} onChange={(e) => setSubForm({ ...subForm, plan_id: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                  <option value="">Seleccionar plan...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} - ${p.price}/{p.billing_cycle === 'monthly' ? 'mes' : p.billing_cycle === 'quarterly' ? 'trim' : 'año'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Monto (opcional, usa precio del plan)</label>
                <input type="number" step="0.01" value={subForm.amount} onChange={(e) => setSubForm({ ...subForm, amount: e.target.value })} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="Dejar vacío para precio del plan" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <button onClick={() => setShowSubModal(false)} className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={handleCreateSub} disabled={saving || !subForm.tenant_id || !subForm.plan_id} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> : <Plus className="h-4 w-4" />}
                Crear Suscripción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-odoo shadow-odoo-lg w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Eliminar Plan</h3>
              <p className="text-sm text-slate-500 mb-6">
                ¿Eliminar el plan <strong>{deleteConfirm.item?.name}</strong>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Cancelar</button>
                <button onClick={() => handleDeletePlan(deleteConfirm.item?.id)} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
