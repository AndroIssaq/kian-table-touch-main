

/**
 * تسجّل زيارة جديدة للعميل بناءً على رقم الهاتف.
 * إذا كان العميل موجودًا، يتم زيادة النقاط. إذا وصل لعدد معين من النقاط، يمكن إظهار مكافأة.
 * @param phoneNumber رقم الهاتف للعميل
 * @param withPhoneNumber إذا كان الطلب يتضمن رقم هاتف
 * @returns كائن يحتوي على النقاط الحالية ونوع المكافأة (إن وجدت) وما إذا كان المستخدم قد حصل على نقاط اليوم
 */
/**
 * يجلب معلومات نقاط الولاء للعميل بناءً على رقم الهاتف
 * @param phoneNumber رقم الهاتف للعميل
 * @returns كائن يحتوي على النقاط الحالية ونوع المكافأة (إن وجدت)
 */
export async function getLoyaltyPoints(phoneNumber: string): Promise<{ points: number, reward?: string, found: boolean }> {
  // إذا لم يتم توفير رقم هاتف
  if (!phoneNumber || phoneNumber.trim() === "") {
    return { points: 0, found: false };
  }
  
  // تنظيف رقم الهاتف من أي أحرف غير رقمية
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
  
  // جلب بيانات العميل من جدول الولاء
  const { data, error } = await supabase
    .from("loyalty_visits")
    .select("points")
    .eq("phone_number", cleanPhoneNumber)
    .single();

  if (error) {
    // إذا لم يتم العثور على العميل
    if (error.code === "PGRST116") {
      return { points: 0, found: false };
    }
    // خطأ آخر
    console.error("Error fetching loyalty points:", error);
    throw error;
  }

  let reward;
  // التحقق من المكافآت
  if (data.points === 20) {
    reward = "special_discount";  // 20% discount
  } else if (data.points === 10) {
    reward = "free_drink";  // Free drink
  }

  return { points: data.points, reward, found: true };
}

export async function registerLoyaltyVisit(phoneNumber: string, withPhoneNumber: boolean = true): Promise<{ points: number, reward?: string, alreadyVisitedToday?: boolean, isNewUser?: boolean }> {
  // إذا لم يتم توفير رقم هاتف ولكن تم طلب النادل
  if (!phoneNumber || phoneNumber.trim() === "") {
    // إذا لم يتم توفير رقم هاتف، لا نعطي أي نقاط ولاء
    return { points: 0, isNewUser: true };
  }
  
  // تنظيف رقم الهاتف من أي أحرف غير رقمية
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
  
  // جلب بيانات العميل من جدول الولاء
  const { data, error } = await supabase
    .from("loyalty_visits")
    .select("id,phone_number,points,last_visit,created_at,status")
    .eq("phone_number", cleanPhoneNumber)
    .single();

  if (error && error.code !== "PGRST116") {
    // خطأ غير "not found"
    throw error;
  }

  // التحقق مما إذا كان المستخدم قد زار بالفعل اليوم
  const today = new Date().toISOString().split('T')[0]; // الحصول على التاريخ الحالي بتنسيق YYYY-MM-DD
  
  let points = 0;
  let reward;
  let alreadyVisitedToday = false;
  let isNewUser = false;

  if (data) {
    // التحقق مما إذا كانت آخر زيارة اليوم
    const lastVisitDate = data.last_visit.split('T')[0];
    alreadyVisitedToday = lastVisitDate === today;
    
    if (alreadyVisitedToday) {
      // إذا زار بالفعل اليوم، لا نضيف نقاط
      points = data.points;
    } else if (withPhoneNumber) {
      // إذا لم يزر اليوم وقدم رقم هاتف، نضيف نقطة واحدة فقط
      points = data.points + 1;
      
      await supabase
        .from("loyalty_visits")
        .update({ 
          points, 
          last_visit: new Date().toISOString() 
        })
        .eq("id", data.id);
    } else {
      // إذا لم يقدم رقم هاتف، لا نضيف نقاط
      points = data.points;
    }

    // التحقق من المكافآت
    if (points === 20) {
      reward = "special_discount";  // 20% discount
    } else if (points === 10) {
      reward = "free_drink";  // Free drink
    }
  } else {
    // إنشاء سجل جديد للعميل
    isNewUser = true;
    points = withPhoneNumber ? 1 : 0; // نقطة واحدة للمستخدمين الجدد الذين يقدمون رقم هاتف
    const now = new Date().toISOString();
    
    const { error: insertError } = await supabase
      .from("loyalty_visits")
      .insert([{ 
        phone_number: cleanPhoneNumber, 
        points, 
        last_visit: now,
        created_at: now,
        status: 'active'
      }]);
      
    if (insertError) {
      console.error("Error inserting loyalty visit:", insertError);
      throw insertError;
    }
  }

  return { points, reward, alreadyVisitedToday, isNewUser };
}

