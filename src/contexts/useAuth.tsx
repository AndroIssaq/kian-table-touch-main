import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'
interface AuthContextType {
    session: Session
    logout: () => Promise<void>
    isAdmin?: boolean
    isLoading?: boolean
    error?: string | null
    setError?: React.Dispatch<React.SetStateAction<string | null>>
    login: (loginData: { email: string; password: string }) => Promise<void>
    signUp?: (signUpData: { email: string; password: string }) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const isAdmin = session?.user?.user_metadata.role === 'admin' // Assuming 'admin' is the role for admin users
    const logout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Error signing out:', error.message)
        } else {
            console.log('User signed out successfully')
        }
    }
    const login = async (loginData: { email: string; password: string }) => {
        const { email, password } = loginData
        setIsLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
            // Update this route to redirect to an authenticated route. The user already has an active session.
            const user = await (await supabase.auth.getUser()).data.user
            if (user?.user_metadata?.role !== 'admin') {
                location.href = '/'
            } else {
                location.href = '/staff-dashboard'
            }
        } catch (error: unknown) {
            setError(
                error instanceof Error ? error.message : 'An error occurred'
            )
        } finally {
            setIsLoading(false)
        }
    }

    const signUp = async (signUpData: { email: string; password: string }) => {
        const { email, password } = signUpData
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        first_name: email.split('@')[0],
                        last_name: 'User',
                        role: 'user',
                    },
                },
            })
            if (error) throw error
        } catch (error: unknown) {
            setError(
                error instanceof Error ? error.message : 'An error occurred'
            )
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setIsLoading(false)
        })
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        console.log('Session updated:', session?.user?.user_metadata)
        console.log(isAdmin ? 'User is an admin' : 'User is not an admin')
    }, [session])

    return (
        <AuthContext.Provider
            value={{
                session,
                logout,
                isAdmin,
                isLoading,
                error,
                login,
                signUp,
                setError,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

// UPDATE auth.users
// SET
//     raw_user_meta_data = '{"sub": "a3462f35-65ac-43bd-b48a-b0a47bf5221b", "role": "admin", "email": "ovic.391@gmail.com", "last_name": "User", "first_name": "ovic.391", "email_verified": true, "phone_verified": false}'::jsonb
// WHERE
//     id = 'a3462f35-65ac-43bd-b48a-b0a47bf5221b'; -- Replace with the actual UUID of the user
