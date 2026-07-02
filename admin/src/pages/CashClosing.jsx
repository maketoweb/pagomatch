import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Receipt,
  DollarSign,
  CheckCircle,
  Clock,
  Loader2,
  Calendar,
  TrendingUp,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'

const COLORS = ['#22c55e', '#f97316', '#ef4444']

export default function CashClosing() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    duplicate: 0,
    approvedTotal: 0,
  })

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchTodayTransactions()
    }
  }, [profile?.tenant_id])

  async function fetchTodayTransactions() {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      const txs = data || []
      const approved = txs.filter((t) => t.status === 'approved')
      const pending = txs.filter((t) => t.status === 'pending')
      const duplicate = txs.filter((t) => t.status === 'duplicate')

      setTransactions(txs)
      setSummary({
        total: txs.length,
        approved: approved.length,
        pending: pending.length,
        duplicate: duplicate.length,
        approvedTotal: approved.reduce((sum, t) => sum + Number(t.amount), 0),
      })
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }

  const pieData = [
    { name: 'Aprobadas', value: summary.approved },
    { name: 'Pendientes', value: summary.pending },
    { name: 'Duplicadas', value: summary.duplicate },
  ].filter((d) => d.value > 0)

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cierre de Caja</h1>
        <p className="text-slate-500 mt-1">Resumen de transacciones del día</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Calendar className="h-4 w-4" />
        <span className="capitalize">{today}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bento-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Transacciones</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{summary.total}</p>
            </div>
            <div className="p-3 rounded-odoo bg-blue-600">
              <Receipt className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bento-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Aprobadas</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{summary.approved}</p>
            </div>
            <div className="p-3 rounded-odoo bg-green-600">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bento-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Pendientes</p>
              <p className="text-2xl font-bold text-orange-500 mt-1">{summary.pending}</p>
            </div>
            <div className="p-3 rounded-odoo bg-orange-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bento-card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Ventas Aprobadas</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">
                ${summary.approvedTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-odoo bg-purple-600">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bento-card">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Distribución de Estados</h2>
            <p className="text-sm text-slate-500">Resumen visual del día</p>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No hay transacciones hoy
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bento-card">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Detalle por Transacción</h2>
            <p className="text-sm text-slate-500">Lista de movimientos del día</p>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No hay transacciones registradas hoy
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        tx.status === 'approved'
                          ? 'bg-green-500'
                          : tx.status === 'pending'
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        ${Number(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {tx.bank} - {tx.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`badge ${
                        tx.status === 'approved'
                          ? 'badge-success'
                          : tx.status === 'pending'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {tx.status === 'approved'
                        ? 'Aprobado'
                        : tx.status === 'pending'
                        ? 'Pendiente'
                        : 'Duplicado'}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(tx.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