// Remove these lines (137-142):
// import { createClient } from '@supabase/supabase-js';
// 
// const supabase = createClient(
//   import.meta.env.VITE_SUPABASE_URL,
//   import.meta.env.VITE_SUPABASE_ANON_KEY!
// );

// At the top of your file, add this import if it's not already there:
import { supabase } from './client';

export default async function handler(req: Request) {
  try {
    const { code, phone_number } = await req.json();

    // 1. التحقق من الكود وصلاحيته
    const { data: codeData, error: codeError } = await supabase
      .from('daily_codes')
      .select('*')
      .eq('code', code)
      .order('created_at', { ascending: false })
      .limit(1);

    if (codeError || !codeData || codeData.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'الكود غير صالح' }), { status: 400 });
    }

    const dailyCode = codeData[0];
    const now = new Date();
    const validUntil = new Date(dailyCode.valid_until);
    if (now > validUntil) {
      return new Response(JSON.stringify({ success: false, message: 'انتهت صلاحية الكود' }), { status: 400 });
    }

    // 2. التحقق من أن المستخدم لم يحصل على نقطة اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: visitData, error: visitError } = await supabase
      .from('loyalty_visits')
      .select('*')
      .eq('phone_number', phone_number)
      .gte('last_visit', today.toISOString())
      .limit(1);

    if (visitError) {
      return new Response(JSON.stringify({ success: false, message: 'خطأ في التحقق من النقاط' }), { status: 500 });
    }

    if (visitData && visitData.length > 0) {
      // المستخدم حصل على نقطة اليوم بالفعل
      return new Response(JSON.stringify({
        success: true,
        alreadyVisitedToday: true,
        points: visitData[0].points,
        reward: getReward(visitData[0].points)
      }), { status: 200 });
    }

    // 3. منح النقطة وتحديث قاعدة البيانات
    // تحقق إذا كان للمستخدم سجل سابق
    const { data: oldVisit, error: oldVisitError } = await supabase
      .from('loyalty_visits')
      .select('*')
      .eq('phone_number', phone_number)
      .limit(1);

    let points = 1;
    let reward = null;

    if (oldVisit && oldVisit.length > 0) {
      points = oldVisit[0].points + 1;
      reward = getReward(points);

      const { error: updateError } = await supabase
        .from('loyalty_visits')
        .update({ points, last_visit: now.toISOString() })
        .eq('phone_number', phone_number);

      if (updateError) {
        return new Response(JSON.stringify({ success: false, message: 'خطأ في تحديث النقاط' }), { status: 500 });
      }
    } else {
      // مستخدم جديد
      const { error: insertError } = await supabase
        .from('loyalty_visits')
        .insert([{ phone_number, points: 1, last_visit: now.toISOString() }]);

      if (insertError) {
        return new Response(JSON.stringify({ success: false, message: 'خطأ في إضافة النقاط' }), { status: 500 });
      }
    }

    // 4. إرجاع النتيجة فقط للواجهة الأمامية
    return new Response(JSON.stringify({
      success: true,
      alreadyVisitedToday: false,
      points,
      reward
    }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'خطأ غير متوقع' }), { status: 500 });
  }
}

// دالة مساعدة لحساب المكافأة
function getReward(points: number) {
  if (points === 10) return 'free_drink';
  if (points === 20) return 'special_discount';
  return null;
}