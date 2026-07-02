import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Wifi, WifiOff } from 'lucide-react'

export default function TransactionListener({ onTransactionConfirmed }) {
  const { profile } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const channelRef = useRef(null)

  const handleNewTransaction = useCallback((payload) => {
    const tx = payload.new

    if (tx.tenant_id !== profile?.tenant_id) return

    setLastEvent({
      id: tx.id,
      amount: tx.amount,
      reference: tx.reference,
      status: tx.status,
      timestamp: new Date(),
    })

    if (tx.status === 'approved') {
      onTransactionConfirmed?.(tx)
    }
  }, [profile?.tenant_id, onTransactionConfirmed])

  useEffect(() => {
    if (!profile?.tenant_id) return

    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        handleNewTransaction
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        handleNewTransaction
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [profile?.tenant_id, handleNewTransaction])

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <>
          <div className="relative">
            <Wifi className="h-4 w-4 text-green-600" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-xs text-green-600 font-medium">Conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-red-500" />
          <span className="text-xs text-red-500 font-medium">Sin conexion</span>
        </>
      )}
    </div>
  )
}
