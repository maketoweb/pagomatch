import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  Mail,
  UserCheck,
  UserX,
  AlertTriangle,
  Power,
} from 'lucide-react'

function CashierForm({ cashier, onSave, onCancel, loading }) {
  const [email, setEmail] = useState(cashier?.email || '')
  const [name, setName] = useState(cashier?.full_name || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !name) {
      setError('Nombre y email son obligatorios')
      return
    }

    if (!cashier && !password) {
      setError('La contraseña es obligatoria para nuevos cajeros')
      return
    }

    if (password && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    onSave({ email, name, password })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-odoo shadow-odoo-lg w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            {cashier ? 'Editar Cajero' : 'Nuevo Cajero'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Juan Perez"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Correo Electronico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="cajero@tienda.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {cashier ? 'Nueva Contrasena (dejar vacio para mantener)' : 'Contrasena'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
              {...(!cashier && { required: true })}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                cashier ? 'Guardar Cambios' : 'Crear Cajero'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CashierManager() {
  const { profile } = useAuth()
  const [cashiers, setCashiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCashier, setEditingCashier] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchCashiers()
    }
  }, [profile?.tenant_id])

  async function fetchCashiers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('role', 'cashier')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCashiers(data || [])
    } catch (err) {
      console.error('Error fetching cashiers:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCashier({ email, name, password }) {
    setSaving(true)
    setError('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'cashier',
            tenant_id: profile.tenant_id,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        const { error: insertError } = await supabase.from('users').insert({
          id: authData.user.id,
          tenant_id: profile.tenant_id,
          email,
          full_name: name,
          role: 'cashier',
          is_active: true,
        })

        if (insertError) throw insertError
      }

      setShowForm(false)
      await fetchCashiers()
    } catch (err) {
      console.error('Error creating cashier:', err)
      setError(err.message || 'Error al crear el cajero. Verifica que el email no este en uso.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateCashier({ email, name }) {
    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('users')
        .update({ email, full_name: name })
        .eq('id', editingCashier.id)

      if (error) throw error

      setShowForm(false)
      setEditingCashier(null)
      await fetchCashiers()
    } catch (err) {
      console.error('Error updating cashier:', err)
      setError(err.message || 'Error al actualizar el cajero')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(cashier) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !cashier.is_active })
        .eq('id', cashier.id)

      if (error) throw error
      await fetchCashiers()
    } catch (err) {
      console.error('Error toggling cashier status:', err)
    }
  }

  async function handleDeleteCashier(cashierId) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', cashierId)

      if (error) throw error
      setConfirmDelete(null)
      await fetchCashiers()
    } catch (err) {
      console.error('Error deleting cashier:', err)
    }
  }

  const filteredCashiers = cashiers.filter(
    (c) =>
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCashiers = filteredCashiers.filter((c) => c.is_active !== false)
  const inactiveCashiers = filteredCashiers.filter((c) => c.is_active === false)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cajeros</h1>
          <p className="text-slate-500 mt-1">
            Gestiona el acceso de tus cajeros al sistema
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCashier(null)
            setShowForm(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-odoo text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nuevo Cajero
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bento-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Cajeros</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{cashiers.length}</p>
            </div>
            <div className="p-3 rounded-odoo bg-primary-600">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Activos</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{activeCashiers.length}</p>
            </div>
            <div className="p-3 rounded-odoo bg-green-600">
              <UserCheck className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <div className="bento-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Inactivos</p>
              <p className="text-2xl font-bold text-slate-400 mt-1">{inactiveCashiers.length}</p>
            </div>
            <div className="p-3 rounded-odoo bg-slate-400">
              <UserX className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="bento-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Buscar por nombre o email..."
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : filteredCashiers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {searchTerm ? 'No se encontraron cajeros' : 'No hay cajeros registrados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                    Cajero
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                    Email
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                    Estado
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider pb-3">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCashiers.map((cashier) => (
                  <tr key={cashier.id} className="hover:bg-slate-50">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full">
                          <span className="text-sm font-medium text-primary-700">
                            {cashier.full_name?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {cashier.full_name || 'Sin nombre'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {cashier.email}
                      </div>
                    </td>
                    <td className="py-4">
                      <span
                        className={`badge ${
                          cashier.is_active !== false ? 'badge-success' : 'badge-danger'
                        }`}
                      >
                        {cashier.is_active !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(cashier)}
                          className={`p-2 rounded-lg transition-colors ${
                            cashier.is_active !== false
                              ? 'text-slate-400 hover:text-orange-600 hover:bg-orange-50'
                              : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={cashier.is_active !== false ? 'Desactivar' : 'Activar'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingCashier(cashier)
                            setShowForm(true)
                          }}
                          className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {confirmDelete === cashier.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteCashier(cashier.id)}
                              className="px-2 py-1 text-xs text-white bg-red-600 rounded-lg hover:bg-red-700"
                            >
                              Si
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-2 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(cashier.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <CashierForm
          cashier={editingCashier}
          onSave={editingCashier ? handleUpdateCashier : handleCreateCashier}
          onCancel={() => {
            setShowForm(false)
            setEditingCashier(null)
            setError('')
          }}
          loading={saving}
        />
      )}
    </div>
  )
}
