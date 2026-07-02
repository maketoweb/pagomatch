import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  CreditCard,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Hash,
} from 'lucide-react'

export default function Register() {
  const { profile } = useAuth()
  const [amount, setAmount] = useState('')
  const [reference, setReference] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function handleVerify(e) {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!amount || parseFloat(amount) <= 0) {
      setError('Ingresa un monto valido mayor a 0')
      return
    }

    if (!reference.trim()) {
      setError('Ingresa una referencia')
      return
    }

    setSearching(true)

    try {
      const { data, error: queryError } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('reference', reference.trim())
        .order('created_at', { ascending: false })
        .limit(10)

      if (queryError) throw queryError

      if (!data || data.length === 0) {
        setResult({
          found: false,
          message: 'No se encontro transaccion con esa referencia',
        })
        return
      }

      const matchAmount = data.find(
        (tx) => Math.abs(Number(tx.amount) - parseFloat(amount)) < 0.01
      )

      if (matchAmount) {
        setResult({
          found: true,
          transaction: matchAmount,
          message: 'Transaccion encontrada',
        })
      } else {
        setResult({
          found: false,
          message: `Se encontraron ${data.length} transaccion(es) con esa referencia, pero ninguna coincide con el monto de $${parseFloat(amount).toLocaleString()}`,
          transactions: data,
        })
      }
    } catch (err) {
      console.error('Error verifying transaction:', err)
      setError('Error al buscar la transaccion. Intenta de nuevo.')
    } finally {
      setSearching(false)
    }
  }

  function handleClear() {
    setAmount('')
    setReference('')
    setResult(null)
    setError('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Registrar Pago</h1>
        <p className="text-slate-500 mt-1">Verifica una transaccion por referencia</p>
      </div>

      <div className="bg-white rounded-odoo shadow-odoo p-6">
        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Monto del Pago
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-odoo text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Referencia
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Hash className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-odoo text-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ej: ABC123456"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-odoo text-sm text-red-700 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 py-4 border border-slate-300 text-slate-700 rounded-odoo text-base font-medium hover:bg-slate-50 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={searching}
              className="flex-[2] flex items-center justify-center gap-3 py-4 bg-primary-600 text-white rounded-odoo text-lg font-bold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {searching ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Search className="h-6 w-6" />
              )}
              Verificar
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div
          className={`rounded-odoo shadow-odoo p-6 ${
            result.found
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-white border-2 border-slate-200'
          }`}
        >
          {result.found ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-green-800">Pago Confirmado</h3>
                <p className="text-sm text-green-600 mt-1">{result.message}</p>
              </div>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Monto</span>
                  <span className="text-sm font-bold text-slate-900">
                    ${Number(result.transaction.amount).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Referencia</span>
                  <span className="text-sm font-medium text-slate-900">
                    {result.transaction.reference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Banco</span>
                  <span className="text-sm font-medium text-slate-900">
                    {result.transaction.bank || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Estado</span>
                  <span
                    className={`badge ${
                      result.transaction.status === 'approved'
                        ? 'badge-success'
                        : result.transaction.status === 'pending'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {result.transaction.status === 'approved'
                      ? 'Aprobado'
                      : result.transaction.status === 'pending'
                      ? 'Pendiente'
                      : 'Duplicado'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleClear}
                className="w-full py-3 bg-primary-600 text-white rounded-odoo text-base font-medium hover:bg-primary-700 transition-colors"
              >
                Nueva Verificacion
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Sin Coincidencia</h3>
                <p className="text-sm text-slate-600 mt-1">{result.message}</p>
              </div>
              {result.transactions && (
                <div className="bg-white rounded-lg p-4 space-y-2 text-left">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2">
                    Transacciones encontradas:
                  </p>
                  {result.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          ${Number(tx.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">{tx.bank}</p>
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
                        {tx.status === 'approved'
                          ? 'Aprobado'
                          : tx.status === 'pending'
                          ? 'Pendiente'
                          : 'Duplicado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleClear}
                className="w-full py-3 border border-slate-300 text-slate-700 rounded-odoo text-base font-medium hover:bg-slate-50 transition-colors"
              >
                Intentar de Nuevo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
