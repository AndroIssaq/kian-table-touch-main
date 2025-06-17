/**
 * يجلب معلومات نقاط الولاء للعميل بناءً على رقم الهاتف
 */

import { supabase } from './client'

/**
 * Fetches loyalty points for a user
 * @param userId The user's ID
 * @returns The user's loyalty points data
 */
export async function getLoyaltyPointsByUserId(userId: string) {
    if (!userId) {
        return { points: 0, found: false }
    }

    const { data, error } = await supabase
        .from('loyalty_visits')
        .select('id,user_id,points,last_visit,created_at,status')
        .eq('user_id', userId)
        .single()

    if (error && error.code !== 'PGRST116') {
        throw error
    }

    return {
        data,
        found: !!data,
    }
}
/**
 * Updates loyalty points for a user
 * @param userId The user's ID
 * @param pointsToAdd The number of points to add (can be negative)
 * @returns The new total points
 */
export async function updateLoyaltyPoints(
    userId: string,
    pointsToAdd: number
): Promise<number> {
    if (!userId) {
        throw new Error('User ID is required')
    }

    const { data, found } = await getLoyaltyPointsByUserId(userId)
    const currentPoints = found && data ? (data as any).points || 0 : 0
    const newPoints = Math.max(0, currentPoints + pointsToAdd)

    // Update points
    const { error: updateError } = await supabase.from('loyalty_visits').upsert(
        {
            user_id: userId,
            points: newPoints,
        },
        { onConflict: 'user_id' }
    )

    if (updateError) {
        throw updateError
    }

    return newPoints
}
