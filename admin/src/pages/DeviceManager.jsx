import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
  Smartphone,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

function generatePairingCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function getTimeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'ahora'
  if (diffMins < 60) return `hace ${diffMins}m`
  if (diffHours < 24) return `hace ${diffHours}h`
  return `hace ${diffDays}d`
}

function isCodeExpired(created_at) {
  const now = new Date()
  const created = new Date(created_at)
  const diffHours = (now - created) / (1000 * 60 * 60)
  return diffHours > 24
}

export default function DeviceManager() {
  const { profile } = useAuth()
  const [devices, setDevices] = useState([])
  const [pairingCode, setPairingCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchDevices()
    }
  }, [profile?.tenant_id])

  async function fetchDevices() {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDevices(data || [])

      const activePending = (data || []).find(
        (d) => !d.device_id && d.is_active && !isCodeExpired(d.created_at)
      )
      if (activePending) {
        setPairingCode(activePending.pairing_code)
      }
    } catch (err) {
      console.error('Error fetching devices:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateCode() {
    setGenerating(true)
    setError('')

    try {
      await supabase
        .from('devices')
        .update({ is_active: false })
        .eq('tenant_id', profile.tenant_id)
        .is('device_id', null)
        .eq('is_active', true)

      const code = generatePairingCode()

      const { error: insertError } = await supabase.from('devices').insert({
        tenant_id: profile.tenant_id,
        pairing_code: code,
        is_active: true,
      })

      if (insertError) throw insertError

      setPairingCode(code)
      await fetchDevices()
    } catch (err) {
      console.error('Error generating code:', err)
      setError('Error al generar el código. Intenta de nuevo.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopyCode() {
    if (!pairingCode) return
    try {
      await navigator.clipboard.writeText(pairingCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = pairingCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleDeactivateDevice(deviceId) {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ is_active: false })
        .eq('id', deviceId)

      if (error) throw error
      if (devices.find((d) => d.id === deviceId && !d.device_id)) {
        setPairingCode('')
      }
      await fetchDevices()
    } catch (err) {
      console.error('Error deactivating device:', err)
    }
  }

  async function handleDeleteDevice(deviceId) {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId)

      if (error) throw error
      if (devices.find((d) => d.id === deviceId && !d.device_id)) {
        setPairingCode('')
      }
      setConfirmDelete(null)
      await fetchDevices()
    } catch (err) {
      console.error('Error deleting device:', err)
    }
  }

  const linkedDevices = devices.filter((d) => d.device_id)
  const pendingDevices = devices.filter((d) => !d.device_id && d.is_active && !isCodeExpired(d.created_at))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vincular Dispositivo</h1>
        <p className="text-slate-500 mt-1">
          Genera un código para vincular la app Puente a tu tienda
        </p>
      </div>

      <div className="bento-card max-w-2xl">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center w-20 h-20 bg-primary-100 rounded-2xl mx-auto">
            <Smartphone className="h-10 w-10 text-primary-600" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Código de Vinculación
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Ingresa este código en la app Puente para conectar tu dispositivo
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {pairingCode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <div className="px-8 py-4 bg-slate-100 rounded-odoo border-2 border-dashed border-slate-300">
                  <span className="text-4xl font-mono font-bold tracking-[0.3em] text-slate-900">
                    {pairingCode}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Clock className="h-3 w-3" />
                <span>Código válido por 24 horas</span>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Código
                    </>
                  )}
                </button>

                <button
                  onClick={handleGenerateCode}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Generar Nuevo
                </button>
              </div>

              <p className="text-xs text-slate-400">
                El código es válido solo para una vinculación. Una vez emparejado, el código se desactivará.
              </p>
            </div>
          ) : (
            <button
              onClick={handleGenerateCode}
              disabled={generating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-odoo text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Smartphone className="h-5 w-5" />
              )}
              Generar Código de Vinculación
            </button>
          )}
        </div>
      </div>

      {pendingDevices.length > 0 && (
        <div className="bento-card border-l-4 border-l-orange-400">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Código pendiente de vinculación
              </p>
              <p className="text-xs text-slate-500">
                {pendingDevices.length} código(s) esperando conexión con la app Puente
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Dispositivos Vinculados
          {linkedDevices.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({linkedDevices.length})
            </span>
          )}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : linkedDevices.length === 0 ? (
          <div className="bento-card text-center py-12">
            <Smartphone className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No hay dispositivos vinculados</p>
            <p className="text-xs text-slate-400 mt-1">
              Genera un código y usa la app Puente para vincular
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedDevices.map((device) => (
              <div key={device.id} className="bento-card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        device.is_active ? 'bg-green-100' : 'bg-slate-100'
                      }`}
                    >
                      {device.is_active ? (
                        <Wifi className="h-5 w-5 text-green-600" />
                      ) : (
                        <WifiOff className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {device.device_id}
                      </p>
                      <p className="text-xs text-slate-500">
                        Vinculado {getTimeAgo(device.created_at)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      device.is_active ? 'badge-success' : 'badge-danger'
                    }`}
                  >
                    {device.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  {device.is_active ? (
                    <button
                      onClick={() => handleDeactivateDevice(device.id)}
                      className="flex-1 px-3 py-2 text-sm text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      Desactivar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeactivateDevice(device.id)}
                      className="flex-1 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Activar
                    </button>
                  )}
                  {confirmDelete === device.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="px-2 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(device.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
