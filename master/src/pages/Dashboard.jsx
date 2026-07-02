import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, TrendingUp, AlertTriangle, Activity, CreditCard, Download, MessageSquare, Clock } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function KpiCard({ title, value, icon: Icon, color, change }) {
  return (
    <div className="bento-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% vs mes anterior
            </p>
          )}
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
        <p className="text-sm text-primary-600">
          Transacciones: {payload[0].value}
        </p>
        {payload[1] && (
          <p className="text-sm text-green-600">
            Aprobadas: {payload[1].value}
          </p>
        )}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalTransactions: 0,
    pendingTransactions: 0,
    activeSubscriptions: 0,
    expiringSubscriptions: 0,
    totalDownloads: 0,
    unreadMessages: 0,
  })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchChartData()
  }, [])

  async function fetchStats() {
    try {
      const [tenantsRes, transactionsRes, subsRes, downloadsRes, messagesRes] = await Promise.all([
        supabase.from('tenants').select('id, status'),
        supabase.from('transactions').select('id, status'),
        supabase.from('subscriptions').select('id, status, current_period_end'),
        supabase.from('app_downloads').select('id'),
        supabase.from('messages').select('id, is_read'),
      ])

      const tenants = tenantsRes.data || []
      const transactions = transactionsRes.data || []
      const subs = subsRes.data || []
      const downloads = downloadsRes.data || []
      const messages = messagesRes.data || []

      const now = new Date()
      const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
      const expiring = subs.filter((s) => {
        if (s.status !== 'active' || !s.current_period_end) return false
        const endDate = new Date(s.current_period_end)
        return endDate <= fiveDaysFromNow && endDate >= now
      }).length

      setStats({
        totalTenants: tenants.length,
        activeTenants: tenants.filter((t) => t.status === 'active').length,
        totalTransactions: transactions.length,
        pendingTransactions: transactions.filter((t) => t.status === 'pending').length,
        activeSubscriptions: subs.filter((s) => s.status === 'active').length,
        expiringSubscriptions: expiring,
        totalDownloads: downloads.length,
        unreadMessages: messages.filter((m) => !m.is_read).length,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  async function fetchChartData() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('created_at, status')
        .order('created_at', { ascending: true })

      if (error) throw error

      // Group by date
      const grouped = (data || []).reduce((acc, item) => {
        const date = new Date(item.created_at).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
        })
        if (!acc[date]) {
          acc[date] = { date, total: 0, approved: 0 }
        }
        acc[date].total++
        if (item.status === 'approved') {
          acc[date].approved++
        }
        return acc
      }, {})

      setChartData(Object.values(grouped).slice(-7))
    } catch (error) {
      console.error('Error fetching chart data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Vista general del sistema de conciliación</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Tiendas"
          value={stats.totalTenants}
          icon={Users}
          color="bg-primary-600"
        />
        <KpiCard
          title="Tiendas Activas"
          value={stats.activeTenants}
          icon={Activity}
          color="bg-green-600"
        />
        <KpiCard
          title="Transacciones"
          value={stats.totalTransactions}
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <KpiCard
          title="Pendientes"
          value={stats.pendingTransactions}
          icon={AlertTriangle}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Suscripciones Activas"
          value={stats.activeSubscriptions}
          icon={CreditCard}
          color="bg-purple-600"
        />
        <KpiCard
          title="Por Vencer (5 días)"
          value={stats.expiringSubscriptions}
          icon={Clock}
          color="bg-red-500"
        />
        <KpiCard
          title="Descargas App"
          value={stats.totalDownloads}
          icon={Download}
          color="bg-cyan-600"
        />
        <KpiCard
          title="Mensajes Sin Leer"
          value={stats.unreadMessages}
          icon={MessageSquare}
          color="bg-pink-600"
        />
      </div>

      <div className="bento-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Transacciones Recientes</h2>
            <p className="text-sm text-slate-500">Últimos 7 días de actividad</p>
          </div>
        </div>

        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
                <Area
                  type="monotone"
                  dataKey="approved"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorApproved)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-slate-600">Total</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-slate-600">Aprobadas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
