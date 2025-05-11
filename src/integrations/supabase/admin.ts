import { supabase } from "./client";

export interface Admin {
  id: string;
  name: string;
}

export async function verifyAdmin(name: string, password: string) {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id, Name')
      .eq('Name', name.trim().toLowerCase()) // إضافة تحويل للحروف الصغيرة
      .eq('password', password.trim()) // إضافة trim لإزالة المسافات
      .single();

    console.log('Debug:', { data, error }); // <-- إضافة console.log للتصحيح
    if (error || !data) {
      return { success: false };
    }

    return { 
      success: true, 
      admin: data as Admin 
    };
  } catch (error) {
    console.error('Error verifying admin:', error);
    return { success: false };
  }
}