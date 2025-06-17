import {
    Cake,
    CupSoda,
    Salad,
    Martini,
    Percent,
    Pizza,
    Utensils,
    Sandwich,
    Leaf,
    GlassWater,
} from 'lucide-react'

import { Coffee } from 'lucide-react'

export const categoryNames: Record<number, { ar: string; en: string }> = {
    1: { ar: 'مشروبات ساخنة', en: 'Hot Drinks' },
    2: { ar: 'مشروبات فريش', en: 'Fresh Drinks' },
    3: { ar: 'سموزي', en: 'Smoothies' },
    4: { ar: 'برجرز', en: 'Burgers' },
    5: { ar: 'مكرونات', en: 'Pasta' },
    6: { ar: 'بيتزا', en: 'Pizza' },
    7: { ar: 'خصومات', en: 'Discounts' },
    8: { ar: 'كوكتيلات', en: 'Cocktails' },
    9: { ar: 'سلطات', en: 'Salads' },
    10: { ar: 'مقبلات', en: 'Appetizers' },
    11: { ar: 'حلويات', en: 'Desserts' },
}
export const categoryStyles: Record<number, { color: string; icon: any }> = {
    1: { color: 'bg-orange-400', icon: Coffee },
    2: { color: 'bg-yellow-400', icon: GlassWater },
    3: { color: 'bg-pink-500', icon: Leaf },
    4: { color: 'bg-red-500', icon: Sandwich },
    5: { color: 'bg-purple-500', icon: Utensils },
    6: { color: 'bg-green-500', icon: Pizza },
    7: { color: 'bg-blue-500', icon: Percent },
    8: { color: 'bg-rose-500', icon: Martini },
    9: { color: 'bg-lime-500', icon: Salad },
    10: { color: 'bg-cyan-500', icon: CupSoda },
    11: { color: 'bg-fuchsia-500', icon: Cake },
}
