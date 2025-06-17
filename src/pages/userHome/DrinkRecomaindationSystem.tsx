import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/useAuth'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || ''
const LOCATION = import.meta.env.VITE_WEATHER_LOCATION || 'Cairo, Egypt'

// تعريف أنواع التصنيفات المطلوبة
const DRINK_CATEGORIES = [
    { ar: 'مشروبات ساخنة', en: 'Hot Drinks', type: 'hot' },
    { ar: 'مشروبات فريش', en: 'Fresh Drinks', type: 'cold' },
    { ar: 'سموزي', en: 'Smoothies', type: 'cold' },
]

// تحديد نوع التوصية بناءً على درجة الحرارة
const getDrinkType = (tempC: number) => {
    if (tempC >= 29) return 'cold'
    if (tempC >= 22) return 'all'
    if (tempC >= 16) return 'hot'
    return 'hot'
}

export default function DrinkRecomaindationSystem() {
    const [temp, setTemp] = useState<number | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [drinks, setDrinks] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const {
        session: { user },
        updateLoyaltyPoints,
    } = useAuth()
    const location = useLocation ? useLocation() : { search: '' }
    const navigate = useNavigate ? useNavigate() : () => {}
    const params = new URLSearchParams(location.search)
    const table = params.get('table') || params.get('tableNumber')

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [selectedDrink, setSelectedDrink] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // حالة الفاتورة (محملة من localStorage)
    const [invoice, setInvoice] = useState<any[]>(() => {
        const stored = localStorage.getItem('invoice')
        return stored ? JSON.parse(stored) : []
    })
    // حفظ الفاتورة في localStorage عند كل تغيير
    useEffect(() => {
        localStorage.setItem('invoice', JSON.stringify(invoice))
    }, [invoice])

    // جلب حالة الطقس
    useEffect(() => {
        setLoading(true)
        fetch(
            `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(
                LOCATION
            )}&lang=ar`
        )
            .then((res) => res.json())
            .then((data) => {
                if (
                    data &&
                    data.current &&
                    typeof data.current.temp_c === 'number'
                ) {
                    setTemp(data.current.temp_c)
                } else {
                    setError('تعذر جلب حالة الطقس الآن.')
                }
                setLoading(false)
            })
            .catch(() => {
                setError('تعذر جلب حالة الطقس الآن.')
                setLoading(false)
            })
    }, [])

    // جلب التصنيفات والمنتجات
    useEffect(() => {
        const fetchData = async () => {
            // جلب التصنيفات (cast as any[] to avoid type errors)
            const { data: catsRaw } = await supabase
                .from('categories' as any)
                .select('id, name_ar, name_en')
            const cats = Array.isArray(catsRaw) ? catsRaw : []
            setCategories(cats)
            // استخراج id للتصنيفات المطلوبة مع حماية ضد الأخطاء
            const getId = (cat: any) =>
                cat && typeof cat === 'object' && 'id' in cat
                    ? cat.id
                    : undefined
            const hotCat = cats.find(
                (c: any) =>
                    c.name_ar === 'مشروبات ساخنة' || c.name_en === 'Hot Drinks'
            )
            const freshCat = cats.find(
                (c: any) =>
                    c.name_ar === 'مشروبات فريش' || c.name_en === 'Fresh Drinks'
            )
            const smoothieCat = cats.find(
                (c: any) => c.name_ar === 'سموزي' || c.name_en === 'Smoothies'
            )
            const ids = [
                getId(hotCat),
                getId(freshCat),
                getId(smoothieCat),
            ].filter(Boolean)
            if (!ids.length) return
            const { data: items } = await supabase
                .from('items')
                .select('id, name_ar, name_en, category_id, price, points')
            setDrinks(
                (items || []).filter((item: any) =>
                    ids.includes(item.category_id)
                )
            )
        }
        fetchData()
    }, [])

    // منطق التوصية
    let drinkType = temp !== null ? getDrinkType(temp) : null
    let recommendedDrinks: any[] = []
    if (drinkType === 'hot') {
        // فقط مشروبات ساخنة
        recommendedDrinks = drinks.filter((d) => {
            const cat = categories.find((c) => c.id === d.category_id)
            return (
                cat &&
                (cat.name_ar === 'مشروبات ساخنة' ||
                    cat.name_en === 'Hot Drinks')
            )
        })
    } else if (drinkType === 'cold') {
        // فقط مشروبات باردة (فريش أو سموزي)
        recommendedDrinks = drinks.filter((d) => {
            const cat = categories.find((c) => c.id === d.category_id)
            return (
                cat &&
                (cat.name_ar === 'مشروبات فريش' ||
                    cat.name_en === 'Fresh Drinks' ||
                    cat.name_ar === 'سموزي' ||
                    cat.name_en === 'Smoothies')
            )
        })
    } else if (drinkType === 'all') {
        // مزيج من الساخنة والباردة
        const hot = drinks.filter((d) => {
            const cat = categories.find((c) => c.id === d.category_id)
            return (
                cat &&
                (cat.name_ar === 'مشروبات ساخنة' ||
                    cat.name_en === 'Hot Drinks')
            )
        })
        const cold = drinks.filter((d) => {
            const cat = categories.find((c) => c.id === d.category_id)
            return (
                cat &&
                (cat.name_ar === 'مشروبات فريش' ||
                    cat.name_en === 'Fresh Drinks' ||
                    cat.name_ar === 'سموزي' ||
                    cat.name_en === 'Smoothies')
            )
        })
        recommendedDrinks = [...hot, ...cold]
    }

    // جمل التوصية
    const recommendationText =
        temp !== null
            ? drinkType === 'hot'
                ? {
                      emoji: '☕🍵',
                      title: 'جرب مشروب دافي!',
                      desc: 'الجو لطيف أو بارد، المشروبات الساخنة هتدفيك أكتر.',
                  }
                : drinkType === 'cold'
                ? {
                      emoji: '🧊🥤',
                      title: 'جرب مشروب مثلج أو عصير بارد!',
                      desc: 'الجو حر اليوم، المشروبات الباردة هتنعشك!',
                  }
                : {
                      emoji: '🥤☕',
                      title: 'مشروبات باردة أو ساخنة؟',
                      desc: 'الجو معتدل، جرب اللي نفسك فيه!',
                  }
            : null

    // عند الضغط على مشروب
    const handleDrinkClick = (drink: any) => {
        setSelectedDrink(drink)
        setConfirmDialogOpen(true)
    }

    // عند تأكيد الطلب
    const handleConfirmOrder = async () => {
        if (!selectedDrink || !table) {
            setConfirmDialogOpen(false)
            setSelectedDrink(null)
            if (!table) navigate('/choose-table')
            return
        }
        setIsSubmitting(true)
        try {
            // إضافة للفاتورة
            setInvoice((prev: any[]) => {
                const newInvoice = [
                    ...prev,
                    {
                        name: selectedDrink.name_ar,
                        quantity: 1,
                        type: 'cash',
                        price: selectedDrink.price || 0,
                        points: null,
                    },
                ]
                localStorage.setItem('invoice', JSON.stringify(newInvoice))
                return newInvoice
            })
            await supabase.from('waiter_requests').insert([
                {
                    table_number: Number(table),
                    request: selectedDrink.name_ar + ' (طلب من توصية الطقس)',
                    status: 'new',
                    created_at: new Date().toISOString(),
                    deleted: false,
                    user_id: user?.id,
                    user_name: user?.email.split('@')[0] || '',
                },
            ])
            updateLoyaltyPoints(1)
            toast({
                title: 'تم إرسال الطلب',
                description: 'تم إرسال طلبك بنجاح وسيظهر للنادل.',
                duration: 3000,
            })
        } catch (err) {
            toast({
                title: 'خطأ',
                description: 'حدث خطأ أثناء إرسال الطلب.',
                variant: 'destructive',
            })
        }
        setIsSubmitting(false)
        setConfirmDialogOpen(false)
        setSelectedDrink(null)
    }

    return (
        <Card className='w-full flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl shadow-lg bg-gradient-to-r from-[#f9f6ff] to-[#fff8f0] dark:from-[#23243a] dark:to-[#181a20] border-2 border-gold/10 my-4'>
            <div className='font-bold text-base sm:text-lg mb-1 text-center flex items-center gap-2'>
                <span className='text-2xl'>🍹</span>
                توصية المشروبات حسب الطقس
            </div>
            {loading ? (
                <div className='flex items-center gap-2 text-yellow-700 font-bold'>
                    <Loader2 className='animate-spin' /> جاري جلب حالة الطقس...
                </div>
            ) : error ? (
                <div className='text-red-600 font-bold'>{error}</div>
            ) : recommendationText ? (
                <div className='w-full flex flex-col items-center gap-2'>
                    <div className='text-3xl mb-1'>
                        {recommendationText.emoji}
                    </div>
                    <div className='font-extrabold text-lg text-kian-burgundy dark:text-gold text-center mb-1'>
                        درجة الحرارة الآن:{' '}
                        <span className='text-yellow-700 dark:text-yellow-200'>
                            {temp}°C
                        </span>
                    </div>
                    <div className='text-base text-gray-700 dark:text-yellow-100 text-center mb-2'>
                        {`بما أن درجة الحرارة ${temp}°C، أنا بقترح عليك تختار: `}
                        <span className='font-bold text-yellow-900 dark:text-yellow-200'>
                            {recommendationText.title}
                        </span>
                    </div>
                    <div className='text-sm text-gray-600 dark:text-yellow-200 text-center mb-2'>
                        {recommendationText.desc}
                    </div>
                    <div className='flex flex-wrap gap-2 justify-center mt-2'>
                        {recommendedDrinks.length === 0 ? (
                            <span className='text-gray-400'>
                                لا توجد مشروبات متاحة حالياً
                            </span>
                        ) : (
                            recommendedDrinks.map((drink) => (
                                <span
                                    key={drink.id}
                                    className='px-3 py-1 rounded-full bg-yellow-100 text-yellow-900 font-bold text-sm border border-yellow-300 shadow-sm dark:bg-yellow-900 dark:text-yellow-100 dark:border-yellow-700 cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 transition'
                                    onClick={() => handleDrinkClick(drink)}
                                >
                                    {drink.name_ar}
                                </span>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
            <Dialog
                open={confirmDialogOpen}
                onOpenChange={setConfirmDialogOpen}
            >
                <DialogContent className='max-w-sm w-full rounded-2xl shadow-2xl'>
                    <DialogHeader>
                        <DialogTitle className='text-xl font-bold text-yellow-700 dark:text-yellow-300'>
                            تأكيد إرسال الطلب
                        </DialogTitle>
                    </DialogHeader>
                    <div className='text-center text-base mb-4'>
                        {selectedDrink && (
                            <>
                                هل أنت متأكد أنك تريد طلب "
                                {selectedDrink.name_ar}"؟ سيتم إرسال الطلب
                                للنادل.
                            </>
                        )}
                    </div>
                    <DialogFooter className='flex gap-2 justify-center'>
                        <Button
                            variant='secondary'
                            onClick={() => {
                                setConfirmDialogOpen(false)
                                setSelectedDrink(null)
                            }}
                            disabled={isSubmitting}
                        >
                            إلغاء
                        </Button>
                        <Button
                            className='bg-yellow-500 hover:bg-yellow-600 text-white font-bold'
                            onClick={handleConfirmOrder}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '...جاري الإرسال' : 'تأكيد الطلب'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}
