import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react'
import { supabase } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'
import {
    getLoyaltyPointsByUserId,
    updateLoyaltyPoints as updateLoyaltyPointsDb,
} from '@/lib/supabase/loyalty'

interface AuthContextType {
    session: Session | null
    logout: () => Promise<void>
    isAdmin: boolean
    isLoading: boolean
    error: string | null
    setError: React.Dispatch<React.SetStateAction<string | null>>
    login: (loginData: { email: string; password: string }) => Promise<void>
    signUp: (signUpData: { email: string; password: string }) => Promise<void>
    loyaltyPoints: number
    refreshLoyaltyPoints: () => Promise<void>
    updateLoyaltyPoints: (pointsToAdd: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0)
    const isAdmin = session?.user?.user_metadata.role === 'admin'

    const logout = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to sign out'
            setError(message)
            throw new Error(message)
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

            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) throw new Error('User not found after login')

            window.location.href =
                user.user_metadata.role === 'admin' ? '/dashboard' : '/'
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to sign in'
            setError(message)
            throw new Error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const signUp = async (signUpData: { email: string; password: string }) => {
        const { email, password } = signUpData
        setIsLoading(true)
        setError(null)

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
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Failed to sign up'
            setError(message)
            throw new Error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const updateLoyaltyPoints = async (pointsToAdd: number) => {
        if (!session?.user?.id) {
            throw new Error('User must be logged in to update loyalty points')
        }

        try {
            const newPoints = await updateLoyaltyPointsDb(
                session.user.id,
                pointsToAdd
            )
            setLoyaltyPoints(newPoints)
            await refreshLoyaltyPoints()
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to update loyalty points'
            setError(message)
            throw new Error(message)
        }
    }

    const refreshLoyaltyPoints = useCallback(async () => {
        if (!session?.user?.id) return

        try {
            const { data, found } = await getLoyaltyPointsByUserId(
                session.user.id
            )

            if (found && data) {
                setLoyaltyPoints((data as any).points || 0)
            } else {
                setLoyaltyPoints(0)
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Failed to refresh loyalty points'
            setError(message)
        }
    }, [session?.user?.id])

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const {
                    data: { session: initialSession },
                } = await supabase.auth.getSession()
                setSession(initialSession)
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : 'Failed to initialize auth'
                setError(message)
            } finally {
                setIsLoading(false)
            }
        }

        initializeAuth()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (session?.user?.id) {
            refreshLoyaltyPoints()
        } else {
            setLoyaltyPoints(0)
        }
    }, [session, refreshLoyaltyPoints])

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
                loyaltyPoints,
                refreshLoyaltyPoints,
                updateLoyaltyPoints,
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
