import React, { createContext, useContext, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

interface LoyaltyPointsContextType {
    points: number | null
    setPoints: (pts: number | null) => void
    refreshPoints: () => Promise<void>
}

const LoyaltyPointsContext = createContext<
    LoyaltyPointsContextType | undefined
>(undefined)

export const LoyaltyPointsProvider = ({
    children,
}: {
    children: React.ReactNode
}) => {
    const { session } = useAuth()
    if (session === undefined) {
        throw new Error(
            'LoyaltyPointsProvider must be used within AuthProvider'
        )
    }
    const user = session?.user
    const [points, setPoints] = useState<number | null>(null)

    const refreshPoints = useCallback(async () => {
        if (!user?.id) return
        const { data, error } = await (supabase as any)
            .from('loyalty_visits')
            .select('points')
            .eq('user_id', user.id)
            .single()
        if (!error && data) setPoints(data.points)
    }, [user?.id])

    React.useEffect(() => {
        refreshPoints()
        if (!user?.id) return
        const channel = supabase
            .channel('loyalty_points_user_' + user.id)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'loyalty_visits',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newRow: any = payload.new
                    if (newRow && typeof newRow.points === 'number') {
                        setPoints(newRow.points)
                    }
                }
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [refreshPoints, user?.id])

    return (
        <LoyaltyPointsContext.Provider
            value={{ points, setPoints, refreshPoints }}
        >
            {children}
        </LoyaltyPointsContext.Provider>
    )
}

export const useLoyaltyPoints = () => {
    const ctx = useContext(LoyaltyPointsContext)
    if (!ctx)
        throw new Error(
            'useLoyaltyPoints must be used within LoyaltyPointsProvider'
        )
    return ctx
}
