import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authStore'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    supabase.auth.getSession().then(({ data: { session } }) => { setUser(session?.user ?? null); setIsLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo(() => ({
    user,
    isLoading,
    isConfigured: isSupabaseConfigured,
    async login(email, password) {
      if (!isSupabaseConfigured) return { error: 'Falta configurar la conexión con Supabase.' }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      return { error: error?.message ?? null }
    },
    async register({ name, email, password }) {
      if (!isSupabaseConfigured) return { error: 'Falta configurar la conexión con Supabase.' }
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim() } } })
      if (error) return { error: error.message }
      if (data.session) await supabase.auth.signOut()
      return { error: null, needsEmailConfirmation: !data.session }
    },
    async logout() { if (supabase) await supabase.auth.signOut() },
  }), [user, isLoading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
