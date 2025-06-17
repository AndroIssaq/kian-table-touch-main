/**
 * يجلب معلومات نقاط الولاء للعميل بناءً على رقم الهاتف
 */

import { supabase } from './client';

// جلب معلومات نقاط الولاء بناءً على userId
export async function getLoyaltyPointsByUserId(userId: string): Promise<{ points: number, reward?: string, found: boolean }> {
  if (!userId) {
    return { points: 0, found: false };
  }
  const { data, error } = await supabase
    .from("loyalty_visits")
    .select("points")
    .eq("user_id", userId)
    .single();
  if (error) {
    if (error.code === "PGRST116") {
      return { points: 0, found: false };
    }
    console.error("Error fetching loyalty points:", error);
    throw error;
  }
  const points = (data && typeof data === 'object' && 'points' in data) ? (data as any).points ?? 0 : 0;
  let reward = undefined;
  if (points >= 20) {
    reward = "special_discount";
  } else if (points >= 10) {
    reward = "free_drink";
  }
  return {
    points,
    reward,
    found: true
  };
}

/**
 * دالة منفصلة لتحديث عمود gift عند وصول النقاط إلى 10 أو 20 فقط
 */
// [REMOVED] updateGiftForLoyaltyByUserId: No longer needed, as 'gift' column is removed.


/**
 * دالة تقوم بمزامنة عمود gift مع النقاط لجميع العملاء
 */
// [REMOVED] syncGiftWithPoints: No longer needed, as 'gift' column is removed.


// تسجيل زيارة جديدة بناءً على userId
export async function registerLoyaltyVisitByUserId(userId: string, userName: string = ""): Promise<{ points: number, reward?: string, alreadyVisitedToday?: boolean, isNewUser?: boolean }> {
  if (!userId) {
    return { points: 0, isNewUser: true };
  }
  const { data, error } = await supabase
    .from("loyalty_visits")
    .select("id,user_id,points,last_visit,created_at,status")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") {
    throw error;
  }
  const today = new Date().toISOString().split('T')[0];
  let points = 0;
  let reward;
  let alreadyVisitedToday = false;
  let isNewUser = false;
  if (data && typeof data === 'object' && 'points' in data) {
    const lastVisitDate = (data as any).last_visit?.split('T')[0];
    alreadyVisitedToday = lastVisitDate === today;
    if (alreadyVisitedToday) {
      points = (data as any).points ?? 0;
    } else {
      points = ((data as any).points ?? 0) + 1;
      await supabase
        .from("loyalty_visits")
        .update({ 
          points, 
          last_visit: new Date().toISOString(),
          user_name: userName,
        })
        .eq("id", (data as any).id);

    }
    if (points === 20) {
      reward = "special_discount";
    } else if (points === 10) {
      reward = "free_drink";
    }
  } else {
    isNewUser = true;
    points = 1;
    const now = new Date().toISOString();
    const { error: insertError } = await supabase
      .from("loyalty_visits")
      .insert([{ 
        user_id: userId, 
        user_name: userName,
        phone_number: null,
        points, 
        last_visit: now,
        created_at: now,
        status: 'active'
      }]);
    if (insertError) {
      console.error("Error inserting loyalty visit:", insertError);
      throw insertError;
    }
    if (points === 20) {
      reward = "special_discount";
    } else if (points === 10) {
      reward = "free_drink";
    }
  }
  return { points, reward, alreadyVisitedToday, isNewUser };
}

