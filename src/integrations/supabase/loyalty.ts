/**
 * يجلب معلومات نقاط الولاء للعميل بناءً على رقم الهاتف
 */

import { supabase } from './client';

// جلب معلومات نقاط الولاء بناءً على userId
export async function getLoyaltyPointsByUserId(userId: string): Promise<{ points: number, reward?: string, found: boolean, gift?: string | null, got_the_gift?: boolean | null }> {
  if (!userId) {
    return { points: 0, found: false };
  }
  const { data, error } = await supabase
    .from("loyalty_visits")
    .select("points, gift, got_the_gift")
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
    found: true,
    gift: (data && typeof data === 'object' && 'gift' in data) ? (data as any).gift ?? null : null,
    got_the_gift: (data && typeof data === 'object' && 'got_the_gift' in data) ? (data as any).got_the_gift ?? null : null
  };
}

/**
 * دالة منفصلة لتحديث عمود gift عند وصول النقاط إلى 10 أو 20 فقط
 */
export async function updateGiftForLoyaltyByUserId(userId: string, points: number) {
  let gift = null;
  if (points === 10) {
    gift = "عصير مجاني";
  } else if (points > 10 && points < 20) {
    gift = "customerGiftIfThePointsMoreThanTen";
  } else if (points === 20) {
    gift = "خصم 20%";
  } else if (points > 20) {
    gift = "customerGiftIfThePointsMoreThanTwenty";
  } else {
    gift = null;
  }
  await supabase
    .from("loyalty_visits")
    .update({ gift })
    .eq("user_id", userId);
}

/**
 * دالة تقوم بمزامنة عمود gift مع النقاط لجميع العملاء
 */
export async function syncGiftWithPoints() {
  const { data, error } = await supabase
    .from("loyalty_visits")
    .select("id, user_id, points, gift");
  if (error) {
    console.error("Error fetching loyalty records for syncGiftWithPoints:", error);
    return;
  }
  if (!data || data.length === 0) return;
  for (const row of data) {
    if (!row || typeof row !== 'object') continue;
    const points = 'points' in row ? (row as any).points ?? 0 : 0;
    const id = 'id' in row ? (row as any).id : null;
    const gift = 'gift' in row ? (row as any).gift : null;
    let correctGift = null;
    if (points === 10) correctGift = "مشروب مجاني";
    else if (points > 10 && points < 20) correctGift = "العميل كان له مشروب مجاني";
    else if (points === 20) correctGift = "خصم 20%";
    else if (points > 20) correctGift = "العميل كان له خصم 20%";
    else correctGift = null;
    if (gift !== correctGift && id) {
      await supabase
        .from("loyalty_visits")
        .update({ gift: correctGift })
        .eq("id", id);
    }
  }
}

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
      if (points === 10 || points === 20) {
        await updateGiftForLoyaltyByUserId(userId, points);
      }
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
    const gift = points === 10 ? "عصير مجاني" : points === 20 ? "خصم 20%" : points > 20 ? "customerGiftIfThePointsMoreThanTwenty" : null;
    const { error: insertError } = await supabase
      .from("loyalty_visits")
      .insert([{ 
        user_id: userId, 
        user_name: userName,
        phone_number: null,
        points, 
        last_visit: now,
        created_at: now,
        status: 'active',
        gift
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

