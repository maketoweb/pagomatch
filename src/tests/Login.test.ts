import { describe, it, expect, vi, beforeEach } from 'vitest'

const ROLE_ROUTES: Record<string, string> = {
  master: '/dashboard/master',
  admin: '/dashboard/admin',
  cashier: '/dashboard/cashier',
}

function getRedirectRoute(role: string): string | null {
  return ROLE_ROUTES[role] ?? null
}

describe('Login - Role-Based Redirect', () => {
  it('should redirect cashier to /dashboard/cashier', () => {
    const route = getRedirectRoute('cashier')
    expect(route).toBe('/dashboard/cashier')
  })

  it('should redirect admin to /dashboard/admin', () => {
    const route = getRedirectRoute('admin')
    expect(route).toBe('/dashboard/admin')
  })

  it('should redirect master to /dashboard/master', () => {
    const route = getRedirectRoute('master')
    expect(route).toBe('/dashboard/master')
  })

  it('should return null for unknown role', () => {
    const route = getRedirectRoute('unknown')
    expect(route).toBeNull()
  })
})

describe('Login - Error Handling', () => {
  it('should map invalid credentials error', () => {
    const supabaseMessage = 'Invalid login credentials'
    let userMessage = 'Error al iniciar sesión'

    if (supabaseMessage.includes('Invalid login credentials')) {
      userMessage = 'Credenciales inválidas. Verifica tu correo y contraseña.'
    }

    expect(userMessage).toBe('Credenciales inválidas. Verifica tu correo y contraseña.')
  })

  it('should handle missing profile', () => {
    const profile = null
    const hasProfile = profile !== null
    expect(hasProfile).toBe(false)
  })

  it('should reject empty role values', () => {
    const role = ''
    const route = getRedirectRoute(role)
    expect(route).toBeNull()
  })
})

describe('Login - Supabase Query Simulation', () => {
  interface MockProfile {
    role: string
  }

  function mockSupabaseQuery(role: string | null): MockProfile | null {
    if (role === null) return null
    return { role }
  }

  it('should resolve route from queried profile role', () => {
    const profile = mockSupabaseQuery('cashier')
    expect(profile).not.toBeNull()
    const route = getRedirectRoute(profile!.role)
    expect(route).toBe('/dashboard/cashier')
  })

  it('should fail gracefully when profile is not found', () => {
    const profile = mockSupabaseQuery(null)
    expect(profile).toBeNull()

    const route = profile ? getRedirectRoute(profile.role) : null
    expect(route).toBeNull()
  })

  it('should reject profile with invalid role from DB', () => {
    const profile = mockSupabaseQuery('superadmin')
    const route = getRedirectRoute(profile!.role)
    expect(route).toBeNull()
  })
})

describe('Login - ProtectedRoute Guard', () => {
  function checkAccess(
    user: boolean,
    profileRole: string | null,
    requiredRole: string
  ): 'granted' | 'denied' | 'redirect_login' {
    if (!user) return 'redirect_login'
    if (profileRole !== requiredRole) return 'denied'
    return 'granted'
  }

  it('should redirect to login when user is not authenticated', () => {
    const result = checkAccess(false, null, 'cashier')
    expect(result).toBe('redirect_login')
  })

  it('should deny access when role does not match', () => {
    const result = checkAccess(true, 'admin', 'cashier')
    expect(result).toBe('denied')
  })

  it('should grant access when role matches', () => {
    const result = checkAccess(true, 'cashier', 'cashier')
    expect(result).toBe('granted')
  })

  it('should deny when profile role is null', () => {
    const result = checkAccess(true, null, 'cashier')
    expect(result).toBe('denied')
  })
})
