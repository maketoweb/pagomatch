import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Smartphone,
  DollarSign,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function KpiCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bento-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-odoo ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-odoo">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-sm text-green-600">
          Aprobadas: ${payload[0]?.value?.toLocaleString() || 0}
        </p>
      </div>
    )
  }
  return null
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalCashiers: 0,
    activeDevices: 0,
    todayTransactions: 0,
    todayTotal: 0,
  })
  const [chartData, setChartData] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchStats()
      fetchChartData()
      fetchRecentTransactions()
    }
  }, [profile?.tenant_id])

  async function fetchStats() {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [cashiersRes, devicesRes, transactionsRes] = await Promise.all([
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id)
          .eq('role', 'cashier'),
        supabase
          .from('devices')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true),
        supabase
          .from('transactions')
          .select('id, amount, status')
          .eq('tenant_id', profile.tenant_id)
          .gte('created_at', todayStart.toISOString()),
      ])

      const todayTx = transactionsRes.data || []
      const approvedToday = todayTx.filter((t) => t.status === 'approved')

      setStats({
        totalCashiers: cashiersRes.count || 0,
        activeDevices: devicesRes.count || 0,
        todayTransactions: todayTx.length,
        todayTotal: approvedToday.reduce((sum, t) => sum + Number(t.amount), 0),
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function fetchChartData() {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('transactions')
        .select('created_at, amount, status')
        .eq('tenant_id', profile.tenant_id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      const grouped = (data || []).reduce((acc, item) => {
        const date = new Date(item.created_at).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
        })
        if (!acc[date]) {
          acc[date] = { date, total: 0 }
        }
        if (item.status === 'approved') {
          acc[date].total += Number(item.amount)
        }
        return acc
      }, {})

      setChartData(Object.values(grouped).slice(-7))
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  async function fetchRecentTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, amount, reference, bank, status, created_at')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Resumen de tu tienda</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Cajeros"
          value={stats.totalCashiers}
          icon={Users}
          color="bg-primary-600"
        />
        <KpiCard
          title="Dispositivos Activos"
          value={stats.activeDevices}
          icon={Smartphone}
          color="bg-green-600"
        />
        <KpiCard
          title="Transacciones Hoy"
          value={stats.todayTransactions}
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <KpiCard
          title="Total Ventas Hoy"
          value={`$${stats.todayTotal.toLocaleString()}`}
          icon={DollarSign}
          color="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bento-card">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Ventas Últimos 7 Días</h2>
            <p className="text-sm text-slate-500">Transacciones aprobadas por día</p>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="total" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bento-card">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Últimas Transacciones</h2>
            <p className="text-sm text-slate-500">Movimientos recientes de la tienda</p>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No hay transacciones recientes
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        tx.status === 'approved'
                          ? 'bg-green-100'
                          : tx.status === 'pending'
                          ? 'bg-orange-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {tx.status === 'approved' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : tx.status === 'pending' ? (
                        <Clock className="h-4 w-4 text-orange-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        ${Number(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">{tx.bank} - {tx.reference}</p>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      tx.status === 'approved'
                        ? 'badge-success'
                        : tx.status === 'pending'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {tx.status === 'approved' ? 'Aprobado' : tx.status === 'pending' ? 'Pendiente' : 'Duplicado'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
