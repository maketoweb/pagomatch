import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  History as HistoryIcon,
  Loader2,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
} from 'lucide-react'

export default function History() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    duplicate: 0,
    totalAmount: 0,
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
        totalAmount: approved.reduce((sum, t) => sum + Number(t.amount), 0),
      })
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status) {
    switch (status) {
      case 'approved':
        return (
          <span className="badge-success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprobado
          </span>
        )
      case 'pending':
        return (
          <span className="badge-warning">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </span>
        )
      case 'duplicate':
        return (
          <span className="badge-danger">
            <XCircle className="h-3 w-3 mr-1" />
            Duplicado
          </span>
        )
      default:
        return <span className="badge bg-slate-100 text-slate-800">{status}</span>
    }
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial</h1>
        <p className="text-slate-500 mt-1">Transacciones de hoy</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Calendar className="h-4 w-4" />
        <span className="capitalize">{today}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-odoo shadow-odoo p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-bold text-slate-900">{summary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-odoo shadow-odoo p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Aprobadas</p>
              <p className="text-lg font-bold text-green-600">{summary.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-odoo shadow-odoo p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Pendientes</p>
              <p className="text-lg font-bold text-orange-500">{summary.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-odoo shadow-odoo p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Vtas</p>
              <p className="text-lg font-bold text-purple-600">
                ${summary.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-odoo shadow-odoo">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-slate-500" />
            Movimientos del Dia
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <HistoryIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay transacciones hoy</p>
            <p className="text-xs text-slate-400 mt-1">
              Las transacciones apareceran aqui cuando se registren
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.status === 'approved'
                          ? 'bg-green-100'
                          : tx.status === 'pending'
                          ? 'bg-orange-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {tx.status === 'approved' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : tx.status === 'pending' ? (
                        <Clock className="h-5 w-5 text-orange-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        ${Number(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500">
                        {tx.bank || 'N/A'} - {tx.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(tx.status)}
                    <p className="text-xs text-slate-400 mt-1">{formatTime(tx.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
