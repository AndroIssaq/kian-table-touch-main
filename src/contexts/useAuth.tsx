import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Session } from '@supabase/supabase-js'
interface AuthContextType {
    session: Session
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState(null)

    const logout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Error signing out:', error.message)
        } else {
            console.log('User signed out successfully')
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        console.log(session)
    }, [session])

    return (
        <AuthContext.Provider value={{ session, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider')
    }
    return context
}
