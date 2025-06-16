import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ReceiptText } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import PageTransition from '@/components/PageTransition'
import { toast } from '@/components/ui/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/integrations/supabase/client'
import { registerLoyaltyVisitByUserId } from '@/integrations/supabase/loyalty'
import { useCart } from '@/contexts/CartContext'
import { useLoyaltyPoints } from '@/contexts/LoyaltyPointsContext'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { UserNavbar } from '@/components/UserNavbar'
import { useAuth } from '@/contexts/useAuth'

// --- Types ---
type ItemInfo = { name?: string; id?: string; price?: string }
type InvoiceRow = {
    name: string
    quantity: number
    type: 'cash' | 'loyalty'
    price?: number
    points?: number
}

const CallWaiter: React.FC = () => {
    const navigate = useNavigate()
    const location = useLocation()
    // --- State ---
    const [request, setRequest] = useState<string>('')
    const [tableNumber, setTableNumber] = useState<number | null>(null)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null)
    // Removed loyaltyReward state (gift logic removed)
    const { t, language } = useLanguage()
    const [itemInfo, setItemInfo] = useState<ItemInfo>({})
    const { addToCart, cart, clearCart } = useCart()
    const { refreshPoints } = useLoyaltyPoints()
    const [cartOpen, setCartOpen] = useState<boolean>(false)
    const {
        session: { user },
    } = useAuth()
    const [invoiceDialogOpen, setInvoiceDialogOpen] = useState<boolean>(false)

    // استخراج بيانات الأكل من الكويري سترينج
    // Extract food item info from query string
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const item = params.get('item')
        const itemId = params.get('itemId')
        const price = params.get('price')
        if (item || itemId || price) {
            setItemInfo({
                name: item || undefined,
                id: itemId || undefined,
                price: price || undefined,
            })
        }
    }, [location.search])

    // Redirect if no table number in URL
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const table = params.get('table') || params.get('tableNumber')
        if (!table) {
            navigate('/choose-table')
        }
    }, [location.search, navigate])

    // تحديث رقم الترابيزة من ال URL عند كل تغيير
    // Update table number from URL on every change
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const table = params.get('table') || params.get('tableNumber')
        setTableNumber(table ? Number(table) : null)
    }, [location.search])

    // Handle waiter call form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (tableNumber === null) {
            toast({
                title: t('error'),
                description: t('noTable'),
                variant: 'destructive',
            })
            return
        }

        setIsSubmitting(true)

        try {
            // بناء نص الطلب: اسم الأكل + أي ملاحظة من المستخدم
            let orderText = itemInfo.name ? itemInfo.name : ''
            if (request && request.trim()) {
                orderText = orderText
                    ? `${orderText} - ${request.trim()}`
                    : request.trim()
            }
            if (!orderText) {
                orderText = t('noSpecificRequest') || 'طلب من المنيو'
            }

            const requestData: any = {
                table_number: tableNumber,
                request: orderText,
                status: 'new',
                created_at: new Date().toISOString(),
                deleted: false,
                user_id: user?.id,
                user_name: user?.email.split('@')[0] || '',
            }

            const { error: requestError } = await supabase
                .from('waiter_requests')
                .insert([requestData])

            if (requestError) {
                throw new Error(requestError.message)
            }

            // إضافة الطلب للسلة المركزية
            if (itemInfo.name && itemInfo.price) {
                addToCart({
                    name: itemInfo.name,
                    price: Number(itemInfo.price),
                    note:
                        request && request.trim() ? request.trim() : undefined,
                    quantity: 1,
                })
            }

            // تسجيل نقطة الولاء للمستخدم الحالي
            if (user?.id) {
                const userName = user?.email.split('@')[0] || ''
                const result = await registerLoyaltyVisitByUserId(
                    user.id,
                    userName
                )
                setLoyaltyPoints(result.points)
                await refreshPoints() // Ensure navbar updates immediately
                let loyaltyMessage = ''
                if (result.alreadyVisitedToday) {
                    loyaltyMessage = `"${
                        t('loyaltyPoints') || 'نقاط الولاء'
                    }: ${
                        result.points
                    }. لقد حصلت على نقاط اليوم بالفعل، عد غدًا للصول على المزيد!"`
                } else {
                    loyaltyMessage = `"${
                        t('loyaltyPoints') || 'نقاط الولاء'
                    }: ${result.points} نقطة.`
                }
                toast({
                    title: t('waiterCalled'),
                    description: `${t(
                        'staffComing'
                    )} ${tableNumber}. ${loyaltyMessage}`,
                })
            }

            navigate(`/user-home?table=${tableNumber}`, { replace: true })
        } catch (error) {
            toast({
                title: t('error'),
                description: t('errorSendingRequest'),
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }
    // زر "تم الدفع" لمسح الفاتورة وإغلاق النافذة
    // Handle clearing invoice ("تم الدفع" button)
    const handleClearInvoice = () => {
        setInvoice([])
        localStorage.removeItem('invoice')
        setInvoiceDialogOpen(false)
    }

    // حالة الفاتورة (محملة من localStorage)
    // Invoice state (persisted in localStorage)
    const [invoice, setInvoice] = useState<InvoiceRow[]>(() => {
        const stored = localStorage.getItem('invoice')
        return stored ? JSON.parse(stored) : []
    })

    // حفظ الفاتورة في localStorage عند كل تغيير
    // Save invoice to localStorage on every change
    useEffect(() => {
        localStorage.setItem('invoice', JSON.stringify(invoice))
    }, [invoice])

    // زر الفاتورة العائم الموحد
    // Floating invoice button
    const InvoiceFloatingButton: React.FC<{ onClick: () => void }> = ({
        onClick,
    }) => (
        <button
            onClick={onClick}
            className='fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-kian-burgundy font-extrabold text-lg border-2 border-yellow-600 transition-all duration-200 hover:scale-105'
            style={{ boxShadow: '0 8px 32px 0 rgba(255, 193, 7, 0.25)' }}
            aria-label={language === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}
        >
            <ReceiptText className='w-6 h-6 mr-1 text-kian-burgundy drop-shadow' />
            <span className='hidden sm:inline'>
                {language === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}
            </span>
        </button>
    )
    return (
        <PageTransition>
            {/* Navbar حديث */}
            <UserNavbar cartCount={cart.length} />
            {/* تمت إزالة سلة الشراء (Cart) وزرها من صفحة CallWaiter */}

            <div className='cafe-container w-full mt-[100px]'>
                <motion.h1
                    className='text-2xl md:text-3xl font-bold mb-6'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {t('callWaiterTo')} {tableNumber}
                </motion.h1>

                <form onSubmit={handleSubmit} className='space-y-6'>
                    <div className='space-y-2'>
                        <label
                            htmlFor='request'
                            className='text-sm font-medium'
                        >
                            {t('whatYouNeed')}
                        </label>
                        <Textarea
                            id='request'
                            placeholder={t('placeholder')}
                            value={request}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                                setRequest(e.target.value)
                            }
                            className='min-h-32'
                        />
                    </div>

                    <Button
                        type='submit'
                        className='w-full bg-gold hover:bg-[#dfa804] dark:bg-kian-gold dark:hover:bg-kian-gold/90 dark:text-kian-charcoal h-14'
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? t('calling') : t('callWaiterNow')}
                    </Button>
                </form>
                <InvoiceFloatingButton
                    onClick={() => setInvoiceDialogOpen(true)}
                />
                {/* زر الرجوع الصغير أعلى الصفحة */}
                <button
                    onClick={() => navigate(-1)}
                    className='fixed top-6 left-6 z-[100] w-10 h-10 lg:flex items-center justify-center hidden sm:flex rounded-full shadow bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-all duration-150'
                    style={{ boxShadow: '0 4px 16px 0 rgba(120,120,120,0.10)' }}
                    aria-label={language === 'ar' ? 'الرجوع' : 'Back'}
                >
                    <ArrowLeft className='w-5 h-5 text-kian-burgundy' />
                </button>
                {/* نافذة الفاتورة (Dialog) الموحدة */}
                <Dialog
                    open={invoiceDialogOpen}
                    onOpenChange={setInvoiceDialogOpen}
                >
                    <DialogContent className='max-w-lg w-full rounded-2xl shadow-2xl'>
                        <DialogHeader>
                            <DialogTitle className='text-2xl font-bold text-kian-burgundy dark:text-gold'>
                                {language === 'ar'
                                    ? 'فاتورة المشتريات'
                                    : 'Purchase Invoice'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className='overflow-x-auto'>
                            <table className='w-full text-sm text-center'>
                                <thead>
                                    <tr className='bg-gold/20'>
                                        <th>
                                            {language === 'ar'
                                                ? 'المنتج'
                                                : 'Item'}
                                        </th>
                                        <th>
                                            {language === 'ar'
                                                ? 'الكمية'
                                                : 'Qty'}
                                        </th>
                                        <th>
                                            {language === 'ar'
                                                ? 'النوع'
                                                : 'Type'}
                                        </th>
                                        <th>
                                            {language === 'ar'
                                                ? 'السعر'
                                                : 'Price'}
                                        </th>
                                        <th>
                                            {language === 'ar'
                                                ? 'النقاط'
                                                : 'Points'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className='py-6 text-gray-400'
                                            >
                                                {language === 'ar'
                                                    ? 'لا توجد مشتريات بعد'
                                                    : 'No purchases yet'}
                                            </td>
                                        </tr>
                                    ) : (
                                        invoice.map((row, idx) => (
                                            <tr key={idx}>
                                                <td>{row.name}</td>
                                                <td>{row.quantity}</td>
                                                <td>
                                                    {row.type === 'loyalty'
                                                        ? language === 'ar'
                                                            ? 'نقاط'
                                                            : 'Loyalty'
                                                        : language === 'ar'
                                                        ? 'نقدي'
                                                        : 'Cash'}
                                                </td>
                                                <td>
                                                    {row.type === 'cash'
                                                        ? `${row.price} EGP`
                                                        : '-'}
                                                </td>
                                                <td>
                                                    {row.type === 'loyalty'
                                                        ? row.points
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* الإجمالي */}
                        <div className='mt-4 text-lg font-bold text-right'>
                            {language === 'ar'
                                ? 'الإجمالي المطلوب دفعه:'
                                : 'Total to Pay:'}{' '}
                            {invoice
                                .filter((i) => i.type === 'cash')
                                .reduce(
                                    (sum, i) => sum + i.price * i.quantity,
                                    0
                                )}{' '}
                            EGP
                        </div>
                        {/* زر تم الدفع */}
                        <div className='flex justify-center mt-6'>
                            <Button
                                className='bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-2 rounded-full'
                                onClick={handleClearInvoice}
                            >
                                {language === 'ar' ? 'تم الدفع' : 'Paid'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            <Toaster />
        </PageTransition>
    )
}

export default CallWaiter

// عند التنقل بين الصفحات، مرر دائمًا رقم الترابيزة في ال query string
// مثال: navigate(`/Menu?table=${tableNumber}`)
// أو عند استخدام <Link> أو أي زر تنقل، أضف table للـ URL
